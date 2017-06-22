

const suman = require('suman');
const Test = suman.init(module);


Test.create('firm', function(it){

  55..times(function(){

    it('is cool', t => {
      suman.autoPass(t);
    });

  });

});