define('all', ['./foo', './bar', 'jquery.dialog'], function(require){
  require('./foo');
  require('jquery.dialog');
});