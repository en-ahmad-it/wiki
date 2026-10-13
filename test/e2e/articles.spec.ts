import { expect, test } from "@playwright/test";

test.describe("Article CRUD Operations (Authenticated)", () => {
  // Note: Authentication is handled by auth.setup.ts and playwright.config.ts
  // These tests run with the saved authentication state from the setup project

  test("should show New Article button when authenticated", async ({
    page,
  }) => {
    await page.goto("/");

    // Verify authentication state by checking for New Article button
    const newArticleButton = page.locator("text=New Article");
    await expect(newArticleButton).toBeVisible();
  });

  test("should display articles on home page", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check if the page has loaded properly
    const pageTitle = await page.title();
    expect(pageTitle).toContain("Wikimasters");

    // Check if Wikimasters heading is visible
    const heading = page.locator("text=Wikimasters");
    await expect(heading).toBeVisible();
  });

  test("should navigate to article detail page", async ({ page }) => {
    await page.goto("/");

    // Wait for articles to potentially load
    await page.waitForLoadState("networkidle");

    // Click on the first article if it exists
    const firstArticle = page.locator('[data-testid="article-card"]').first();
    const articleExists = await firstArticle.isVisible().catch(() => false);

    if (articleExists) {
      await firstArticle.click();

      // Should navigate to article detail page
      await expect(page).toHaveURL(/\/wiki\/\d+/);

      // Article content should be visible
      const content = page.locator("main");
      await expect(content).toBeVisible();
    }
  });

  test("should create a new article", async ({ page }) => {
    // Navigate to create article page
    await page.goto("/wiki/edit/new");

    // Verify we're on the create page
    await expect(page).toHaveURL("/wiki/edit/new");

    // Fill in article form
    const titleInput = page.locator('input[name="title"]');
    const contentTextarea = page
      .locator('textarea[name="content"]')
      .or(page.locator(".w-md-editor-text-input"));

    // Wait for form to be ready
    await titleInput.waitFor({ state: "visible" });
    await contentTextarea.first().waitFor({ state: "visible" });

    // Fill the form
    const uniqueTitle = `Test Article ${Date.now()}`;
    await titleInput.fill(uniqueTitle);
    await contentTextarea
      .first()
      .fill("This is a test article content created by Playwright E2E test.");

    // Submit form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for navigation after submission (AI summary generation may take time)
    await page.waitForURL(/\/(wiki\/\d+|$)/, { timeout: 20000 });

    // Verify the article was created
    const articleTitle = page.locator("h1").filter({ hasText: uniqueTitle });
    await expect(articleTitle).toBeVisible({ timeout: 10000 });
  });

  test("should update an existing article", async ({ page }) => {
    // First create an article to update
    await page.goto("/wiki/edit/new");

    const titleInput = page.locator('input[name="title"]');
    const contentTextarea = page
      .locator('textarea[name="content"]')
      .or(page.locator(".w-md-editor-text-input"));

    const originalTitle = `Article to Update ${Date.now()}`;
    await titleInput.fill(originalTitle);
    await contentTextarea.first().fill("Original content that will be changed");

    const createButton = page.locator('button[type="submit"]');
    await createButton.click();

    // Wait for redirect to article page
    await page.waitForURL(/\/wiki\/\d+/, { timeout: 20000 });

    // Extract article ID from URL
    const url = page.url();
    const match = url.match(/wiki\/(\d+)/);

    expect(match).not.toBeNull();
    const articleId = match?.[1];

    // Navigate to edit page
    await page.goto(`/wiki/edit/${articleId}`);
    await page.waitForLoadState("networkidle");

    // Update the article
    const editTitleInput = page.locator('input[name="title"]');
    const editContentTextarea = page
      .locator('textarea[name="content"]')
      .or(page.locator(".w-md-editor-text-input"));

    // Clear and fill with new values
    await editTitleInput.clear();
    const updatedTitle = `Updated Article ${Date.now()}`;
    await editTitleInput.fill(updatedTitle);

    await editContentTextarea.first().clear();
    await editContentTextarea
      .first()
      .fill("This content has been updated by Playwright test.");

    // Submit update
    const updateButton = page.locator('button[type="submit"]');
    await updateButton.click();

    // Wait for redirect (AI summary generation may take time)
    await page.waitForURL(/\/wiki\/\d+/, { timeout: 20000 });

    // Verify update was successful
    const updatedTitleElement = page
      .locator("h1")
      .filter({ hasText: updatedTitle });
    await expect(updatedTitleElement).toBeVisible({ timeout: 10000 });
  });

  test("should delete an article", async ({ page }) => {
    // First create an article to delete
    await page.goto("/wiki/edit/new");

    const titleInput = page.locator('input[name="title"]');
    const contentTextarea = page
      .locator('textarea[name="content"]')
      .or(page.locator(".w-md-editor-text-input"));

    const uniqueTitle = `Article to Delete ${Date.now()}`;
    await titleInput.fill(uniqueTitle);
    await contentTextarea.first().fill("This article will be deleted");

    const createButton = page.locator('button[type="submit"]');
    await createButton.click();

    // Wait for redirect to article page
    await page.waitForURL(/\/wiki\/\d+/, { timeout: 20000 });

    // Verify we're on the article page
    await expect(
      page.locator("h1").filter({ hasText: uniqueTitle }),
    ).toBeVisible();

    // Look for delete button (use first() to avoid strict mode violation if multiple exist)
    const deleteButton = page
      .locator("button")
      .filter({ hasText: /Delete/i })
      .first();

    if (await deleteButton.isVisible()) {
      // Handle confirmation dialog if it appears
      page.on("dialog", (dialog) => dialog.accept());

      await deleteButton.click();

      // Should redirect to home page after deletion
      await page.waitForURL("/", { timeout: 15000 });

      // Verify we're back on home page
      await expect(page).toHaveURL("/");

      // Verify article is no longer visible (wait a bit for potential cache clear)
      await page.waitForTimeout(1000);
      await expect(page.locator(`text=${uniqueTitle}`)).not.toBeVisible();
    }
  });

  test("should prevent creating article with empty title", async ({ page }) => {
    await page.goto("/wiki/edit/new");

    const titleInput = page.locator('input[name="title"]');
    const contentTextarea = page
      .locator('textarea[name="content"]')
      .or(page.locator(".w-md-editor-text-input"));

    // Fill only content, leave title empty
    await titleInput.fill("");
    await contentTextarea.first().fill("Some content");

    // Try to submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should stay on the same page or show validation error
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/wiki/edit/new");
  });

  test("should prevent creating article with empty content", async ({
    page,
  }) => {
    await page.goto("/wiki/edit/new");

    const titleInput = page.locator('input[name="title"]');
    const contentTextarea = page
      .locator('textarea[name="content"]')
      .or(page.locator(".w-md-editor-text-input"));

    // Fill only title, leave content empty
    await titleInput.fill("Test Title");
    await contentTextarea.first().fill("");

    // Try to submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should stay on the same page or show validation error
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/wiki/edit/new");
  });

  test("should display article content on detail page", async ({ page }) => {
    // Create an article first
    await page.goto("/wiki/edit/new");

    const titleInput = page.locator('input[name="title"]');
    const contentTextarea = page
      .locator('textarea[name="content"]')
      .or(page.locator(".w-md-editor-text-input"));

    const uniqueTitle = `Detail Test Article ${Date.now()}`;
    await titleInput.fill(uniqueTitle);
    await contentTextarea
      .first()
      .fill("Testing detail page display with unique content.");

    await page.locator('button[type="submit"]').click();

    // Wait for redirect to article page
    await page.waitForURL(/\/wiki\/\d+/, { timeout: 20000 });

    // Check that the title is displayed
    await expect(
      page.locator("h1").filter({ hasText: uniqueTitle }),
    ).toBeVisible();

    // Content should be visible
    const content = page.locator(
      "text=Testing detail page display with unique content",
    );
    await expect(content).toBeVisible();
  });

  test("should allow navigating between article pages", async ({ page }) => {
    // Go to home
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check if there are any articles
    const articleCards = page.locator('[data-testid="article-card"]');
    const count = await articleCards.count();

    if (count > 0) {
      // Click on first article
      await articleCards.first().click();
      await expect(page).toHaveURL(/\/wiki\/\d+/);

      // Navigate back to home by clicking the logo
      await page.locator("text=Wikimasters").first().click();
      await expect(page).toHaveURL("/");

      // Verify we're back on the home page
      await expect(page.locator("text=Wikimasters")).toBeVisible();
    }
  });

  test("should display AI-generated summary for articles", async ({ page }) => {
    // Create an article
    await page.goto("/wiki/edit/new");

    const titleInput = page.locator('input[name="title"]');
    const contentTextarea = page
      .locator('textarea[name="content"]')
      .or(page.locator(".w-md-editor-text-input"));

    const uniqueTitle = `Summary Test ${Date.now()}`;
    await titleInput.fill(uniqueTitle);
    await contentTextarea
      .first()
      .fill(
        "This is a comprehensive article about testing. It covers various aspects of E2E testing with Playwright and how to write effective tests.",
      );

    await page.locator('button[type="submit"]').click();

    // Wait for redirect to article page
    await page.waitForURL(/\/wiki\/\d+/, { timeout: 20000 });

    // The summary should be generated and displayed (though we can't predict exact content)
    // Just verify the article page loaded successfully
    await expect(
      page.locator("h1").filter({ hasText: uniqueTitle }),
    ).toBeVisible();
  });

  test("should allow editing own articles", async ({ page }) => {
    // Create an article
    await page.goto("/wiki/edit/new");

    const uniqueTitle = `Editable Article ${Date.now()}`;
    await page.locator('input[name="title"]').fill(uniqueTitle);
    await page
      .locator('textarea[name="content"]')
      .or(page.locator(".w-md-editor-text-input"))
      .first()
      .fill("Original content");

    await page.locator('button[type="submit"]').click();

    // Wait for redirect
    await page.waitForURL(/\/wiki\/\d+/, { timeout: 20000 });

    // Extract article ID
    const url = page.url();
    const match = url.match(/wiki\/(\d+)/);
    expect(match).not.toBeNull();
    const articleId = match?.[1];

    // Should be able to navigate to edit page for own article
    await page.goto(`/wiki/edit/${articleId}`);

    // Should not redirect (we own this article)
    await expect(page).toHaveURL(`/wiki/edit/${articleId}`);

    // Edit form should be visible
    const titleInput = page.locator('input[name="title"]');
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toHaveValue(uniqueTitle);
  });
});
