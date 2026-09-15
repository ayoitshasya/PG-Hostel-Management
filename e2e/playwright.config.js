const { defineConfig, devices } = require('@playwright/test');

// Assumes the backend (http://localhost:5000) and frontend
// (http://localhost:5173, either `npm run dev` or a built `npm run
// preview`) are already running - this config doesn't auto-start them
// (see README for why: this repo's dev environment has had recurring
// issues with process lifecycle when tools spawn long-running servers
// themselves, so tests here assume you start them the same way you'd
// start them to use the app manually).
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false, // tests create real users/listings through the UI; avoid cross-test races
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /responsive\.spec\.js/ },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: /responsive\.spec\.js/ },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: /responsive\.spec\.js/ },
    // Responsive/mobile-viewport check only (not the full data-creating
    // flows - those already run 3x across the desktop browsers above;
    // repeating full signup/listing/inquiry creation a 4th time here
    // would just create more redundant test data for no extra signal).
    // testMatch here alone isn't enough to keep the desktop projects
    // from ALSO running this file (each project runs everything in
    // testDir by default unless told otherwise) - testIgnore above is
    // the half of this that actually excludes it from them.
    {
      name: 'Mobile Chrome',
      testMatch: /responsive\.spec\.js/,
      use: { ...devices['Pixel 5'] },
    },
  ],
});
