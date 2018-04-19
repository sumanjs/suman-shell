"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var logging_1 = require("./logging");
var path = require("path");
var fs = require("fs");
exports.makeRunFiles = function (p, projectRoot) {
    return function (args, cb) {
        if (!args) {
            logging_1.log.error('Implementation error: no args object available. Returning early.');
            return cb(null);
        }
        if (!args.file) {
            logging_1.log.error('no file/files chosen, please select a file path.');
            return cb(null);
        }
        var testFilePath = path.isAbsolute(args.file) ? args.file : path.resolve(process.cwd() + ("/" + args.file));
        try {
            var stats = fs.statSync(testFilePath);
            if (!stats.isFile()) {
                logging_1.log.warning('please pass a suman test file, not a directory or symlink.');
                return cb(null);
            }
        }
        catch (err) {
            logging_1.log.error(err.message);
            return cb(null);
        }
        var begin = Date.now();
        p.anyCB({ testFilePath: testFilePath }, function (err, result) {
            logging_1.log.veryGood('total time millis => ', Date.now() - begin, '\n');
            cb(null);
        });
    };
};
