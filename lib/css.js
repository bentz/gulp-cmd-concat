var path = require('path'),
    fs = require('fs'),
    util = require('util'),
    _ = require('underscore'),
    gutil = require('gulp-util'),
    css = require('cmd-util').css,
    iduri = require('cmd-util').iduri;

exports.cssConcat = function(file, options, cached){
  var data = file.contents.toString('utf8'),
      meta = css.parse(data)[0],
      id = meta.id;

  if (!id) {
    gutil.log('require a transported file.');
    return '';
  }

  if (_.contains(cached, id)) return '';

  var imports = [];

  if (options.include === 'self') return data;
  
  walkImport();
  
  function walkImport() {
    meta = css.parse(data)[0];

    var isImported = false;
    data = css.stringify(meta.code, function(node, parent) {
      if (node.type === 'import' && node.id) {
        isImported = true;
        return importNode(node, parent);
      }
    });

    if (isImported) walkImport();
  }

  function importNode(node, parent) {
    if (_.contains(imports, node.id)) return false;

    imports.push(node.id);

    var fpath, parsed;
    if (node.id.charAt(0) === '.') {
      if (parent && parent.id) {
        node.id = unixy(path.join(path.dirname(parent.id), node.id));
      }
      fpath = path.join(path.dirname(file.path), node.id);

      if (!/\.css$/.test(fpath)) fpath += '.css';

      if (!fs.existsSync(fpath)) {
        gutil.log('file ' + fpath + ' not found');
        return false;
      }

      parsed = css.parse(fs.readFileSync(fpath, 'utf8'))[0];

      //remove circle imports
      if (parsed.id === id) {
        gutil.log('file ' + fpath + ' has circle dependencies');
        return false;
      }
      if (!parsed.id) gutil.log('file ' + fpath + ' has no defined id');

      parsed.id = node.id;
      return parsed;
    }

    var fileInPaths;
    options.paths.some(function(basedir){
      fpath = path.join(basedir, node.id);
      if (!/\.css$/.test(fpath)) fpath += '.css';
      if (fs.existsSync(fpath)) {
        fileInPaths = fpath;
        return true;
      }
    });

    if (!fileInPaths) {
      gutil.log('file ' + node.id + ' not found');
      return false;
    }

    parsed = css.parse(fs.readFileSync(fileInPaths, 'utf8'))[0];
    if (!parsed.id) gutil.log('file ' + fileInPaths + ' has no defined id');

    parsed.id = node.id;

    return parsed;
  }

  function toString(){
    meta = css.parse(data)[0];
    return css.stringify(meta.code, function(node) {
      if (node.id && _.contains(cached, node.id)) return false;
      if (node.id) {
        if (node.id.charAt(0) === '.') node.id = iduri.absolute(id, node.id);
        if (_.contains(cached, node.id)) return false;
        cached.push(node.id);
        
        return node;
      }
    });
  }
  
  return [
    util.format('/*! define %s */', id),
    toString()
  ].join(gutil.linefeed);
};

//helpers
function unixy(uri) {
  return uri.replace(/\\/g, '/');
}