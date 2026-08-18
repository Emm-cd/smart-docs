// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 40_000,
  retries: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    // URL de tu app en Vercel
    baseURL: process.env.BASE_URL || 'https://smart-docs-amber.vercel.app/',

    // ⬇️ ENCABEZADOS GLOBALES: Envía la clave para saltar la protección de Vercel
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': process.env.VERCEL_BYPASS_TOKEN || 'mNXWssGAVTxBrmPhufR5vInrRuP2Q0Nn',
    },

    headless: false,
    screenshot: 'on',
    video: 'on',
    trace: 'on',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: 'test-results',
});