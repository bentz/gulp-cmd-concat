define('p.page', ['./modules/m.dialog', './modules/m.modal'], function(require){
  require('./modules/m.dialog');
});
define("modules/m.dialog", [ "modules/m.modal" ], function(require) {
    require("modules/m.modal");
});
define("modules/m.modal", [], function(require) {});