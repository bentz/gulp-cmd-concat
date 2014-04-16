define('foo', ['./bar'], function(require){
  require('./bar');
});
define("bar", [], function() {});