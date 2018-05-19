'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');
const path = require("path");
const _suman = global.__suman = (global.__suman || {});
const sumanFilesToLoad = [
    'lib/index.js',
    'lib/exec-suite.js',
    'lib/suman.js'
];
process.once('message', function (m) {
    setImmediate(function () {
        require(m.msg.testFilePath);
    });
});
process.once('SIGINT', function () {
    console.log('SIGINT received by suman-shell.');
    process.exit(1);
});
const sumanIndex = process.env['SUMAN_LIBRARY_ROOT_PATH'];
const sumanProjectRoot = process.env['SUMAN_PROJECT_ROOT'];
const pkgJSON = require(path.resolve(sumanIndex + '/../package.json'));
sumanFilesToLoad.forEach(function (dep) {
    try {
        require(path.resolve(sumanIndex + '/' + dep));
    }
    catch (err) {
        console.error(err.message || err);
    }
});
Object.keys(pkgJSON.dependencies).forEach(function (k) {
    try {
        require(k);
    }
    catch (err) {
        try {
            require(path.resolve(sumanProjectRoot + '/node_modules/' + k));
        }
        catch (err) {
        }
    }
});
console.log('Suman is loaded, waiting for test file input...');
