/**
 * @file azureConnector.js
 * @description Example for simple MQTT connection to Azure ioT Centrtal MQTT Broker for
 * receiving NB-IoT provided messages via mm1 Technology NB-IoT Relay Service
 * @author Andjela Vuckovic dos Reis, based on tutorial:
 * https://docs.microsoft.com/en-us/azure/iot-central/howto-connect-nodejs-experimental
 * @copyright (C) 2018 mm1 Technology GmbH - all rights reserved.
 * @licence MIT licence
 *
 * Find out more about mm1 Technology:
 * Company: http://mm1-technology.de/
 * GitHub:  https://github.com/mm1technology/
 */

import log from './log/dbg';
import NbiotRelayService from './lib/NbiotRelayService.class.js';
import nconf from 'nconf';
nconf.argv().env().file({file: "config/config.json"});
import events from 'events';


//local debug level
let dl = 2;


let connectionString = nconf.get("azure:connectionString");
let Protocol = require('azure-iot-device-mqtt').Mqtt;
let AzureClient = require('azure-iot-device').Client;
let AzureMessage = require('azure-iot-device').Message;
let azureClient = AzureClient.fromConnectionString(connectionString, Protocol);
let eventHandler = new events.EventEmitter();

// Defining event handlers and some functions:


/**
 * @function onCommandEcho
 * Respond to the echo command from Azure IoT Central.
 * To get the echo command a command with the Field Name 'echo' must be
 * configured in the Command Tab in the Azure IoT Central device options.
 *
 * @param request
 * @param response
 */
let onCommand = (request, response) => {
    log.L2(dl,'Command received: ', request.payload);
    // Respond
    response.send(10, 'Success', function (errorMessage) {});
};


/**
 * @function sendDeviceProperties
 * Sending device properties
 * @param twin
 */
const sendDeviceProperties = (twin) => {
    twin.properties.reported.update(nconf.get("azure:deviceProperties"), (errorMessage) =>
        log.L2(dl,`Sent device properties ` + (errorMessage ? `Error: ${errorMessage.toString()}` : `(success)`)));
};


/**
 * @function sendLocationProperties
 * Sending location properties on event 'locationData'
 * @param twin
 */
const sendLocationProperties = (twin) => {
    eventHandler.on('locationData', (location) => {
        twin.properties.reported.update(location, (errorMessage) =>
            log.L2(dl, `Sent location properties ` + (errorMessage ? `Error: ${errorMessage.toString()}` : `(success)`)));
    });
};


/**
 * @function sendSetting
 * Send settings to the NB-IoT device via NB-IoT Relay Service
 * @param command
 * @param newValue
 */
let sendSetting = (command, newValue) => {
    let imsi = nconf.get("azure:deviceProperties:imsi");
    if (typeof(newValue) === 'string'){
        newValue = newValue.trim()
    }
    let message = '[' + JSON.stringify({"command": command, "value": newValue}) + ']';
    log.L3(dl, "setting sent: ", message);
    relayService.flushQueue(imsi)
        .then(function() {
            relayService.relayMsgToDevice(imsi, message)
        })
        .catch(function (err) {
            console.log(err);
        });
};

// the settings which are to be sent to the mm1T NB-IoT Demo Kit
// 'oled' - to show the desired text on the display
// 'interval' - to set the sending interval
//
let settings = {
    'oled': (newValue) => {
        sendSetting('oled', newValue);
    },
    'interval': (newValue) => {
        newValue = parseInt(newValue.trim())*1000;
        sendSetting('interval', newValue);
    }
};

/**
 * @function handleSettings
 * Handle settings changes that come from Azure IoT Central via the device twin.
 * @param twin
 */
let handleSettings = (twin) => {
    twin.on('properties.desired', function (desiredChange) {
        for (let setting in desiredChange) {
            if (settings[setting]) {
                log.L2(dl,`Received setting: ${setting}: ${desiredChange[setting].value}`);
                settings[setting](desiredChange[setting].value, (newValue, status, message) => {
                    let patch = {
                        [setting]: {
                            value: newValue,
                            status: status,
                            desiredVersion: desiredChange.$version,
                            message: message
                        }
                    };
                    twin.properties.reported.update(patch, (err) => console.log(`Sent setting update for ${setting}; ` +
                        (err ? `error: ${err.toString()}` : `status: success`)));
                });
            }
        }
    });
};



/**
 * @function connectCallback
 * Handle device connection to Azure IoT Central.
 * @param err
 */
let connectCallback = (err) => {
    if (err) {
        console.log(`Device could not connect to Azure IoT Central: ${err.toString()}`);
    } else {
        console.log('Device successfully connected to Azure IoT Central');

        // Setup device command callbacks
        azureClient.onDeviceMethod('command', onCommand);
        // Get device twin from Azure IoT Central.
        azureClient.getTwin((err, twin) => {
            if (err) {
                console.log(`Error getting device twin: ${err.toString()}`);
            } else {
                sendLocationProperties(twin);
                // Send device properties once on device start up
                sendDeviceProperties(twin);
                // Apply device settings and handle changes to device settings.
                handleSettings(twin);

            }
        });
    }
};





console.log("****************************************************");
console.log("*** Starting Connection to Azure *******************");
console.log("****************************************************");
azureClient.open(connectCallback);

console.log("*****************************************************");
console.log("*** Starting Connection to mm1 UDP Relay Service ****");
console.log("*****************************************************");
let relayService = new NbiotRelayService(nconf);
relayService.setupWebSocket();


//publish incoming messages from the mm1T NB-IoT Relay Service
// to the Azure Central IoT mqtt broker

relayService.on('jsonData', function(data){
    let message = {};
    if (JSON.stringify(data.msgJSON).trim() !== '{}') {
        let msgJSON = data.msgJSON;
        msgJSON.imsi = data.imsi;
        Object.keys(msgJSON).forEach(key => {
            msgJSON[key] = msgJSON[key].toString();
        });
        let location = {"location":{"lon": parseFloat(msgJSON.longitude),"lat": parseFloat(msgJSON.latitude)}};
        eventHandler.emit('locationData', location);
        message = new AzureMessage(JSON.stringify(msgJSON));
        azureClient.sendEvent(message, (err, res) => console.log(`Sent message to Azure IoT Central: ${message.getData()}` +
            (err ? `; \nerror: ${err.toString()}` : '') +
            (res ? `; \nstatus: ${res.constructor.name}` : '')));
    }else{
        log.L2(dl, "The data received from the device must be in JSON format.")
    }

});


