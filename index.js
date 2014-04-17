var gulp = require('gulp'),
    path = require('path'),
    es = require('event-stream'),
    _ = require('underscore'),
    gutil = require('gulp-util'),
    script = require('./lib/script'),
    css = require('./lib/css');

var PLUGIN_NAME = 'gulp-cmd-concat';

module.exports = function(filename, options){
  if (!filename || typeof filename !== 'string') return this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'Missing filename'));

  options = _.extend({
    //modules path
    paths: ['sea-modules'],

    uglify: {
      beautify: true,
      comments: true
    },

    separator: gutil.linefeed,

    include: 'self',

    noncmd: false,

    processors: {
      '.js': script.jsConcat,
      '.css': css.cssConcat
    }
  }, options || {});

  var buffer = [],
      cached = [],
      firstFile = null,
      newLineBuffer = new Buffer(options.separator);

  function doConcat(file) {
    if (file.isNull()) return;
    if (file.isStream()) return this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported for ' + PLUGIN_NAME));

    var extname = path.extname(file.path),
        processor = options.processors[extname];

    if (!processor) return this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'no processors for file ' + file.path));
    
    if (!firstFile) firstFile = file;
    else buffer.push(newLineBuffer);
    
    var data = processor(file, options, cached);
    buffer.push(new Buffer(data));
  }

  function end(){
    if (buffer.length === 0) return this.emit('end');

    var data = Buffer.concat(buffer),
        fpath = filename,
        resultFile = new gutil.File({
          path: fpath,
          contents: data
        });

    firstFile = null;

    this.emit('data', resultFile);
    this.emit('end');
  }

  return es.through(doConcat, end);
};