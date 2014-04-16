var gulp = require('gulp'),
    clean = require('gulp-clean'),
    jshint = require('gulp-jshint'),
    runSeq = require('run-sequence'),
    cmdConcat = require('./index');

gulp.task('clean', function(){
  return gulp.src('test/expected', { read: false })
    .pipe(clean());
});

gulp.task('concat', ['clean'], function(cb){
  return gulp.src('**/*.js', { cwd: 'test/cases/js' })
    .pipe(cmdConcat({
      paths: ['test/cases/libs'],
      include: 'all'
    }))
    .pipe(gulp.dest('test/expected/js'));
});

gulp.task('jshint', function(){
  return gulp.src(['../lib/*.js', '../index.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('default', ['concat']);