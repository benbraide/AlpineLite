const minify = require('@node-minify/core');
const uglifyjs = require('@node-minify/uglify-js');

minify({
    compressor: uglifyjs,
    input: './src/*.js',
    output: './dist/uglifyjs-wildcards.js',
    callback: function(err, min) {}
});
