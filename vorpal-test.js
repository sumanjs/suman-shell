
const Vorpal = require('vorpal');
const vorpal = new Vorpal();

vorpal
  .command('foo', 'Outputs "bar".')
  .action(function (args, cb) {
    this.log('bar');
    cb();
  });

vorpal
  .delimiter('suman>')
  .show();