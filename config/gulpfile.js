var replace = require('gulp-replace');
var path = require("path");
var fs = require("fs");
var process = require("process");

var gulp = require('gulp');
var del = require('del');
var ejs = require("gulp-ejs");
const rename = require('gulp-rename')
const debug = require('gulp-debug');
var sass = require('gulp-sass');
var csso = require('gulp-csso');
const webpack = require('webpack');
const config = require('./webpack.config')
var RevAll = require("gulp-rev-all");

sass.compiler = require('node-sass');


function clean() {
  return del(['dist', 'temp', 'cdn']);
}

const shortPathKV = {
  'stylesheets/': 'asset/css/',
  'images/': 'asset/img/',
  'icons/': 'asset/icon/',
  'fonts/': 'asset/font/',
  'public/': '',
}
var manifest;

function render() {
  manifest = JSON.parse(fs.readFileSync('./dist/asset/js/manifest.json'));
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
          return start + shortPathKV[keyArray[i]]
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
    .pipe(replace('<!-- inject page js -->', function () {
      return jsFileNameFind(this.file.path);
    }))
    .pipe(gulp.dest("dist"));
}

function cssFileNameBuilder(fileName) {
  // 取views以下层级 格式为 pages.文件夹.文件名.css
  return 'asset/css/pages.'
    + fileName.replace(path.resolve() + '\\app\\views\\', '').replace('.html', '').split('/').join('.')
    + '.css';
}

function jsTagWrapper(src) {
  return '<script src="'
    + src
    + '"></script>';
}

function jsFileNameFind(fileName) {
  try {
    // pages.文件夹.文件名 去 webpack stats里去找
    var pageKey = 'pages.' + fileName.replace(path.resolve() + '\\app\\views\\', '').replace('.html', '').split('/').join('.');
    return manifest.entrypoints[pageKey].assets.map(function (src) {
      return jsTagWrapper('asset/js/' + src);
    }).join('');
  } catch (e) {
    return '<!-- js no find -->'
  }
}

function sassTask() {
  return gulp.src([
    'app/stylesheets/pages/**/*.scss',
    'app/stylesheets/application.scss'], {base: path.join(process.cwd(), './app/stylesheets')})
    .pipe(sass().on('error', sass.logError))
    .pipe(csso({
      restructure: false,
      sourceMap: true,
      debug: true
    }))
    .pipe(replace('url(images/', 'url(asset/img/'))
    .pipe(rename(function (path) {
      var dirnameTmp = path.dirname;
      path.dirname = "asset/css";
      var prefix = dirnameTmp.replace('.', '').split('\\').join('.');
      if (prefix) {
        path.basename = prefix + '.' + path.basename;
      }
    }))
    .pipe(gulp.dest('dist'))
}

function assetTaskBuilder(originalPath, assetpath) {
  return function () {
    return gulp.src([
      'app/' + originalPath + '/**/*.*',
    ], {base: path.join(process.cwd(), './app/' + originalPath)})
      .pipe(rename(function (path) {
        var dirnameTmp = path.dirname;
        path.dirname = 'asset/' + assetpath;
        var prefix = dirnameTmp.replace('.', '').split('\\').join('.');
        if (prefix) {
          path.basename = prefix + '.' + path.basename;
        }
      }))
      .pipe(gulp.dest('dist'))
  }
}

function publicPathTask() {
  return gulp.src([
    'public/**/*.*',
  ])
    .pipe(gulp.dest('dist'))
}

function webpackTask() {
  return new Promise(function (resolve, inject) {
    webpack(config, function (err, stats) {
      resolve();
    })
  })
}

function revTask() {
  return gulp.src(["dist/**", '!dist/asset/js/**/*.*'])
    .pipe(RevAll.revision({dontRenameFile: [".html"]}))
    .pipe(gulp.dest("cdn"))
    .pipe(RevAll.manifestFile())
    .pipe(gulp.dest('dist'))
}

var assetTask = gulp.parallel(
  assetTaskBuilder('icons', 'icons'),
  assetTaskBuilder('images', 'img'),
  assetTaskBuilder('fonts', 'fonts'),
  publicPathTask,
  sassTask,
  webpackTask);

// var build = gulp.series(clean, render, gulp.parallel(styles, scripts));
var build = gulp.series(clean, assetTask, render, revTask);

exports.build = build;
/*
 * Define default task that can be called by just running `gulp` from cli
 */
exports.default = build;

// "entrypoints
//   "pages.about.cache
//       "runtime.bundle.js",
//       "pages.about.cache.chunk.js"
//  
