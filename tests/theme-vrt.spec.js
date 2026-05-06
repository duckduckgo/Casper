const {test, expect} = require('@playwright/test');

test.describe('SpreadPrivacy theme visual coverage', () => {
    test('homepage desktop rendering remains stable', async ({page}) => {
        await page.goto('/', {waitUntil: 'networkidle'});
        await expect(page.locator('.site-wrapper')).toBeVisible();
        await expect(page).toHaveScreenshot('home-desktop.png', {
            fullPage: true,
            maxDiffPixelRatio: 0.02
        });
    });

    test('homepage mobile rendering remains stable', async ({page}) => {
        await page.setViewportSize({width: 390, height: 844});
        await page.goto('/', {waitUntil: 'networkidle'});
        await expect(page.locator('.site-wrapper')).toBeVisible();
        await expect(page).toHaveScreenshot('home-mobile.png', {
            fullPage: true,
            maxDiffPixelRatio: 0.02
        });
    });

    test('representative post rendering remains stable', async ({page}) => {
        await page.goto('/', {waitUntil: 'networkidle'});
        const firstPost = page.locator('.post-card-content-link').first();
        await expect(firstPost).toBeVisible();
        await firstPost.click();
        await page.waitForLoadState('networkidle');
        await expect(page.locator('.post-full-title')).toBeVisible();
        await expect(page).toHaveScreenshot('post-desktop.png', {
            fullPage: true,
            maxDiffPixelRatio: 0.02
        });
    });
});
