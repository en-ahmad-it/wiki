import { expect, test } from "@playwright/test";

test.describe("Authentication Flow (Unauthenticated)", () => {
  test("should display sign in and sign up buttons when not authenticated", async ({
    page,
  }) => {
    await page.goto("/");

    // Check for sign in and sign up buttons
    const signInButton = page.locator("text=Sign In");
    const signUpButton = page.locator("text=Sign Up");

    await expect(signInButton).toBeVisible();
    await expect(signUpButton).toBeVisible();
  });

  test("should not show New Article button when not authenticated", async ({
    page,
  }) => {
    await page.goto("/");

    // New Article button should not be visible without auth
    const newArticleButton = page.locator("text=New Article");
    await expect(newArticleButton).not.toBeVisible();
  });

  test("should navigate to Stack auth when clicking sign in", async ({
    page,
  }) => {
    await page.goto("/");

    // Click sign in button
    const signInButton = page.locator("text=Sign In");
    await signInButton.click();

    // Should redirect to Stack auth page (handler route)
    await expect(page).toHaveURL(/.*handler.*sign-in.*/);
  });

  test("should navigate to Stack auth when clicking sign up", async ({
    page,
  }) => {
    await page.goto("/");

    // Click sign up button
    const signUpButton = page.locator("text=Sign Up");
    await signUpButton.click();

    // Should redirect to Stack auth page (handler route)
    await expect(page).toHaveURL(/.*handler.*sign-up.*/);
  });

  test("should protect article creation route", async ({ page }) => {
    // Try to access edit page without authentication
    await page.goto("/wiki/edit/new");

    // Should redirect to auth handler
    await page.waitForURL(/.*handler.*/, { timeout: 5000 });

    const url = page.url();
    expect(url).toMatch(/handler/);
  });

  test("should protect article edit routes", async ({ page }) => {
    // Try to access an edit page without authentication
    await page.goto("/wiki/edit/1");

    // Should redirect to auth handler
    await page.waitForURL(/.*handler.*/, { timeout: 5000 });

    const url = page.url();
    expect(url).toMatch(/handler/);
  });

  test("should allow viewing articles without authentication", async ({
    page,
  }) => {
    await page.goto("/");

    // Home page should be accessible
    await expect(page).toHaveURL("/");

    // Should see the Wikimasters title link (not <title>)
    const titleLink = page.getByRole("link", { name: "Wikimasters" });
    await expect(titleLink).toBeVisible();

    // Should still see sign in/up buttons
    const signInButton = page.locator("text=Sign In");
    await expect(signInButton).toBeVisible();
  });

  test("should allow viewing individual articles without authentication", async ({
    page,
  }) => {
    await page.goto("/");

    // Try to find and click on an article if it exists
    const articleCard = page.locator('[data-testid="article-card"]').first();
    const hasArticles = await articleCard.isVisible().catch(() => false);

    if (hasArticles) {
      await articleCard.click();

      // Should be able to view the article
      await expect(page).toHaveURL(/\/wiki\/\d+/);

      // Should still not see New Article button
      const newArticleButton = page.locator("text=New Article");
      await expect(newArticleButton).not.toBeVisible();
    }
  });
});
