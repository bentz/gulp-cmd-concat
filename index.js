var gulp = require('gulp'),
    path = require('path'),
    es = require('event-stream'),
    _ = require('underscore'),
    gutil = require('gulp-util'),
    ast = require('cmd-util').ast,
    iduri = require('cmd-util').iduri,
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

    include: 'relative',

    noncmd: false,

    processors: {
      '.js': script.jsConcat,
      '.css': css.cssConcat
    }
  }, options || {});

  var datas = [],
      cached = [],
      firstFile = null;

  function doConcat(file) {
    if (file.isNull()) return;
    if (file.isStream()) return this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported for ' + PLUGIN_NAME));

    var extname = path.extname(file.path),
        processor = options.processors[extname];

    if (!firstFile) {
      firstFile = file;
    } else {
      datas.push(options.separator);
    }
    if (!processor || options.noncmd) return datas.push(file.contents.toString('utf8'));
    var data = processor(file, options, cached);
    datas.push(data);
  }

  function end(){
    if (datas.length === 0) return this.emit('end');
    var data = datas.join('');

    if (/\.js$/.test(filename) && !options.noncmd) {
      var astCache = ast.getAst(data),
          idCaches = ast.parse(astCache).map(function(o){
            return o.id;
          });

      data = ast.modify(astCache, {
        dependencies: function(v) {
          if (v.charAt(0) === '.') {
            var altId = iduri.absolute(idCaches[0], v);
            if (_.contains(idCaches, altId)) return v;
          }

          var ext = path.extname(v);
          if (ext && /\.(?:html|txt|tpl|handlebars|css)$/.test(ext)) return null;

          return v;
        }
      }).print_to_string(options.uglify);
    }

    data = new Buffer(data);
    var fpath = filename,
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