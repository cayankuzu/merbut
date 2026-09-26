import { defineConfig } from '@playwright/test'

const alternateBrowser = process.env.PW_BROWSER as 'firefox' | 'webkit' | undefined
// Another local project may own 5173; PW_PORT points the suite at any dev server.
const port = process.env.PW_PORT ?? '5173'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: alternateBrowser,
    channel: alternateBrowser ? undefined : (process.env.PW_CHANNEL ?? 'chrome'),
    viewport: { width: 1280, height: 720 },
    trace: 'retain-on-failure',
    launchOptions: { args: ['--ignore-gpu-blocklist', '--enable-gpu'] },
  },
  webServer: {
    command: `node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: true,
  },
})
