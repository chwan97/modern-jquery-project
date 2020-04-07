var gulp = require('gulp');
var del = require('del');
var sass = require('gulp-sass');
process.env.NODE_ENV = 'production';
const webpack = require('webpack');

const config = require('./webpack.config')

sass.compiler = require('node-sass');


function clean() {
  return del(['dist', 'temp', 'cdn']);
}

function webpackTask() {
  return new Promise(function(resolve, inject){
    webpack(config, function(err, stats){
      resolve();
    })
  })
}

// const watchFileTask = gulp.parallel()

var build = gulp.series(clean, webpackTask);

exports.default = build;


