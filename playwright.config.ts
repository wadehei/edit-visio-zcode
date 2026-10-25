import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
