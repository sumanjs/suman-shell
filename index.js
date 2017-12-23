'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
var cp = require("child_process");
var poolio_1 = require("poolio");
var chalk = require("chalk");
var fs = require("fs");
var Vorpal = require("vorpal");
var fsAutocomplete = require('vorpal-autocomplete-fs');
var _ = require("lodash");
var _suman = global.__suman = (global.__suman || {});
var logging_1 = require("./lib/logging");
var execute_shell_cmd_1 = require("./lib/execute-shell-cmd");
var run_files_1 = require("./lib/run-files");
var find_prompt_1 = require("./lib/find-prompt");
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
    var findPrompt = find_prompt_1.makeFindPrompt(p, projectRoot);
    process.once('exit', function () {
        p.killAllActiveWorkers();
    });
    var vorpal = new Vorpal();
    vorpal.command('pwd')
        .description('echo present working directory')
        .action(function (args, cb) {
        console.log(process.cwd());
        cb(null);
    });
    vorpal.command('bash [commands...]')
        .allowUnknownOptions()
        .action(execute_shell_cmd_1.makeExecute('bash', projectRoot));
    vorpal.command('zsh [commands...]')
        .allowUnknownOptions()
        .action(execute_shell_cmd_1.makeExecute('zsh', projectRoot));
    vorpal.command('sh [commands...]')
        .allowUnknownOptions()
        .action(execute_shell_cmd_1.makeExecute('sh', projectRoot));
    vorpal.command('run [file]')
        .description('run a single test script')
        .autocomplete(fsAutocomplete())
        .action(run_files_1.makeRunFiles(p, projectRoot));
    vorpal.command('find')
        .description('find test files to run')
        .option('--opts <sumanOpts>', 'Search for test scripts in subdirectories.')
        .cancel(function () {
        logging_1.log.warning('find command was canceled.');
    })
        .action(function (args, cb) {
        var dir;
        if (args && typeof args.folder === 'string') {
            dir = path.isAbsolute(args.folder) ? args.folder : path.resolve(projectRoot + '/' + args.folder);
        }
        else {
            logging_1.log.warning('using /test directory as default since no folder was passed as an argument.');
            dir = path.resolve(projectRoot + '/test');
        }
        var sumanOptions = _.flattenDeep([args.opts || []]);
        sumanOptions = sumanOptions.join(' ');
        findPrompt(this, dir, sumanOptions, function (err) {
            err && logging_1.log.error(err);
            cb(null);
        });
    });
    vorpal
        .delimiter(shortCWD + chalk.black.bold(' // suman>'))
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
    });
    return function cleanUpSumanShell() {
    };
};
