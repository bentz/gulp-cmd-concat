define('all', ['./foo', './bar', 'jquery.dialog'], function(require){
  require('./foo');
  require('jquery.dialog');
});
define("foo", [ "bar" ], function(require) {
    require("bar");
});
define("bar", [], function() {});
