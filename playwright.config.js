const {defineConfig, devices} = require('@playwright/test');

// Refuse to silently overwrite VRT baselines in CI.
if (process.env.CI === 'true' && process.argv.some((a) => a === '--update-snapshots' || a.startsWith('--update-snapshots='))) {
    console.error('refusing to run with --update-snapshots in CI (env.CI=true); refresh baselines locally and commit them.');
    process.exit(2);
}

// Trailing slash required so subpath previews resolve `./` correctly.
const rawBase = process.env.GHOST_BASE_URL || 'http://localhost:2368';
const baseURL = rawBase.endsWith('/') ? rawBase : rawBase + '/';

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
        screenshot: 'only-on-failure',
        // Dev previews often live behind a personal subdomain whose cert doesn't match.
        ignoreHTTPSErrors: true
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                viewport: {width: 1440, height: 1000}
            }
        }
    ],
    reporter: [['list'], ['html', {open: 'never'}]]
});
