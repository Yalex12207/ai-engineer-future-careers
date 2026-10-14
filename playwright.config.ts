import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
export default defineConfig({
  testDir: './e2e', timeout: 30_000, workers: 1, reporter: 'list',
  use: { baseURL: process.env.POSTER_TEST_URL || 'http://127.0.0.1:5173', browserName: 'chromium', channel: process.env.POSTER_BROWSER_CHANNEL || (existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe') ? 'msedge' : undefined), trace: 'retain-on-failure' },
  webServer: process.env.POSTER_TEST_URL ? undefined : { command: 'npm run dev', url: 'http://127.0.0.1:5173', reuseExistingServer: true, timeout: 30_000 },
});
