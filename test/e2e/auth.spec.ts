import { expect, type Page, test } from "@playwright/test";

// These tests run in the "chromium-unauthenticated" project, which explicitly
// starts with an empty storageState (see playwright.config.ts). They must
// never see a logged-in session.

// WikiCard has no data-testid; article cards are links to /wiki/<id>.
const articleLinks = (page: Page) => page.locator('main a[href^="/wiki/"]');

test.describe("Authentication Flow (Unauthenticated)", () => {
  test("should display sign in and sign up buttons when not authenticated", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByTestId("sign-in-btn")).toBeVisible();
    await expect(page.getByTestId("sign-up-btn")).toBeVisible();
  });

  test("should not show New Article button when not authenticated", async ({
    page,
  }) => {
    await page.goto("/");

    // Must not exist at all while logged out.
    await expect(page.getByTestId("new-article-btn")).toHaveCount(0);
    await expect(page.getByTestId("user-menu")).toHaveCount(0);
  });

  test("should navigate to Stack auth when clicking sign in", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByTestId("sign-in-btn").click();

    // Nav links to /handler/sign-in (Stack/Hexclave handler route).
    await expect(page).toHaveURL(/\/handler\/sign-in/);
  });

  test("should navigate to Stack auth when clicking sign up", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByTestId("sign-up-btn").click();

    await expect(page).toHaveURL(/\/handler\/sign-up/);
  });

  test("should protect article creation route", async ({ page }) => {
    // The page itself performs a server-side redirect to the auth handler.
    await page.goto("/wiki/edit/new");

    await expect(page).toHaveURL(/\/handler\/sign-in/, { timeout: 15_000 });
  });

  test("should protect article edit routes", async ({ page }) => {
    await page.goto("/wiki/edit/1");

    await expect(page).toHaveURL(/\/handler\/sign-in/, { timeout: 15_000 });
  });

  test("should allow viewing articles without authentication", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("link", { name: "Wikimasters" })).toBeVisible();
    await expect(page.getByTestId("sign-in-btn")).toBeVisible();

    // global-setup.ts seeds articles, so the home page must list content —
    // this test must not silently pass on an empty page.
    await expect(
      articleLinks(page).first(),
      "expected at least one article on the home page (global-setup seeds 3)",
    ).toBeVisible();
  });

  test("should allow viewing individual articles without authentication", async ({
    page,
  }) => {
    await page.goto("/");

    const firstArticle = articleLinks(page).first();
    await expect(
      firstArticle,
      "expected at least one seeded article to open",
    ).toBeVisible();
    await firstArticle.click();

    // Seeded and test-created articles live at /wiki/<numeric id>.
    await expect(page).toHaveURL(/\/wiki\/\d+/);

    // Article content renders.
    await expect(page.locator("h1")).toBeVisible();

    // Still logged out: no authenticated UI on the article page.
    await expect(page.getByTestId("new-article-btn")).toHaveCount(0);
    await expect(page.getByTestId("sign-in-btn")).toBeVisible();
  });
});
