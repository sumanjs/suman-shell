'use strict';

//core
import * as path from 'path';

//npm
import * as residence from 'residence';
import {Pool} from 'poolio';
import * as chalk from 'chalk';
import * as fs from 'fs';
import {Writable} from "stream";
import * as Vorpal from 'vorpal';

//////////////////////////////////////////////////////////////////

const name = ' => [suman-d] =>';
const log = console.log.bind(console, name);
const logGood = console.log.bind(console, chalk.cyan(name));
const logVeryGood = console.log.bind(console, chalk.green(name));
const logWarning = console.error.bind(console, chalk.yellow.bold(name));
const logError = console.error.bind(console, chalk.red(name));

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

const defaultOptions = {
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

export const startSumanD = function (projectRoot: string, sumanLibRoot: string, opts: ISubsetSumanDOptions,) {

  const cwd: string = process.cwd();
  const sliceCount = Math.max(0, String(cwd).length - 20);
  const shortCWD = String(cwd).slice(sliceCount);

  process.on('uncaughtException', function (e) {
    console.error('caught exception => ', e.stack || e);
  });

  debugger;

  console.log('SUMAN_LIBRARY_ROOT_PATH => ', sumanLibRoot);

  const p = new Pool(Object.assign({}, defaultOptions, opts, {
    filePath,
    env: Object.assign({}, process.env, {
      SUMAN_LIBRARY_ROOT_PATH: sumanLibRoot,
      SUMAN_PROJECT_ROOT: projectRoot
    })
  }));

  let getAnimals = function (input, cb) {
    process.nextTick(cb, null, ['dogs', 'cats', 'birds']);
  };

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

    let testFilePath = path.resolve(process.cwd() + `/${args.file}`);

    try {
      fs.statSync(testFilePath)
    }
    catch (err) {
      return cb(err.message);
    }

    const begin = Date.now();

    p.anyCB({testFilePath}, function (err, result) {

      console.log('total time millis => ', Date.now() - begin);

      cb(null);
    });
  });

  vorpal
  .delimiter(shortCWD + chalk.magenta(' / suman>'))
  .show();

  const to = setTimeout(function () {
    process.stdin.end();
    console.log('No stdin was received after 45 seconds..closing...');
    p.killAllImmediately();
    process.exit(0);
  }, 45000);

  process.stdin
  // .setEncoding('utf8')
  // .resume()
  .on('data', function customOnData(data: string) {
    clearTimeout(to);
    if (String(data) === 'q') {
      console.log('killing all active workers.');
      p.killAllActiveWorkers();
    }
  });

  return function cleanUpSumanD(): void {

    // process.stdin.end();

  };
};

const $exports = module.exports;
export default $exports;

