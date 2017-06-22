
//core
import * as path from 'path';

//npm
import * as residence from 'residence';
import {Pool} from 'poolio';
import * as chalk from 'chalk';
import * as fs from 'fs';

//////////////////////////////////////////////////////////////////


const name = ' => [suman-d] =>';
const log = console.log.bind(console, name);
const logGood = console.log.bind(console, chalk.cyan(name));
const logVeryGood = console.log.bind(console, chalk.green(name));
const logWarning = console.error.bind(console, chalk.yellow.bold(name));
const logError = console.error.bind(console, chalk.red(name));

const projectRoot = residence.findProjectRoot(process.cwd());

let getSharedWritableStream = function(){
  return fs.createWriteStream(path.resolve(__dirname  + '/test.log'));
};

const p = new Pool({
  size: 3,
  filePath: path.resolve(__dirname + '/lib/worker.js'),
  getSharedWritableStream,
  addWorkerOnExit: true,
  oneTimeOnly: true
});


process.stdin.setEncoding('utf8');

process.stdin.on('data', function(data: string){

  let testFilePath = path.resolve(__dirname + '/test/one.test.js');
  console.log('data received => ', data);

  p.any({testFilePath}).then(function(result){

    console.log('result => ', result);

  }, function(err: Error){
    console.error(err.stack || err);
  })


});