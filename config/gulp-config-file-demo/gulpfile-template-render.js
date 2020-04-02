var path = require("path");
var process = require("process");

var gulp = require('gulp');
var del = require('del');
var ejs = require("gulp-ejs");
const rename = require('gulp-rename')
const debug = require('gulp-debug');
const data = require('gulp-data');
const template = require('gulp-template');
var gulpIgnore = require('gulp-ignore');

function clean() {
  return del(['dist']);
}

function replaceRelativePath() {
  return gulp.src([
    'app/views/**/*.ejs',
  ])
    .pipe(data(function (file) {
      return {
        resolve: function (relativePath) {
          console.log('path: ' + path.resolve(file.path, '../', relativePath));
          console.log('filename: ' + file.path);
          return path.resolve(file.path, '../', relativePath)
        }
      };
    }))
    .pipe(template(null, {
      evaluate: /<#([\s\S]+?)#>/g,
      escape: /<#-([\s\S]+?)#>/g,
      interpolate: /<#=([\s\S]+?)#>/g
    }))
    .pipe(gulp.dest("temp"))
    .pipe(gulpIgnore.exclude('app/views/**/_*.ejs'))
}

function render() {
  return gulp.src([
    'temp/**/*.ejs',
    '!temp/**/_*.ejs',
  ])
    .pipe(debug({title: 'handler html:'}))
    .pipe(ejs())
    .pipe(rename({extname: '.html'}))
    .pipe(gulp.dest("dist"));
}

// var build = gulp.series(clean, render, gulp.parallel(styles, scripts));
var build = gulp.series(clean, replaceRelativePath, render);

exports.build = build;
/*
 * Define default task that can be called by just running `gulp` from cli
 */
exports.default = build;
