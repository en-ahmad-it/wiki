import dotenv from "dotenv";

// Playwright does not load `.env` files on its own (unlike Next.js or Vitest).
// This module is imported for its side effects by playwright.config.ts,
// auth.setup.ts and global-setup.ts, so the config, the setup project and the
// global hooks all see the same variables.
//
// Precedence mirrors test/setup.ts, with `.env` as a local fallback:
//   processes that already have a variable set (e.g. GitHub Actions secrets)
//   always win, because dotenv never overrides existing keys.
dotenv.config({ quiet: true, path: ".env.test" });
dotenv.config({ quiet: true, path: ".env.test.local" });
dotenv.config({ quiet: true, path: ".env" });
