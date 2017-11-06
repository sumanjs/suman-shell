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
import JSON2Stdout = require('json-2-stdout');
import * as residence from 'residence';
import {Pool} from 'poolio';
import * as chalk from 'chalk';
import * as fs from 'fs';
import {Writable} from 'stream';
import * as Vorpal from 'vorpal';
import {pt} from 'prepend-transform';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {log} from './lib/logging';
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

  const vorpal = new Vorpal();

  vorpal.command('run [file]')
  .description('run a single test script')
  .autocomplete({
    data: function (input: string, cb: Function) {

      const basename = path.basename(input);
      const dir = path.dirname(path.resolve(process.cwd() + `/${input}`));

      fs.readdir(dir, function (err, items) {
        if (err) {
          return cb(null);
        }
        const matches = items.filter(function (item) {
          return String(item).match(basename);
        });

        return cb(matches);

      });
    }
  })
  .action(function (args: Array<string>, cb: Function) {

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

  const findPrompt = function (object: any, dir: string, cb: Function) {

    const onFindComplete = function (files: Array<string>) {

      object.prompt([
          {
            type: 'list',
            name: 'fileToRun',
            message: 'Choose a test script to run',
            choices: files,
          }
        ],

        function (result: any) {

          if (!result.fileToRun) {
            log.warning('no file chosen to run.');
            return process.nextTick(cb);
          }

          const testFilePath =
            path.isAbsolute(result.fileToRun) ? result.fileToRun : path.resolve(projectRoot + '/' + result.fileToRun);

          const begin = Date.now();

          p.anyCB({testFilePath}, function (err: Error, result: any) {
            err && log.newLine() && log.error(err.stack || err) && log.newLine();
            log.veryGood('total time millis => ', Date.now() - begin, '\n');
            cb(null);
          });

        });
    };

    // let files;
    //
    // try {
    //   files = fs.readdirSync(dir).map(function (item) {
    //     return path.resolve(dir + '/' + item);
    //   });
    // }
    // catch (err) {
    //   return process.nextTick(cb, err);
    // }

    const json2StdoutStream = JSON2Stdout.createParser();

    const k = cp.spawn('bash', [], {
      cwd: projectRoot
    });

    let files: Array<string> = [];
    k.once('exit', function (code, signal) {
      if (code === 0) {
        onFindComplete(files);
      }
      else {
        log.error(' => "suman --find-only" process exited with non-zero code', code, signal ? signal : '');
        cb(null);
      }

    });

    k.stdout.pipe(JSON2Stdout.createParser()).on(JSON2Stdout.stdEventName, function (obj: any) {
      if (obj && obj.file) {
        files.push(obj.file);
      }
      else {
        log.error('object did not have an expected "file" property => ' + util.inspect(obj));
      }
    });

    k.stderr.pipe(pt(chalk.yellow(' [suman "--find-only" process stderr] '))).pipe(process.stderr);

    k.stdin.end(`\n suman --find-only --default \n`);
  };

  vorpal.command('find [folder]')
  .description('find test files to run')
  .action(function (args: Array<string>, cb: Function) {

    let dir;

    if (args && typeof args.folder === 'string') {
      dir = path.isAbsolute(args.folder) ? args.folder : path.resolve(projectRoot + '/' + args.folder);
    }
    else {
      dir = path.resolve(projectRoot + '/test');
    }

    findPrompt(this, dir, function (err?: Error) {
      err && log.error(err);
      cb(null);
    });
  });

  vorpal
  .delimiter(shortCWD + chalk.magenta(' // suman>'))
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
    if (String(data) === 'q') {
      log.warning('killing all active workers.');
      p.killAllActiveWorkers();
    }
  });

  return function cleanUpSumanShell(): void {
    // p.killAllImmediately();
    // process.stdin.end();
  };
};



