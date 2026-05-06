const {series, parallel, watch, src, dest} = require('gulp');
const autoprefixer = require('autoprefixer');
const beeper = require('beeper');
const colorFunction = require('postcss-color-function');
const cssnano = require('cssnano');
const easyimport = require('postcss-easy-import');
const fs = require('fs');
const livereload = require('gulp-livereload');
const path = require('path');
const postcss = require('gulp-postcss');
const pump = require('pump');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const zip = require('gulp-zip').default;

const builtDir = path.join(__dirname, 'assets', 'built');

function handleError(done) {
    return function (err) {
        if (err) {
            beeper();
        }

        done(err);
    };
}

function serve(done) {
    livereload.listen(1234);
    done();
}

function cleanJs(done) {
    fs.readdir(builtDir, function (err, files) {
        if (err && err.code === 'ENOENT') {
            done();
            return;
        }

        if (err) {
            done(err);
            return;
        }

        const minifiedJs = files
            .filter(function (file) {
                return file.endsWith('-min.js') || file.endsWith('-min.js.map');
            })
            .map(function (file) {
                return fs.promises.unlink(path.join(builtDir, file));
            });

        Promise.all(minifiedJs).then(function () {
            done();
        }, done);
    });
}

function copyFonts(done) {
    pump([
        src('assets/fonts/**/*', {allowEmpty: true}),
        dest('assets/built/')
    ], handleError(done));
}

function css(done) {
    pump([
        src('assets/css/*.css', {sourcemaps: true}),
        postcss([
            easyimport,
            colorFunction(),
            autoprefixer(),
            cssnano({
                preset: ['default', {
                    zindex: false
                }]
            })
        ]),
        dest('assets/built/', {sourcemaps: '.'}),
        livereload()
    ], handleError(done));
}

function js(done) {
    pump([
        src('assets/js/*.js', {sourcemaps: true}),
        uglify(),
        rename({suffix: '-min'}),
        dest('assets/built/', {sourcemaps: '.'}),
        livereload()
    ], handleError(done));
}

function hbs(done) {
    pump([
        src(['*.hbs', 'partials/**/*.hbs'], {allowEmpty: true}),
        livereload()
    ], handleError(done));
}

function zipper(done) {
    const filename = require('./package.json').name + '.zip';

    pump([
        src([
            '**',
            '!node_modules', '!node_modules/**',
            '!dist', '!dist/**',
            '!playwright-report', '!playwright-report/**',
            '!test-results', '!test-results/**',
            '!*.log',
            '!yarn-error.log'
        ]),
        zip(filename),
        dest('dist/')
    ], handleError(done));
}

const build = series(parallel(css, series(cleanJs, js), copyFonts));
const watcher = function () {
    watch('assets/css/**', css);
    watch('assets/js/**', series(cleanJs, js));
    watch(['*.hbs', 'partials/**/*.hbs'], hbs);
};

exports.build = build;
exports.css = css;
exports.js = series(cleanJs, js);
exports.zip = series(build, zipper);
exports.default = series(build, serve, watcher);
