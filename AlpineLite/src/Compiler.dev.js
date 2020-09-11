"use strict";

var minify = require('@node-minify/core');

var uglifyjs = require('@node-minify/uglify-js');

minify({
  compressor: uglifyjs,
  input: './src/*.js',
  output: './dist/uglifyjs-wildcards.js',
  callback: function callback(err, min) {}
});