/**
 * @file NbiotRelayService.class.js
 * @description The connector to mm1 Technology NB-IoT Relay Service
 * @author Andjela Vuckovic dos Reis
 * @copyright (C) 2018 mm1 Technology GmbH - all rights reserved.
 * @licence MIT licence
 *
 * Find out more about mm1 Technology:
 * Company: http://mm1-technology.de/
 * GitHub:  https://github.com/mm1technology/
 */


import eventEmitter from 'events';

import https from 'https';
import Promise from 'bluebird';
import log from '../log/dbg.js';
import {safelyParseJSON} from './helperFunctions.js';
import nconf from 'nconf';
nconf.argv().env().file({file: "./config/config.json"});

//local debug level:
let dl = 1;


class NbiotRelayService extends eventEmitter {
    /**
     * @class NbiotRelayService
     * Listens to the Messages from the mm1 Technology NB-IoT Relay Service
     * end emits event with the message JSON
     */
    constructor(nconf) {

        super();
        this._nconf = nconf;
        this.bearerToken = this._nconf.get("udpRelayService:bearerToken");
        this.url = this._nconf.get("udpRelayService:url");
        let fetchUrl = 'https://' + this.url + "?token=" + this.bearerToken;
        this.socket = require('socket.io-client')(fetchUrl,
            {
                transports: ['websocket'],
                upgrade: false
            }
        );
        this.bearerToken = 'Bearer ' + this.bearerToken;

    }

    // web socket event handler

    setupWebSocket() {

        let self = this;
        let filterImsi = self._nconf.get("udpRelayService:filterImsi");
        self.socket.on('connect', function () {
            console.log("Connected to NB-IoT relay service");
        });
        self.socket.on('message', function (data) {
            data.msgStr = new Buffer(data.data, 'base64').toString("ascii");
            data.msgJSON = safelyParseJSON(data.msgStr) || {};

            // if set in the config.jsom the messages are filtered bei an imsi
            if (filterImsi === '' || filterImsi === data.imsi) {
                log.L2(dl, '########################');
                log.L2(dl, 'Received from: ' + data.imsi);
                log.L2(dl, "Reveiced at: " + data.timestamp);
                log.L2(dl, "Direction: " + data.direction);
                log.L2(dl, "Message_raw: " + data.msgStr);
                log.L2(dl, "Message_json: " + JSON.stringify(data.msgJSON, null, 4));
                log.L2(dl, '########################\n\n\n');

                self.emit('jsonData', data);
            }
        });

        self.socket.on('disconnect', function () {
            log.L1(dl,"Disconnected from NB-IoT relay service");
        });

        self.socket.on('error', (error) => {
            log.Err(dl, error);
        });

    }


    // Recieves the message from the cloud and relays it to the device
    // with the given imsi via NB-IoT Relay Service

    relayMsgToDevice(imsi, message){

        let self = this;
        log.L3(dl,'Sending message to device: ', message);
        let path = '/api/device/' + imsi + '/message';

        return new Promise(function (resolve, reject) {
            let postRequest = null,
                data = JSON.stringify({"message": message.trim()});
            let postOptions = {
                hostname: self.url,
                path: path,
                method: 'POST',
                headers:
                    {
                        'Cache-Control': 'no-cache',
                         Authorization: self.bearerToken,
                        'Content-Type': 'application/json',
                        'Content-Length': data.length
                    }
            };
            postRequest = https.request(postOptions, function (res) {
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    log.L3(dl, 'Response from the NB-IoT Relay Service: ', chunk);
                    resolve([res.statusCode, chunk])
                });
            });
            postRequest.on('error', function (e) {
                log.Err(dl, imsi, ': Problem with POST request: ' + e.message);
                reject(e)
            });
            log.L3(dl, 'Sending POST request to NRS - data: ', data);
            postRequest.write(data);
            postRequest.end();

        });

    };


    /**
     * @function flushQueue
     * Cleans a downstream queue created for the device by the NB-IoT Relay Service
     * @param imsi
     */
    flushQueue(imsi){

        let self = this;
        let path = '/api/device/' + imsi + '/message/flush';

        return new Promise(function(resolve, reject) {
            let json = {};
            const options = {
                hostname: self.url,
                path: path,
                method: 'DELETE',
                headers:
                    {
                        'Cache-Control': 'no-cache',
                         Authorization: self.bearerToken,
                        'Content-Type': 'application/json' },
                json: true };

            const req = https.request(options, function (res) {
                res.setEncoding('utf8');
                log.L3(dl, 'Status: ' + res.status);
                log.L3(dl, 'Headers: ' + JSON.stringify(res.headers));
                res.on('data', function (body) {
                    log.L3(dl, 'Body: ', body);
                    json = safelyParseJSON(body);
                    resolve(json)
                });
                res.on('end', () => {
                    log.L3(dl, 'Flushing the downstream queue - json: ', json);
                });
            });
            req.on('error', function (e) {
                log.Err(dl, 'problem with request: ' + e.message);
                reject(e);
            });
            req.end();
        });

    };


}

module.exports = NbiotRelayService;