import { defineConfig } from '@playwright/test'

const isCI = !!process.env.CI

export default defineConfig({
  testDir: './',
  fullyParallel: false,
  workers: 1,

  retries: isCI ? 1 : 0,
  preserveOutput: 'always',

  use: {
    browserName: 'chromium',

    // Local = headed, CI = headless
    headless: isCI,

    // Maximize browser window
    viewport: null,

    launchOptions: {
      //Playwright waits about (1000 milliseconds = 1 sec) between actions.
      slowMo: 1000,
      args: ['--start-maximized'],
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
})
