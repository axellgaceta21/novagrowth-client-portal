import { defineConfig } from "@playwright/test";

const development = Boolean(process.env.PORTAL_TEST_DEV);
const port = development ? 3001 : 3100;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  use: { baseURL, browserName: "chromium", trace: "retain-on-failure" },
  webServer: { command: `npm run ${development ? "dev" : "start"} -- --hostname 127.0.0.1 --port ${port}`, url: baseURL, reuseExistingServer: development, timeout: 120000 },
});
