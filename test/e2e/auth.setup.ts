import { expect, test as setup } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // ✅ تحقق من وجود مفاتيح Stack
  const stackProjectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
  const stackPublishableKey =
    process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;

  if (!stackProjectId || !stackPublishableKey) {
    throw new Error(
      "Stack credentials not found. Please set NEXT_PUBLIC_STACK_PROJECT_ID and NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY in your .env.test.local file",
    );
  }

  // ✅ افتح صفحة تسجيل الدخول
  await page.goto("/handler/sign-in", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");

  // ✅ تحقق من وجود بيانات المستخدم التجريبية
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;

  if (!testEmail || !testPassword) {
    throw new Error(
      "TEST_USER_EMAIL and TEST_USER_PASSWORD must be configured for E2E tests",
    );
  }

  try {
    // 🟩 الخطوة الأولى: إدخال الإيميل
    const emailInput = page
      .locator('input[type="email"], input[name="email"]')
      .first();
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill(testEmail);

    // 🟩 الخطوة الثانية: التعامل مع واجهة تسجيل دخول متعددة الخطوات
    const passwordInput = page
      .locator(
        'input[type="password"], input[name="password"], input[autocomplete="current-password"]',
      )
      .first();

    const hasPasswordInput = await passwordInput
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (!hasPasswordInput) {
      const continueButton = page
        .getByRole("button", { name: /continue|next|sign in/i })
        .first();
      await continueButton.click();
    }

    // 🟩 الخطوة الثالثة: إدخال الباسورد
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await passwordInput.fill(testPassword);

    // 🟩 الخطوة الرابعة: الضغط على زر تسجيل الدخول
    const signInButton = page
      .getByRole("button", { name: /sign in|log in|continue/i })
      .last();
    await signInButton.click();

    // 🟩 الخطوة الخامسة: انتظار إعادة التوجيه بعد تسجيل الدخول
    await page.waitForURL(/\/(?!handler)/, { timeout: 15000 });

    // 🟩 التحقق من أننا سجلنا الدخول فعليًا
    await expect(
      page
        .getByText("New Article")
        .or(page.locator('[data-testid="user-menu"]')),
    ).toBeVisible({ timeout: 10000 });

    console.log("✅ Authentication successful");

    // 🟩 حفظ حالة الجلسة
    await page.context().storageState({ path: authFile });
  } catch (error) {
    console.error("❌ Authentication failed:", error);

    if (!page.isClosed()) {
      await page
        .screenshot({ path: "playwright/.auth/auth-error.png", fullPage: true })
        .catch(() => {});
    }

    throw new Error(
      "Failed to authenticate. Please check:\n" +
        "1. TEST_USER_EMAIL and TEST_USER_PASSWORD are correct\n" +
        "2. The test user exists in your Stack project\n" +
        "3. Stack selectors match the actual UI (check auth-error.png screenshot)\n" +
        `Error: ${error}`,
    );
  }
});
