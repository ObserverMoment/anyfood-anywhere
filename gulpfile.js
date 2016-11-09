var gulp = require('gulp'),
    concat = require('gulp-concat'),
    minifyCSS = require('gulp-minify-css'),
    uglifyJS = require('gulp-uglify'),
    watch = require('gulp-watch'),
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer');

var cssSrcFiles = ['css/style.css'];
var cssDest = 'dist/css';

// Process CSS
gulp.task('css', function() {
  return gulp.src(cssSrcFiles)
    .pipe(postcss([autoprefixer]))
    .pipe(minifyCSS())
    .pipe(concat('style.min.css'))
    .pipe(gulp.dest('./dist/css/'));
});

var jsSrcFiles = ['js/oauth-signature.js', 'js/app.js'];
var jsDest = 'dist/js';

// Process JS
gulp.task('scripts', function() {
    return gulp.src(jsSrcFiles)
        .pipe(uglifyJS())
        .pipe(concat('allScripts.min.js'))
        .pipe(gulp.dest(jsDest));
});

// Watch the main files for changes.
gulp.task('watch', function() {
  watch('js/*.js', function() {
    gulp.start('scripts');
  });
  watch('css/*.css', function() {
    gulp.start('css');
  });
});
