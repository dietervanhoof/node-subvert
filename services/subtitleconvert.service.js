const fs = require('fs');
const XmlStream = require('xml-stream');
const log = require("./logger.service");
const timeutils = require("../utils/timeutils");
const util = require('util');
const chardet = require('chardet');
const numeral = require("numeral");

/**
 * Subtitle convertor service
 * @param {String} sourceFile  absolute path to the source file
 * @param {String} destionationFile    absolute path to the destination file to write to
 * @constructor
 * @returns {SubtitleConvertService}
 **/
function SubtitleConvertService(sourceFile, destinationFile, start, end) {
    this.sourceFile = sourceFile;
    this.destinationFile = destinationFile;
    this.start = start;
    this.end = end;
    this.result = [];
    return this;
}
/**
 * Convert and write the subtitle. This also detects the source file encoding.
 * The file grabs the offset of the XIF file based on the `<FileHeader>` XML element
 */
SubtitleConvertService.prototype.convert = function() {
    // Detect character set
    this.charSet = this.detectEncoding(this.sourceFile);
    log.debug("Encoding of " + this.sourceFile + " is: " + this.charSet);
    this.xml = new XmlStream(this.readFile(this.sourceFile, this.charSet));
    //this.xml.preserve('XIF', true);
    this.xml.collect('ContentBlock');
    this.xml.collect('Text');
    let that = this;
    this.xml.on('endElement: XIF', function(item) {
        that.result = item;
    });
    return new Promise((resolve, reject) => {
        that.xml.on("end", function() {
            const offset = that.parseHeaderTimes(that.result.FileHeader);
            // Check if the offset and start differ by 10 hours
            if (that.start) {
                const temp = that.validateOffsetAndStartTime(offset, that.start, that.end);
                that.start = temp.newStartTime;
                that.end = temp.newEndTime;
            }
            that.validateOffsetAndStartTime(offset, that.start, that.end);
            that.transformAndWrite(offset.startTime, that.destinationFile);
            log.debug("Finished reading XML.");
            resolve();
        });
    })
};

SubtitleConvertService.prototype.validateOffsetAndStartTime = function(offset, start, end) {
    if ((timeutils.getHours(offset.startTime) - timeutils.getHours(start)) === 10) {
        log.warn("The offset and starttime differ 10 hours. Offsetting start and end by 10 hours...");
        const newStartTime = util.format("%s:%s:%s:%s",
            numeral(timeutils.getHours(start) + 10).format("00"),
            numeral(timeutils.getMinutes(start)).format("00"),
            numeral(timeutils.getSeconds(start)).format("00"),
            numeral(timeutils.getHundreds(start)).format("00"));
        const newEndTime = util.format("%s:%s:%s:%s",
            numeral(timeutils.getHours(end) + 10).format("00"),
            numeral(timeutils.getMinutes(end)).format("00"),
            numeral(timeutils.getSeconds(end)).format("00"),
            numeral(timeutils.getHundreds(end)).format("00"));
        log.warn("New start: " + newStartTime);
        log.warn("New end: " + newEndTime);
        return {newStartTime, newEndTime}
    }
};

/**
 * Transforms the XML to an SRT format and writes the result to a file
 * @param {String} offset    The StartTime attribute of the XIF file (example: 10:00:50:07)
 * @param {String} destinationFile  The absolute path to the destination file
 */
SubtitleConvertService.prototype.transformAndWrite = function(offset, destinationFile) {
    var writeStream = fs.createWriteStream(destinationFile, { flags : 'w' });
    const offsetInSecs = timeutils.timeInSecs(offset.split(":")[0] + ":00:00:00");
    // Filter out the ContentBlocks that are outside of the timerange
    if (this.start && this.end) {
        this.result.FileBody.ContentBlock.filter((data) => this.isWithinRange(data, this)).forEach((r) => {
            this.writeContentBlock(r, writeStream, offsetInSecs);
        });
    } else {
        this.result.FileBody.ContentBlock.forEach((r) => {
            this.writeContentBlock(r, writeStream, offsetInSecs);
        });
    }
    writeStream.end();
};

/**
 * Parses the timeIn and timeOut values and turns them into seconds
 * @param {Object} contentBlock the contentBlock to parse the data from
 * @param {Number} offsetInSecs the offset in seconds
 * @returns {{timeInInSecs: number, timeOutInSecs: number}}
 */
SubtitleConvertService.prototype.parseTimingObject = function(contentBlock, offsetInSecs) {
    const timeIn = contentBlock.ThreadedObject.TimingObject.TimeIn.$.value;
    const timeOut = contentBlock.ThreadedObject.TimingObject.TimeOut.$.value;
    const timeInInSecs = timeutils.timeInSecs(timeIn) - offsetInSecs;
    const timeOutInSecs = timeutils.timeInSecs(timeOut) - offsetInSecs;
    return {timeInInSecs, timeOutInSecs};
};
/**
 * Writes a single content block in SRT format to the specified writeStream
 * @param {Object} contentBlock The JSON representation of the ContentBlock XML element as returned by 'xml-stream'
 * @param {WriteStream} writeStream The stream to write the output to
 * @param {Number} offsetInSecs the offset of the XIF file in seconds
 */
SubtitleConvertService.prototype.writeContentBlock = function(contentBlock, writeStream, offsetInSecs) {
    const {timeInInSecs, timeOutInSecs} = this.parseTimingObject(contentBlock, offsetInSecs);

    writeStream.write(timeutils.splitTime(timeInInSecs) + " --> " + timeutils.splitTime(timeOutInSecs) + "\n");
    contentBlock.ThreadedObject.Content.SubtitleText.Paragraph.Text.forEach((d) => {
        writeStream.write(d.replace("", "") + "\n");
    });
    writeStream.write("\n");
};

/**
 * Extracts the start and stop time from a XIF FileHeader as returned by 'xml-stream'
 * @param {Object} header   The XIF FileHeader
 * @returns {{startTime: *, stopTime: *}}
 */
SubtitleConvertService.prototype.parseHeaderTimes = function(header) {
    return {
        startTime: header.GlobalFileInfo.$.StartTime,
        stopTime: header.GlobalFileInfo.$.StopTime
    }
};

/**
 * Detects the encoding on the specified file
 * @param {String} file Absolute path to the file
 */
SubtitleConvertService.prototype.detectEncoding = function(file) {
    return chardet.detectFileSync(file, { sampleSize: 32 });
};

/**
 * Reads a file from the filesystem
 * @param {String} file the absolute path to the file
 * @param {String} encoding the encoding to use when reading the file
 */
SubtitleConvertService.prototype.readFile = function(file, encoding) {
    return fs.createReadStream(file, { encoding: encoding, autoClose: true });
};

/**
 * Checks if a value is between two values
 * @param {Number} value    the value to check
 * @param {Number} lower    the lower limit
 * @param {Number} upper    the upper limit
 * @returns {boolean}
 */
SubtitleConvertService.prototype.isBetween = function(value, lower, upper) {
    return (lower < value && value < upper);
};

SubtitleConvertService.prototype.isWithinRange = function(contentBlock, that) {
    const {timeInInSecs, timeOutInSecs} = that.parseTimingObject(contentBlock, 0);
    const start = timeutils.timeInSecs(that.start);
    const end = timeutils.timeInSecs(that.end);
    return (timeOutInSecs >= start && timeInInSecs <= end);
};

module.exports = SubtitleConvertService;
