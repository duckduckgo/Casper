# Casper – Ghost Default Theme

## Cursor Cloud specific instructions

### Node.js version requirement

This project targets **Ghost 6.x** and uses **Node 22** for local theme development. The `.node-version` file pins the version for `fnm` / `nvm` / `volta`.

### Development workflow

- `yarn dev` — runs `gulp` default task which compiles CSS/JS, starts livereload on port 1234, and watches `assets/css/` and `assets/js/` for changes.
- `yarn build` — one-shot compile (no watch). Required before running the Playwright suites.
- `yarn zip` — packages the theme into `dist/casper.zip` for upload to a Ghost instance.
- `yarn test:gscan` — Ghost theme validation.
- `yarn test:smoke` — Playwright structural smoke tests against `GHOST_BASE_URL` (default `http://localhost:2368`).
- `yarn test:vrt` — Playwright visual regression tests against committed baselines. Refresh with `yarn test:vrt -- --update-snapshots` (refused in CI when `CI=true`).
- CSS is compiled with PostCSS (autoprefixer, custom properties, color function, cssnano).
- JS is minified via `gulp-minify`.

### Running the theme

This is a Ghost CMS theme (Handlebars templates), not a standalone application. To see it render, install it in a running Ghost 6.x instance. `yarn dev` validates asset compilation and the watch/livereload cycle but does not render the theme.

### No lint tool configured

This project does not have a dedicated linter (no ESLint, Stylelint, or similar). The build, `gscan`, and the Playwright suites are the correctness checks.
