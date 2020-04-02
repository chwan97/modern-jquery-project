var gulp = require('gulp');
var del = require('del');
var gulpConnect = require('gulp-connect');

function clean() {
  return del(['dist']);
}

function connect() {
  return gulpConnect.server({
    root: 'dist',
  });
}

function html() {
  return gulp.src('public/*.*')
    .pipe(gulp.dest('dist'))
}

function watch() {
  return gulp.watch(['public/*.html'], gulp.series(html));
}

var build = gulp.series(clean, html, gulp.parallel(connect, watch));

exports.default = build;
