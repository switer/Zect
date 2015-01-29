var gulp = require('gulp')
var webpack = require('gulp-webpack')
var uglify = require('gulp-uglifyjs')
var header = require('gulp-header')
var meta = require('./package.json')
var watch = require('gulp-watch')

var banner = ['/**',
              '* Zect v${version}',
              '* (c) 2015 ${author}',
              '* Released under the ${license} License.',
              '*/',
              ''].join('\n')
var bannerVars = { 
        version : meta.version,
        author: 'guankaishe',
        license: 'MIT'
    }

gulp.task('watch', function () {
    watch('lib/*.js', function () {
        gulp.start('default')
    })
});

gulp.task('default', function() {
    return gulp.src('index.js')
        .pipe(webpack({
            output: {
                library: 'Zect',
                libraryTarget: 'umd',
                filename: 'zect.js'
            }
        }))
        .pipe(header(banner, bannerVars))
        .pipe(gulp.dest('dist/'))
        .pipe(uglify('zect.min.js', {
            mangle: true,
            compress: true
        }))
        .pipe(header(banner, bannerVars))
        .pipe(gulp.dest('dist/'))
});
