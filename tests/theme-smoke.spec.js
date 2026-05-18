const {expect, test} = require('@playwright/test');

async function discoverUrls(page) {
    return page.evaluate(() => ({
        post: (document.querySelector('.post-card-content-link, .post-card a[href]') || {}).href,
        author: (document.querySelector('a[href*="/author/"]') || {}).href,
        tag: (document.querySelector('a[href*="/tag/"]') || {}).href
    }));
}

function parseRgb(color) {
    const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    return m ? [+m[1], +m[2], +m[3]] : null;
}

test.describe('SpreadPrivacy theme smoke checks', () => {
    test('homepage renders DDG theme chrome and post feed', async ({page}) => {
        const consoleErrors = [];
        page.on('console', (message) => {
            if (message.type() === 'error') consoleErrors.push(message.text());
        });

        await page.goto('./');

        await expect(page.locator('.side-nav')).toBeVisible();
        await expect(page.locator('.site-nav, .mobile-nav').first()).toBeAttached();
        await expect(page.locator('.post-feed')).toBeVisible();
        await expect(page.locator('article.post-card').first()).toBeVisible();

        await expect(page.locator('.side-bar')).not.toHaveClass(/show/);
        await page.locator('.side-menu').click();
        await expect(page.locator('.side-bar')).toHaveClass(/show/);
        await page.locator('.side-bar-close').click();
        await expect(page.locator('.side-bar')).not.toHaveClass(/show/);

        expect(consoleErrors.filter(isThemeConsoleError)).toEqual([]);
    });

    test('DDG_ProximaNova webfont loads and is the rendered family', async ({page}) => {
        await page.goto('./');
        await page.evaluate(() => document.fonts.ready);

        const result = await page.evaluate(() => {
            const loaded = new Set();
            for (const f of document.fonts) {
                if (f.family === 'DDG_ProximaNova' && f.status === 'loaded') loaded.add(f.weight);
            }
            return {
                loaded: [...loaded].sort(),
                bodyFontFamily: getComputedStyle(document.body).fontFamily,
                check: document.fonts.check('400 16px DDG_ProximaNova')
            };
        });

        expect(result.check).toBe(true);
        expect(result.bodyFontFamily).toMatch(/^DDG_ProximaNova/);
        for (const w of ['400', '600', '700']) {
            expect(result.loaded, `weight ${w} loaded`).toContain(w);
        }
    });

    test('side-nav header stays one row on post/tag/author pages', async ({page}) => {
        // Single-row guarantee. Cap at 80px; prod is 66px.
        await page.goto('./');
        const urls = await discoverUrls(page);
        for (const [label, url] of [['post', urls.post], ['author', urls.author]]) {
            expect(url, `${label} link`).toBeTruthy();
            await page.goto(url);
            const sideNav = page.locator('.side-nav').first();
            await expect(sideNav).toBeVisible();
            const box = await sideNav.boundingBox();
            expect(box.height, `side-nav height @ ${url}`).toBeLessThanOrEqual(80);
        }
    });

    test('site-nav menu items are all visible at narrow desktop widths', async ({page}) => {
        // 1011-1200px is the regression band. Assert each visible nav <a> sits
        // inside the viewport rather than asserting on .site-nav-left scrollWidth -
        // .site-nav-left is intentionally overflow-x: auto, so the scrollW check
        // would false-positive on legitimate content that fits via scroll.
        await page.goto('./');
        const urls = await discoverUrls(page);
        expect(urls.author, 'author link').toBeTruthy();
        for (const width of [1336, 1200, 1100, 1040, 1015, 950]) {
            await page.setViewportSize({width, height: 900});
            await page.goto(urls.author);
            const clipped = await page.evaluate((vw) => {
                return Array.from(document.querySelectorAll('.site-nav-left .nav a'))
                    .filter((a) => a.offsetParent !== null)
                    .filter((a) => a.getBoundingClientRect().right > vw + 1)
                    .map((a) => a.textContent.trim());
            }, width);
            expect(clipped, `clipped nav items @ ${width}px`).toEqual([]);
        }
    });

    test('no third-party domains are loaded on the page', async ({page, baseURL}) => {
        const allowed = new URL(baseURL).host;
        const offenders = new Set();
        page.on('request', (req) => {
            try {
                const url = new URL(req.url());
                if (!['http:', 'https:'].includes(url.protocol)) return;
                if (url.host !== allowed) offenders.add(`${url.host} - ${req.url()}`);
            } catch {
                // non-URL request target (data:, blob:, etc.) - ignore
            }
        });
        await page.goto('./');
        const urls = await discoverUrls(page);
        for (const [label, url] of [['home', './'], ['author', urls.author], ['tag', urls.tag]]) {
            expect(url, `${label} link`).toBeTruthy();
            await page.goto(url);
            await page.waitForLoadState('networkidle');
        }
        expect(Array.from(offenders)).toEqual([]);
    });

    test('first post renders content, byline, and floating header', async ({page}) => {
        const consoleErrors = [];
        page.on('console', (message) => {
            if (message.type() === 'error') consoleErrors.push(message.text());
        });

        await page.goto('./');
        const firstPost = page.locator('article.post-card a.post-card-content-link').first();
        await expect(firstPost).toBeVisible();
        await firstPost.click();

        await expect(page.locator('body')).toHaveClass(/post-template/);
        await expect(page.locator('.post-full-title')).toBeVisible();
        await expect(page.locator('.post-full-content.gh-content')).toBeVisible();
        await expect(page.locator('.post-full-footer')).toBeVisible();
        await expect(page.locator('.floating-header')).toBeAttached();
        await expect(page.locator('.newsletter').first()).toBeAttached();

        expect(consoleErrors.filter(isThemeConsoleError)).toEqual([]);
    });

    test('side-nav logo sits left of the hamburger on post/author/tag', async ({page}) => {
        await page.goto('./');
        const urls = await discoverUrls(page);
        for (const [label, url] of Object.entries(urls)) {
            expect(url, `${label} link`).toBeTruthy();
            await page.goto(url);
            const logoBox = await page.locator('.nav-logo').first().boundingBox();
            const menuBox = await page.locator('.side-menu').first().boundingBox();
            expect(logoBox, `${label}: .nav-logo`).not.toBeNull();
            expect(logoBox.width, `${label}: .nav-logo non-zero width`).toBeGreaterThan(0);
            expect(menuBox, `${label}: .side-menu`).not.toBeNull();
            expect(logoBox.x, `${label}: logo left of hamburger`).toBeLessThan(menuBox.x);
        }
    });

    test('tag page renders title in the grid area with dark text', async ({page}) => {
        await page.goto('./');
        const urls = await discoverUrls(page);
        expect(urls.tag, 'tag link').toBeTruthy();
        await page.goto(urls.tag);

        await expect(page.locator('.tag-header')).toBeVisible();
        await expect(page.locator('.site-header.outer')).toHaveCount(0);
        const titleColor = await page.locator('.tag-title').evaluate((el) => getComputedStyle(el).color);
        const rgb = parseRgb(titleColor);
        expect(rgb, `parseable color: ${titleColor}`).not.toBeNull();
        for (const channel of rgb) {
            expect(channel, `dark channel in ${titleColor}`).toBeLessThanOrEqual(80);
        }
    });
});

const HARMLESS_CONSOLE = [
    'favicon',
    'net::ERR_BLOCKED_BY_CLIENT'
];

function isThemeConsoleError(message) {
    // Treat first-party /assets/ and /content/ failures as real errors; only
    // suppress known harmless console noise (favicon, ad-blocker blocks).
    if (/Failed to load resource.*\/(?:assets|content)\//.test(message)) return true;
    return !HARMLESS_CONSOLE.some((ignored) => message.includes(ignored));
}
