define('foo', ['./bar'], function(require){
  require('./bar');
});