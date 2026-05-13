---
name: ghost-local-preview
description: Operate a local Ghost install previewing this Casper theme — start / stop / restart Ghost, refresh the deployed theme from this repo, tail logs, and back up or restore the SQLite DB. Use when the user asks to "start ghost", "restart ghost", "deploy this PR to my box", "refresh the preview", "tail ghost logs", or any other op on the local Ghost serving Spread Privacy content.
---

# Ghost local preview (Casper PR previews)

This skill operates a local Ghost install used to preview Casper theme branches against real Spread Privacy content.

## Layout

| Path                                                       | Role                                                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `/home/moollaza/ghost-pr47/`                               | Ghost install root (`config.development.json`, `content/`, `current` → `versions/6.37.1`). |
| `/home/moollaza/ghost-pr47/content/themes/casper-pr47/`    | Active theme — **non-git directory clone** of a Casper branch.                             |
| `/home/moollaza/projects/spreadprivacy-blog/Casper`        | Canonical theme source (this repo). Don't edit the deployed copy in isolation.             |
| `/home/moollaza/ghost-pr47/content/data/ghost-local.db`    | SQLite DB with imported Spread Privacy content.                                            |

Public URL: `https://moollaza.duckduckgo.com/spreadprivacy/`, via the snippet documented in the [`ddg-nginx-dev-shim`](../ddg-nginx-dev-shim/SKILL.md) skill.

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
cd /home/moollaza/ghost-pr47 && fnm use 22

ghost status                       # is it up?
ghost start
ghost stop
ghost restart                      # also flushes in-memory caches
ghost log -f                       # tail logs (or: tail -f content/logs/*.log)
```

## Refresh the deployed theme from this repo

```bash
cd /home/moollaza/projects/spreadprivacy-blog/Casper
git fetch origin
git checkout <branch>    # e.g. pr-47 or master
git pull --ff-only

# Replace the deployed copy (this discards any local hand-edits — back them up first).
rsync -a --delete \
  --exclude='.git/' \
  /home/moollaza/projects/spreadprivacy-blog/Casper/ \
  /home/moollaza/ghost-pr47/content/themes/casper-pr47/

cd /home/moollaza/ghost-pr47 && fnm use 22 && ghost restart
```

Then in Ghost admin → **Design → Change theme**, pick `casper-pr47` if it isn't already active.

## CSS iteration shortcut (avoid the Gulp 3.x build)

The theme's source CSS (`assets/css/spreadprivacy.css`) is compiled to `assets/built/spreadprivacy.css` by a Gulp 3.x pipeline that requires Node 8 and is painful to run. For quick iteration, edit **both** files in the deployed theme dir directly:

- `content/themes/casper-pr47/assets/css/spreadprivacy.css` (source)
- `content/themes/casper-pr47/assets/built/spreadprivacy.css` (what Ghost actually serves)

Reload the page in the browser — no theme restart needed. When you're done iterating, port the changes back into `/home/moollaza/projects/spreadprivacy-blog/Casper` on the right branch, commit both files together, and push.

## DB backup / restore

```bash
cd /home/moollaza/ghost-pr47

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

`config.development.json` is the source of truth for Ghost's public URL. The current setup binds Ghost to `127.0.0.1:5000` and serves the site at `https://moollaza.duckduckgo.com/spreadprivacy`:

```json
{
  "url": "https://moollaza.duckduckgo.com/spreadprivacy",
  "server": { "port": 5000, "host": "127.0.0.1" },
  "database": {
    "client": "sqlite3",
    "connection": { "filename": "/home/moollaza/ghost-pr47/content/data/ghost-local.db" }
  }
}
```

Ghost binds to `127.0.0.1` only — all public access goes through the nginx shim. Don't change the bind host.

If Ghost ever silently falls back to `ghost-dev.db` after a restart, check that `config.development.json` still exists in the install root — without it, Ghost uses its own default DB and the imported content "disappears". This file has been deleted accidentally in the past; consider it part of the install state.

## Related skills

- [`ddg-nginx-dev-shim`](../ddg-nginx-dev-shim/SKILL.md) — the nginx snippet that exposes Ghost publicly at `moollaza.duckduckgo.com/spreadprivacy/`.
- [`ghost-dev-import-cleanup`](../ghost-dev-import-cleanup/SKILL.md) — clean up a freshly-imported Ghost JSON export (demo posts + `__GHOST_URL__` placeholders).
