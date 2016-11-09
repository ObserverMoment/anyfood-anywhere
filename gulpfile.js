var gulp = require('gulp'),
    concat = require('gulp-concat'),
    minifyCSS = require('gulp-minify-css'),
    uglifyJS = require('gulp-uglify'),
    watch = require('gulp-watch'),
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer');


gulp.task('css', function() {
  return gulp.src('./css/style.css')
    .pipe(postcss([autoprefixer]))
    .pipe(gulp.dest('./dist/css/'));
});

var jsSrcFiles = ['js/oauth-signature.js', 'js/app.js'];
var jsDest = 'dist/js';

gulp.task('scripts', function() {
    return gulp.src(jsSrcFiles)
        .pipe(concat('allScripts.min.js'))
        .pipe(uglifyJS())
        .pipe(gulp.dest(jsDest));
});
