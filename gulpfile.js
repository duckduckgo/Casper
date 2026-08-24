const {series, parallel, watch, src, dest} = require('gulp');
const autoprefixer = require('autoprefixer');
const beeper = require('beeper');
const colorFunction = require('postcss-color-function');
const customProperties = require('postcss-custom-properties');
const cssnano = require('cssnano');
const easyimport = require('postcss-easy-import');
const fs = require('fs');
const livereload = require('gulp-livereload');
const path = require('path');
const postcss = require('gulp-postcss');
const pump = require('pump');
const rename = require('gulp-rename');
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
    // encoding:false keeps font files as binary buffers (gulp 5 / vinyl-fs 4 default text-decodes them).
    pump([
        src('assets/fonts/**/*', {allowEmpty: true, encoding: false}),
        dest('assets/built/')
    ], handleError(done));
}

function css(done) {
    pump([
        src('assets/css/*.css', {sourcemaps: true}),
        postcss([
            easyimport,
            customProperties({preserve: false})
        ]),
        postcss([
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
        src('assets/js/*.js'),
        uglify(),
        rename({suffix: '-min'}),
        dest('assets/built/'),
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
        // encoding:false keeps binary files (woff2, png, jpg) as buffers;
        // vinyl-fs 4 otherwise UTF-8-decodes them and mangles the bytes.
        src([
            '**',
            '!node_modules', '!node_modules/**',
            '!dist', '!dist/**',
            '!playwright-report', '!playwright-report/**',
            '!test-results', '!test-results/**',
            '!*.log',
            '!yarn-error.log'
        ], {encoding: false}),
        zip(filename),
        dest('dist/')
    ], handleError(done));
}

// screen.css gives every :nth-child(6n+1) card the full-width slot, counting
// across the whole feed including the cards infinite scroll appends. index.hbs
// mirrors that set with @rowStart from {{#foreach posts columns=6}}, which is
// page-local, so the two only agree while posts_per_page is a multiple of 6.
// Fail the build rather than let the mismatch ship silently.
function checkPostsPerPage(done) {
    const perPage = require('./package.json').config.posts_per_page;
    if (perPage % 6 !== 0) {
        return done(new Error(
            `posts_per_page is ${perPage}; it must be a multiple of 6 so that ` +
            '@rowStart in index.hbs stays aligned with :nth-child(6n+1) in screen.css ' +
            'on every infinite-scroll page. See the note above the home page grid rules.'
        ));
    }
    done();
}

const build = series(checkPostsPerPage, parallel(css, series(cleanJs, js), copyFonts));
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
