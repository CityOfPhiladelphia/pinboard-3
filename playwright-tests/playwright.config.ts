import { defineConfig } from '@playwright/test';

const isCI = !!process.env.CI;

// Local headless control:
// HEADLESS=true  -> run headless locally
// HEADLESS=false -> run headed locally
// If HEADLESS is not provided:
//   CI = headless
//   Local = headed
const localHeadless =
  process.env.HEADLESS === 'true'
    ? true
    : process.env.HEADLESS === 'false'
      ? false
      : isCI;

export default defineConfig({
  testDir: './',
  fullyParallel: true,
  workers: 2,

  retries: isCI ? 1 : 0,
  preserveOutput: 'always',

  use: {
    browserName: 'chromium',

    // CI runs headless by default.
    // Local can be controlled with HEADLESS=true or HEADLESS=false.
    headless: localHeadless,

    // Desktop tests use full browser window.
    // Mobile tests can override this inside the spec file with test.use({ ...devices['iPhone 13'] }).
    viewport: null,

    launchOptions: {
      // Slow motion is helpful only when watching headed local runs.
      slowMo: localHeadless ? 0 : 1000,

      // Maximize browser window for headed desktop runs.
      args: localHeadless ? [] : ['--start-maximized'],
    },

    permissions: ['geolocation'],

    geolocation: {
      latitude: 39.9512,
      longitude: -75.16037,
    },

    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  reporter: [['html', { open: 'never' }]],
});
