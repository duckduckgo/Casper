---
name: ghost-dev-import-cleanup
description: After importing a Ghost JSON export into a local dev Ghost, delete the two Ghost demo posts that always re-appear and rewrite the literal __GHOST_URL__ placeholder to a real production domain across every column Ghost stores it in. Use when importing the Spread Privacy export (or any Ghost export) into a dev install — triggered by "import spread privacy content", "fix import", "clean up imported posts", "ghost url placeholders", "remove demo posts", "imported about-2".
---

# Ghost dev-import cleanup

After importing a Ghost JSON export into a local dev Ghost (via **Settings → Labs → Import content** in the admin UI), the DB needs three cleanups:

1. **Delete the two Ghost demo entries** that Ghost ships with — they re-appear after every import and clutter the home feed:
   - `about` page id `6a02272e8f2b1502e0cacfcd`
   - `coming-soon` post id `6a02272e8f2b1502e0cacfcb`
2. **Rename `about-2` → `about`.** The real About page imports with the `-2` suffix because of the slug collision with the Ghost demo. After deleting the demo, rename it back to the canonical slug.
3. **Rewrite the literal `__GHOST_URL__` placeholder** to a real production domain across every column where Ghost stores it. Ghost normally substitutes this at render time using its `url` config — so leaving it pointing at your dev URL means production-grade image links 404.

Columns that contain `__GHOST_URL__`:

| Table        | Columns                                                                                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `posts`      | `feature_image`, `mobiledoc`, `lexical`, `html`, `plaintext`, `custom_excerpt`, `canonical_url`, `codeinjection_head`, `codeinjection_foot`                       |
| `posts_meta` | `og_image`, `twitter_image`, `feature_image_caption`, `frontmatter`                                                                                               |
| `tags`       | `feature_image`, `og_image`, `twitter_image`, `description`, `canonical_url`, `codeinjection_head`, `codeinjection_foot`                                          |
| `users`      | `profile_image`, `cover_image`, `bio`                                                                                                                             |
| `settings`   | `value`                                                                                                                                                           |

## Workflow

```bash
# 1. Ghost install root (the directory containing config.development.json).
export GHOST_DIR=/home/moollaza/ghost-pr47

# 2. Back up the DB first.
cp "$GHOST_DIR/content/data/ghost-local.db" \
   "$GHOST_DIR/content/data/ghost-local.db.bak-$(date +%Y%m%d-%H%M%S)"

# 3. Run the cleanup script.
#    GHOST_DIR controls both the DB path and the require() path for Ghost's bundled sqlite3.
#    Optional overrides: PROD_URL (default https://spreadprivacy.com), DB_FILE (default $GHOST_DIR/content/data/ghost-local.db).
GHOST_DIR="$GHOST_DIR" PROD_URL="https://spreadprivacy.com" \
  node /path/to/this/skill/scripts/fix-import.js

# 4. Restart Ghost to flush in-memory caches (it caches content from the DB).
cd "$GHOST_DIR" && fnm use 22 && ghost restart
```

The script is at [`scripts/fix-import.js`](scripts/fix-import.js). It does everything in a single transaction and rolls back on any error.

## Expected output

```
deleted N from posts_authors for 6a02272e8f2b1502e0cacfcd
deleted N from posts_meta for 6a02272e8f2b1502e0cacfcd
...
deleted 1 from posts for 6a02272e8f2b1502e0cacfcb
renamed about-2 -> about: 1 row(s)
rewrote posts.feature_image: 139 row(s)
rewrote posts.mobiledoc: 139 row(s)
...
TOTAL rows rewritten: 495
--- residual __GHOST_URL__ refs ---
posts.feature_image 0
posts.mobiledoc 0
posts.lexical 0
posts.html 0
COMMIT ok
```

If any residual count is non-zero, an undocumented column still has `__GHOST_URL__` left in it — extend the `COLS` table in `scripts/fix-import.js` to cover it.

## Caveats

- The DB must be reachable at `$GHOST_DIR/content/data/ghost-local.db` (override with `DB_FILE` if not).
- Ghost must have run at least once against `$GHOST_DIR` so that `$GHOST_DIR/current/node_modules/sqlite3` exists. The script `require`s sqlite3 from there because `node` invoked from an arbitrary cwd won't find it otherwise.
- **Always restart Ghost after the script.** Direct DB writes don't invalidate Ghost's in-memory caches; without a restart you'll keep seeing the old content.
- To roll back: stop Ghost, copy the `.bak-*` file back over `ghost-local.db`, start Ghost.

## Related skills

- [`ghost-local-preview`](../ghost-local-preview/SKILL.md) — start / restart / refresh the local Ghost preview that this script targets.
