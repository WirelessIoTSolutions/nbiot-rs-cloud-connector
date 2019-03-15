/**
 * @file dgb.js
 * @description central debugging module.
 * @author Andjela Vuckovic dos Reis
 * @created  on 15.06.17
 * @copyright (C) 2017 mm1 Technology GmbH - all rights reserved
 * @licence MIT
 */

import nconf from 'nconf';
nconf.argv().env().file({file: "config/config.json"});

/**
 * globalDbLevel: global debug level -  maximal debug level for the whole project
 * 3 - All debug levels are possible. Debug level for a particular file = local debug level in a particular file.
 * 2 - Only logs with debug levels L2 and L1 are possible. Debug level = min (local debug level, global debug level)
 * 1 - only logs with debug level L1 are possible
 */
const globalDbLevel = nconf.get("maxDebugLevel");

/**
 * @function Err - defines the debug level for logging errors (always shown)
 * @param dbLevel
 * @param args
 */
let Err = ( dbLevel, ...args ) => {
    if(( dbLevel !== undefined )){
        console.log( ...args );
    }
};

/**
 * @function L1 defines the debug level 1 - only logs with debug level 1
 * @param dbLevel
 * @param args
 */
let L1 = ( dbLevel, ...args ) => {
    if(( dbLevel !== undefined ) && ( dbLevel > 0 ) && ( globalDbLevel > 0 )){
        console.log( ...args );
    }
};

/**
 * @function L2 defines the debug level 2 - only logs with debug level 2 and 1
 * @param dbLevel
 * @param args
 */
let L2 = ( dbLevel, ...args ) => {
    if(( dbLevel !== undefined ) && ( dbLevel > 1 ) && ( globalDbLevel > 1)){
        console.log( ...args );
    }
};

/**
 * @function L3 defines the debug level 3 - all logs
 * @param dbLevel
 * @param args
 */
let L3 = ( dbLevel, ...args ) => {
    if(( dbLevel !== undefined ) && ( dbLevel > 2 ) && ( globalDbLevel > 2)){
        console.log( ...args );
    }
};

exports.Err = Err;
exports.L1 = L1;
exports.L2 = L2;
exports.L3 = L3;
