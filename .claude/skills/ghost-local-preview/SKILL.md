---
name: ghost-local-preview
description: Operate a local Ghost install previewing this Casper theme — start / stop / restart Ghost, refresh the deployed theme from this repo, tail logs, and back up or restore the SQLite DB. Use when the user asks to "start ghost", "restart ghost", "deploy this PR to my box", "refresh the preview", "tail ghost logs", or any other op on the local Ghost serving Spread Privacy content.
---

# Ghost local preview (Casper PR previews)

This skill operates a local Ghost install used to preview Casper theme branches against real Spread Privacy content.

> Each DDG developer runs their own local Ghost install on their own dev box and serves it from their own `<your-handle>.duckduckgo.com` subdomain. Substitute your own paths and handle below — the layout is a recommended convention, not a hard-coded location.

## Layout (recommended convention)

| Path                                         | Role                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `$GHOST_DIR`                                 | Ghost install root (`config.development.json`, `content/`, `current` → `versions/<X.Y.Z>`). |
| `$GHOST_DIR/content/themes/<theme-dir>/`     | Active theme — **non-git directory clone** of a Casper branch.                             |
| `$REPO_DIR`                                  | Canonical theme source (this repo, wherever you cloned it). Don't edit the deployed copy in isolation. |
| `$GHOST_DIR/content/data/ghost-local.db`     | SQLite DB with imported Spread Privacy content.                                            |

Suggested values (use whatever you prefer):

```bash
export GHOST_DIR="$HOME/ghost-preview"
export REPO_DIR="$HOME/projects/Casper"
export THEME_DIR="$GHOST_DIR/content/themes/casper-preview"
```

Public URL: `https://<your-handle>.duckduckgo.com/<subpath>/`, via the snippet documented in the [`ddg-nginx-dev-shim`](../ddg-nginx-dev-shim/SKILL.md) skill. The conventional `<subpath>` is `spreadprivacy` (matches Ghost's `url` config below), but you can use any unique path.

## Node version gotcha

`ghost-cli` requires **Node 22.x**. `fnm` may auto-switch into Node 18 in some directories, breaking `ghost restart` with `ERR_REQUIRE_ESM`.

**Always run before any `ghost` command:**

```bash
fnm use 22
node -v   # must report v22.x
```

Or load `fnm` with auto-cd: `eval "$(fnm env --use-on-cd)"`.

## Operate

```bash
cd "$GHOST_DIR" && fnm use 22

ghost status                       # is it up?
ghost start
ghost stop
ghost restart                      # also flushes in-memory caches
ghost log -f                       # tail logs (or: tail -f content/logs/*.log)
```

## Refresh the deployed theme from this repo

```bash
cd "$REPO_DIR"
git fetch origin
git checkout <branch>    # e.g. master, or a PR branch
git pull --ff-only

# Replace the deployed copy (this discards any local hand-edits — back them up first).
rsync -a --delete \
  --exclude='.git/' \
  "$REPO_DIR"/ \
  "$THEME_DIR"/

cd "$GHOST_DIR" && fnm use 22 && ghost restart
```

Then in Ghost admin → **Design → Change theme**, pick the theme dir name (e.g. `casper-preview`) if it isn't already active.

## CSS iteration shortcut (avoid the Gulp 3.x build)

The theme's source CSS (`assets/css/spreadprivacy.css`) is compiled to `assets/built/spreadprivacy.css` by a Gulp 3.x pipeline that requires Node 8 and is painful to run. For quick iteration, edit **both** files in the deployed theme dir directly:

- `$THEME_DIR/assets/css/spreadprivacy.css` (source)
- `$THEME_DIR/assets/built/spreadprivacy.css` (what Ghost actually serves)

Reload the page in the browser — no theme restart needed. When you're done iterating, port the changes back into `$REPO_DIR` on the right branch, commit both files together, and push.

## DB backup / restore

```bash
cd "$GHOST_DIR"

# Back up
cp content/data/ghost-local.db content/data/ghost-local.db.bak-$(date +%Y%m%d-%H%M%S)

# List backups
ls -lh content/data/ghost-local.db*

# Restore (stop Ghost first so SQLite locks release cleanly)
fnm use 22 && ghost stop
cp content/data/ghost-local.db.bak-<TIMESTAMP> content/data/ghost-local.db
ghost start
```

## Ghost config (do not change without restart)

`config.development.json` is the source of truth for Ghost's public URL. The conventional setup binds Ghost to `127.0.0.1:5000` and serves the site at `https://<your-handle>.duckduckgo.com/spreadprivacy`:

```json
{
  "url": "https://<your-handle>.duckduckgo.com/spreadprivacy",
  "server": { "port": 5000, "host": "127.0.0.1" },
  "database": {
    "client": "sqlite3",
    "connection": { "filename": "<absolute path to $GHOST_DIR>/content/data/ghost-local.db" }
  }
}
```

Ghost binds to `127.0.0.1` only — all public access goes through the nginx shim. Don't change the bind host.

If Ghost ever silently falls back to `ghost-dev.db` after a restart, check that `config.development.json` still exists in the install root — without it, Ghost uses its own default DB and the imported content "disappears". This file has been deleted accidentally in the past; consider it part of the install state.

## Related skills

- [`ddg-nginx-dev-shim`](../ddg-nginx-dev-shim/SKILL.md) — the nginx snippet that exposes Ghost publicly at `<your-handle>.duckduckgo.com/<subpath>/`.
- [`ghost-dev-import-cleanup`](../ghost-dev-import-cleanup/SKILL.md) — clean up a freshly-imported Ghost JSON export (demo posts + `__GHOST_URL__` placeholders).
