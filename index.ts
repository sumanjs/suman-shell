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
  oneTimeOnly: true,
  inheritStdio: true
};

export const startSumanD = function (opts: ISubsetSumanDOptions) {

  const cwd : string= process.cwd();
  const projectRoot = residence.findProjectRoot(cwd);

  const sliceCount = Math.max(0, String(cwd).length - 20);
  const shortCWD = String(cwd).slice(sliceCount);

  // const p = new Pool(Object.assign({}, defaultOptions, opts, {
  //   filePath
  // }));


  const vorpal = new Vorpal();

  vorpal
    .command('foo', 'Outputs "bar".')
    .action(function (args: Array<string>, cb: Function) {
      this.log('bar');
      cb();
    });


  let getAnimals = function(input, cb){
     process.nextTick(cb,null,['dogs','cats','birds']);
  };

  vorpal.command('feed [animal] [duck]')
    .autocomplete({
      data: function (input: string, cb: Function) {
        console.log('input => ', input);
        getAnimals(input, function (err, array) {
          cb(array);
        });
      }
    })
    .action(function(args,cb){
      console.log('args =>',args);
       this.log('zoomba');
       cb(null);
    });


  vorpal
    .delimiter(shortCWD + chalk.magenta(' / $suman>'))
    .show();

  // const to = setTimeout(function(){
  //     process.stdin.end();
  //     console.log('No stdin was received after 10 seconds..closing...');
  //     process.exit(0);
  // },10000);
  //
  // process.stdin
  //   .setEncoding('utf8')
  //   .resume()
  //   .on('data', function (data: string) {
  //
  //     clearTimeout(to);
  //
  //     if (String(data).match(/s/)) {
  //       console.log('killing all active workers...');
  //       p.killAllActiveWorkers();
  //       return;
  //     }
  //
  //     let testFilePath = path.resolve(__dirname + '/test/one.test.js');
  //     console.log('data received => ', data);
  //
  //     p.any({testFilePath}).then(function (result) {
  //
  //       console.log('result => ', result);
  //
  //     }, function (err: Error) {
  //       console.error(err.stack || err);
  //     });
  //
  //   });

  return function cleanUpSumanD(): void {

    // process.stdin.end();

  };
};

const $exports = module.exports;
export default $exports;

