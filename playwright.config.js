// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  /* Maximum time one test can run for. */
  timeout: 10 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     */
    timeout: 5000
  },
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        /* Collect trace when retrying the failed test */
        trace: 'on-first-retry',
        /* Immer im headless-Modus ausführen */
        headless: true,
        /* Browser-Größe für Konsistenz festlegen */
        viewport: { width: 1280, height: 720 },
        /* Screenshot-Ordner definieren */
        screenshot: 'only-on-failure',
        /* Video nur bei Fehlern aufzeichnen */
        video: 'on-first-retry',
        /* Collect browser console logs */
        logger: {
          isEnabled: (name, severity) => true,
          log: (name, severity, message, args) => console.log(`${name} ${severity}: ${message}`)
        },
      },
    },
  ],
  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'echo "Using existing dev server on port 9091"',
    url: 'http://localhost:9091',
    reuseExistingServer: true,
    timeout: 5000,
  },
});
