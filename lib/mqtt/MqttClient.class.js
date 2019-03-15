/**
 * @file mqttClient.Class.js
 * @description Class for simple MQTT connection to  MQTT Broker
 * @author Lyn Matten
 * @copyright (C) 2018 mm1 Technology GmbH - all rights reserved.
 * @licence MIT licence
 *
 * Find out more about mm1 Technology:
 * Company: http://mm1-technology.de/
 * GitHub:  https://github.com/mm1technology/
 */

import mqtt from 'mqtt';
import moment from 'moment';
moment().format();
import eventEmitter from 'events';
import fs from 'fs';
import log from '../../log/dbg.js';

const fd = fs.openSync('lib/mqtt/mqtt.log','w');
//local debug level
let dl = 2;



class MqttClient extends eventEmitter {
    /**
     * @class mqttClient
     * Emits events when mqtt functions are performed
     * @param options
     */
    constructor(options) {

        log.L3(dl,'New MQTT Client generated with options: ', options);
        super();
        this._login = options.login;
        this._pwd = options.pwd;
        this._server = options.server;
        this._port = options.port;
        this._conName = options.conName;
        this._options =  {
            port: this._port,
            rejectUnauthorized: false,
            username: this._login,
            password: this._pwd,
            clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8)
        };
        this._client = null;
        this._name = options.name || options.login;

    }


    connect() {

        let self = this;
        if(this._client !== null) {
            self._debug_Print('Client already connected.');
            return false;
        }else {
            self._debug_Print('Connecting ' + self._name + '(' + self._login + ') ...');
            this._client = mqtt.connect(this._server, this._options);
            this._registerEvents();
            return true;
        }

    }


    registerTopic(topic) {

        let self = this;
        self._client.subscribe(topic);
        self._debug_Print('Subscribed to topic: "' + topic + '"');
        self.emit('topicRegistered');

    }


    publish(topic, message) {

        log.L2(dl,'Publishing to topic "' + topic + '": ' + message);
        this._client.publish(topic, message);

    }


    _registerEvents() {

        let self = this;
        this._client.on('connect', function() {
            self._debug_Print(moment().format('YYYY/MM/DD, HH:mm:ss') + ' -- successfully connected to '+ self._conName +' for ' + self._name);
            self.emit('connect');
        });
        this._client.on('disconnect', function() {
            self._debug_Print('Disconnected from ' + self._conName);
            self.emit('disconnect');
        });
        this._client.on('error', function(err) {
            self._debug_Print('error: ', err.toString());
            self.emit('Error', err);
        });
        this._client.on('message', function(topic, message) {
            log.L2(dl, 'Message received from topic "' + topic + '": ' + message);
            message = message.toString('utf8');
            self.emit("mqttMessage",  [message, topic]);
        });

    }


    _debug_Print(msg) {

        log.L1(dl,msg);
        fs.appendFileSync(fd, msg + '\n', 'utf8', function (err) {
            if (err) throw err;
        });

    }

}

module.exports = MqttClient;