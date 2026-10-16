import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { expect, test as setup } from "@playwright/test";
// Ensures the worker process has the same env vars as the config/app.
import "./load-env";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page, browser, baseURL }) => {
  // Accept both the current Hexclave names and the legacy Stack names. The SDK
  // supports both; CI currently exposes the NEXT_PUBLIC_STACK_* aliases.
  const projectId =
    process.env.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID ??
    process.env.HEXCLAVE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_STACK_PROJECT_ID ??
    process.env.STACK_PROJECT_ID;
  const publishableKey =
    process.env.NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY ??
    process.env.HEXCLAVE_PUBLISHABLE_CLIENT_KEY ??
    process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY ??
    process.env.STACK_PUBLISHABLE_CLIENT_KEY;

  if (!projectId || !publishableKey) {
    throw new Error(
      "Hexclave/Stack credentials are missing. Set NEXT_PUBLIC_HEXCLAVE_PROJECT_ID " +
        "and NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY (or the STACK_* equivalents) " +
        "in .env.test.local locally, or as CI secrets.",
    );
  }

  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;

  // Fail fast. Never "return" quietly here: the authenticated project depends
  // on this file. Skipping it would let that project run with a stale session
  // (or none at all) and fail with a confusing "not logged in" error.
  if (!testEmail || !testPassword) {
    throw new Error(
      "TEST_USER_EMAIL and TEST_USER_PASSWORD must be set (local: .env.test.local, " +
        "CI: repository secrets). Without them the authenticated session cannot be generated.",
    );
  }

  try {
    // 1) Open the sign-in handler. It renders skeletons while it fetches the
    // project config, so `networkidle` is unreliable (analytics beacons keep
    // the network busy). Wait for real elements instead.
    const response = await page.goto("/handler/sign-in", {
      waitUntil: "domcontentloaded",
    });

    // Surface hard server errors (e.g. a 500 in CI) with an actionable message
    // instead of a generic locator timeout.
    const status = response?.status() ?? 0;
    if (status >= 400) {
      const body = (await response?.text().catch(() => "")) ?? "";
      throw new Error(
        `The sign-in page responded with HTTP ${status}. This usually means the app ` +
          `failed to build/start in this environment (missing env vars, bad build, or ` +
          `a non-whitelisted redirect origin).\nURL: ${page.url()}\n` +
          `Body (truncated): ${body.slice(0, 500)}`,
      );
    }

    // 2) An email field exists on every credential/magic-link layout. Waiting
    // for it also waits for the post-skeleton auth form.
    const emailInput = page
      .locator('input#email, input[name="email"], input[type="email"]')
      .first();
    await emailInput.waitFor({ state: "visible", timeout: 30_000 });

    // 3) When the project enables BOTH password and magic-link, Stack renders
    // tabs and defaults to the magic-link ("Email") tab — which has no password
    // field. Switch to the password tab first. Match by role/name so we do not
    // depend on tab order, with a positional fallback.
    const tabs = page.getByRole("tab");
    if ((await tabs.count()) > 1) {
      const passwordTab = page.getByRole("tab", { name: /password/i });
      if ((await passwordTab.count()) > 0) {
        await passwordTab.first().click();
      } else {
        await tabs.last().click();
      }
    }

    // 4) Fill credentials. Locators are lazy, so `emailInput` re-resolves to
    // the credential form's input after the tab switch.
    await emailInput.fill(testEmail);

    const passwordInput = page
      .locator(
        'input#password, input[name="password"], input[type="password"], input[autocomplete="current-password"]',
      )
      .first();
    await passwordInput.waitFor({ state: "visible", timeout: 20_000 });
    await passwordInput.fill(testPassword);

    // 5) Submit the credential form.
    await page.locator('button[type="submit"]').first().click();

    // 6) `automaticRedirect` sends us to `urls.afterSignIn` ("/") once the
    // session cookie is set. Wait until we leave the /handler/* tree.
    await page.waitForURL((url) => !url.pathname.startsWith("/handler"), {
      timeout: 30_000,
    });

    // 7) Guard against wrong-origin sessions (e.g. localhost vs 127.0.0.1).
    // Cookies are host-scoped, so state saved for another origin would be
    // silently ignored by every authenticated test.
    const expectedOrigin = new URL(baseURL ?? "http://localhost:3000").origin;
    const actualOrigin = new URL(page.url()).origin;
    expect(
      actualOrigin,
      `Signed in on "${actualOrigin}" but tests run against "${expectedOrigin}". ` +
        "storageState cookies would be ignored — check baseURL and the Stack/Hexclave " +
        "trusted domains configuration.",
    ).toBe(expectedOrigin);

    // 8) Confirm the UI reflects an authenticated user before persisting state.
    await expect(page.getByTestId("new-article-btn")).toBeVisible({
      timeout: 30_000,
    });

    // 9) Persist the session.
    mkdirSync(dirname(authFile), { recursive: true });
    await page.context().storageState({ path: authFile });

    // 10) Prove the saved file actually works in a brand-new context. This
    // catches "storageState not applied" problems at setup time, instead of
    // failing every authenticated test later.
    const verifyContext = await browser.newContext({
      storageState: authFile,
      baseURL,
    });
    try {
      const verifyPage = await verifyContext.newPage();
      await verifyPage.goto("/", { waitUntil: "domcontentloaded" });
      await expect(verifyPage.getByTestId("new-article-btn")).toBeVisible({
        timeout: 20_000,
      });
    } finally {
      await verifyContext.close();
    }

    console.log(`✅ Authentication successful — session saved to ${authFile}`);
  } catch (error) {
    console.error("❌ Authentication failed:", error);

    if (!page.isClosed()) {
      await page
        .screenshot({ path: "playwright/.auth/auth-error.png", fullPage: true })
        .catch(() => {});
    }

    throw new Error(
      "Failed to authenticate the E2E test user. Check:\n" +
        "1. TEST_USER_EMAIL / TEST_USER_PASSWORD are correct and the user exists in the Stack/Hexclave project\n" +
        "2. The project has email+password sign-in enabled (see the tab handling in this file)\n" +
        "3. The sign-in page rendered in this environment (see playwright/.auth/auth-error.png)\n" +
        `Underlying error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
});
