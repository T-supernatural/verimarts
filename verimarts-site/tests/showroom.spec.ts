import { test, expect } from "@playwright/test";
import { business, whatsappUrl } from "../src/config/business";

test("WhatsApp configuration produces a safely encoded vehicle enquiry", () => {
  expect(whatsappUrl()).toBeUndefined();
  const original = business.whatsapp;
  try {
    business.whatsapp = "+234 800 000 0000";
    const url = new URL(whatsappUrl("BMW 5 Series & Touring (2022)")!);
    expect(url.hostname).toBe("wa.me");
    expect(url.pathname).toBe("/2348000000000");
    expect(url.searchParams.get("text")).toContain(
      "BMW 5 Series & Touring (2022)",
    );
    expect(url.searchParams.get("text")).toContain("current availability");
  } finally {
    business.whatsapp = original;
  }
});
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("verimarts-intro", "seen"),
  );
});
test("catalogue search, filters, sorting and reset", async ({ page }) => {
  await page.goto("/showroom");
  await expect(page.locator(".vehicle-card")).toHaveCount(6);
  await page.getByRole("textbox", { name: "Search vehicles" }).fill("BMW");
  await expect(page.locator(".vehicle-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator(".vehicle-card")).toHaveCount(6);
  await page.getByLabel("Body type", { exact: true }).selectOption("SUV");
  await expect(page.locator(".vehicle-card")).toHaveCount(2);
  await page.getByLabel("Maximum demo price").selectOption("50000000");
  await expect(
    page.getByRole("heading", { name: "No matching vehicles." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator(".vehicle-card")).toHaveCount(6);
  await page.getByLabel("Sort by").selectOption("price");
  await expect(page.locator(".vehicle-card").first()).toContainText("C-Class");
  await expect(page.locator(".vehicle-card").last()).toContainText(
    "Contact for price",
  );
});
test("vehicle gallery and missing contact path", async ({ page }) => {
  await page.goto("/showroom/mercedes-gle");
  await expect(
    page.getByRole("heading", { name: "Mercedes-Benz GLE 350" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next photo" }).click();
  await expect(page.locator(".photo-count")).toHaveText("2 / 2");
  await page.getByRole("link", { name: /WhatsApp enquiry/ }).click();
  await expect(
    page.getByRole("heading", { name: "Contact details coming soon" }),
  ).toBeVisible();
  await expect(page.locator("form")).toHaveCount(0);
  await page.goto("/showroom/does-not-exist");
  await expect(
    page.getByRole("heading", { name: "This page isn’t here." }),
  ).toBeVisible();
});
test("mobile navigation and all pages fit the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Showroom" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your next drive is here." }),
  ).toBeVisible();
  for (const path of [
    "/",
    "/showroom",
    "/showroom/mercedes-gle",
    "/about",
    "/services",
    "/contact",
  ]) {
    await page.goto(path);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    for (const img of await page.locator("img").all()) {
      await img.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          img.evaluate(
            (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
          ),
        )
        .toBe(true);
    }
  }
});
test("intro skips, remembers session, replays and respects reduced motion", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").locator("video")).toHaveCount(0);
  await expect(page.getByRole("dialog").getByRole("img")).toHaveAttribute(
    "src",
    "/assets/logo.png",
  );
  await page.getByRole("button", { name: "Skip intro" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Replay brand intro" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await context.close();
  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto("/");
  await expect(reducedPage.getByRole("dialog")).toHaveCount(0, {
    timeout: 2000,
  });
  await reduced.close();
});
test("intro logo failure does not block the website", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.route("**/assets/logo.png", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 6000 });
  await expect(
    page.getByRole("heading", { name: "A new road. A new possibility." }),
  ).toBeVisible();
  await context.close();
});
