'use strict';
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const path = require("path");
const cp = require("child_process");
const util = require("util");
const JSONStdio = require("json-stdio");
const chalk = require("chalk");
const prepend_transform_1 = require("prepend-transform");
const su = require("suman-utils");
const _suman = global.__suman = (global.__suman || {});
const logging_1 = require("./logging");
exports.makeFindPrompt = function (p, projectRoot) {
    return function findPrompt(object, dir, sumanOptions, cb) {
        const onFindComplete = function (files) {
            let cancelOption = '(cancel - do not run a test)';
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
                const testFilePath = path.isAbsolute(result.fileToRun) ? result.fileToRun : path.resolve(projectRoot + '/' + result.fileToRun);
                const begin = Date.now();
                p.any({ testFilePath }, function (err) {
                    err && logging_1.log.newLine() && logging_1.log.error(err.stack || err) && logging_1.log.newLine();
                    logging_1.log.veryGood('total time millis => ', Date.now() - begin, '\n');
                    cb(null);
                });
            });
        };
        const k = cp.spawn('bash', [], {
            cwd: projectRoot
        });
        let files = [];
        k.once('exit', function (code, signal) {
            if (code === 0) {
                onFindComplete(files);
            }
            else {
                logging_1.log.error(' => "suman --find-only" process exited with non-zero code', code, signal ? signal : '');
                cb(null);
            }
        });
        let parser = JSONStdio.createParser(su.constants.JSON_STDIO_SUMAN_SHELL);
        k.stdout.pipe(parser).on(JSONStdio.stdEventName, function (obj) {
            if (obj && obj.file) {
                files.push(obj.file);
            }
            else {
                logging_1.log.error('object did not have an expected "file" property => ' + util.inspect(obj));
            }
        });
        k.stderr.pipe(prepend_transform_1.pt(chalk.yellow(' [suman "--find-only" stderr] '), { omitWhitespace: true })).pipe(process.stderr);
        sumanOptions = sumanOptions + ' --find-only ';
        k.stdin.end(`\n suman ${sumanOptions} \n`);
    };
};
