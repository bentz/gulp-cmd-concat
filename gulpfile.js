var gulp = require('gulp'),
    path = require('path'),
    clean = require('gulp-clean'),
    jshint = require('gulp-jshint'),
    runSeq = require('run-sequence'),
    cmdConcat = require('./index');

var tasks = {
  all: {
    options: {
      include: 'all',
      paths: ['test/cases/libs']
    },
    files: {
      'test/expected/js/all.js': ['test/cases/js/all.js', 'test/cases/js/foo.js', 'test/cases/js/bar.js']
    }
  },

  relative: {
    options: {
      include: 'relative'
    },
    files: {
      'test/expected/js/relative.js': 'test/cases/js/all.js'
    }
  },

  page: {
    files: {
      'test/expected/js/p.page.js': 'test/cases/js/p.page.js'
    }
  }
};

gulp.task('clean', function(){
  return gulp.src('test/expected', { read: false })
    .pipe(clean());
});

var taskNames = [];
Object.keys(tasks).forEach(function(name){
  var task = tasks[name],
      files = task.files,
      options = task.options;

  for(var f in files) {
    var taskName = name + ':' + f;
    gulp.task(taskName, function(){
      return gulp.src(files[f])
        .pipe(cmdConcat(f, options))
        .pipe(gulp.dest('.'));
    });
    taskNames.push(taskName);
  }
});

gulp.task('concat-css', function(){
  return gulp.src('foo/bar/baz/baz.css', { cwd: 'test/cases/css' })
    .pipe(cmdConcat('foo/bar/baz/baz.css', {
      include: 'all'
    }))
    .pipe(gulp.dest('test/expected/css'));
});

gulp.task('jshint', function(){
  return gulp.src(['../lib/*.js', '../index.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('concat-js', function(cb){
  runSeq('clean', taskNames, cb);
});

gulp.task('default', ['concat-js', 'concat-css']);