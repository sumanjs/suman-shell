'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const path = require("path");
const logging_1 = require("./logging");
const sumanGlobalModulesPath = path.resolve(process.env.HOME + '/.suman/global');
exports.loadInquirer = function () {
    try {
        require.resolve('inquirer');
    }
    catch (err) {
        logging_1.log.warning('loading suman-shell...please wait.');
        try {
            cp.execSync(`cd ${sumanGlobalModulesPath} && npm install inquirer`);
        }
        catch (err) {
            logging_1.log.error('suman-shell could not be loaded; suman-shell cannot load the "inquirer" dependency.');
            logging_1.log.error(err.stack || err);
            process.exit(1);
        }
    }
    try {
        require('inquirer');
    }
    catch (err) {
        logging_1.log.warning('you may be missing necessary dependences for the suman-shell CLI.');
        logging_1.log.warning(err.message);
    }
};
