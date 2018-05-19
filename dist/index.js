'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const path = require("path");
const poolio_1 = require("poolio");
const chalk = require("chalk");
const fs = require("fs");
const Vorpal = require("vorpal");
const fsAutocomplete = require('vorpal-autocomplete-fs');
const _ = require("lodash");
const _suman = global.__suman = (global.__suman || {});
const logging_1 = require("./logging");
const execute_shell_cmd_1 = require("./execute-shell-cmd");
const run_files_1 = require("./run-files");
const find_prompt_1 = require("./find-prompt");
const check_for_executables_1 = require("./check-for-executables");
const load_inquirer_1 = require("./load-inquirer");
load_inquirer_1.loadInquirer();
let getSharedWritableStream = function () {
    return fs.createWriteStream(path.resolve(__dirname + '/test.log'));
};
const filePath = path.resolve(__dirname + '/worker.js');
const defaultPoolioOptions = {
    size: 3,
    getSharedWritableStream,
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
    const cwd = process.cwd();
    let shortCWD = String(cwd).split('/').slice(-3).join('/');
    if (shortCWD.length + 1 < String(cwd).length) {
        shortCWD = ' /.../' + shortCWD;
    }
    shortCWD = chalk.gray(shortCWD);
    const p = new poolio_1.Pool(Object.assign({}, defaultPoolioOptions, opts, {
        filePath,
        env: Object.assign({}, process.env, {
            SUMAN_LIBRARY_ROOT_PATH: sumanLibRoot,
            SUMAN_PROJECT_ROOT: projectRoot,
            FORCE_COLOR: 1
        })
    }));
    const findPrompt = find_prompt_1.makeFindPrompt(p, projectRoot);
    process.once('exit', function () {
        p.killAllActiveWorkers();
    });
    const vorpal = new Vorpal();
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
        let dir;
        if (args && typeof args.folder === 'string') {
            dir = path.isAbsolute(args.folder) ? args.folder : path.resolve(projectRoot + '/' + args.folder);
        }
        else {
            logging_1.log.warning('using /test directory as default since no folder was passed as an argument.');
            dir = path.resolve(projectRoot + '/test');
        }
        let sumanOptions = _.flattenDeep([args.opts || []]);
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
    const to = setTimeout(function () {
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
