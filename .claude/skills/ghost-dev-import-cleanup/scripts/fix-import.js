#!/usr/bin/env node
// One-shot DB cleanup after importing a Ghost JSON export.
//
//   1. Delete the two Ghost demo entries (`about` page + `coming-soon` post)
//      and all of their child rows in posts_authors / posts_meta / posts_tags /
//      posts_products / mobiledoc_revisions.
//   2. Rename `about-2` -> `about` so the real Spread Privacy About page gets
//      the canonical slug now that the demo is gone.
//   3. Rewrite the Ghost `__GHOST_URL__` placeholder to a real production URL
//      across every column where the import dump uses it, so images / canonical
//      links resolve to the production CDN.
//
// Run with:
//   GHOST_DIR="$HOME/ghost-preview" \
//   PROD_URL=https://spreadprivacy.com \
//     node /path/to/scripts/fix-import.js
//
// Env knobs:
//   GHOST_DIR  Ghost install root containing `current/node_modules/sqlite3`
//              and `content/data/ghost-local.db`. Required.
//   PROD_URL   The URL to substitute for `__GHOST_URL__`. Default:
//              `https://spreadprivacy.com`.
//   DB_FILE    Explicit path to the SQLite DB. Default:
//              `$GHOST_DIR/content/data/ghost-local.db`.

const GHOST_DIR = process.env.GHOST_DIR;
if (!GHOST_DIR) {
    console.error('ERROR: GHOST_DIR env var is required (Ghost install root containing current/node_modules/sqlite3).');
    process.exit(2);
}
const PROD_URL = process.env.PROD_URL || 'https://spreadprivacy.com';
const DB_FILE = process.env.DB_FILE || `${GHOST_DIR}/content/data/ghost-local.db`;

let sqlite;
try {
    sqlite = require(`${GHOST_DIR}/current/node_modules/sqlite3`).verbose();
} catch (e) {
    console.error(`ERROR: could not require sqlite3 from ${GHOST_DIR}/current/node_modules/sqlite3 — has Ghost been installed there?`);
    console.error(e.message);
    process.exit(2);
}

const db = new sqlite.Database(DB_FILE);

const DEMO_IDS = ['6a02272e8f2b1502e0cacfcd', '6a02272e8f2b1502e0cacfcb'];

const COLS = [
    ['posts', 'feature_image'], ['posts', 'mobiledoc'], ['posts', 'lexical'],
    ['posts', 'html'], ['posts', 'plaintext'], ['posts', 'custom_excerpt'],
    ['posts', 'canonical_url'], ['posts', 'codeinjection_head'], ['posts', 'codeinjection_foot'],
    ['posts_meta', 'og_image'], ['posts_meta', 'twitter_image'],
    ['posts_meta', 'feature_image_caption'], ['posts_meta', 'frontmatter'],
    ['tags', 'feature_image'], ['tags', 'og_image'], ['tags', 'twitter_image'],
    ['tags', 'description'], ['tags', 'canonical_url'],
    ['tags', 'codeinjection_head'], ['tags', 'codeinjection_foot'],
    ['users', 'profile_image'], ['users', 'cover_image'], ['users', 'bio'],
    ['settings', 'value'],
];

function run(sql, params = []) {
    return new Promise((res, rej) => db.run(sql, params, function (e) { e ? rej(e) : res(this); }));
}
function all(sql, params = []) {
    return new Promise((res, rej) => db.all(sql, params, (e, r) => e ? rej(e) : res(r)));
}

(async () => {
    console.log(`DB: ${DB_FILE}`);
    console.log(`PROD_URL: ${PROD_URL}`);

    try {
        await run('BEGIN');

        const childTables = ['posts_authors', 'posts_meta', 'posts_tags', 'posts_products', 'mobiledoc_revisions'];
        for (const id of DEMO_IDS) {
            for (const t of childTables) {
                const r = await run(`DELETE FROM ${t} WHERE post_id = ?`, [id]);
                if (r.changes) console.log(`deleted ${r.changes} from ${t} for ${id}`);
            }
            const r = await run('DELETE FROM posts WHERE id = ?', [id]);
            console.log(`deleted ${r.changes} from posts for ${id}`);
        }

        const renameRes = await run(
            "UPDATE posts SET slug='about' WHERE slug='about-2' AND type='page'"
        );
        console.log(`renamed about-2 -> about: ${renameRes.changes} row(s)`);

        let totalRowsRewritten = 0;
        for (const [t, c] of COLS) {
            const r = await run(
                `UPDATE ${t} SET ${c} = REPLACE(${c}, '__GHOST_URL__', ?) WHERE ${c} LIKE '%__GHOST_URL__%'`,
                [PROD_URL]
            );
            if (r.changes) {
                console.log(`rewrote ${t}.${c}: ${r.changes} row(s)`);
                totalRowsRewritten += r.changes;
            }
        }
        console.log(`TOTAL rows rewritten: ${totalRowsRewritten}`);

        const remaining = await all(
            "SELECT 'posts.feature_image' as col, count(*) c FROM posts WHERE feature_image LIKE '%__GHOST_URL__%' "
            + "UNION ALL SELECT 'posts.mobiledoc', count(*) FROM posts WHERE mobiledoc LIKE '%__GHOST_URL__%'"
            + "UNION ALL SELECT 'posts.lexical', count(*) FROM posts WHERE lexical LIKE '%__GHOST_URL__%'"
            + "UNION ALL SELECT 'posts.html', count(*) FROM posts WHERE html LIKE '%__GHOST_URL__%'"
        );
        console.log('--- residual __GHOST_URL__ refs ---');
        remaining.forEach(r => console.log(r.col, r.c));

        await run('COMMIT');
        console.log('COMMIT ok');
    } catch (e) {
        console.error('FAILED, rolling back:', e);
        try { await run('ROLLBACK'); } catch (_) { }
        process.exit(1);
    } finally {
        db.close();
    }
})();
