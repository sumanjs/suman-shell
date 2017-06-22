
const residence = require('residence');
const projectRoot = residence.findProjectRoot(process.cwd());
const path = require('path');


const npmDepsToLoad = [
  'async',
  'lodash',
  'lockfile',
  'function-arguments',
  'pragmatik',
  'colors',
  'ascii-table',
  'residence',
  'rimrak',
  'semver',
  'siamese',
  'tcp-ping',
  'socket.io',
  'socket.io-client',
  'suman-utils',
  'suman-events',
  'underscore',
  'replacestream'
];


const sumanFilesToLoad = [
  'lib/index.js',
];


process.once('message', function(m){
  require(m.msg.testFilePath);
});


npmDepsToLoad.forEach(function(dep){
  try{
    require(dep);
  }
  catch(err){
    console.error(err.stack || err);
  }
});


const sumanRoot = path.resolve(projectRoot + '/node_modules/suman');

sumanFilesToLoad.forEach(function(dep){
  try{
    require(path.resolve(sumanRoot + '/' + dep));
  }
  catch(err){
    console.error(err.stack || err);
  }
});




