import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e-test-api",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure", screenshot: "only-on-failure", ...devices["Desktop Chrome"] },
  projects: [{ name: "chromium-test-api", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "node scripts/start-test-api-homologation.mjs", url: "http://localhost:3000", reuseExistingServer: false, timeout: 120_000 },
});
