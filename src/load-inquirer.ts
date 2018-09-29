'use strict';

//core
import cp = require('child_process');
import path = require('path');

//npm
import chalk from 'chalk';

//project
import {log} from "./logging";
const sumanGlobalModulesPath = path.resolve(process.env.HOME + '/.suman/global');

////////////////////////////////////////////////////////////

export const loadInquirer = function () {
  
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
  
};


