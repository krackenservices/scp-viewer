import { defineConfig, devices } from '@playwright/test';

const isDocker = process.env.PLAYWRIGHT_TEST_BASE_URL !== undefined;

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['html', { outputFolder: 'test-results' }]],
    use: {
        baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    // Only use webServer when running locally (not in Docker)
    ...(isDocker ? {} : {
        webServer: {
            command: 'npm run preview',
            url: 'http://localhost:4173',
            reuseExistingServer: !process.env.CI,
        },
    }),
});
