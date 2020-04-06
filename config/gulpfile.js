var gulp = require('gulp');
var del = require('del');
var sass = require('gulp-sass');
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

var build = gulp.series(clean, webpackTask);

exports.default = build;


