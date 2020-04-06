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
var gulpConnect = require('gulp-connect');
const rev = require('gulp-rev');

sass.compiler = require('node-sass');

function clean() {
  return del(['dist', 'temp', 'cdn']);
}

function replaceRelativePath() {
  return gulp.src([
    'app/views/**/*.ejs',
  ])
    .pipe(data(function (file) {
      return {
        resolve: function (relativePath) {
          return path.resolve(file.path, '../', relativePath).replace(path.resolve() + '\\', '');
        }
      };
    }))
    .pipe(template(null, {
      evaluate: /<#([\s\S]+?)#>/g,
      escape: /<#-([\s\S]+?)#>/g,
      interpolate: /<#=([\s\S]+?)#>/g
    }))
    .pipe(gulp.dest("temp"))
}

function render() {
  return gulp.src([
    'temp/**/*.ejs',
    '!temp/**/_*.ejs',
  ])
    .pipe(debug({title: 'handler html:'}))
    .pipe(ejs())
    .pipe(rename({extname: '.html'}))
    .pipe(gulp.dest('dist'))
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
  // .pipe(RevAll.revision())
  // .pipe(gulp.dest('dist'))
  // .pipe(RevAll.manifestFile())
  // .pipe(gulp.dest('dist'))
  // .pipe(RevAll.versionFile())
  // .pipe(gulp.dest("build/assets"))
  //   .pipe(rev())
  //   .pipe(gulp.dest('dist'))
  //   .pipe(rev.manifest({
  //     base: 'dist',
  //     merge: true // Merge with the existing manifest if one exists
  //   }))
  //   .pipe(gulp.dest('dist'))
}

function connect() {
  return gulpConnect.server({
    root: 'dist',
  });
}
function revAllTask(){
  return gulp.src([
    'dist/**/*.*',
  ])
    .pipe(RevAll.revision())
    .pipe(gulp.dest('cdn'))
    .pipe(RevAll.manifestFile())
    .pipe(gulp.dest('cdn'))
}

function movePublic() {
  return gulp.src([
    'public/**/*.*',
  ])
    .pipe(gulp.dest('dist'))
}
var build = gulp.series(clean, sassTask,
  replaceRelativePath, render,
  movePublic, revAllTask/*, connect*/);

exports.default = build;


