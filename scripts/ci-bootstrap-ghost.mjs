// Bootstrap a fresh Ghost instance for CI:
//   1. Complete the setup wizard (idempotent: 403 = already done).
//   2. Get a session cookie.
//   3. Create an Admin API integration to obtain an Admin API key.
//   4. Upload + activate dist/casper.zip via the official Admin API SDK.
//   5. Seed a tag, an author, and a published post so smoke/VRT URLs resolve.
//
// Assumes Ghost is reachable at GHOST_BASE_URL (default http://localhost:2368).

import GhostAdminAPI from '@tryghost/admin-api';
import {readFile} from 'node:fs/promises';

const BASE = process.env.GHOST_BASE_URL || 'http://localhost:2368';
const EMAIL = 'ci@example.com';
const PASS = 'ci-password-12345!';
const ZIP = process.env.THEME_ZIP || 'dist/casper.zip';

async function setupOwner() {
    const res = await fetch(`${BASE}/ghost/api/admin/authentication/setup/`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            setup: [{name: 'CI', email: EMAIL, password: PASS, blogTitle: 'CI'}]
        })
    });
    if (![201, 403].includes(res.status)) {
        throw new Error(`setup failed: ${res.status} ${await res.text()}`);
    }
}

async function login() {
    const res = await fetch(`${BASE}/ghost/api/admin/session/`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Origin: BASE},
        body: JSON.stringify({username: EMAIL, password: PASS})
    });
    if (res.status !== 201) {
        throw new Error(`login failed: ${res.status} ${await res.text()}`);
    }
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie) throw new Error('login: no set-cookie header');
    return setCookie.split(';')[0];
}

async function createAdminApiKey(cookie) {
    const res = await fetch(`${BASE}/ghost/api/admin/integrations/?include=api_keys`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Cookie: cookie, Origin: BASE},
        body: JSON.stringify({integrations: [{name: 'ci'}]})
    });
    if (res.status !== 201) {
        throw new Error(`integration create failed: ${res.status} ${await res.text()}`);
    }
    const body = await res.json();
    const adminKey = body.integrations[0].api_keys.find((k) => k.type === 'admin');
    return `${adminKey.id}:${adminKey.secret}`;
}

async function main() {
    await setupOwner();
    const cookie = await login();
    const key = await createAdminApiKey(cookie);

    const api = new GhostAdminAPI({url: BASE, key, version: 'v6.0'});

    await api.themes.upload({file: ZIP});
    await api.themes.activate('casper');

    await api.tags.add({name: 'Privacy', slug: 'privacy'});
    await api.posts.add(
        {
            title: 'Hello from CI',
            status: 'published',
            html: '<p>Seeded post for smoke + VRT runs.</p>',
            tags: [{slug: 'privacy'}]
        },
        {source: 'html'}
    );

    console.log('ci-bootstrap-ghost: ready');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
