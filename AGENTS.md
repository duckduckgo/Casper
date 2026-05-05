# Casper – Ghost Default Theme

## Cursor Cloud specific instructions

### Node.js version requirement

This project uses **Gulp 3.9.1** which depends on the `natives` package. It requires **Node.js 8.x** (specifically v8.17.0). Node 10+ will fail with `internalBinding is not defined` and Node 12+ will fail with `primordials is not defined`.

The environment uses `nvm` with Node 8.17.0 set as default.

### Development workflow

- `yarn dev` — runs `gulp` default task which compiles CSS/JS, starts livereload on port 1234, and watches `assets/css/` and `assets/js/` for changes.
- `yarn zip` — packages the theme into `dist/casper.zip` for upload to a Ghost instance.
- CSS is compiled with PostCSS (autoprefixer, custom properties, color function, cssnano).
- JS is minified via `gulp-minify`.

### Running the theme

This is a Ghost CMS theme (Handlebars templates), not a standalone application. To see it render, it must be installed in a running Ghost instance. For development purposes, `yarn dev` is sufficient to validate asset compilation and the watch/livereload cycle.

### No lint tool configured

This project does not have a dedicated linter (no ESLint, Stylelint, or similar). The build (`yarn dev` or `yarn zip`) is the primary correctness check.
