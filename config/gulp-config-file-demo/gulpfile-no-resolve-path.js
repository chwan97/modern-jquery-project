var replace = require('gulp-replace');
var path = require("path");

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

const shortPathKV = {
  'stylesheets/': 'asset/css/',
  'images/': 'asset/img/',
  'icons/': 'asset/icon/',
  'fonts/': 'asset/font/',
  'public/': 'asset/',
}

function render() {
  return gulp.src([
    'app/views/**/*.ejs',
    '!app/views/**/_*.ejs',
  ])
    .pipe(debug({title: 'handler html:'}))
    .pipe(ejs())
    .pipe(rename({extname: '.html'}))
    .pipe(replace(/(<link.*?href="|<img.*?src=")(.*?)(".*?>)/g, function (match, start, shortPath, end, offset, string) {
      var keyArray = Object.keys(shortPathKV);
      for (let i = 0; i < keyArray.length; i++) {
        if (shortPath.startsWith(keyArray[i])) {
          return  start + shortPathKV[keyArray[i]]
            + shortPath.replace(keyArray[i], '').replace('.scss', '.css').split('/').join('.')
            + end;
        }
      }
      return start + shortPath + end;
    }))
    .pipe(replace('<!-- inject page css -->', function () {
      return '<link rel="stylesheet" href="'
        + cssFileNameBuilder(this.file.path)
        + '">';
    }))
    .pipe(gulp.dest("dist"));
}

function cssFileNameBuilder(fileName) {
  // 取temp以下层级 格式为 pages.文件夹.文件名.css
  console.log(fileName);
  console.log(path.resolve());
  return 'asset/css/pages.'
    + fileName.replace(path.resolve() + '\\app\\views\\', '').replace('.html', '').split('/').join('.')
    + '.css';
}

// var build = gulp.series(clean, render, gulp.parallel(styles, scripts));
var build = gulp.series(clean, render);

exports.build = build;
/*
 * Define default task that can be called by just running `gulp` from cli
 */
exports.default = build;
