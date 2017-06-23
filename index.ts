//core
import * as path from 'path';

//npm
import * as residence from 'residence';
import {Pool} from 'poolio';
import * as chalk from 'chalk';
import * as fs from 'fs';
import {Writable} from "stream";

//////////////////////////////////////////////////////////////////

const name = ' => [suman-d] =>';
const log = console.log.bind(console, name);
const logGood = console.log.bind(console, chalk.cyan(name));
const logVeryGood = console.log.bind(console, chalk.green(name));
const logWarning = console.error.bind(console, chalk.yellow.bold(name));
const logError = console.error.bind(console, chalk.red(name));

const projectRoot = residence.findProjectRoot(process.cwd());

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
  oneTimeOnly: true,
  inheritStdio: true
};

export const startSumanD = function (opts: ISubsetSumanDOptions) {

  const p = new Pool(Object.assign({}, defaultOptions, opts, {
    filePath
  }));

  process.stdin
    .setEncoding('utf8')
    .resume()
    .on('data', function (data: string) {

      if (String(data).match(/s/)) {
        console.log('killing all active workers...');
        p.killAllActiveWorkers();
        return;
      }

      let testFilePath = path.resolve(__dirname + '/test/one.test.js');
      console.log('data received => ', data);

      p.any({testFilePath}).then(function (result) {

        console.log('result => ', result);

      }, function (err: Error) {
        console.error(err.stack || err);
      });

    });

  return function cleanUpSumanD(): void {

    process.stdin.end();

  };
};


const $exports = module.exports;
export default $exports;

