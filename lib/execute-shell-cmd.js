"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cp = require("child_process");
var logging_1 = require("./logging");
exports.makeExecute = function (exec, projectRoot) {
    return function (args, cb) {
        if (!args.commands) {
            logging_1.log.error('no commands issued.');
            return process.nextTick(cb);
        }
        var k = cp.spawn(exec);
        k.stdout.pipe(process.stdout);
        k.stderr.pipe(process.stderr);
        k.stdin.write(args.commands.join(' '));
        k.stdin.end('\n');
        k.once('exit', cb);
    };
};
