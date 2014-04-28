var path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    gutil = require('gulp-util'),
    ast = require('cmd-util').ast,
    iduri = require('cmd-util').iduri;

exports.jsConcat = function(file, options, cached){
  var data = file.contents.toString('utf8'),
      meta = ast.parseFirst(data);

  if (!meta) {
    console.info('file not cmd module ' + file.path);
    return data;
  }

  if (_.contains(cached, meta.id)) return '';
  cached.push(meta.id);

  //dependencies
  var rv = meta.dependencies.map(function(dep){
    if (dep.charAt(0) === '.') {
      var id = iduri.absolute(meta.id, dep);
      if (_.contains(cached, id)) return '';

      cached.push(id);
      var fpath = path.join(path.dirname(file.path), dep);
      if (!/\.js$/.test(fpath)) fpath += '.js';
      if (!fs.existsSync(fpath)) {
        if (!/\{\w+\}/.test(fpath)) gutil.log('file ' + fpath + ' not found');
        return '';
      }
      
      var data = fs.readFileSync(fpath, 'utf8'),
          astCache;
      try {
        astCache = ast.getAst(data);
      } catch(e) {
        gutil.log('js parse error ', file.path);
        return cb(new PluginError(e.message + ' [ line:' + e.line + ', col:' + e.col + ', pos:' + e.pos + ' ]'));
      }

      var srcId = ast.parseFirst(astCache).id;

      astCache = ast.modify(astCache, function(v){
        //make id absolute
        if (v.charAt(0) === '.') {
          return iduri.absolute(srcId, v);
        }
        return v;
      });

      return astCache.print_to_string(options.uglify);
    } else if ( (/\.css$/.test(dep) && options.css2js) || options.include === 'all') {
      var fileInPaths;

      options.paths.some(function(basedir) {
        var fpath = path.join(basedir, dep);
        if (!/\.(?:css|js)$/.test(dep)) {
          fpath += '.js';
        }
        if (fs.existsSync(fpath)) {
          fileInPaths = fpath;
          return true;
        }
      });

      if (!fileInPaths) {
        gutil.log('file ' + dep + ' not found');
      } else {
        var data = fs.readFileSync(fileInPaths, 'utf8');
        if (/\.css$/.test(dep)) return options.css2js(data, dep, options);
        return data;
      }
    }
  }).join(options.separator);
  
  data = [data, rv].join(options.separator);

  return data;
};
