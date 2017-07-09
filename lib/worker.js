const residence = require('residence');
const path = require('path');
const util = require('util');
const fs = require('fs');

const sumanFilesToLoad = [
  'lib/index.js',
  'lib/exec-suite.js'
];

process.once('message', function (m) {
  setImmediate(function () {
    console.log('m.msg.testFilePath => ', m.msg.testFilePath);
    require(m.msg.testFilePath);
  });
});

process.once('SIGINT', function () {
  console.log('SIGINT received by suman-d.');
  process.exit(1);
});

const sumanIndex = process.env['SUMAN_LIBRARY_ROOT_PATH'];
const sumanProjectRoot = process.env['SUMAN_PROJECT_ROOT'];

fs.readdirSync(path.resolve(sumanIndex + '/lib/test-suite-helpers')).forEach(function (item) {
  sumanFilesToLoad.push(`lib/${item}`);
});

fs.readdirSync(path.resolve(sumanIndex + '/lib/test-suite-methods')).forEach(function (item) {
  sumanFilesToLoad.push(`lib/${item}`);
});

fs.readdirSync(path.resolve(sumanIndex + '/lib/helpers')).forEach(function (item) {
  sumanFilesToLoad.push(`lib/${item}`);
});

const pkgJSON = require(path.resolve(sumanIndex + '/package.json'));

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
    console.log('attempting to load => ', k);
    require(k);
    console.log('loaded => ', k);
  }
  catch (err) {
    // console.error(err.message || err);
    try {
      console.log('attempting to load 2 => ', k);
      require(path.resolve(sumanProjectRoot + '/node_modules/' + k));
      console.log('loaded 2 => ', k);
    }
    catch (err) {
      // console.error(err.message || err);
    }
  }
});

console.log('Suman is loaded, waiting for test file input...');








