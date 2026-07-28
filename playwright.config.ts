import { defineConfig } from '@playwright/test'

const alternateBrowser = process.env.PW_BROWSER as 'firefox' | 'webkit' | undefined

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    browserName: alternateBrowser,
    channel: alternateBrowser ? undefined : (process.env.PW_CHANNEL ?? 'chrome'),
    viewport: { width: 1280, height: 720 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
  },
})
