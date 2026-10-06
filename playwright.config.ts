import { defineConfig, devices } from '@playwright/test'

// Сквозные проверки на собранном dist/index.html (file://): так же, как его откроют
// с флешки в классе. Перед запуском: npm run build (npm run test:e2e делает это сам).
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
})
