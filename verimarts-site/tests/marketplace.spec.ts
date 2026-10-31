import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { Buffer } from "node:buffer";
import type { Listing, Article, ListingImage } from "../src/data/marketplace";
import type { FarmProfile } from "../src/data/farm";
test("FASHYN navigation and confirmed business contacts", async ({ page }) => {
  await mockBackend(page);
  await page.addInitScript(() =>
    sessionStorage.setItem("verimarts-intro", "seen"),
  );
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/contact");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeHidden();
  await expect(nav.getByRole("link", { name: "Collection", exact: true })).toHaveCount(1);
  await expect(nav.getByRole("link", { name: "Cars", exact: true })).toHaveCount(0);
  await expect(
    page
      .locator("main")
      .getByRole("link", { name: "08144669205", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('main a[href="mailto:Thisislivelong@gmail.com"]'),
  ).toBeVisible();
  await expect(
    page.locator('main a[href^="https://wa.me/2349070419149"]'),
  ).toHaveCount(2);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await nav.getByRole("link", { name: "Collection", exact: true }).click();
  await expect(page).toHaveURL(/\/shop$/);
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeVisible();
});
const farmFixture: FarmProfile = {
  id: "livelong-farm",
  heading: "Organic Farm Produce & Aquaculture.",
  intro: "",
  main_address: "No. 15, Ayinde Street, Iyana-Cele, Ogun State.",
  branch_address:
    "Abijo by Destiny Home Estate, Sangotedo, Ajah, Lekki, Lagos.",
  whatsapp: "09070419149",
  phone: "08144669205",
  email: "thisislivelong@gmail.com",
  website: "thisislivelong.com",
  products: [
    "Fruit smoothies and parfait",
    "Fresh palm oil",
    "Fresh live catfish",
    "Cassava farm / cassava produce",
  ],
  aquaculture: ["Pond rental", "Fingerlings and juvenile fish rearing"],
  status: "published",
};
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
      title: "Test produce",
      slug: "test-produce",
      category: "farm-produce",
      price: 100,
      currency: "NGN",
      details: { unit: "Test pack" },
    },
    {
      ...base,
      id: "33333333-3333-4333-8333-333333333333",
      title: "Test car",
      slug: "test-car",
      category: "cars",
      price: 200,
      currency: "NGN",
      details: { make: "Test make", year: "2020" },
    },
    {
      ...base,
      id: "44444444-4444-4444-8444-444444444444",
      title: "Private property draft",
      slug: "private-property",
      category: "property",
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
  let farm = { ...farmFixture };
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
    if (url.pathname.endsWith("/business_pages")) {
      if (method === "PATCH") {
        farm = { ...farm, ...request.postDataJSON() };
        return respond(null);
      }
      return respond(
        url.searchParams.get("status") === "eq.published" &&
          farm.status !== "published"
          ? null
          : farm,
      );
    }
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
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("verimarts-intro", "seen"),
  );
});
test("only published content is shown; search, categories and price filters work", async ({
  page,
}) => {
  await mockBackend(page);
  await page.goto("/shop");
  await expect(page.locator(".vehicle-card")).toHaveCount(2);
  await expect(page.getByText("Private property draft")).toHaveCount(0);
  await page.getByLabel("Search listings").fill("produce");
  await expect(page.locator(".vehicle-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator(".vehicle-card")).toHaveCount(2);
  await page.getByLabel("Category", { exact: true }).selectOption("cars");
  await expect(page.locator(".vehicle-card")).toHaveCount(1);
  await expect(page.locator(".vehicle-card")).toContainText("Test car");
  await page.getByLabel("Currency").selectOption("NGN");
  await page.getByLabel("Maximum price").fill("150");
  await expect(
    page.getByRole("heading", { name: "No published listings yet." }),
  ).toBeVisible();
  await page.goto("/cars");
  await page.getByLabel("Make", { exact: true }).selectOption("Test make");
  await expect(page.locator(".vehicle-card")).toHaveCount(1);
  await page.goto("/property");
  await expect(page.locator(".vehicle-card")).toHaveCount(0);
});
test("listing enquiries are encoded and Journal is published-only with escaped HTML", async ({
  page,
}) => {
  await mockBackend(page);
  await page.goto("/listings/test-produce");
  await expect(
    page.getByRole("heading", { name: "Test produce" }),
  ).toBeVisible();
  const href = await page
    .getByRole("link", { name: "Enquire on WhatsApp" })
    .getAttribute("href");
  expect(new URL(href!).searchParams.get("text")).toContain("Test produce");
  await page.goto("/listings/private-property");
  await expect(
    page.getByRole("heading", { name: "Listing not found." }),
  ).toBeVisible();
  await page.goto("/journal");
  await expect(page.getByText("Private writing draft")).toHaveCount(0);
  await page.getByRole("link", { name: "Published test article" }).click();
  await expect(page.locator(".article-body")).toContainText(
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
async function login(page: Page) {
  await page.goto("/portal");
  await page.getByLabel("Owner email").fill("owner@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("owner-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
test("owner imports demo catalogue once without overwriting edits", async ({
  page,
}) => {
  const { state } = await mockBackend(page);
  await login(page);
  page.on("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Add / update handover content" })
    .click();
  await expect(page.getByRole("status")).toHaveText(
    "42 entries added or updated.",
  );
  expect(
    state.listings.filter((i) => i.id.startsWith("de000000-0000-4000-8000"))
      .length,
  ).toBe(32);
  expect(
    state.articles.filter((i) => i.id.startsWith("de000000-0000-4000-9000"))
      .length,
  ).toBe(10);
  const sample = state.listings.find((i) => i.slug === "city-hatchback")!;
  sample.title = "Owner replacement";
  await page
    .getByRole("button", { name: "Add / update handover content" })
    .click();
  await expect(page.getByRole("status")).toHaveText(
    "Catalogue entries already exist. Existing content was kept.",
  );
  expect(sample.title).toBe("Owner replacement");
  expect(state.listings.length).toBe(35);
});

test("Livelong Farm shows supplied offerings, contacts and encoded item enquiries", async ({
  page,
}) => {
  const { state } = await mockBackend(page);
  state.listings.push({
    ...state.listings[0],
    id: "77777777-7777-4777-8777-777777777777",
    category: "livelong-farm",
    title: "Palm oil & jars",
    slug: "farm-palm-oil",
    details: { unit: "litre" },
  });
  await page.goto("/livelong-farm");
  await expect(
    page.getByRole("heading", {
      name: "Organic Farm Produce & Aquaculture.",
      exact: true,
    }),
  ).toBeVisible();
  for (const name of [...farmFixture.products, ...farmFixture.aquaculture])
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  await expect(page.getByText(farmFixture.main_address)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "09070419149", exact: true }),
  ).toHaveAttribute("href", /^https:\/\/wa.me\/2349070419149\?text=/);
  await expect(
    page
      .locator("main")
      .getByRole("link", { name: "08144669205", exact: true }),
  ).toHaveAttribute("href", "tel:08144669205");
  await expect(
    page.getByRole("link", { name: "thisislivelong@gmail.com", exact: true }),
  ).toHaveAttribute("href", "mailto:thisislivelong@gmail.com");
  await expect(
    page.getByRole("link", { name: "thisislivelong.com", exact: true }),
  ).toHaveAttribute("href", "https://thisislivelong.com/");
  await page.goto("/listings/farm-palm-oil");
  const url = new URL(
    (await page
      .getByRole("link", { name: "Enquire on WhatsApp" })
      .getAttribute("href"))!,
  );
  expect(url.pathname).toBe("/2349070419149");
  expect(url.searchParams.get("text")).toContain("Palm oil & jars");
});

test("farm leads with products and grouped footer fits desktop and mobile", async ({
  page,
}) => {
  await mockBackend(page);
  await page.addInitScript(() =>
    sessionStorage.setItem("verimarts-intro", "seen"),
  );
  for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/livelong-farm");
    await expect(page.locator(".farm-hero .vehicle-card")).toHaveCount(1);
    await expect(page.locator(".farm-hero")).toContainText("Test produce");
    await expect(page.locator(".farm-hero")).toContainText(
      "wider story behind the FASHYN collection",
    );
    expect(
      await page
        .locator("#farm-products")
        .evaluate((el) =>
          Boolean(
            el.compareDocumentPosition(
              document.querySelector(".farm-contact-section")!,
            ) & Node.DOCUMENT_POSITION_FOLLOWING,
          ),
        ),
    ).toBe(true);
    await page.locator("footer").scrollIntoViewIfNeeded();
    await expect(page.locator("footer")).toContainText("THE COLLECTION");
    await expect(page.locator("footer")).toContainText("DISCOVER FASHYN");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Back to top" }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  }
});

test("owner manages farm page text, preview and publication", async ({
  page,
}) => {
  await mockBackend(page);
  await login(page);
  await page
    .getByRole("button", { name: "Livelong Farm", exact: true })
    .click();
  await page
    .getByLabel("Introduction", { exact: true })
    .fill("Owner-confirmed farm introduction.");
  await page
    .getByRole("button", { name: "Save farm page", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Farm page published.");
  await page.getByRole("button", { name: "Preview farm page" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Owner-confirmed farm introduction.",
  );
  await page.getByRole("button", { name: "Close preview" }).click();
  await page.getByRole("button", { name: "Unpublish farm page" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Farm page saved as a private draft.",
  );
  await page.goto("/livelong-farm");
  await expect(
    page.getByText("Farm information will appear when published."),
  ).toBeVisible();
  await expect(
    page.getByText("Owner-confirmed farm introduction."),
  ).toHaveCount(0);
});

test("paint starts empty and owner can upload, publish and change availability", async ({
  page,
}) => {
  const { state, uploads } = await mockBackend(page);
  await page.goto("/paint-production");
  await expect(
    page.getByRole("heading", { name: "No paint products published yet." }),
  ).toBeVisible();
  await login(page);
  await page
    .getByRole("button", { name: "Paint Production", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create listing", exact: true })
    .click();
  await expect(
    page.getByLabel("Listing category", { exact: true }),
  ).toHaveValue("paint-production");
  await page.getByLabel("Title", { exact: true }).fill("Owner test paint");
  await page.getByRole("button", { name: "Generate from title" }).click();
  await page
    .getByLabel("Description", { exact: true })
    .fill("Owner-supplied paint description.");
  await page.getByLabel("Paint type", { exact: true }).fill("Owner test type");
  await page
    .getByLabel("Colour / colour options", { exact: true })
    .fill("Owner test colour");
  await page
    .getByLabel("Size / volume (include unit)", { exact: true })
    .fill("Owner test volume");
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: "paint.png", mimeType: "image/png", buffer: png });
  await page
    .getByRole("button", { name: "Save and publish", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Listings", exact: true }),
  ).toBeVisible();
  expect(uploads.length).toBe(1);
  await page
    .getByLabel("Availability for Owner test paint")
    .selectOption("unavailable");
  await expect
    .poll(
      () =>
        state.listings.find((item) => item.title === "Owner test paint")
          ?.availability,
    )
    .toBe("unavailable");
  expect(
    state.listings.find((item) => item.title === "Owner test paint")?.details
      .paint_type,
  ).toBe("Owner test type");
  await page.goto("/paint-production");
  await expect(
    page.getByRole("heading", { name: "Owner test paint", exact: true }),
  ).toBeVisible();
});

test("owner can upload, reorder, preview, publish, unpublish and delete a listing", async ({
  page,
}) => {
  const { state, uploads } = await mockBackend(page);
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Your FASHYN catalogue." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create listing" }).click();
  await page.getByLabel("Title", { exact: true }).fill("New farm listing");
  await page.getByRole("button", { name: "Generate from title" }).click();
  await page
    .getByLabel("Description", { exact: true })
    .fill("Owner-provided produce description.");
  await page.getByLabel("Unit or pack size").fill("Confirmed unit");
  await page.getByLabel("Upload images").setInputFiles([
    { name: "one.png", mimeType: "image/png", buffer: png },
    { name: "two.png", mimeType: "image/png", buffer: png },
  ]);
  await expect(page.locator(".image-edit-card")).toHaveCount(2);
  await expect(page.getByText("Uploading images…")).toHaveCount(0);
  await page.getByRole("button", { name: "Move image 2 earlier" }).click();
  await page
    .locator(".image-edit-card")
    .first()
    .getByRole("button", { name: "Use as cover" })
    .click();
  await page.getByRole("button", { name: "Preview listing" }).click();
  await expect(page.getByRole("dialog")).toContainText("New farm listing");
  await page.getByRole("button", { name: "Close preview" }).click();
  await page.getByRole("button", { name: "Save and publish" }).click();
  await expect(
    page.locator(".owner-record").filter({ hasText: "New farm listing" }),
  ).toBeVisible();
  expect(uploads).toHaveLength(2);
  const item = state.listings.find((i) => i.title === "New farm listing")!;
  expect(item.status).toBe("published");
  expect(item.images[0].is_cover).toBe(true);
  expect(item.details.unit).toBe("Confirmed unit");
  const record = page
    .locator(".owner-record")
    .filter({ hasText: "New farm listing" });
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

test("owner can upload short Livelong Farm video media with preview and progress", async ({
  page,
}) => {
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
  await page.getByRole("button", { name: "Create listing" }).click();
  await page.getByLabel("Title", { exact: true }).fill("Farm video listing");
  await page.getByRole("button", { name: "Generate from title" }).click();
  await page
    .getByLabel("Description", { exact: true })
    .fill("Owner provided farm video.");
  await page.getByLabel("Unit or pack size").fill("Confirmed unit");
  await page.getByLabel("Upload images or video").setInputFiles({
    name: "farm.webm",
    mimeType: "video/webm",
    buffer: Buffer.from([1, 2, 3, 4]),
  });
  await expect(page.locator(".image-edit-card video")).toBeVisible();
  await expect(
    page.getByText(/uploaded\. Save the content to keep it\./),
  ).toBeVisible();
  expect(uploads.some((path) => path.endsWith(".webm"))).toBe(true);
  await page.getByRole("button", { name: "Save and publish" }).click();
  await expect(
    page.locator(".owner-record").filter({ hasText: "Farm video listing" }),
  ).toBeVisible();
  expect(uploads.some((path) => path.endsWith(".webm"))).toBe(true);
  expect(state.listings.find((item) => item.title === "Farm video listing")?.images[0]?.duration_seconds).toBe(4);
});

test("media uploads reject oversized files before contacting Storage", async ({
  page,
}) => {
  const { uploads } = await mockBackend(page);
  await login(page);
  await page.getByRole("button", { name: "Create listing" }).click();
  await page.getByLabel("Upload images or video").setInputFiles({
    name: "too-large.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });
  await expect(page.getByRole("alert")).toContainText("5 MiB or smaller");
  expect(uploads).toHaveLength(0);
  await page.route("**/storage/v1/object/catalogue-media/listings/**", (route) => route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ message: "row-level security policy denied" }) }));
  await page.getByLabel("Upload images or video").setInputFiles({ name: "denied.png", mimeType: "image/png", buffer: png });
  await expect(page.getByRole("alert")).toContainText("Storage owner policies");
  expect(uploads).toHaveLength(0);
});
test("owner Journal supports drafts, preview and publication; no sign-up", async ({
  page,
}) => {
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
test("non-owner login cannot open management; password reset has no signup", async ({
  page,
}) => {
  await mockBackend(page, false);
  await page.goto("/portal");
  await expect(
    page.getByRole("button", { name: /sign up|register/i }),
  ).toHaveCount(0);
  await page.getByLabel("Owner email").fill("owner@example.test");
  await page.getByRole("button", { name: "Reset password" }).click();
  await expect(page.getByRole("status")).toContainText("password-reset email");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Owner access required" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create listing" }),
  ).toHaveCount(0);
});
test("mobile pages fit, nav resets scroll, and fixed header follows scroll direction", async ({
  page,
}) => {
  test.setTimeout(90000);
  await mockBackend(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Collection", exact: true })
    .click();
  await expect(page).toHaveURL(/shop$/);
  for (const path of [
    "/",
    "/shop",
    "/cars",
    "/property",
    "/farm-produce",
    "/livelong-farm",
    "/paint-production",
    "/electronics",
    "/other-goods",
    "/journal",
    "/listings/test-produce",
    "/journal/published-test",
    "/about",
    "/contact",
    "/photo-credits",
    "/portal",
  ]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect(page.locator("header")).toHaveClass(/header--hidden/);
  await page.evaluate(() => window.scrollTo(0, 599));
  await expect(page.locator("header")).not.toHaveClass(/header--hidden/);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Home", exact: true })
    .evaluate((el) => (el as HTMLElement).click());
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});
test("intro still skips, remembers the session, replays and respects reduced motion", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await mockBackend(page);
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").locator("video")).toHaveCount(1);
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
  const p = await reduced.newPage();
  await mockBackend(p);
  await p.goto("/");
  await expect(p.getByRole("dialog")).toHaveCount(0, { timeout: 2000 });
  await reduced.close();
});
