import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5175", ...devices["Desktop Chrome"],
    // Set PW_CHANNEL=chrome to test with an installed browser if Chromium cannot be downloaded.
    channel: process.env.PW_CHANNEL,
  },
  webServer: {
    command: "npm run dev -- --port 5175 --strictPort",
    url: "http://127.0.0.1:5175",
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: "http://127.0.0.1:54321",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_only",
    },
  },
  reporter: "list",
});
