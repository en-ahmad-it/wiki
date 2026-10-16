import { defineConfig, devices } from "@playwright/test";
// Side-effect import: loads .env.test / .env.test.local / .env into this
// process (and into every worker, which re-loads the config). Real environment
// variables always win, so CI secrets are unaffected.
import "./test/e2e/load-env";

const AUTH_STATE_PATH = "playwright/.auth/user.json";
const BASE_URL = "http://localhost:3000";
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./test/e2e",
  // A file is only collected if it is a spec or a Playwright setup file.
  // (global-setup.ts / global-teardown.ts do not match either pattern and are
  // therefore never treated as test files.)
  testMatch: ["**/*.spec.ts", "**/*.setup.ts"],
  globalSetup: "./test/e2e/global-setup.ts",
  globalTeardown: "./test/e2e/global-teardown.ts",

  // Tests share a single Neon database and a single dev/prod server, so keep
  // execution sequential to avoid cross-test interference.
  fullyParallel: false,
  // A committed test.only would silently skip everything else in CI.
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,

  // Login against Stack/Hexclave + a cold Neon connection can exceed the 30s
  // default in CI; 60s keeps individual tests from flaking on cold starts.
  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: isCI ? [["list"], ["html", { open: "never" }]] : [["html"]],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },

  projects: [
    // 1) Generates the authenticated session once, then writes it to disk.
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      // Logging in involves a full page load + Stack API round trips.
      timeout: 120_000,
    },

    // 2) CRUD tests. These always run with the freshly generated session.
    {
      name: "chromium-authenticated",
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_STATE_PATH,
      },
      dependencies: ["setup"],
      testMatch: /.*articles\.spec\.ts/,
    },

    // 3) Auth flow tests. Explicitly starts from a clean context so a leaked or
    // stale session can never make these assert the wrong thing.
    {
      name: "chromium-unauthenticated",
      use: {
        ...devices["Desktop Chrome"],
        storageState: { cookies: [], origins: [] },
      },
      testMatch: /.*auth\.spec\.ts/,
    },
  ],
});
