import { expect, test as setup } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  const hexclaveProjectId = process.env.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID;
  const hexclavePublishableKey =
    process.env.NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY;

  if (!hexclaveProjectId || !hexclavePublishableKey) {
    throw new Error(
      "Hexclave credentials not found. Please set NEXT_PUBLIC_HEXCLAVE_PROJECT_ID and NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY in your .env.test.local file",
    );
  }

  await page.goto("/handler/sign-in");
  await page.waitForLoadState("networkidle");

  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;

  if (!testEmail || !testPassword) {
    console.warn("⚠️  TEST_USER_EMAIL and TEST_USER_PASSWORD not set.");
    console.warn(
      "⚠️  Please create a test user in Hexclave and set these credentials.",
    );
    console.warn("⚠️  Skipping authentication setup...");
    return;
  }

  try {
    const emailInput = page
      .locator('input[type="email"], input[name="email"]')
      .first();
    await emailInput.waitFor({ timeout: 5000 });
    await emailInput.fill(testEmail);

    const passwordInput = page
      .locator(
        'input[type="password"], input[name="password"], input[autocomplete="current-password"]',
      )
      .first();

    const hasPasswordInput = await passwordInput
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (!hasPasswordInput) {
      const continueButton = page.locator('button[type="submit"]').first();
      await continueButton.click();
    }

    await passwordInput.waitFor({ state: "visible", timeout: 10000 });
    await passwordInput.fill(testPassword);

    const signInButton = page.locator('button[type="submit"]').first();
    await signInButton.click();

    await page.waitForURL(/^(?!.*handler).*$/, { timeout: 10000 });

    // ✅ تحقق من ظهور عناصر تدل على تسجيل الدخول.
    await expect(
      page
        .locator("text=New Article")
        .or(page.locator('[data-testid="user-menu"]'))
        .or(page.getByText(/Wikimasters/i))
        .or(page.getByText(/Ahmad Ismail/i)),
    ).toBeVisible({ timeout: 15000 });

    console.log("✅ Authentication successful");

    await page.context().storageState({ path: authFile });
  } catch (error) {
    console.error("❌ Authentication failed:", error);

    if (!page.isClosed()) {
      await page
        .screenshot({ path: "playwright/.auth/auth-error.png" })
        .catch(() => {});
    }

    throw new Error(
      "Failed to authenticate. Please check:\n" +
        "1. TEST_USER_EMAIL and TEST_USER_PASSWORD are correct\n" +
        "2. The test user exists in your Hexclave project\n" +
        "3. Hexclave selectors match the actual UI (check auth-error.png screenshot)\n" +
        `Error: ${error}`,
    );
  }
});
