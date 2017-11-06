'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var cp = require("child_process");
var util = require("util");
var JSON2Stdout = require("json-2-stdout");
var poolio_1 = require("poolio");
var chalk = require("chalk");
var fs = require("fs");
var Vorpal = require("vorpal");
var prepend_transform_1 = require("prepend-transform");
var _suman = global.__suman = (global.__suman || {});
var logging_1 = require("./lib/logging");
var sumanGlobalModulesPath = path.resolve(process.env.HOME + '/.suman/global');
try {
    require.resolve('inquirer');
}
catch (err) {
    logging_1.log.warning('loading suman-shell...please wait.');
    try {
        cp.execSync("cd " + sumanGlobalModulesPath + " && npm install inquirer");
    }
    catch (err) {
        logging_1.log.error('suman-shell could not be loaded; suman-shell cannot load the "inquirer" dependency.');
        logging_1.log.error(err.stack || err);
        process.exit(1);
    }
}
try {
    require('inquirer');
}
catch (err) {
    logging_1.log.warning('you may be missing necessary dependences for the suman-shell CLI.');
    logging_1.log.warning(err.message);
}
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
    logging_1.log.newLine();
    var cwd = process.cwd();
    var shortCWD = String(cwd).split('/').slice(-3).join('/');
    if (shortCWD.length + 1 < String(cwd).length) {
        shortCWD = ' /.../' + shortCWD;
    }
    shortCWD = chalk.gray(shortCWD);
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
            logging_1.log.veryGood('total time millis => ', Date.now() - begin, '\n');
            cb(null);
        });
    });
    var findPrompt = function (object, dir, cb) {
        var onFindComplete = function (files) {
            object.prompt([
                {
                    type: 'list',
                    name: 'fileToRun',
                    message: 'Choose a test script to run',
                    choices: files,
                }
            ], function (result) {
                if (!result.fileToRun) {
                    logging_1.log.warning('no file chosen to run.');
                    return process.nextTick(cb);
                }
                var testFilePath = path.isAbsolute(result.fileToRun) ? result.fileToRun : path.resolve(projectRoot + '/' + result.fileToRun);
                var begin = Date.now();
                p.anyCB({ testFilePath: testFilePath }, function (err, result) {
                    err && logging_1.log.newLine() && logging_1.log.error(err.stack || err) && logging_1.log.newLine();
                    logging_1.log.veryGood('total time millis => ', Date.now() - begin, '\n');
                    cb(null);
                });
            });
        };
        var json2StdoutStream = JSON2Stdout.createParser();
        var k = cp.spawn('bash', [], {
            cwd: projectRoot
        });
        var files = [];
        k.once('exit', function (code, signal) {
            if (code === 0) {
                onFindComplete(files);
            }
            else {
                logging_1.log.error(' => "suman --find-only" process exited with non-zero code', code, signal ? signal : '');
                cb(null);
            }
        });
        k.stdout.pipe(JSON2Stdout.createParser()).on(JSON2Stdout.stdEventName, function (obj) {
            if (obj && obj.file) {
                files.push(obj.file);
            }
            else {
                logging_1.log.error('object did not have an expected "file" property => ' + util.inspect(obj));
            }
        });
        k.stderr.pipe(prepend_transform_1.pt(chalk.yellow(' [suman "--find-only" process stderr] '))).pipe(process.stderr);
        k.stdin.end("\n suman --find-only --default \n");
    };
    vorpal.command('find [folder]')
        .description('find test files to run')
        .action(function (args, cb) {
        var dir;
        if (args && typeof args.folder === 'string') {
            dir = path.isAbsolute(args.folder) ? args.folder : path.resolve(projectRoot + '/' + args.folder);
        }
        else {
            dir = path.resolve(projectRoot + '/test');
        }
        findPrompt(this, dir, function (err) {
            err && logging_1.log.error(err);
            cb(null);
        });
    });
    vorpal
        .delimiter(shortCWD + chalk.magenta(' // suman>'))
        .show();
    var to = setTimeout(function () {
        logging_1.log.error('No stdin was received after 25 seconds...closing...');
        p.killAllImmediately();
        setTimeout(function () {
            process.exit(1);
        }, 2000);
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
