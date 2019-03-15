# mm1 Technology NB-Iot Relay Service - Cloud Connector

The application establishes a simple MQTT connection 
to the Adafruit-MQTT broker and to Azure Central-IoT-MQTT broker for receiving NB-IoT messages, 
provided via mm1 Technology NB-IoT Relay Service. 
The connector can be used with mm1 Technology NB-IoT Demo Kit.


## Getting Started

### Prerequisites

- node.js v10.13.0
- mm1 Technology Relay Service Account
- Addafruit.io Account and/or
- Microsoft Azure IoT Account 


### Installing

- Install node.js v10.13.0 from https://nodejs.org/en/download/ 
- Before you first time run the application execute 

```
npm install
```

 in the project folder to install the necessary node modules and dependencies.
 
 ## Run the application
 #### - Adafruit Connector: 
 - Login or sign in to Adafruit platform:
     - link: https://io.adafruit.com  
 - Rename the config_template.json to config.json and configure your Adafruit connection
 - For configuration check: https://learn.adafruit.com/adafruit-io/mqtt-api
 - Learn more on https://learn.adafruit.com/adafruit-io/overview
 - Start the connector: **npm run adafruit**
 
 
 #### - Azure Connector:
 - login  or sign in to Azure IoT Central:
     - link: https://azureiotcentral.com
     - user and password: The credentials of your Microsoft Office Account
 - Rename the config_template.json to config.json and configure your Azure ioT Central connection
 - For configuration check the Azure IoT Central-Dokumentation on https://docs.microsoft.com/de-de/azure/iot-central/
 - Start the connector: **npm run azure**


## Authors

* Andjela Vuckovic dos Reis and Lyn Matten
- Company: http://mm1-technology.de/
- GitHub:  https://github.com/mm1technology/

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments
 Used tutorial: 
https://docs.microsoft.com/en-us/azure/iot-central/howto-connect-nodejs-experimental


