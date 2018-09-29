'use strict';

//dts
import {IGlobalSumanObj} from 'suman-types/dts/global';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import * as path from 'path';

//npm
import {Pool} from 'poolio';
import chalk from 'chalk';
import * as fs from 'fs';
import {Writable} from 'stream';
import * as Vorpal from 'vorpal';
const fsAutocomplete = require('vorpal-autocomplete-fs');
import * as _ from 'lodash';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {log} from './logging';
import {makeExecute, makeExecuteCommand, makeExecuteBash} from "./execute-shell-cmd";
import {makeRunFiles} from "./run-files";
import {makeFindPrompt} from "./find-prompt";
import {executables} from "./check-for-executables";
import {loadInquirer} from "./load-inquirer";


//////////////////////////////////////////////////////////////////

// we need inquirer for searching for tests
loadInquirer();

let getSharedWritableStream = function () {
  return fs.createWriteStream(path.resolve(__dirname + '/test.log'));
};

export interface ISumanDOptions {
  size: number,
  getSharedWritableStream: Writable,
  addWorkerOnExit: true,
  oneTimeOnly: true,
  inheritStdio: true
}

export type ISubsetSumanDOptions = Partial<ISumanDOptions>;
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

export const startSumanShell = function (projectRoot: string, sumanLibRoot: string, opts: ISubsetSumanDOptions) {
  
  log.newLine(); // we want to log a new line before `suman>`
  
  const cwd: string = process.cwd();
  // slice(-3) allows us to just use the 3 closest directories.
  // aka: if pwd = /a/b/c/d/e/f, then /.../d/e/f
  let shortCWD = String(cwd).split('/').slice(-3).join('/');
  
  if (shortCWD.length + 1 < String(cwd).length) {
    shortCWD = ' /.../' + shortCWD;
  }
  
  shortCWD = chalk.gray(shortCWD);
  
  const p = new Pool(Object.assign({}, defaultPoolioOptions, opts, {
    filePath,
    env: Object.assign({}, process.env, {
      SUMAN_LIBRARY_ROOT_PATH: sumanLibRoot,
      SUMAN_PROJECT_ROOT: projectRoot,
      FORCE_COLOR: 1
    })
  }));
  
  const findPrompt = makeFindPrompt(p, projectRoot);
  
  process.once('exit', function () {
    p.killAllActiveWorkers();
  });
  
  const vorpal = new Vorpal();
  
  vorpal.command('run [file]')  //vorpal.command('run [files...]')
  .description('run a single test script')
  .autocomplete(fsAutocomplete())
  .action(makeRunFiles(p, projectRoot));
  
  vorpal.command('search [a]')
  .description('find test files to run')
  .option('--opts <sumanOpts>', 'Search for test scripts in subdirectories.')
  // .option('--match-none <matchNone>', 'Size of pizza.')
  .cancel(function () {
    log.warning(chalk.red('search command was canceled.'));
  })
  .action(function (args: Array<string>, cb: Function) {
    
    let dir;
    
    if (args && typeof args.folder === 'string') {
      dir = path.isAbsolute(args.folder) ? args.folder : path.resolve(projectRoot + '/' + args.folder);
    }
    else {
      log.warning('using /test directory as default since no folder was passed as an argument.');
      dir = path.resolve(projectRoot + '/test');
    }
    
    let sumanOptions = _.flattenDeep([args.opts || []]);
    
    // log.info('suman options => ', sumanOptions);
    
    sumanOptions = sumanOptions.join(' ');
    
    findPrompt(this, dir, sumanOptions, function (err?: Error) {
      err && log.error(err);
      cb(null);
    });
  });
  
  
  if(executables.bash){
    vorpal
    .mode('bash')
    .delimiter('bash:')
    .init(function (args: Array<string>, callback: Function) {
      this.log('Welcome to bash mode.\nYou can now directly enter arbitrary bash commands. To exit, type `exit`.');
      callback();
    })
    .action(
      makeExecuteCommand('bash', projectRoot)
    );
  }
  else{
    log.warning('Suman-Shell could not locate a bash executable using `command`.')
  }
  
  
  if(executables.zsh){
    vorpal
    .mode('zsh')
    .delimiter('zsh:')
    .init(function (args: Array<string>, callback: Function) {
      this.log('Welcome to zsh mode.\nYou can now directly enter arbitrary zsh commands. To exit, type `exit`.');
      callback();
    })
    .action(
      makeExecuteCommand('zsh', projectRoot)
    );
  }
  else{
    log.warning('Suman-Shell could not locate a zsh executable using `command`.')
  }
  
  vorpal
  .catch('[cmd]', 'Catches unrecognized commands')
  .allowUnknownOptions()
  .action(
    makeExecuteBash(projectRoot)
  );
  
  vorpal
  .delimiter(shortCWD + chalk.black.bold(' // suman>'))
  .show();
  
  const to = setTimeout(function () {
    // vorpal.end();
    // process.stdin.end();
    log.error('No stdin was received after 25 seconds...closing...');
    p.killAllImmediately();
    setTimeout(function () {
      process.exit(1);
    }, 2000);
  }, 25000);
  
  process.stdin
  .setEncoding('utf8')
  .resume()
  .on('data', function (data: string) {
    clearTimeout(to);
  });
  
  return function cleanUpSumanShell(): void {
    // p.killAllImmediately();
    // process.stdin.end();
  };
};



