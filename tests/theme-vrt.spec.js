const {test, expect} = require('@playwright/test');

// Refresh baselines locally: yarn test:vrt -- --update-snapshots
// (Refused in CI when env CI=true - see playwright.config.js)

const MOBILE = {width: 390, height: 844};

async function gotoStable(page, url) {
    await page.goto(url, {waitUntil: 'domcontentloaded'});
    await page.evaluate(() => document.fonts.ready);
}

async function discoverUrls(page) {
    return page.evaluate(() => {
        function pickHref(selector) {
            const a = document.querySelector(selector);
            return a ? a.getAttribute('href') : null;
        }
        return {
            author: pickHref('a[href*="/author/"]'),
            tag: pickHref('a[href*="/tag/"]'),
            post: pickHref('.post-card-content-link, .post-card a[href]')
        };
    });
}

async function gotoHomeAndDiscover(page) {
    await gotoStable(page, './');
    const urls = await discoverUrls(page);
    expect(urls.author, 'homepage must expose at least one author link').toBeTruthy();
    expect(urls.tag, 'homepage must expose at least one tag link').toBeTruthy();
    expect(urls.post, 'homepage must expose at least one post link').toBeTruthy();
    return urls;
}

const SNAPSHOT_OPTS = {fullPage: false, maxDiffPixelRatio: 0.02};

test.describe('SpreadPrivacy theme visual coverage', () => {
    test('homepage desktop rendering remains stable', async ({page}) => {
        await gotoStable(page, './');
        await expect(page.locator('.site-wrapper')).toBeVisible();
        await expect(page).toHaveScreenshot('home-desktop.png', SNAPSHOT_OPTS);
    });

    test('homepage mobile rendering remains stable', async ({page}) => {
        await page.setViewportSize(MOBILE);
        await gotoStable(page, './');
        await expect(page.locator('.site-wrapper')).toBeVisible();
        await expect(page).toHaveScreenshot('home-mobile.png', SNAPSHOT_OPTS);
    });

    test('author page desktop rendering remains stable', async ({page}) => {
        const urls = await gotoHomeAndDiscover(page);
        await gotoStable(page, urls.author);
        await expect(page.locator('.site-header-content')).toBeVisible();
        await expect(page).toHaveScreenshot('author-desktop.png', SNAPSHOT_OPTS);
    });

    test('author page mobile rendering remains stable', async ({page}) => {
        await page.setViewportSize(MOBILE);
        const urls = await gotoHomeAndDiscover(page);
        await gotoStable(page, urls.author);
        await expect(page).toHaveScreenshot('author-mobile.png', SNAPSHOT_OPTS);
    });

    test('tag page desktop rendering remains stable', async ({page}) => {
        const urls = await gotoHomeAndDiscover(page);
        await gotoStable(page, urls.tag);
        await expect(page.locator('.tag-header')).toBeVisible();
        await expect(page).toHaveScreenshot('tag-desktop.png', SNAPSHOT_OPTS);
    });

    test('tag page mobile rendering remains stable', async ({page}) => {
        await page.setViewportSize(MOBILE);
        const urls = await gotoHomeAndDiscover(page);
        await gotoStable(page, urls.tag);
        await expect(page).toHaveScreenshot('tag-mobile.png', SNAPSHOT_OPTS);
    });

    test('representative post rendering remains stable', async ({page}) => {
        const urls = await gotoHomeAndDiscover(page);
        await gotoStable(page, urls.post);
        await expect(page.locator('.post-full-title')).toBeVisible();
        await expect(page).toHaveScreenshot('post-desktop.png', SNAPSHOT_OPTS);
    });

    test('post mobile rendering remains stable', async ({page}) => {
        await page.setViewportSize(MOBILE);
        const urls = await gotoHomeAndDiscover(page);
        await gotoStable(page, urls.post);
        await expect(page).toHaveScreenshot('post-mobile.png', SNAPSHOT_OPTS);
    });
});
