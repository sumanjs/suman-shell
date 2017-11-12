'use strict';

//dts
import {IGlobalSumanObj} from 'suman-types/dts/global';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import * as path from 'path';
import * as cp from 'child_process';
import * as util from 'util';

//npm
import * as residence from 'residence';
import {Pool} from 'poolio';
import * as chalk from 'chalk';
import * as fs from 'fs';
import {Writable} from 'stream';
import * as Vorpal from 'vorpal';
const fsAutocomplete = require('vorpal-autocomplete-fs');
import {pt} from 'prepend-transform';
import _ = require('lodash');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {log} from './lib/logging';
import {makeFindPrompt} from "./lib/find-prompt";
const sumanGlobalModulesPath = path.resolve(process.env.HOME + '/.suman/global');

try {
  require.resolve('inquirer');
}
catch (err) {
  log.warning('loading suman-shell...please wait.');
  try {
    cp.execSync(`cd ${sumanGlobalModulesPath} && npm install inquirer`);
  }
  catch (err) {
    log.error('suman-shell could not be loaded; suman-shell cannot load the "inquirer" dependency.');
    log.error(err.stack || err);
    process.exit(1);
  }

}

try {
  require('inquirer');
}
catch (err) {
  log.warning('you may be missing necessary dependences for the suman-shell CLI.');
  log.warning(err.message);
}

//////////////////////////////////////////////////////////////////

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
const filePath = path.resolve(__dirname + '/lib/worker.js');

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

  vorpal.command('pwd')
  .description('echo present working directory')
  .action(function(args: Array<string>,cb: Function){
     console.log(process.cwd());
     cb(null);
  });

  vorpal.command('run [file]')  //vorpal.command('run [files...]')
  .description('run a single test script')
  .autocomplete(fsAutocomplete())
  // .autocomplete({
  //   data: function (input: string, cb: Function) {
  //
  //     const basename = path.basename(input);
  //     const dir = path.dirname(path.resolve(process.cwd() + `/${input}`));
  //
  //     fs.readdir(dir, function (err, items) {
  //       if (err) {
  //         return cb(null);
  //       }
  //       const matches = items.filter(function (item) {
  //         return String(item).match(basename);
  //       });
  //
  //       return cb(matches);
  //
  //     });
  //   }
  // })
  .action(function (args: any, cb: Function) {

    console.log('args: ', args);

    if(!args){
      log.error('Implementation error: no args object available. Returning early.');
      return cb(null);
    }

    if(!args.file){
      log.error('no file/files chosen, please select a file path.');
    }

    let testFilePath = path.isAbsolute(args.file) ? args.file : path.resolve(process.cwd() + `/${args.file}`);

    try {
      fs.statSync(testFilePath)
    }
    catch (err) {
      return cb(err.message);
    }

    const begin = Date.now();

    p.anyCB({testFilePath}, function (err: Error, result: any) {
      log.veryGood('total time millis => ', Date.now() - begin, '\n');
      cb(null);
    });
  });

  vorpal.command('find')
  .description('find test files to run')
  .option('--opts <sumanOpts>', 'Search for test scripts in subdirectories.')
  // .option('--match-none <matchNone>', 'Size of pizza.')
  .cancel(function () {
    log.warning('find command was canceled.');
  })
  .action(function (args: Array<string>, cb: Function) {

    // log.info('args => ', args);

    let dir;

    if (args && typeof args.folder === 'string') {
      dir = path.isAbsolute(args.folder) ? args.folder : path.resolve(projectRoot + '/' + args.folder);
    }
    else {
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
  .on('data', function customOnData(data: string) {
    clearTimeout(to);
  });

  return function cleanUpSumanShell(): void {
    // p.killAllImmediately();
    // process.stdin.end();
  };
};



