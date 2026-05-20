# Casper

The default theme for [Ghost](http://github.com/tryghost/ghost/). This is the latest development version of Casper. If you're just looking to download the latest release, head over to the [releases](https://github.com/TryGhost/Casper/releases) page.

&nbsp;

![screenshot-desktop](https://user-images.githubusercontent.com/120485/27221326-1e31d326-5280-11e7-866d-82d550a7683b.jpg)

&nbsp;

# First time using a Ghost theme?

Ghost uses a simple templating language called [Handlebars](http://handlebarsjs.com/) for its themes.

We've documented our default theme pretty heavily so that it should be fairly easy to work out what's going on just by reading the code and the comments. Once you feel comfortable with how everything works, we also have full [theme API documentation](https://themes.ghost.org) which explains every possible Handlebars helper and template.

**The main files are:**

- `default.hbs` - The main template file
- `index.hbs` - Used for the home page
- `post.hbs` - Used for individual posts
- `page.hbs` - Used for individual pages
- `tag.hbs` - Used for tag archives
- `author.hbs` - Used for author archives

One really neat trick is that you can also create custom one-off templates just by adding the slug of a page to a template file. For example:

- `page-about.hbs` - Custom template for the `/about/` page
- `tag-news.hbs` - Custom template for `/tag/news/` archive
- `author-ali.hbs` - Custom template for `/author/ali/` archive


# Development

Casper styles are compiled using Gulp/PostCSS to polyfill future CSS spec. This fork targets Ghost 6.x and uses Node 22 for local theme development.

From the theme's root directory:

```bash
$ yarn install
$ yarn dev
```

Now you can edit `/assets/css/` files, which will be compiled to `/assets/built/` automatically.

The `zip` Gulp task packages the theme files into `dist/<theme-name>.zip`, which you can then upload to your site.

```bash
$ yarn zip
```

# Releases

Releases are automatic on merge to `master`. Use [Conventional Commit](https://www.conventionalcommits.org/) subjects (`feat:` → minor, `fix:` → patch, `BREAKING CHANGE:` footer → major) — anything else skips the release. Download the zip from the [releases page](https://github.com/duckduckgo/Casper/releases) and upload via Ghost admin → Settings → Design → Change theme.

# Running the theme tests

CI runs the full chain on every PR and master push: gscan → zip → bundle
integrity → smoke → VRT. Locally:

```bash
yarn install --frozen-lockfile
yarn build
yarn zip
scripts/verify-bundle.sh dist/casper.zip
# spin up a local Ghost serving this theme on http://localhost:2368
GHOST_BASE_URL=http://localhost:2368 yarn test:smoke
GHOST_BASE_URL=http://localhost:2368 yarn test:vrt
```

The smoke spec covers: theme chrome + post feed render, single-post page,
DDG Proxima Nova webfont actually loaded at every weight, side-nav stays
one row tall, site-nav menu does not overflow at narrow desktop widths
(1015-1200px band), and no third-party tracking / external CDN requests.

`scripts/verify-bundle.sh` magic-byte-checks every font, PNG, and JPG in
the built zip — catches the class of bug where tooling re-encodes binary
assets without `yarn zip` itself failing.

# PostCSS Features Used

- Autoprefixer - Don't worry about writing browser prefixes of any kind, it's all done automatically with support for the latest 2 major versions of every browser.
- Variables - Simple pure CSS variables
- [Color Function](https://github.com/postcss/postcss-color-function)


# SVG Icons

Casper uses inline SVG icons, included via Handlebars partials. You can find all icons inside `/partials/icons`. To use an icon just include the name of the relevant file, eg. To include the SVG icon in `/partials/icons/rss.hbs` - use `{{> "icons/rss"}}`.

You can add your own SVG icons in the same manner.


# Copyright & License

Copyright (c) 2013-2018 Ghost Foundation - Released under the [MIT license](LICENSE).
