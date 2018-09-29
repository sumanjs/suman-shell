'use strict';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

// npm
import residence = require('residence');
import path = require('path');
import util = require('util');
import fs = require('fs');
import chalk from 'chalk';

// project
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

// fs.readdirSync(path.resolve(sumanIndex + '/lib/test-suite-helpers'))
// .filter(v => String(v).endsWith('.js'))
// .forEach(function (item) {
//   sumanFilesToLoad.push(`lib/test-suite-helpers/${item}`);
// });
//
// fs.readdirSync(path.resolve(sumanIndex + '/lib/test-suite-methods'))
// .filter(v => String(v).endsWith('.js'))
// .forEach(function (item) {
//   sumanFilesToLoad.push(`lib/test-suite-methods/${item}`);
// });
//
// fs.readdirSync(path.resolve(sumanIndex + '/lib/injection'))
// .filter(v => String(v).endsWith('.js'))
// .forEach(function (item) {
//   sumanFilesToLoad.push(`lib/injection/${item}`);
// });
//
// fs.readdirSync(path.resolve(sumanIndex + '/lib/helpers'))
// .filter(v => String(v).endsWith('.js'))
// .forEach(function (item) {
//   sumanFilesToLoad.push(`lib/helpers/${item}`);
// });
//
// fs.readdirSync(path.resolve(sumanIndex + '/lib/index-helpers'))
// .filter(v => String(v).endsWith('.js'))
// .forEach(function (item) {
//   sumanFilesToLoad.push(`lib/index-helpers/${item}`);
// });
//
// fs.readdirSync(path.resolve(sumanIndex + '/lib/acquire-dependencies'))
// .filter(v => String(v).endsWith('.js'))
// .forEach(function (item) {
//   sumanFilesToLoad.push(`lib/acquire-dependencies/${item}`);
// });

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
    // console.log('attempting to load => ', k);
    require(k);
    // console.log('loaded => ', k);
  }
  catch (err) {
    // console.error(err.message || err);
    try {
      // console.log('attempting to load 2 => ', k);
      require(path.resolve(sumanProjectRoot + '/node_modules/' + k));
      // console.log('loaded 2 => ', k);
    }
    catch (err) {
      // console.error(err.message || err);
    }
  }
});

console.log('Suman is loaded, waiting for test file input...');








