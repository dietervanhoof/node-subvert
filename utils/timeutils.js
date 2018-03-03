const divmod = require('divmod');
const util = require('util');
const numeral = require('numeral');
const log = require("../services/logger.service");

/**
 * Transforms a time of format '10:00:50:07' to seconds
 * @param {String} time
 * @returns {Number}
 */
const timeInSecs = function(time) {
    let a = time.split(':');
    a[0] = parseInt(a[0] * 60 * 60);
    a[1] = parseInt(a[1] * 60);
    a[2] = parseInt(a[2]);
    a[3] = a[3] / 100;
    return a.reduce((accumulator, currentValue) => accumulator + currentValue);
};

/**
 * Splits seconds into the format 'hh:mm:ss.SSS'
 * @param {Number} time
 */
const splitTime = function(time) {
    const r1 = divmod(time, 1);
    const r2 = divmod(time, 60);
    const r3 = divmod(r2[0], 60);
    return util.format("%s:%s:%s", numeral(r3[0]).format("00"), numeral(r3[1]).format("00"), numeral(r2[1]).format("00.000").replace(".", ","));
};

module.exports = {
    timeInSecs: timeInSecs,
    splitTime: splitTime
};