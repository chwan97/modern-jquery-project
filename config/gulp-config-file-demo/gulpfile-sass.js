var gulp = require('gulp');
var del = require('del');
var sass = require('gulp-sass');
var csso = require('gulp-csso');

sass.compiler = require('node-sass');

function clean() {
  return del(['dist']);
}

function sassTask(){
  return gulp.src([
    'app/stylesheets/pages/**/*.scss',
    'app/stylesheets/application.scss'])
    .pipe(sass().on('error', sass.logError))
    .pipe(csso({
      restructure: false,
      sourceMap: true,
      debug: true
    }))
    .pipe(gulp.dest('dist'))
}

var build = gulp.series(clean, sassTask);

exports.default = build;

