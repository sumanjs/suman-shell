import {log} from "./logging";
import {Pool} from "poolio";
import path = require('path');
import fs = require('fs');
import chalk from 'chalk';

export const makeRunFiles = function (p: Pool, projectRoot: string) {
  
  return function (args: Object, cb: Function) {
    
    if (!args) {
      log.error('Implementation error: no args object available. Returning early.');
      return cb(null);
    }
    
    if (!args.file) {
      log.error('no file/files chosen, please select a file path.');
      return cb(null);
    }
    
    let testFilePath = path.isAbsolute(args.file) ? args.file : path.resolve(process.cwd() + `/${args.file}`);
    
    try {
      let stats = fs.statSync(testFilePath);
      if (!stats.isFile()) {
        log.warning('please pass a suman test file, not a directory or symlink.');
        return cb(null);
      }
    }
    catch (err) {
      log.error(err.message);
      return cb(null);
    }
    
    const begin = Date.now();
    
    p.any({testFilePath}, function (err: Error, result: any) {
      log.veryGood('total time millis => ', Date.now() - begin, '\n');
      cb(null);
    });
  }
  
};
