"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var residence = require("residence");
var chalk = require("chalk");
var fs = require("fs");
var Vorpal = require("vorpal");
var name = ' => [suman-d] =>';
var log = console.log.bind(console, name);
var logGood = console.log.bind(console, chalk.cyan(name));
var logVeryGood = console.log.bind(console, chalk.green(name));
var logWarning = console.error.bind(console, chalk.yellow.bold(name));
var logError = console.error.bind(console, chalk.red(name));
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
    var cwd = process.cwd();
    var projectRoot = residence.findProjectRoot(cwd);
    var sliceCount = Math.max(0, String(cwd).length - 20);
    var shortCWD = String(cwd).slice(sliceCount);
    var vorpal = new Vorpal();
    vorpal
        .command('foo', 'Outputs "bar".')
        .action(function (args, cb) {
        this.log('bar');
        cb();
    });
    var getAnimals = function (input, cb) {
        process.nextTick(cb, null, ['dogs', 'cats', 'birds']);
    };
    vorpal.command('feed [animal] [duck]')
        .autocomplete({
        data: function (input, cb) {
            console.log('input => ', input);
            getAnimals(input, function (err, array) {
                cb(array);
            });
        }
    })
        .action(function (args, cb) {
        console.log('args =>', args);
        this.log('zoomba');
        cb(null);
    });
    vorpal
        .delimiter(shortCWD + chalk.magenta(' / $suman>'))
        .show();
    return function cleanUpSumanD() {
    };
};
var $exports = module.exports;
exports.default = $exports;
