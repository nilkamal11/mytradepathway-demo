import { defineConfig } from "@playwright/test";
const live = process.env.LIVE_DEMO_URL;
export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  expect: { timeout: 15000 },
  timeout: 60000,
  use: {
    baseURL: live || "http://127.0.0.1:3200/mytradepathway-demo/",
    viewport: { width: 1440, height: 1000 },
    ...(!process.env.CI ? { channel: "msedge" } : {}),
  },
  ...(!live
    ? {
        webServer: {
          command: "npm run preview",
          url: "http://127.0.0.1:3200/mytradepathway-demo/",
          reuseExistingServer: false,
        },
      }
    : {}),
});
