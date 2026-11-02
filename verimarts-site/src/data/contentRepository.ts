import {
  requireBackend,
  supabase,
  supabasePublicConfig,
} from "../lib/supabase";
import type { Listing, Article, ListingImage } from "./marketplace";
import { fashionCategoryIds, isFashion } from "./marketplace";
import {
  starterArticles,
  starterImages,
  starterListings,
  starterMedia,
} from "./starterCatalogue";
const bucket = "catalogue-media";
function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}
/** Starter files ship with the site; pre-clothing placeholders were retired. Neither is in Storage. */
function isStored(path: string) {
  return !starterMedia[path] && !path.endsWith("/handover-cover.svg");
}
async function imageUrl(path: string) {
  if (!isStored(path)) return starterMedia[path];
  const { data, error } = await requireBackend()
    .storage.from(bucket)
    .createSignedUrl(path, 3600);
  check(error);
  return data?.signedUrl;
}
export async function refreshMediaUrl(path: string) {
  const url = await imageUrl(path);
  if (!url) throw new Error("Supabase did not return a media link.");
  return url;
}
/** One batched request, so a large catalogue does not sign images one at a time. */
async function resolveUrls(paths: string[]) {
  const urls = new Map<string, string | undefined>();
  const stored = paths.filter(isStored);
  paths
    .filter((path) => !isStored(path))
    .forEach((path) => urls.set(path, starterMedia[path]));
  if (stored.length) {
    const { data, error } = await requireBackend()
      .storage.from(bucket)
      .createSignedUrls(stored, 3600);
    check(error);
    data?.forEach((entry) => {
      if (entry.path && entry.signedUrl) urls.set(entry.path, entry.signedUrl);
    });
  }
  return urls;
}
export async function withListingImages(items: Listing[]) {
  const urls = await resolveUrls(
    items.flatMap((item) => (item.images || []).map((image) => image.path)),
  );
  return items.map((item) => ({
    ...item,
    category:
      item.category === "farm-produce"
        ? ("livelong-farm" as const)
        : item.category,
    images: [...(item.images || [])]
      .sort((a, b) => a.position - b.position)
      .map((image) => ({ ...image, url: urls.get(image.path) })),
  }));
}
async function withCovers(items: Article[]) {
  const urls = await resolveUrls(
    items.flatMap((item) => (item.cover_path ? [item.cover_path] : [])),
  );
  return items.map((item) => ({
    ...item,
    cover_url: item.cover_path ? urls.get(item.cover_path) : undefined,
  }));
}
/** Without a backend (local preview) the site shows the starter range so it can be reviewed. */
function previewListings(): Listing[] {
  return starterListings.map((item) => ({
    ...item,
    images: starterImages
      .filter((image) => image.listing_id === item.id)
      .map((image) => ({ ...image, url: starterMedia[image.path] })),
  }));
}
function previewArticles(): Article[] {
  return starterArticles.map((item) => ({
    ...item,
    cover_url: starterMedia[item.cover_path],
  }));
}
export const contentRepository = {
  /** Owner-confirmed import of the illustrative launch range. Never overwrites existing records. */
  async addStarterCatalogue() {
    const client = requireBackend();
    let added = 0;
    const listingRows = await client.from("listings").select("id,slug");
    check(listingRows.error);
    const newListings = starterListings.filter(
      (sample) =>
        !listingRows.data?.some(
          (row) => row.id === sample.id || row.slug === sample.slug,
        ),
    );
    if (newListings.length) {
      check((await client.from("listings").insert(newListings)).error);
      added += newListings.length;
      const images = starterImages.filter((image) =>
        newListings.some((item) => item.id === image.listing_id),
      );
      check((await client.from("listing_images").insert(images)).error);
    }
    const articleRows = await client.from("articles").select("id,slug");
    check(articleRows.error);
    const newArticles = starterArticles.filter(
      (sample) =>
        !articleRows.data?.some(
          (row) => row.id === sample.id || row.slug === sample.slug,
        ),
    );
    if (newArticles.length) {
      check((await client.from("articles").insert(newArticles)).error);
      added += newArticles.length;
    }
    return added;
  },
  async listings(owner = false): Promise<Listing[]> {
    if (!supabase) return owner ? [] : previewListings();
    let q = supabase
      .from("listings")
      .select("*, images:listing_images(*)")
      .order("created_at", { ascending: false });
    if (!owner)
      q = q.eq("status", "published").in("category", fashionCategoryIds);
    const { data, error } = await q;
    check(error);
    return withListingImages(
      (data as Listing[]).filter(
        (item) =>
          owner || (item.status === "published" && isFashion(item.category)),
      ),
    );
  },
  async articles(owner = false): Promise<Article[]> {
    if (!supabase) return owner ? [] : previewArticles();
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
      media_type: img.media_type || "image",
      duration_seconds: img.duration_seconds ?? null,
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
export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 30;
export const MEDIA_TYPES = {
  "image/jpeg": { extension: "jpg", kind: "image" },
  "image/png": { extension: "png", kind: "image" },
  "image/webp": { extension: "webp", kind: "image" },
  "video/mp4": { extension: "mp4", kind: "video" },
  "video/webm": { extension: "webm", kind: "video" },
} as const;
export type UploadProgress = { loaded: number; total: number; percent: number };
function inspectVideo(file: File) {
  return new Promise<number>((resolve, reject) => {
    const video = document.createElement("video");
    const localUrl = URL.createObjectURL(file);
    const cleanup = () => {
      URL.revokeObjectURL(localUrl);
      video.removeAttribute("src");
      video.load();
    };
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = video.duration;
      cleanup();
      if (!Number.isFinite(duration) || duration <= 0) {
        reject(
          new Error(
            "Could not read the video duration. Try an MP4 or WebM video.",
          ),
        );
      } else if (duration > MAX_VIDEO_SECONDS) {
        reject(
          new Error(
            `Videos must be ${MAX_VIDEO_SECONDS} seconds or shorter. This video is ${Math.ceil(duration)} seconds.`,
          ),
        );
      } else {
        resolve(Math.ceil(duration));
      }
    };
    video.onerror = () => {
      cleanup();
      reject(
        new Error(
          "This video could not be previewed. Use an MP4 or WebM file.",
        ),
      );
    };
    video.src = localUrl;
  });
}
export async function uploadMedia(
  file: File,
  kind: "listings" | "articles",
  id: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<ListingImage> {
  const type = MEDIA_TYPES[file.type as keyof typeof MEDIA_TYPES];
  if (!type)
    throw new Error("Choose a JPEG, PNG or WebP image, or an MP4/WebM video.");
  if (file.size > MAX_MEDIA_BYTES)
    throw new Error(
      "Each file must be 5 MiB or smaller, matching the Supabase Storage limit.",
    );
  if (file.size === 0)
    throw new Error("This file is empty. Choose another file.");
  if (kind === "articles" && type.kind === "video")
    throw new Error("Journal covers must be images.");
  const duration = type.kind === "video" ? await inspectVideo(file) : null;
  const client = requireBackend();
  const { data: sessionData, error: sessionError } =
    await client.auth.getSession();
  check(sessionError);
  const accessToken = sessionData.session?.access_token;
  if (!accessToken)
    throw new Error(
      "Your portal session has expired. Sign in again and retry the upload.",
    );
  const path = `${kind}/${id}/${crypto.randomUUID()}.${type.extension}`;
  const storageBase = supabasePublicConfig.url?.replace(/\/$/, "");
  const apiKey = supabasePublicConfig.key;
  if (!storageBase || !apiKey)
    throw new Error("Supabase public URL and publishable key are required.");
  const url = `${storageBase}/storage/v1/object/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", url);
    request.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    request.setRequestHeader("apikey", apiKey);
    request.setRequestHeader("Content-Type", file.type);
    request.setRequestHeader("cache-control", "max-age=3600");
    request.setRequestHeader("x-upsert", "false");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress?.({
          loaded: event.loaded,
          total: event.total,
          percent: Math.round((event.loaded / event.total) * 100),
        });
    };
    request.onerror = () =>
      reject(
        new Error(
          "Upload could not reach Supabase Storage. Check the connection and try again.",
        ),
      );
    request.onabort = () => reject(new Error("Upload was cancelled."));
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress?.({ loaded: file.size, total: file.size, percent: 100 });
        resolve();
        return;
      }
      let providerDetail: string;
      try {
        const payload = JSON.parse(request.responseText);
        providerDetail = payload.message || payload.error || "";
      } catch {
        providerDetail = request.responseText;
      }
      const statusMessage: Record<number, string> = {
        401: "Your portal session has expired. Sign in again and retry.",
        403: `Supabase denied this upload. Check that this account is the configured owner and the Storage owner policies are applied. ${providerDetail}`.trim(),
        413: "This file exceeds the current Supabase project or bucket upload limit.",
        415: "Supabase rejected this file type. Check catalogue-media allowed MIME types.",
      };
      const detail = statusMessage[request.status] || providerDetail;
      reject(
        new Error(
          `Upload failed (${request.status}). ${detail || "Check the Storage bucket settings and owner policy, then retry."}`,
        ),
      );
    };
    request.send(file);
  });
  return {
    path,
    alt: "",
    position: 0,
    is_cover: false,
    media_type: type.kind,
    duration_seconds: duration,
    url: await imageUrl(path),
  };
}
export async function removeMedia(paths: string[]) {
  paths = paths.filter(isStored);
  if (!paths.length) return;
  const { error } = await requireBackend().storage.from(bucket).remove(paths);
  check(error);
}
