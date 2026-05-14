# Agent instructions — DuckDuckGo Casper fork

This is the [duckduckgo/Casper](https://github.com/duckduckgo/Casper) checkout — a fork of TryGhost's Casper theme, customized for [spreadprivacy.com](https://spreadprivacy.com). This file is the canonical guidance for AI coding agents (Claude Code, Cursor, etc.) working in this repo. `AGENTS.md` is a symlink to this file so every agent runtime reads the same content.

## What this repo is

- The Ghost theme that powers [spreadprivacy.com](https://spreadprivacy.com).
- Handlebars templates at the repo root (`default.hbs`, `post.hbs`, etc.), source CSS in `assets/css/`, built CSS in `assets/built/`, partials in `partials/`.
- Default branch: `master`. PR branches follow `cursor/*` naming.

## Build system pain (read before touching CSS)

The repo's `gulpfile.js` uses **Gulp 3.x**, which only works on Node 8 / 10 — not Node 18+. Running `yarn install && yarn dev` on a modern Node will fail (`primordials is not defined` or `internalBinding is not defined`).

**Workaround used in this repo:**

- Edit `assets/css/spreadprivacy.css` (source) **and** `assets/built/spreadprivacy.css` (compiled output served by Ghost) together, by hand.
- Commit both. The built file is intentionally checked in so Ghost can serve the theme without a build step at deploy time.

This is the established pattern — see commit `f7317d53` ("Adopt sidemenu colors from duckduckgo.com sidebar") which edits both files in lockstep. Follow the same approach until someone modernizes the Gulp pipeline.

If you do try the proper build, you'll need a Node 8 environment: `fnm install 8 && fnm use 8 && yarn install --ignore-engines && yarn dev`. It's brittle.

## Hard rules

1. **Keep PR branches scoped.** Don't add agent docs, editor configs, or workflow files to feature PRs unless explicitly asked.
2. **Don't run `yarn dev` / `gulp` on Node 18 or 22.** It will not produce usable output. Use the direct-edit workaround above.
3. **Keep the built CSS (`assets/built/*.css`) and source CSS (`assets/css/*.css`) in sync in the same commit.** A change to one without the other is a bug.
4. **Don't `git push` to `origin/master` without confirming with the user.** This repo's `master` is the deployment branch and pushes have downstream effects.

## Safe to edit

- Handlebars templates (`*.hbs`, `partials/**`)
- `assets/css/**` and `assets/built/**` — **together**, see rule 3
- `package.json` / `yarn.lock` only if you're prepared to also fix the Gulp pipeline

## Don't touch without asking

- `gulpfile.js` — touching this means committing to fixing the build system
- `.github/**` — CI/PR templates
- `LICENSE` — upstream license

## Local preview

For running this theme against real Spread Privacy content via a local Ghost install, see the project skills under [`.claude/skills/`](.claude/skills/) (Cursor reads the same content through [`.cursor/skills/`](.cursor/skills/) symlinks):

- [`ghost-local-preview`](.claude/skills/ghost-local-preview/SKILL.md) — start / stop / restart Ghost, refresh the deployed theme from this repo, back up and restore the SQLite DB. Includes the Node 22 / `fnm` gotcha.
- [`ghost-dev-import-cleanup`](.claude/skills/ghost-dev-import-cleanup/SKILL.md) — import the Spread Privacy JSON export and clean up the two Ghost demo posts plus the literal `__GHOST_URL__` placeholders that ship in every Ghost export.
- [`ddg-nginx-dev-shim`](.claude/skills/ddg-nginx-dev-shim/SKILL.md) — expose any localhost dev service at `https://<your-handle>.duckduckgo.com/<subpath>/` via the production nginx include directory on your DDG dev box. Reusable beyond this repo.

## Quick repo orientation

| Path                 | What                                          |
| -------------------- | --------------------------------------------- |
| `default.hbs`        | Master template wrapping everything           |
| `index.hbs`          | Home page                                     |
| `post.hbs`           | Individual posts                              |
| `page.hbs`           | Individual pages                              |
| `tag.hbs`            | Tag archives                                  |
| `author.hbs`         | Author archives                               |
| `partials/`          | Reusable Handlebars chunks (incl. SVG icons)  |
| `assets/css/`        | Source CSS (PostCSS, compiled by Gulp 3)      |
| `assets/built/`      | Pre-built CSS — what Ghost actually serves    |
| `assets/js/`         | Source JS                                     |
| `assets/built/*.js`  | Built JS                                      |
| `gulpfile.js`        | The Node-8-only build pipeline                |
| `.claude/skills/`    | Project skills (Claude Code reads here)       |
| `.cursor/skills/`    | Symlinks into `.claude/skills/` for Cursor    |
