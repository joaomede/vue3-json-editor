import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5199',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'node', testMatch: /node\.spec\.mjs/ },
    { name: 'chromium', testMatch: /browser\.spec\.mjs/, use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: {
    command: 'npx vite --config fixture/vite.config.mjs',
    url: 'http://localhost:5199',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
})
