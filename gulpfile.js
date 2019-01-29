var gulp = require('gulp');

// gulp plugins and utils
var gutil = require('gulp-util');
var livereload = require('gulp-livereload');
var postcss = require('gulp-postcss');
var sourcemaps = require('gulp-sourcemaps');
var zip = require('gulp-zip');
var minify = require('gulp-minify');
var del = require('del');

// postcss plugins
var autoprefixer = require('autoprefixer');
var colorFunction = require('postcss-color-function');
var cssnano = require('cssnano');
var customProperties = require('postcss-custom-properties');
var easyimport = require('postcss-easy-import');

var swallowError = function swallowError(error) {
    gutil.log(error.toString());
    gutil.beep();
    this.emit('end');
};

var nodemonServerInit = function () {
    livereload.listen(1234);
};

gulp.task('build', ['css', 'js:clean', 'js', 'copy'], function (/* cb */) {
    return nodemonServerInit();
});

gulp.task('copy', function() {
    return gulp.src(['assets/fonts/**/*'])
               .pipe(gulp.dest('assets/built/'));
});

gulp.task('css', function () {
    var processors = [
        easyimport,
        customProperties,
        colorFunction(),
        autoprefixer({browsers: ['last 2 versions']}),
        cssnano({
            preset: ['default', {
                zindex: false,
            }],
        })
    ];

    return gulp.src('assets/css/*.css')
        .on('error', swallowError)
        .pipe(sourcemaps.init())
        .pipe(postcss(processors))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('assets/built/'))
        .pipe(livereload());
});

gulp.task('js', function() {
    gulp.src(['assets/js/*.js'])
        .pipe(minify({
            noSource: true
        }))
        .pipe(gulp.dest('assets/built/', {overwrite: true}))
        .pipe(livereload());;
});

gulp.task('js:clean', function() {
    return del([
        'assets/built/*-min.js',
    ]);
});

gulp.task('watch', function () {
    gulp.watch('assets/css/**', ['css', 'copy']);
    gulp.watch('assets/js/**', ['js:clean', 'js']);
});

gulp.task('zip', ['css', 'js'], function () {
    var targetDir = 'dist/';
    var themeName = require('./package.json').name;
    var filename = themeName + '.zip';

    return gulp.src([
        '**',
        '!node_modules', '!node_modules/**',
        '!dist', '!dist/**'
    ])
        .pipe(zip(filename))
        .pipe(gulp.dest(targetDir));
});

gulp.task('default', ['build'], function () {
    gulp.start('watch');
});
