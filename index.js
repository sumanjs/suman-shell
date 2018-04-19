'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var path = require("path");
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
var check_for_executables_1 = require("./lib/check-for-executables");
var load_inquirer_1 = require("./lib/load-inquirer");
load_inquirer_1.loadInquirer();
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
    vorpal.command('run [file]')
        .description('run a single test script')
        .autocomplete(fsAutocomplete())
        .action(run_files_1.makeRunFiles(p, projectRoot));
    vorpal.command('search [a]')
        .description('find test files to run')
        .option('--opts <sumanOpts>', 'Search for test scripts in subdirectories.')
        .cancel(function () {
        logging_1.log.warning(chalk.red('search command was canceled.'));
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
    if (check_for_executables_1.executables.bash) {
        vorpal
            .mode('bash')
            .delimiter('bash:')
            .init(function (args, callback) {
            this.log('Welcome to bash mode.\nYou can now directly enter arbitrary bash commands. To exit, type `exit`.');
            callback();
        })
            .action(execute_shell_cmd_1.makeExecuteCommand('bash', projectRoot));
    }
    else {
        logging_1.log.warning('Suman-Shell could not locate a bash executable using `command`.');
    }
    if (check_for_executables_1.executables.zsh) {
        vorpal
            .mode('zsh')
            .delimiter('zsh:')
            .init(function (args, callback) {
            this.log('Welcome to zsh mode.\nYou can now directly enter arbitrary zsh commands. To exit, type `exit`.');
            callback();
        })
            .action(execute_shell_cmd_1.makeExecuteCommand('zsh', projectRoot));
    }
    else {
        logging_1.log.warning('Suman-Shell could not locate a zsh executable using `command`.');
    }
    vorpal
        .catch('[cmd]', 'Catches unrecognized commands')
        .allowUnknownOptions()
        .action(execute_shell_cmd_1.makeExecuteBash(projectRoot));
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
        .on('data', function (data) {
        clearTimeout(to);
    });
    return function cleanUpSumanShell() {
    };
};
