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
import stdio = require('json-stdio');
import * as residence from 'residence';
import {Pool} from 'poolio';
import chalk from 'chalk';
import * as fs from 'fs';
import {Writable} from 'stream';
import {pt} from 'prepend-transform';
import su = require('suman-utils');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {log} from './logging';

/////////////////////////////////////////////////////////////////////////////////////////////////////////

export const makeFindPrompt = function (p: Pool, projectRoot: string) {

  return function findPrompt(object: any, dir: string, sumanOptions: string, cb: Function) {

    const onFindComplete = function (files: Array<string>) {

      let cancelOption = '(cancel - do not run a test)';

      files.unshift(cancelOption);
      log.newLine(); // log a new line to the console

      object.prompt([
          {
            type: 'list',
            name: 'fileToRun',
            message: 'Choose a test script to run',
            choices: files,
            default: null
          }
        ],

        function (result: any) {

          if (!result.fileToRun) {
            log.warning('no file chosen to run.');
            return process.nextTick(cb);
          }

          if (result.fileToRun === cancelOption) {
            log.warning('canceled option selected.');
            return process.nextTick(cb);
          }

          const testFilePath =
            path.isAbsolute(result.fileToRun) ? result.fileToRun : path.resolve(projectRoot + '/' + result.fileToRun);

          const begin = Date.now();

          p.any({testFilePath}, function (err: Error) {
            err && log.newLine() && log.error(err.stack || err) && log.newLine();
            log.veryGood('total time millis => ', Date.now() - begin, '\n');
            cb(null);
          });

        });
    };

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

    // let parser = JSONStdio.createParser('@suman-shell-json-stdio');
    let parser = stdio.createParser(su.constants.JSON_STDIO_SUMAN_SHELL);
    // let parser = JSONStdio.createParser();


    k.stdout.pipe(parser).on(stdio.stdEventName, function (obj: any) {

      if (obj && obj.file) {
        files.push(obj.file);
      }
      else {
        log.error('object did not have an expected "file" property => ' + util.inspect(obj));
      }
    });

    k.stderr.pipe(pt(chalk.yellow(' [suman "--find-only" stderr] '), {omitWhitespace: true})).pipe(process.stderr);

    sumanOptions = sumanOptions + ' --find-only ';

    k.stdin.end(`\n suman ${sumanOptions} \n`);
  };

};
