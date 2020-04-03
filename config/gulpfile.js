var path = require("path");
var gulp = require('gulp');
var del = require('del');
var sass = require('gulp-sass');
var csso = require('gulp-csso');
var RevAll = require("gulp-rev-all");
var ejs = require("gulp-ejs");
const rename = require('gulp-rename')
const debug = require('gulp-debug');
const data = require('gulp-data');
const template = require('gulp-template');
var gulpIgnore = require('gulp-ignore');

sass.compiler = require('node-sass');

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
}

function revTask(){
  return gulp.src([''])
    .pipe(RevAll.revision())
    .pipe(gulp.dest('dist'));
}
var build = gulp.series(clean, sassTask, replaceRelativePath, render, revTask);

exports.default = build;


