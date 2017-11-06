'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var cp = require("child_process");
var util = require("util");
var JSON2Stdout = require("json-2-stdout");
var chalk = require("chalk");
var prepend_transform_1 = require("prepend-transform");
var _suman = global.__suman = (global.__suman || {});
var logging_1 = require("./logging");
exports.makeFindPrompt = function (p, projectRoot) {
    return function findPrompt(object, dir, sumanOptions, cb) {
        var onFindComplete = function (files) {
            var cancelOption = '(cancel - do not run a test)';
            files.unshift(cancelOption);
            logging_1.log.newLine();
            object.prompt([
                {
                    type: 'list',
                    name: 'fileToRun',
                    message: 'Choose a test script to run',
                    choices: files,
                    default: null
                }
            ], function (result) {
                if (!result.fileToRun) {
                    logging_1.log.warning('no file chosen to run.');
                    return process.nextTick(cb);
                }
                if (result.fileToRun === cancelOption) {
                    logging_1.log.warning('canceled option selected.');
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
        sumanOptions = sumanOptions + ' --find-only ';
        k.stdin.end("\n suman " + sumanOptions + " \n");
    };
};
