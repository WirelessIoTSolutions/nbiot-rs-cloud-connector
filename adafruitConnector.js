/**
 * @file adafruitConnector.js
 * @description Example for simple MQTT connection to Adafruit MQTT Broker for
 * receiving NB-IoT messages, provided via mm1 Technology NB-IoT Relay Service
 * @author Lyn Matten, Andjela Vuckovic dos Reis
 * @copyright (C) 2018 mm1 Technology GmbH - all rights reserved.
 * @licence MIT licence
 *
 * Find out more about mm1 Technology:
 * Company: http://mm1-technology.de/
 * GitHub:  https://github.com/mm1technology/
 */

import log from './log/dbg';
import MqttClient from './lib/mqtt/MqttClient.class.js';
import NbiotRelayService from './lib/NbiotRelayService.class.js';
import {parseString} from './lib/helperFunctions.js';
import nconf from 'nconf';
nconf.argv().env().file({file: "config/config.json"});

//local debug level
let dl = 2;
let subscribeToTopics = nconf.get("adafruit:subscribeToTopics");
let adafruitOptions = nconf.get("adafruit:adafruitOptions");

console.log("****************************************");
console.log("*** Starting Connection to Adafruit ****");
console.log("****************************************");

let adafruit = new MqttClient(adafruitOptions);
adafruit.connect();

console.log("*****************************************************");
console.log("*** Starting Connection to mm1 UDP Relay Service ****");
console.log("*****************************************************");

let relayService = new NbiotRelayService(nconf);
relayService.setupWebSocket();


// Defining events handlers:

// subscribe to preconfigured topics on 'connect'
adafruit.on("connect", function() {
    log.L3(dl, "Connected to Adafruit");
    if(subscribeToTopics !== []){
        subscribeToTopics.forEach((topic) => {
            adafruit.registerTopic(topic);
        });
    }
});

//listen to mqtt message from Adafruit mqtt broker and send it
//to device via mm1T NB-IoT Relay Service
adafruit.on('mqttMessage', function(mqttArray){
    log.L3(dl,'Message from Adafruit mqtt topic: "', mqttArray[1], '": ', mqttArray[0]);
    let imsi = parseString(mqttArray[1], '/imsi-', '.' );
    let topicCommand = mqttArray[1].split('set-')[1];
    let value = mqttArray[0];
    // especially for the topic 'interval' used by the mm1T NB-IoT Demo Kit
    if (topicCommand === 'interval'){
        value = parseInt(value)*1000
    }else{
        value = value.trim();
    }
    let message = '[' + JSON.stringify({"command": topicCommand, "value": value}) + ']';
    log.L3(dl, 'message sent to device: ', message);
    relayService.flushQueue(imsi)
        .then(function() {
            relayService.relayMsgToDevice(imsi, message)
        })
        .catch(function (err) {
            console.log(err);
        });
});


//publish incoming messages from the NB-IoT Relay Service to Adafruit mqtt broker
relayService.on('jsonData', function(data){
    if (JSON.stringify(data.msgJSON).trim() !== '{}') {
        if(data.msgJSON.longitude && data.msgJSON.latitude){
            data.msgJSON.location = JSON.stringify({
                "lon": data.msgJSON.longitude,
                "lat": data.msgJSON.latitude
            })
        }
        Object.keys(data.msgJSON).forEach(key => {
            if (key.length > 2 && key !== 'latitude' && key !== 'longitude'){
                adafruit.publish(adafruitOptions.login + '/feeds/' + 'imsi-' + data.imsi.toString() + '.' + key, data.msgJSON[key].toString());
            }
        });
    }else{
        log.L1(dl, "The data received from the device must be in JSON format.")
    }

});



