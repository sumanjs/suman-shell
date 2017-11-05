'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var poolio_1 = require("poolio");
var chalk = require("chalk");
var fs = require("fs");
var Vorpal = require("vorpal");
var logging_1 = require("./lib/logging");
var getSharedWritableStream = function () {
    return fs.createWriteStream(path.resolve(__dirname + '/test.log'));
};
var filePath = path.resolve(__dirname + '/lib/worker.js');
var defaultPoolioOptions = {
    size: 3,
    getSharedWritableStream: getSharedWritableStream,
    addWorkerOnExit: true,
    streamStdioAfterDelegation: true,
    oneTimeOnly: true,
    inheritStdio: false,
    resolveWhenWorkerExits: true,
    stdout: process.stdout,
    stderr: process.stderr
};
exports.startSumanShell = function (projectRoot, sumanLibRoot, opts) {
    var cwd = process.cwd();
    var shortCWD = String(cwd).split('/').slice(-3).join('/');
    if (shortCWD.length + 1 < String(cwd).length) {
        shortCWD = '/.../' + shortCWD;
    }
    var p = new poolio_1.Pool(Object.assign({}, defaultPoolioOptions, opts, {
        filePath: filePath,
        env: Object.assign({}, process.env, {
            SUMAN_LIBRARY_ROOT_PATH: sumanLibRoot,
            SUMAN_PROJECT_ROOT: projectRoot,
            FORCE_COLOR: 1
        })
    }));
    var vorpal = new Vorpal();
    vorpal.command('run [file]')
        .description('run a single test script')
        .autocomplete({
        data: function (input, cb) {
            var basename = path.basename(input);
            var dir = path.dirname(path.resolve(process.cwd() + ("/" + input)));
            fs.readdir(dir, function (err, items) {
                if (err) {
                    return cb(null);
                }
                var matches = items.filter(function (item) {
                    return String(item).match(basename);
                });
                return cb(matches);
            });
        }
    })
        .action(function (args, cb) {
        var testFilePath = path.isAbsolute(args.file) ? args.file : path.resolve(process.cwd() + ("/" + args.file));
        try {
            fs.statSync(testFilePath);
        }
        catch (err) {
            return cb(err.message);
        }
        var begin = Date.now();
        p.anyCB({ testFilePath: testFilePath }, function (err, result) {
            logging_1.log.veryGood('total time millis => ', Date.now() - begin);
            cb(null);
        });
    });
    vorpal
        .delimiter(shortCWD + chalk.magenta(' / suman>'))
        .show();
    var to = setTimeout(function () {
        process.stdin.end();
        logging_1.log.error('No stdin was received after 25 seconds..closing...');
        p.killAllImmediately();
        process.exit(0);
    }, 25000);
    process.stdin
        .setEncoding('utf8')
        .resume()
        .on('data', function customOnData(data) {
        clearTimeout(to);
        if (String(data) === 'q') {
            logging_1.log.warning('killing all active workers.');
            p.killAllActiveWorkers();
        }
    });
    return function cleanUpSumanShell() {
    };
};
