const {defineConfig, devices} = require('@playwright/test');

const baseURL = process.env.GHOST_BASE_URL || 'http://localhost:2368';

module.exports = defineConfig({
    testDir: './tests',
    timeout: 30 * 1000,
    expect: {
        timeout: 10 * 1000,
        toHaveScreenshot: {
            animations: 'disabled',
            maxDiffPixelRatio: 0.01
        }
    },
    use: {
        baseURL,
        actionTimeout: 10 * 1000,
        navigationTimeout: 20 * 1000,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure'
    },
    projects: [
        {
            name: 'chromium-desktop',
            use: {
                ...devices['Desktop Chrome'],
                viewport: {width: 1440, height: 1000}
            }
        },
        {
            name: 'chromium-mobile',
            use: {
                ...devices['Pixel 5']
            }
        }
    ],
    reporter: [['list'], ['html', {open: 'never'}]]
});
