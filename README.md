# Casper — DuckDuckGo fork

This is the DuckDuckGo fork of TryGhost's [Casper theme](https://github.com/TryGhost/Casper), customized for the [Spread Privacy](https://spreadprivacy.com) blog. It's a Ghost CMS theme — Handlebars templates rendered by a running Ghost instance.

If you're looking for the upstream theme, see [TryGhost/Casper](https://github.com/TryGhost/Casper).

For instructions to AI coding agents working in this repo, see [`CLAUDE.md`](CLAUDE.md) (Cursor reads the same content via `AGENTS.md` → `CLAUDE.md`).

## Working with Ghost themes

Ghost uses [Handlebars](http://handlebarsjs.com/) for its themes. The theme code is documented heavily; reading the source and inline comments is the fastest way in. For the helper reference, see the [Ghost theme API docs](https://themes.ghost.org).

**The main template files are:**

- `default.hbs` — the main template wrapping everything
- `index.hbs` — home page
- `post.hbs` — individual posts
- `page.hbs` — individual pages
- `tag.hbs` — tag archives
- `author.hbs` — author archives

You can create custom one-off templates by adding the slug of a page to a template filename. For example:

- `page-about.hbs` — custom template for the `/about/` page
- `tag-news.hbs` — custom template for `/tag/news/` archive
- `author-ali.hbs` — custom template for `/author/ali/` archive

## Development

> ⚠️ The build pipeline is on **Gulp 3.x**, which only runs on **Node 8 / 10**. On any modern Node it will fail (`primordials is not defined` or `internalBinding is not defined`). For small CSS changes there's a hand-edit workaround — see [`CLAUDE.md`](CLAUDE.md#build-system-pain-read-before-touching-css).

Casper styles are compiled using Gulp/PostCSS to polyfill future CSS spec. To run the proper build you need Node 8 and Gulp installed. From the theme's root directory:

```bash
fnm use 8                          # or: nvm use 8
yarn install --ignore-engines
yarn dev
```

Now you can edit `/assets/css/` files, which will be compiled to `/assets/built/` automatically.

The `zip` Gulp task packages the theme files into `dist/<theme-name>.zip`, which you can then upload to your site.

```bash
yarn zip
```

## PostCSS features used

- **Autoprefixer** — automatic browser prefixes for the latest 2 major versions of every browser.
- **Variables** — simple pure CSS variables.
- [**Color Function**](https://github.com/postcss/postcss-color-function)

## SVG icons

Casper uses inline SVG icons, included via Handlebars partials. You can find all icons inside `/partials/icons`. To use an icon, include the name of the relevant file — for example, to include the SVG icon in `/partials/icons/rss.hbs`, use `{{> "icons/rss"}}`.

You can add your own SVG icons in the same manner.

## Local preview against real Spread Privacy content

To run this theme end-to-end against a real Spread Privacy export in a local Ghost install, see the project skills under [`.claude/skills/`](.claude/skills/) (Cursor picks them up via [`.cursor/skills/`](.cursor/skills/) symlinks):

- [`ghost-local-preview`](.claude/skills/ghost-local-preview/SKILL.md) — start, stop, and restart Ghost; refresh the deployed theme from this repo; back up and restore the SQLite DB. Includes the Node 22 / `fnm` gotcha.
- [`ghost-dev-import-cleanup`](.claude/skills/ghost-dev-import-cleanup/SKILL.md) — import a Ghost JSON export, then clean up the two Ghost demo posts and the literal `__GHOST_URL__` placeholders that ship in every export. Ships with a runnable `fix-import.js`.
- [`ddg-nginx-dev-shim`](.claude/skills/ddg-nginx-dev-shim/SKILL.md) — expose any localhost dev service at `https://moollaza.duckduckgo.com/<subpath>/` via the production nginx include directory. Reusable beyond this repo.

## Copyright & license

Released under the [MIT license](LICENSE).

Upstream Casper © 2013-2018 Ghost Foundation.
