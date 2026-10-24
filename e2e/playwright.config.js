// Smoke tests against a deployed site. CI runs them after every staging deploy;
// locally: cd e2e && npm ci && npx playwright install chromium && npm test
// Point elsewhere with BASE_URL=https://theoption.life/ npm test
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 20_000 },
  // nginx rate-limits /api/ (instant 503) and repeated 503s get the IP banned,
  // so: one browser at a time, a pause between tests, and no retries (a retry
  // after a ban only adds strikes).
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.BASE_URL || 'https://theoption.life/staging/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Touch + narrow: the app picks the mobile reader on its own
    { name: 'phone', use: { ...devices['Pixel 7'] }, testMatch: /mobile-.*\.spec\.js/ },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testMatch: /desktop-.*\.spec\.js/ },
  ],
});
