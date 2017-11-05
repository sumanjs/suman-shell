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

//project
import {log} from './lib/logging';

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

  const cwd: string = process.cwd();
  // slice(-3) allows us to just use the 3 closest directories.
  // aka: if pwd = /a/b/c/d/e/f, then /.../d/e/f
  let shortCWD =  String(cwd).split('/').slice(-3).join('/');

  if(shortCWD.length + 1 < String(cwd).length){
    shortCWD = '/.../' + shortCWD;
  }

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

    p.anyCB({testFilePath}, function (err, result) {
      log.veryGood('total time millis => ', Date.now() - begin);
      cb(null);
    });
  });

  vorpal
  .delimiter(shortCWD + chalk.magenta(' / suman>'))
  .show();

  const to = setTimeout(function () {
    process.stdin.end();
    log.error('No stdin was received after 25 seconds..closing...');
    p.killAllImmediately();
    process.exit(0);
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



