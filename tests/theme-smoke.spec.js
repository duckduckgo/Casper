const {expect, test} = require('@playwright/test');

test.describe('SpreadPrivacy theme smoke checks', () => {
    test('homepage renders DDG theme chrome and post feed', async ({page}) => {
        const consoleErrors = [];
        page.on('console', (message) => {
            if (message.type() === 'error') {
                consoleErrors.push(message.text());
            }
        });

        await page.goto('/');

        await expect(page.locator('.side-nav')).toBeVisible();
        await expect(page.locator('.site-nav, .mobile-nav').first()).toBeAttached();
        await expect(page.locator('.post-feed')).toBeVisible();
        await expect(page.locator('article.post-card').first()).toBeVisible();
        await expect(page.locator('.newsletter').first()).toBeAttached();

        await expect(page.locator('.side-bar')).not.toHaveClass(/show/);
        await page.locator('.side-menu').click();
        await expect(page.locator('.side-bar')).toHaveClass(/show/);
        await page.locator('.side-bar-close').click();
        await expect(page.locator('.side-bar')).not.toHaveClass(/show/);

        expect(consoleErrors.filter(isThemeConsoleError)).toEqual([]);
    });

    test('first post renders content, byline, and floating header', async ({page}) => {
        const consoleErrors = [];
        page.on('console', (message) => {
            if (message.type() === 'error') {
                consoleErrors.push(message.text());
            }
        });

        await page.goto('/');
        const firstPost = page.locator('article.post-card a.post-card-content-link').first();
        await expect(firstPost).toBeVisible();
        await firstPost.click();

        await expect(page.locator('body')).toHaveClass(/post-template/);
        await expect(page.locator('.post-full-title')).toBeVisible();
        await expect(page.locator('.post-full-content.gh-content')).toBeVisible();
        await expect(page.locator('.post-full-footer')).toBeVisible();
        await expect(page.locator('.floating-header')).toBeAttached();

        expect(consoleErrors.filter(isThemeConsoleError)).toEqual([]);
    });
});

function isThemeConsoleError(message) {
    return ![
        'favicon',
        'Failed to load resource',
        'net::ERR_BLOCKED_BY_CLIENT'
    ].some((ignored) => message.includes(ignored));
}
