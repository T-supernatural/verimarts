import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { Buffer } from "node:buffer";
import type { Listing, Article, ListingImage } from "../src/data/marketplace";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=",
  "base64",
);
const uid = "11111111-1111-4111-8111-111111111111";
function fixtures() {
  const base = {
    description: "Approved test description.",
    price: null,
    currency: null,
    price_label: "",
    availability: "available" as const,
    status: "published" as const,
    featured: true,
    location: "",
    details: {},
    created_at: "2026-10-09T00:00:00Z",
    updated_at: "2026-10-09T00:00:00Z",
    images: [],
  };
  const listings: Listing[] = [
    {
      ...base,
      id: "22222222-2222-4222-8222-222222222222",
      title: "Test gown",
      slug: "test-gown",
      category: "women",
      price: 100,
      currency: "NGN",
      details: {
        product_type: "Dresses",
        sizes: "S, M",
        colours: "Ember",
        material: "Test chiffon",
      },
    },
    {
      ...base,
      id: "77777777-7777-4777-8777-777777777777",
      title: "Test blazer",
      slug: "test-blazer",
      category: "men",
      price: 200,
      currency: "NGN",
      details: {
        product_type: "Blazers",
        sizes: "L",
        colours: "Navy",
        compare_at_price: "300",
      },
    },
    {
      ...base,
      id: "33333333-3333-4333-8333-333333333333",
      title: "Old car",
      slug: "old-car",
      category: "cars",
      price: 900,
      currency: "NGN",
      details: { make: "Test make", year: "2020" },
    },
    {
      ...base,
      id: "44444444-4444-4444-8444-444444444444",
      title: "Private dress draft",
      slug: "private-dress",
      category: "women",
      status: "draft",
      featured: false,
      availability: "not-provided",
    },
  ];
  const articleBase = {
    category: "Test writing",
    cover_path: null,
    cover_alt: "",
    published_at: "2026-10-09T00:00:00Z",
    created_at: base.created_at,
    updated_at: base.updated_at,
  };
  const articles: Article[] = [
    {
      ...articleBase,
      id: "55555555-5555-4555-8555-555555555555",
      title: "Published test article",
      slug: "published-test",
      body: "Approved writing.\n\n<script>window.hacked=true</script>",
      status: "published",
    },
    {
      ...articleBase,
      id: "66666666-6666-4666-8666-666666666666",
      title: "Private writing draft",
      slug: "private-writing",
      body: "Private content",
      status: "draft",
    },
  ];
  return { listings, articles };
}
async function mockBackend(page: Page, owner = true) {
  const state = fixtures();
  const uploads: string[] = [];
  await page.route("http://127.0.0.1:54321/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const respond = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    if (url.pathname.includes("/auth/v1/token")) {
      const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: uid, role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.test`;
      return respond({
        access_token: token,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "test-refresh-token",
        user: {
          id: uid,
          email: "owner@example.test",
          aud: "authenticated",
          role: "authenticated",
          app_metadata: { provider: "email" },
          user_metadata: {},
          created_at: new Date().toISOString(),
        },
      });
    }
    if (url.pathname.includes("/auth/v1/")) return respond({});
    if (url.pathname.endsWith("/rpc/is_owner")) return respond(owner);
    if (url.pathname.endsWith("/listing_images")) {
      if (method === "GET")
        return respond(
          state.listings.flatMap((item) =>
            item.images.map((image) => ({ ...image, listing_id: item.id })),
          ),
        );
      if (method === "POST") {
        for (const image of request.postDataJSON() as ListingImage[]) {
          state.listings
            .find((item) => item.id === image.listing_id)
            ?.images.push(image);
        }
        return respond(null);
      }
    }
    if (url.pathname.endsWith("/rpc/save_listing_with_images")) {
      const payload = request.postDataJSON() as {
        listing_data: Listing;
        new_images: ListingImage[];
      };
      const item = { ...payload.listing_data, images: payload.new_images };
      state.listings = state.listings
        .filter((i) => i.id !== item.id)
        .concat(item);
      return respond(null);
    }
    if (url.pathname.endsWith("/listings")) {
      if (method === "GET") {
        const rows =
          url.searchParams.get("status") === "eq.published"
            ? state.listings.filter((i) => i.status === "published")
            : state.listings;
        return respond(rows);
      }
      const id = url.searchParams.get("id")?.replace("eq.", "");
      if (method === "POST") {
        const payload = request.postDataJSON();
        state.listings.push(
          ...(Array.isArray(payload) ? payload : [payload]).map((item) => ({
            ...state.listings[0],
            ...item,
            images: [],
          })),
        );
      }
      if (method === "PATCH")
        state.listings = state.listings.map((i) =>
          i.id === id
            ? { ...i, ...(request.postDataJSON() as Partial<Listing>) }
            : i,
        );
      if (method === "DELETE")
        state.listings = state.listings.filter((i) => i.id !== id);
      return respond(null);
    }
    if (url.pathname.endsWith("/articles")) {
      if (method === "GET")
        return respond(
          url.searchParams.get("status") === "eq.published"
            ? state.articles.filter((i) => i.status === "published")
            : state.articles,
        );
      if (method === "POST") {
        const payload = request.postDataJSON();
        const items = (
          Array.isArray(payload) ? payload : [payload]
        ) as Article[];
        state.articles = state.articles
          .filter((i) => !items.some((item) => item.id === i.id))
          .concat(items);
      }
      const id = url.searchParams.get("id")?.replace("eq.", "");
      if (method === "PATCH")
        state.articles = state.articles.map((i) =>
          i.id === id
            ? { ...i, ...(request.postDataJSON() as Partial<Article>) }
            : i,
        );
      if (method === "DELETE")
        state.articles = state.articles.filter((i) => i.id !== id);
      return respond(null);
    }
    if (url.pathname.endsWith("/object/sign/catalogue-media") && method === "POST") {
      const { paths } = request.postDataJSON() as { paths: string[] };
      return respond(
        paths.map((path) => ({
          path,
          signedURL: `/object/catalogue-media/${path}?token=test`,
          error: null,
        })),
      );
    }
    if (url.pathname.includes("/storage/v1/object/sign/") && method === "POST")
      return respond({
        signedURL: url.pathname.replace("/storage/v1", "") + "?token=test",
      });
    if (url.pathname.includes("/storage/v1/object/") && method === "GET")
      return route.fulfill({ contentType: "image/png", body: png });
    if (url.pathname.includes("/storage/v1/object/") && method === "POST") {
      uploads.push(url.pathname);
      return respond({ Key: url.pathname });
    }
    if (method === "DELETE") return respond([]);
    return respond({ message: "Unhandled test endpoint" }, 404);
  });
  return { state, uploads };
}
async function skipIntro(page: Page) {
  await page.addInitScript(() =>
    sessionStorage.setItem("fashyn-intro", "seen"),
  );
}
async function login(page: Page) {
  await page.goto("/portal");
  await page.getByLabel("Owner email").fill("owner@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("owner-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
const cards = (page: Page) => page.locator(".catalogue .product-card");

test.describe("storefront", () => {
  test.beforeEach(async ({ page }) => {
    await skipIntro(page);
  });

  test("navigation and confirmed business contacts", async ({ page }) => {
    await mockBackend(page);
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/contact");
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();
    await expect(
      nav.getByRole("link", { name: "Women", exact: true }),
    ).toHaveCount(1);
    for (const retired of ["Cars", "Property", "Livelong Farm"])
      await expect(page.getByRole("link", { name: retired })).toHaveCount(0);
    await expect(
      page.locator('main a[href="tel:08144669205"]'),
    ).toBeVisible();
    await expect(
      page.locator('main a[href="mailto:Thisislivelong@gmail.com"]'),
    ).toBeVisible();
    await expect(
      page.locator('main a[href^="https://wa.me/2349070419149"]'),
    ).toHaveCount(1);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Open menu" }).click();
    const drawer = page.getByRole("dialog", { name: "Menu" });
    await drawer.getByRole("button", { name: "Women" }).click();
    await drawer
      .getByRole("link", { name: "Shop all women", exact: true })
      .click();
    await expect(page).toHaveURL(/\/women$/);
    await expect(drawer).toBeHidden();
  });

  test("mega menu opens by keyboard and search returns focus", async ({
    page,
  }) => {
    await mockBackend(page);
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.goto("/");
    const women = page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Women", exact: true });
    await women.focus();
    await expect(
      page.getByRole("link", { name: "Dresses", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Search" }).click();
    const dialog = page.getByRole("dialog", { name: "Search FASHYN" });
    await expect(dialog).toBeVisible();
    await page.getByLabel("Search the collection").fill("gown");
    await expect(dialog.getByRole("link", { name: /Test gown/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: "Search" })).toBeFocused();
    await page.getByRole("button", { name: "Search" }).click();
    await page.getByLabel("Search the collection").fill("blazer");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=blazer/);
    await expect(cards(page)).toHaveCount(1);
  });

  test("only published clothing is shown and filters work", async ({ page }) => {
    await mockBackend(page);
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/shop");
    await expect(cards(page)).toHaveCount(2);
    await expect(page.getByText("Private dress draft")).toHaveCount(0);
    await expect(page.getByText("Old car")).toHaveCount(0);
    const filters = page.getByRole("complementary", { name: "Filters" });
    await filters.getByLabel("Department").selectOption("men");
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page)).toContainText("Test blazer");
    await page.getByRole("button", { name: "Clear all" }).click();
    await expect(cards(page)).toHaveCount(2);
    await filters.getByRole("button", { name: "S", exact: true }).click();
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page)).toContainText("Test gown");
    await page.getByRole("button", { name: "Clear all" }).click();
    await filters.getByLabel("Maximum price").fill("150");
    await expect(cards(page)).toHaveCount(1);
    await filters.getByLabel("Maximum price").fill("50");
    await expect(
      page.getByRole("heading", { name: "Nothing matches just yet." }),
    ).toBeVisible();
    await page.goto("/women");
    await expect(cards(page)).toHaveCount(1);
    await page.goto("/sale");
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page)).toContainText("Test blazer");
    await expect(cards(page).locator(".tag--sale")).toBeVisible();
  });

  test("bag requires a size, persists, and becomes a WhatsApp order", async ({
    page,
  }) => {
    await mockBackend(page);
    await page.goto("/product/test-gown");
    await expect(
      page.getByRole("heading", { name: "Test gown" }),
    ).toBeVisible();
    const ask = await page
      .getByRole("link", { name: "Ask about this on WhatsApp" })
      .getAttribute("href");
    expect(new URL(ask!).searchParams.get("text")).toContain("Test gown");
    await page.getByRole("button", { name: "Add to bag" }).click();
    await expect(page.getByRole("alert")).toContainText("choose a size");
    await page.getByRole("button", { name: "M", exact: true }).click();
    await page.getByRole("button", { name: "Increase quantity" }).click();
    await page.getByRole("button", { name: "Add to bag" }).click();
    const bag = page.getByRole("dialog", { name: "Your bag (2)" });
    await expect(bag).toBeVisible();
    await expect(bag).toContainText("Size M");
    const order = await bag
      .getByRole("link", { name: "Order on WhatsApp" })
      .getAttribute("href");
    expect(order).toContain("wa.me/2349070419149");
    const message = new URL(order!).searchParams.get("text")!;
    expect(message).toContain("Test gown (Size M, Ember) x 2");
    expect(message).toContain("Subtotal");
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Open bag, 2 items" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Open bag, 2 items" }).click();
    await page.getByRole("button", { name: "Remove Test gown" }).click();
    await expect(page.getByText("Your bag is empty")).toBeVisible();
  });

  test("drafts and archived records have no public page; Journal escapes HTML", async ({
    page,
  }) => {
    await mockBackend(page);
    for (const slug of ["private-dress", "old-car"]) {
      await page.goto(`/product/${slug}`);
      await expect(
        page.getByRole("heading", { name: "We can't find that piece." }),
      ).toBeVisible();
    }
    await page.goto("/journal");
    await expect(page.getByText("Private writing draft")).toHaveCount(0);
    await page.getByRole("link", { name: "Published test article" }).click();
    await expect(page.locator(".article__body")).toContainText(
      "<script>window.hacked=true</script>",
    );
    expect(await page.evaluate(() => Object.hasOwn(window, "hacked"))).toBe(
      false,
    );
    await page.goto("/journal/private-writing");
    await expect(
      page.getByRole("heading", { name: "Article not found." }),
    ).toBeVisible();
  });

  test("pages publish SEO metadata and structured data", async ({ page }) => {
    await mockBackend(page);
    await page.goto("/");
    await expect(page).toHaveTitle(/FASHYN \| Modern Clothing/);
    const types = async () =>
      page.evaluate(() =>
        [
          ...document.querySelectorAll(
            'script[type="application/ld+json"]',
          ),
        ].flatMap((script) =>
          JSON.parse(script.textContent || "[]").map(
            (entry: { "@type": string }) => entry["@type"],
          ),
        ),
      );
    await expect.poll(types).toEqual(["ClothingStore", "WebSite"]);
    await page.goto("/men");
    await expect(page).toHaveTitle(/Men's Clothing/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/men$/,
    );
    await expect
      .poll(types)
      .toEqual(["BreadcrumbList", "CollectionPage"]);
    await page.goto("/product/test-gown");
    await expect(page).toHaveTitle(/Test gown/);
    await expect.poll(types).toEqual(["Product", "BreadcrumbList"]);
    const product = await page.evaluate(
      () =>
        JSON.parse(
          document.querySelector('script[type="application/ld+json"]')!
            .textContent!,
        )[0],
    );
    expect(product.offers).toMatchObject({
      price: 100,
      priceCurrency: "NGN",
      availability: "https://schema.org/InStock",
    });
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      "content",
      "product",
    );
    for (const path of ["/search?q=x", "/bag", "/no-such-page"]) {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/,
      );
    }
  });

  test("retired addresses redirect into the clothing store", async ({
    page,
  }) => {
    await mockBackend(page);
    for (const path of ["/cars", "/property", "/livelong-farm", "/showroom/x"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/shop$/);
    }
    await page.goto("/listings/test-gown");
    await expect(page).toHaveURL(/\/product\/test-gown$/);
    await page.goto("/services");
    await expect(page).toHaveURL(/\/how-to-order$/);
  });

  test("every page fits a phone screen", async ({ page }) => {
    test.setTimeout(90000);
    await mockBackend(page);
    for (const width of [360, 768]) {
      await page.setViewportSize({ width, height: 800 });
      for (const path of [
        "/",
        "/shop",
        "/women",
        "/sale",
        "/new-arrivals",
        "/journal",
        "/product/test-gown",
        "/journal/published-test",
        "/about",
        "/how-to-order",
        "/contact",
        "/bag",
        "/photo-credits",
        "/portal",
      ]) {
        await page.goto(path);
        await expect(page.locator("main")).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
          `${path} at ${width}px`,
        ).toBe(true);
      }
    }
  });
});

test.describe("owner portal", () => {
  test.beforeEach(async ({ page }) => {
    await skipIntro(page);
  });

  test("sample range imports once without overwriting records", async ({
    page,
  }) => {
    const { state } = await mockBackend(page);
    state.listings = state.listings.filter((item) => item.category === "cars");
    await login(page);
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Add sample range" }).click();
    await expect(page.getByText("29 sample entries added.")).toBeVisible();
    expect(
      state.listings.filter((item) => item.id.startsWith("fa000000")),
    ).toHaveLength(26);
    await expect(
      page.getByRole("button", { name: "Add sample range" }),
    ).toHaveCount(0);
    await expect(page.locator(".stat").first()).toContainText("26");
    expect(state.listings.find((i) => i.slug === "old-car")?.title).toBe(
      "Old car",
    );
  });

  test("earlier records live in the archive, not in products", async ({
    page,
  }) => {
    await mockBackend(page);
    await login(page);
    const nav = page.getByRole("navigation", { name: "Owner navigation" });
    await expect(
      nav.getByRole("button", { name: /Livelong|Paint/ }),
    ).toHaveCount(0);
    await nav.getByRole("button", { name: /Products/ }).click();
    await expect(page.locator(".owner-record")).toHaveCount(3);
    await expect(page.getByText("Old car")).toHaveCount(0);
    await nav.getByRole("button", { name: /Archive/ }).click();
    await expect(page.locator(".owner-record")).toHaveCount(1);
    await expect(page.locator(".owner-record")).toContainText("Old car");
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await expect(page.getByLabel("Make")).toHaveValue("Test make");
  });

  test("owner can upload, reorder, preview, publish, unpublish and delete a product", async ({
    page,
  }) => {
    const { state, uploads } = await mockBackend(page);
    await login(page);
    await expect(
      page.getByRole("heading", { name: "Your FASHYN store." }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Add product" }).click();
    await page.getByLabel("Title", { exact: true }).fill("New linen shirt");
    await page.getByRole("button", { name: "Generate from title" }).click();
    await page
      .getByLabel("Description", { exact: true })
      .fill("Owner-provided description.");
    await page.getByLabel("Department").selectOption("men");
    await page.getByLabel("Sizes").fill("M, L");
    await page.getByLabel("Price", { exact: true }).fill("5000");
    await page.getByLabel("Upload images").setInputFiles([
      { name: "one.png", mimeType: "image/png", buffer: png },
      { name: "two.png", mimeType: "image/png", buffer: png },
    ]);
    await expect(page.locator(".image-edit-card")).toHaveCount(2);
    await page.getByRole("button", { name: "Move image 2 earlier" }).click();
    await page
      .locator(".image-edit-card")
      .first()
      .getByRole("button", { name: "Use as cover" })
      .click();
    await page.getByRole("button", { name: "Preview product" }).click();
    await expect(page.getByRole("dialog")).toContainText("New linen shirt");
    await page.getByRole("button", { name: "Close preview" }).click();
    await page.getByRole("button", { name: "Save and publish" }).click();
    const record = page
      .locator(".owner-record")
      .filter({ hasText: "New linen shirt" });
    await expect(record).toBeVisible();
    expect(uploads).toHaveLength(2);
    const item = state.listings.find((i) => i.title === "New linen shirt")!;
    expect(item.status).toBe("published");
    expect(item.category).toBe("men");
    expect(item.currency).toBe("NGN");
    expect(item.images[0].is_cover).toBe(true);
    expect(item.details.sizes).toBe("M, L");
    await record.getByRole("button", { name: "Unpublish" }).click();
    await expect(record).toContainText("draft");
    page.once("dialog", (dialog) => dialog.dismiss());
    await record.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(record).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await record.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(record).toHaveCount(0);
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(
      page.getByRole("heading", { name: "Sign in to FASHYN." }),
    ).toBeVisible();
  });

  test("owner can upload short video media", async ({ page }) => {
    const { uploads, state } = await mockBackend(page);
    await page.addInitScript(() => {
      HTMLMediaElement.prototype.load = function () {};
      const descriptor = Object.getOwnPropertyDescriptor(
        HTMLMediaElement.prototype,
        "src",
      )!;
      Object.defineProperty(HTMLMediaElement.prototype, "src", {
        configurable: true,
        get() {
          return descriptor.get?.call(this);
        },
        set(value: string) {
          descriptor.set?.call(this, value);
          queueMicrotask(() => this.dispatchEvent(new Event("loadedmetadata")));
        },
      });
      Object.defineProperty(HTMLMediaElement.prototype, "duration", {
        configurable: true,
        get: () => 4,
      });
    });
    await login(page);
    await page.getByRole("button", { name: "Add product" }).click();
    await page.getByLabel("Title", { exact: true }).fill("Runway video dress");
    await page.getByRole("button", { name: "Generate from title" }).click();
    await page
      .getByLabel("Description", { exact: true })
      .fill("Owner provided video.");
    await page.getByLabel("Upload images or video").setInputFiles({
      name: "runway.webm",
      mimeType: "video/webm",
      buffer: Buffer.from([1, 2, 3, 4]),
    });
    await expect(page.locator(".image-edit-card video")).toBeVisible();
    await expect(
      page.getByText(/uploaded\. Save the content to keep it\./),
    ).toBeVisible();
    await page.getByRole("button", { name: "Save and publish" }).click();
    await expect(
      page.locator(".owner-record").filter({ hasText: "Runway video dress" }),
    ).toBeVisible();
    expect(uploads.some((path) => path.endsWith(".webm"))).toBe(true);
    expect(
      state.listings.find((item) => item.title === "Runway video dress")
        ?.images[0]?.duration_seconds,
    ).toBe(4);
  });

  test("uploads reject oversized files before contacting Storage", async ({
    page,
  }) => {
    const { uploads } = await mockBackend(page);
    await login(page);
    await page.getByRole("button", { name: "Add product" }).click();
    await page.getByLabel("Upload images or video").setInputFiles({
      name: "too-large.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    });
    await expect(page.getByRole("alert")).toContainText("5 MiB or smaller");
    expect(uploads).toHaveLength(0);
    await page.route("**/storage/v1/object/catalogue-media/listings/**", (route) =>
      route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ message: "row-level security policy denied" }),
      }),
    );
    await page.getByLabel("Upload images or video").setInputFiles({
      name: "denied.png",
      mimeType: "image/png",
      buffer: png,
    });
    await expect(page.getByRole("alert")).toContainText(
      "Storage owner policies",
    );
    expect(uploads).toHaveLength(0);
  });

  test("Journal supports drafts, preview and publication", async ({ page }) => {
    const { state } = await mockBackend(page);
    await login(page);
    await page
      .getByRole("button", { name: "Write article", exact: true })
      .click();
    await page.getByLabel("Article title").fill("New owner writing");
    await page.getByRole("button", { name: "Generate from title" }).click();
    await page.getByLabel("Article content").fill("Approved article body.");
    await page.getByRole("button", { name: "Preview article" }).click();
    await expect(page.getByRole("dialog")).toContainText(
      "Approved article body.",
    );
    await page.getByRole("button", { name: "Close preview" }).click();
    await page.getByRole("button", { name: "Save draft / unpublish" }).click();
    const record = page
      .locator(".owner-record")
      .filter({ hasText: "New owner writing" });
    await expect(record).toContainText("draft");
    await record.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(record).toContainText("published");
    expect(
      state.articles.find((a) => a.title === "New owner writing")?.status,
    ).toBe("published");
    await record.getByRole("button", { name: "Unpublish" }).click();
    await expect(record).toContainText("draft");
  });

  test("non-owner login cannot manage; reset offers no sign-up", async ({
    page,
  }) => {
    await mockBackend(page, false);
    await page.goto("/portal");
    await expect(
      page.getByRole("button", { name: /sign up|register/i }),
    ).toHaveCount(0);
    await page.getByLabel("Owner email").fill("owner@example.test");
    await page.getByRole("button", { name: "Reset password" }).click();
    await expect(page.getByRole("status")).toContainText(
      "password-reset email",
    );
    await page.getByLabel("Password", { exact: true }).fill("password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Owner access required" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add product" }),
    ).toHaveCount(0);
  });

  test("portal is never indexed", async ({ page }) => {
    await mockBackend(page);
    await page.goto("/portal");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
  });
});

test.describe("loading page", () => {
  test("plays the film, shows progress, skips, remembers and replays", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await mockBackend(page);
    await page.goto("/");
    const loader = page.getByRole("dialog", { name: "FASHYN is loading" });
    await expect(loader).toBeVisible();
    await expect(loader.locator("video, svg.loader__logo")).toHaveCount(1);
    await expect(loader.getByRole("progressbar")).toBeVisible();
    await expect(
      loader.getByRole("button", { name: "Skip intro" }),
    ).toBeFocused();
    await loader.getByRole("button", { name: "Skip intro" }).click();
    await expect(loader).toHaveCount(0);
    await page.reload();
    await expect(loader).toHaveCount(0);
    await page.getByRole("button", { name: "Replay brand intro" }).click();
    await expect(loader).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(loader).toHaveCount(0);
    await context.close();
  });

  test("finishes on its own and never traps the visitor", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await mockBackend(page);
    await page.route("**/media/fashyn-reveal.mp4", (route) => route.abort());
    await page.goto("/");
    await expect(
      page.getByRole("dialog", { name: "FASHYN is loading" }),
    ).toHaveCount(0, { timeout: 9000 });
    await expect(page.locator("h1")).toContainText("Modern style");
    await context.close();
  });

  test("respects reduced motion", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await mockBackend(page);
    await page.goto("/");
    await expect(page.locator("video")).toHaveCount(0);
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 2000 });
    await context.close();
  });
});
