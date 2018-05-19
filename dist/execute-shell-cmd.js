"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const logging_1 = require("./logging");
exports.makeExecute = function (exec, projectRoot) {
    return function (args, cb) {
        try {
            if (!args.commands) {
                logging_1.log.error('no commands issued.');
                return process.nextTick(cb);
            }
            const k = cp.spawn(exec, [], {
                cwd: projectRoot
            });
            k.once('error', cb);
            k.stdout.pipe(process.stdout);
            k.stderr.pipe(process.stderr);
            k.stdin.write(args.commands.join(' '));
            k.stdin.end('\n');
            k.once('exit', cb);
        }
        catch (err) {
            logging_1.log.error(err);
            process.nextTick(cb, null);
        }
    };
};
exports.makeExecuteBash = function (projectRoot) {
    return function (args, cb) {
        try {
            const k = cp.spawn('bash', [], {
                cwd: projectRoot
            });
            k.once('error', cb);
            k.stdout.pipe(process.stdout);
            k.stderr.pipe(process.stderr);
            k.stdin.write(args.rawCommand);
            k.stdin.end('\n');
            k.once('exit', cb);
        }
        catch (err) {
            logging_1.log.error(err);
            process.nextTick(cb, null);
        }
    };
};
exports.makeExecuteCommand = function (exec, projectRoot) {
    return function (command, cb) {
        try {
            if (command.length < 1) {
                logging_1.log.error('no command issued.');
                return process.nextTick(cb);
            }
            const k = cp.spawn(exec, [], {
                cwd: projectRoot
            });
            k.once('error', cb);
            k.stdout.pipe(process.stdout);
            k.stderr.pipe(process.stderr);
            k.stdin.write(command);
            k.stdin.end('\n');
            k.once('exit', cb);
        }
        catch (err) {
            logging_1.log.error(err);
            process.nextTick(cb, null);
        }
    };
};
