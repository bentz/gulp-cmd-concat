var gulp = require('gulp'),
    path = require('path'),
    es = require('event-stream'),
    ast = require('cmd-util').ast,
    iduri = require('cmd-util').iduri,
    _ = require('underscore'),
    gutil = require('gulp-util'),
    script = require('./lib/script'),
    css = require('./lib/css');

var PLUGIN_NAME = 'gulp-cmd-concat';

module.exports = function(options){
  options = _.extend({
    paths: ['sea-modules'],

    uglify: {
      beautify: true,
      comments: true
    },

    separator: '\n',

    include: 'self',

    noncmd: false,

    processors: {
      '.js': script.jsConcat,
      '.css': css.cssConcat
    }
  }, options || {});

  function doConcat(file, cb) {
    if (file.isNull()) return cb(null, file);
    if (file.isStream()) return cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported for ' + PLUGIN_NAME));

    var data = file.contents.toString('utf8'),
        extname = path.extname(file.path),
        processor = options.processors[extname];

    if (!processor) return cb(null, file);

    return processor(file, cb, options);
  }

  return es.map(doConcat);
};