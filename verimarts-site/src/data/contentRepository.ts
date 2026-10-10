import { requireBackend, supabase } from "../lib/supabase";
import type { Listing, Article, ListingImage } from "./marketplace";
import handoverMedia from "./handoverMedia.json";
import type { FarmProfile } from "./farm";
const bucket = "catalogue-media";
function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}
async function imageUrl(path: string) {
  const illustration = (handoverMedia as Record<string, string>)[path];
  if (illustration) return illustration;
  const { data, error } = await requireBackend()
    .storage.from(bucket)
    .createSignedUrl(path, 60);
  check(error);
  return data?.signedUrl;
}
export async function withListingImages(items: Listing[]) {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      category:
        item.category === "farm-produce"
          ? ("livelong-farm" as const)
          : item.category,
      images: await Promise.all(
        (item.images || [])
          .sort((a, b) => a.position - b.position)
          .map(async (img) => ({ ...img, url: await imageUrl(img.path) })),
      ),
    })),
  );
}
async function withCovers(items: Article[]) {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      cover_url: item.cover_path ? await imageUrl(item.cover_path) : undefined,
    })),
  );
}
export const contentRepository = {
  async farmProfile(owner = false): Promise<FarmProfile | null> {
    if (!supabase) return null;
    let query = supabase
      .from("business_pages")
      .select("*")
      .eq("id", "livelong-farm");
    if (!owner) query = query.eq("status", "published");
    const { data, error } = await query.maybeSingle();
    check(error);
    if (!data || (!owner && data.status !== "published")) return null;
    return data as FarmProfile;
  },
  async saveFarmProfile(profile: FarmProfile) {
    check(
      (
        await requireBackend()
          .from("business_pages")
          .update(profile)
          .eq("id", "livelong-farm")
      ).error,
    );
  },
  async addDemoContent() {
    const { default: samples } = await import("./demoContent.json");
    const client = requireBackend();
    let added = 0;
    for (const table of ["listings", "articles"] as const) {
      const { data, error } = await client.from(table).select("id,slug,title");
      check(error);
      const existing = data || [];
      const missing = samples[table].filter(
        (sample) =>
          !existing.some(
            (row) => row.id === sample.id || row.slug === sample.slug,
          ) ||
          existing.some(
            (row) =>
              row.id === sample.id &&
              row.title.startsWith(
                table === "listings" ? "Demo — " : "Sample — ",
              ),
          ),
      );
      if (missing.length) {
        const result = await client.from(table).upsert(missing);
        check(result.error);
        added += missing.length;
      }
    }
    const { data: images, error: imageError } = await client
      .from("listing_images")
      .select("listing_id");
    check(imageError);
    const covers = samples.listings
      .filter((item) => !images?.some((image) => image.listing_id === item.id))
      .map((item) => ({
        listing_id: item.id,
        path: `listings/${item.id}/handover-cover.svg`,
        alt: `Illustrative image for ${item.title}`,
        position: 0,
        is_cover: true,
      }));
    if (covers.length)
      check((await client.from("listing_images").insert(covers)).error);
    return added;
  },
  async listings(owner = false): Promise<Listing[]> {
    if (!supabase) return [];
    let q = supabase
      .from("listings")
      .select("*, images:listing_images(*)")
      .order("created_at", { ascending: false });
    if (!owner) q = q.eq("status", "published");
    const { data, error } = await q;
    check(error);
    return withListingImages(
      (data as Listing[]).filter(
        (item) => owner || item.status === "published",
      ),
    );
  },
  async articles(owner = false): Promise<Article[]> {
    if (!supabase) return [];
    let q = supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: false });
    if (!owner) q = q.eq("status", "published");
    const { data, error } = await q;
    check(error);
    return withCovers(
      (data as Article[]).filter(
        (item) => owner || item.status === "published",
      ),
    );
  },
  async listing(slug: string): Promise<Listing | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("listings")
      .select("*, images:listing_images(*)")
      .eq("status", "published")
      .eq("slug", slug)
      .maybeSingle();
    check(error);
    return data ? (await withListingImages([data as Listing]))[0] : null;
  },
  async article(slug: string): Promise<Article | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .eq("slug", slug)
      .maybeSingle();
    check(error);
    return data ? (await withCovers([data as Article]))[0] : null;
  },
  async saveListing(item: Listing) {
    const { images, ...row } = item;
    row.details = Object.fromEntries(
      Object.entries(row.details).filter(([, value]) => value.trim()),
    );
    const payload = images.map((img, i) => ({
      listing_id: item.id,
      path: img.path,
      alt: img.alt,
      position: i,
      is_cover: img.is_cover,
    }));
    const result = await requireBackend().rpc("save_listing_with_images", {
      listing_data: row,
      new_images: payload,
    });
    check(result.error);
  },
  async saveArticle(item: Article) {
    const { cover_url: _url, ...row } = item;
    void _url;
    const { error } = await requireBackend().from("articles").upsert(row);
    check(error);
  },
  async removeListing(item: Listing) {
    const { error } = await requireBackend()
      .from("listings")
      .delete()
      .eq("id", item.id);
    check(error);
    await removeMedia(item.images.map((i) => i.path));
  },
  async removeArticle(item: Article) {
    const { error } = await requireBackend()
      .from("articles")
      .delete()
      .eq("id", item.id);
    check(error);
    if (item.cover_path) await removeMedia([item.cover_path]);
  },
  async changeListing(
    id: string,
    values: { status?: string; availability?: string },
  ) {
    const { error } = await requireBackend()
      .from("listings")
      .update(values)
      .eq("id", id);
    check(error);
  },
  async changeArticle(id: string, status: string) {
    const { error } = await requireBackend()
      .from("articles")
      .update({ status })
      .eq("id", id);
    check(error);
  },
};
export async function uploadImage(
  file: File,
  kind: "listings" | "articles",
  id: string,
): Promise<ListingImage> {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  )
    throw new Error("Upload JPEG, PNG or WebP images up to 5 MB each.");
  const extension = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  }[file.type];
  const path = `${kind}/${id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await requireBackend()
    .storage.from(bucket)
    .upload(path, file, { upsert: false, contentType: file.type });
  check(error);
  return {
    path,
    alt: "",
    position: 0,
    is_cover: false,
    url: await imageUrl(path),
  };
}
export async function removeMedia(paths: string[]) {
  paths = paths.filter(
    (path) => !(handoverMedia as Record<string, string>)[path],
  );
  if (!paths.length) return;
  const { error } = await requireBackend().storage.from(bucket).remove(paths);
  check(error);
}
