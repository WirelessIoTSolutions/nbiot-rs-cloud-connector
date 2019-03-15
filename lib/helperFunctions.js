/**
 * @file helperFunctions.js
 * @description helper functions for the Application
 * @author Andjela Vuckovic dos Reis
 * @copyright (C) 2017 mm1 Technology GmbH - all rights reserved.
 * @licence MIT licence
 *
 * Find out more about mm1 Technology:
 * Company: http://mm1-technology.de/
 * GitHub:  https://github.com/mm1technology/
 */


exports.safelyParseJSON = (json) => {
    let parsed = '';
    try {
        parsed = JSON.parse(json)
    } catch (e) {
        //console.log("Error on parsing JSON", e);
    }
    return parsed // Could be undefined!


};

exports.parseString = (string, stringPart1, stringPart2) => {
    let array1 = string.split(stringPart1);
    let index = array1.length - 1;
    let leftCut = array1[index];
    let rightCut = leftCut.split(stringPart2)[0];
    return rightCut
};

