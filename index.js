"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var residence = require("residence");
var poolio_1 = require("poolio");
var chalk = require("chalk");
var fs = require("fs");
var name = ' => [suman-d] =>';
var log = console.log.bind(console, name);
var logGood = console.log.bind(console, chalk.cyan(name));
var logVeryGood = console.log.bind(console, chalk.green(name));
var logWarning = console.error.bind(console, chalk.yellow.bold(name));
var logError = console.error.bind(console, chalk.red(name));
var projectRoot = residence.findProjectRoot(process.cwd());
var getSharedWritableStream = function () {
    return fs.createWriteStream(path.resolve(__dirname + '/test.log'));
};
var filePath = path.resolve(__dirname + '/lib/worker.js');
var defaultOptions = {
    size: 3,
    getSharedWritableStream: getSharedWritableStream,
    addWorkerOnExit: true,
    oneTimeOnly: true,
    inheritStdio: true
};
exports.startSumanD = function (opts) {
    var p = new poolio_1.Pool(Object.assign({}, defaultOptions, opts, {
        filePath: filePath
    }));
    process.stdin
        .setEncoding('utf8')
        .resume()
        .on('data', function (data) {
        if (String(data).match(/s/)) {
            console.log('killing all active workers...');
            p.killAllActiveWorkers();
            return;
        }
        var testFilePath = path.resolve(__dirname + '/test/one.test.js');
        console.log('data received => ', data);
        p.any({ testFilePath: testFilePath }).then(function (result) {
            console.log('result => ', result);
        }, function (err) {
            console.error(err.stack || err);
        });
    });
    return function cleanUpSumanD() {
        process.stdin.end();
    };
};
var $exports = module.exports;
exports.default = $exports;
