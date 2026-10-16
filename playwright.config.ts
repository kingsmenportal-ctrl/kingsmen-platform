import { defineConfig, devices } from "playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "kingsmen-runtime.spec.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: "reports/staging/playwright-runtime-results.json" }]
  ],
  use: {
    baseURL: process.env.KINGSMEN_STAGING_BASE_URL,
    trace: "off",
    screenshot: "off",
    video: "off"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
