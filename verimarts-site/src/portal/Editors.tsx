import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  archivedCategories,
  availabilityLabels,
  categories,
  categoryName,
  fields,
  isFashion,
  slugify,
} from "../data/marketplace";
import type {
  Listing,
  ListingImage,
  Article,
  Category,
} from "../data/marketplace";
import {
  contentRepository,
  removeMedia,
  uploadMedia,
  MAX_MEDIA_BYTES,
  MAX_VIDEO_SECONDS,
} from "../data/contentRepository";
import { ProductDetails } from "../features/shop/pages/Product";
import { ArticleBody } from "../features/shop/pages/Journal";
import { MediaDisplay } from "../features/shop/components/MediaDisplay";

export function PreviewDialog({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} className="content-preview" onCancel={onClose}>
      <div className="preview-heading">
        <strong>Preview: viewing this does not publish or change anything</strong>
        <button
          className="button button--small"
          onClick={() => {
            ref.current?.close();
            onClose();
          }}
        >
          Close preview
        </button>
      </div>
      <div className="preview-body">{children}</div>
    </dialog>
  );
}
export function MediaEditor({
  images,
  onChange,
  kind,
  id,
  max = 20,
  onBusy,
  disabled = false,
}: {
  images: ListingImage[];
  onChange: (images: ListingImage[]) => void;
  kind: "listings" | "articles";
  id: string;
  max?: number;
  onBusy: (busy: boolean) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [success, setSuccess] = useState("");
  const objectUrls = useRef<string[]>([]);
  useEffect(
    () => () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );
  async function upload(files: FileList | null) {
    if (!files) return;
    if (images.length + files.length > max) {
      setError(`Maximum ${max} media files.`);
      return;
    }
    setBusy(true);
    onBusy(true);
    setError("");
    setSuccess("");
    const next = [...images];
    try {
      const selected = Array.from(files);
      for (const [index, file] of selected.entries()) {
        const isVideo = file.type.startsWith("video/");
        setProgress(
          `${isVideo ? "Checking video duration" : "Preparing image"}: ${file.name} (${index + 1} of ${selected.length})`,
        );
        const image = await uploadMedia(file, kind, id, ({ percent }) =>
          setProgress(
            `Uploading ${file.name} (${index + 1} of ${selected.length}) · ${percent}%`,
          ),
        );
        const url = URL.createObjectURL(file);
        objectUrls.current.push(url);
        next.push({
          ...image,
          url,
          is_cover: next.length === 0,
          position: next.length,
        });
        onChange([...next]);
        setProgress("");
        setSuccess(
          `${selected.length === 1 ? file.name : `${index + 1} of ${selected.length} files`} uploaded. Save the content to keep it.`,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      setProgress("");
      onBusy(false);
    }
  }
  function move(index: number, delta: number) {
    const next = [...images];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next.map((i, position) => ({ ...i, position })));
  }
  return (
    <fieldset className="media-editor" disabled={busy || disabled}>
      <legend>{max === 1 ? "Cover image" : "Photos and video"}</legend>
      <small>
        {kind === "articles"
          ? "JPEG, PNG or WebP image"
          : `Images (JPEG, PNG, WebP) and short videos (MP4, WebM) · Up to ${Math.round(MAX_MEDIA_BYTES / 1024 / 1024)} MiB each · Videos up to ${MAX_VIDEO_SECONDS} seconds`}{" "}
        · {max} file{max === 1 ? "" : "s"} maximum. Uploads stay private until
        published.
      </small>
      <label className="media-editor__drop">
        Upload {kind === "articles" ? "cover image" : "images or video"}
        <input
          type="file"
          accept={
            kind === "articles"
              ? "image/jpeg,image/png,image/webp"
              : "image/jpeg,image/png,image/webp,video/mp4,video/webm"
          }
          multiple={max > 1}
          onChange={(e) => {
            void upload(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {progress && (
        <>
          <p role="status" aria-live="polite">
            {progress}
          </p>
          <progress
            className="media-upload-progress"
            max={100}
            value={Number(progress.match(/(\d+)%$/)?.[1] || 0)}
            aria-label="Media upload progress"
          />
        </>
      )}
      {success && !busy && <p role="status">{success}</p>}
      {error && <p role="alert">{error}</p>}
      <div className="image-edit-grid">
        {images.map((image, index) => (
          <div className="image-edit-card" key={image.path}>
            <MediaDisplay
              media={image}
              alt={
                image.alt ||
                (image.media_type === "video"
                  ? "Uploaded video preview"
                  : "Uploaded image preview")
              }
              controls
            />
            {image.media_type === "video" && (
              <span className="media-duration">
                Video · {image.duration_seconds}s
              </span>
            )}
            <label>
              Media description
              <input
                maxLength={500}
                value={image.alt}
                onChange={(e) =>
                  onChange(
                    images.map((i, n) =>
                      n === index ? { ...i, alt: e.target.value } : i,
                    ),
                  )
                }
              />
            </label>
            <div className="image-edit-card__actions">
              <button
                type="button"
                className="button button--outline"
                aria-pressed={image.is_cover}
                onClick={() =>
                  onChange(
                    images.map((i, n) => ({ ...i, is_cover: n === index })),
                  )
                }
              >
                {image.is_cover ? "Cover selected" : "Use as cover"}
              </button>
              <button
                type="button"
                className="button button--outline"
                aria-label={`Move ${image.media_type === "video" ? "video" : "image"} ${index + 1} earlier`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                ←
              </button>
              <button
                type="button"
                className="button button--outline"
                aria-label={`Move ${image.media_type === "video" ? "video" : "image"} ${index + 1} later`}
                disabled={index === images.length - 1}
                onClick={() => move(index, 1)}
              >
                →
              </button>
              <button
                type="button"
                className="button button--outline"
                onClick={() => {
                  const next = images.filter((_, n) => n !== index);
                  if (!next.some((i) => i.is_cover) && next.length)
                    next[0] = { ...next[0], is_cover: true };
                  onChange(next);
                }}
              >
                Remove media
              </button>
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
export function newListing(): Listing {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    category: "women",
    title: "",
    slug: "",
    description: "",
    price: null,
    currency: "NGN",
    price_label: "",
    availability: "available",
    status: "draft",
    featured: false,
    location: "",
    details: {},
    created_at: now,
    updated_at: now,
    images: [],
  };
}
export function newArticle(): Article {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: "",
    slug: "",
    category: "",
    body: "",
    cover_path: null,
    cover_alt: "",
    status: "draft",
    published_at: null,
    created_at: now,
    updated_at: now,
  };
}
function message(error: unknown) {
  return error instanceof Error ? error.message : "Unable to save content.";
}
export function ListingEditor({
  initial,
  onDone,
}: {
  initial: Listing;
  onDone: () => void;
}) {
  const [item, setItem] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  function change<K extends keyof Listing>(key: K, value: Listing[K]) {
    setItem((current) => ({ ...current, [key]: value }));
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const status = ((event.nativeEvent as SubmitEvent).submitter?.getAttribute(
      "data-status",
    ) || "draft") as "draft" | "published";
    setError("");
    if (status === "published" && !item.description.trim()) {
      setError("Add a description before publishing.");
      return;
    }
    setBusy(true);
    try {
      const saved = { ...item, status, slug: item.slug || slugify(item.title) };
      await contentRepository.saveListing(saved);
      await removeMedia(
        initial.images
          .filter((i) => !item.images.some((n) => n.path === i.path))
          .map((i) => i.path),
      );
      onDone();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  const fashion = isFashion(item.category);
  const compareField = (
    <label>
      Original price (for sale items)
      <input
        type="number"
        min="0"
        step="0.01"
        value={item.details.compare_at_price || ""}
        onChange={(e) => {
          const details = { ...item.details };
          if (e.target.value) details.compare_at_price = e.target.value;
          else delete details.compare_at_price;
          change("details", details);
        }}
      />
      <small>Leave empty unless this piece is reduced. Must be above the price.</small>
    </label>
  );
  return (
    <>
      <div className="workspace__head">
        <div>
          <h1>{initial.title ? "Edit product" : "Add product"}</h1>
          <p>Only enter facts you can confirm. Blank fields stay hidden.</p>
        </div>
        <button
          className="button button--outline"
          onClick={() => {
            if (
              window.confirm("Leave this editor? Unsaved changes will be lost.")
            )
              onDone();
          }}
        >
          Back to products
        </button>
      </div>
      <form className="owner-form" onSubmit={save}>
        <div className="editor-layout">
          <div>
            <fieldset className="editor-card" disabled={busy || uploading}>
              <legend>Basics</legend>
              <label>
                Title
                <input
                  required
                  maxLength={180}
                  value={item.title}
                  onChange={(e) => change("title", e.target.value)}
                />
              </label>
              <label>
                Description
                <textarea
                  maxLength={20000}
                  rows={5}
                  value={item.description}
                  onChange={(e) => change("description", e.target.value)}
                />
              </label>
              <label>
                Web address (slug)
                <input
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  maxLength={180}
                  value={item.slug}
                  onChange={(e) => change("slug", e.target.value)}
                  placeholder="lowercase-hyphenated-slug"
                />
              </label>
              <button
                className="text-link"
                type="button"
                onClick={() => change("slug", slugify(item.title))}
              >
                Generate from title
              </button>
            </fieldset>
            <fieldset className="editor-card" disabled={busy || uploading}>
              <legend>{fashion ? "Clothing details" : `${categoryName(item.category)} details`}</legend>
              <div className="form-grid">
                {fields[item.category].map((f) => (
                  <label key={f.key}>
                    {f.label}
                    {f.options ? (
                      <select
                        value={item.details[f.key] || ""}
                        onChange={(e) =>
                          change("details", {
                            ...item.details,
                            [f.key]: e.target.value,
                          })
                        }
                      >
                        <option value="">Not provided</option>
                        {f.options.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={f.numeric ? "number" : "text"}
                        min={f.numeric ? 0 : undefined}
                        step={f.numeric ? 1 : undefined}
                        maxLength={5000}
                        value={item.details[f.key] || ""}
                        onChange={(e) => {
                          const details = { ...item.details };
                          if (e.target.value) details[f.key] = e.target.value;
                          else delete details[f.key];
                          change("details", details);
                        }}
                      />
                    )}
                    {f.hint && <small>{f.hint}</small>}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="editor-card">
              <MediaEditor
                images={item.images}
                onChange={(images) => change("images", images)}
                kind="listings"
                id={item.id}
                onBusy={setUploading}
                disabled={busy}
              />
            </div>
          </div>
          <div>
            <fieldset className="editor-card" disabled={busy || uploading}>
              <legend>Organise</legend>
              <label>
                Department
                <select
                  aria-label="Department"
                  value={item.category}
                  onChange={(e) =>
                    setItem((current) => ({
                      ...current,
                      category: e.target.value as Category,
                      details: {},
                    }))
                  }
                >
                  {categories.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
                  {archivedCategories
                    .filter((c) => c.id === initial.category)
                    .map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.name} (archived)
                      </option>
                    ))}
                </select>
                <small>Changing department clears the details fields.</small>
              </label>
              <label>
                Availability
                <select
                  value={item.availability}
                  onChange={(e) =>
                    change(
                      "availability",
                      e.target.value as Listing["availability"],
                    )
                  }
                >
                  {Object.entries(availabilityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={item.featured}
                  onChange={(e) => change("featured", e.target.checked)}
                />
                Feature on the homepage
              </label>
            </fieldset>
            <fieldset className="editor-card" disabled={busy || uploading}>
              <legend>Pricing</legend>
              <label>
                Price
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price ?? ""}
                  onChange={(e) =>
                    change(
                      "price",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />
              </label>
              <label>
                Currency (ISO code)
                <input
                  required={item.price !== null}
                  pattern="[A-Z]{3}"
                  maxLength={3}
                  value={item.currency || ""}
                  onChange={(e) =>
                    change("currency", e.target.value.toUpperCase() || null)
                  }
                />
              </label>
              {fashion && compareField}
              <label>
                Text to show when there is no price
                <input
                  maxLength={180}
                  value={item.price_label}
                  onChange={(e) => change("price_label", e.target.value)}
                  placeholder="Price on request"
                />
              </label>
            </fieldset>
          </div>
        </div>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="editor-bar">
          <small>Drafts stay off the store. Previewing does not publish.</small>
          <button
            className="button button--outline"
            type="button"
            onClick={() => setPreview(true)}
          >
            Preview product
          </button>
          <button
            disabled={busy || uploading}
            className="button button--outline"
            data-status="draft"
          >
            {busy ? "Saving…" : "Save draft / unpublish"}
          </button>
          <button
            disabled={busy || uploading}
            className="button button--indigo"
            data-status="published"
          >
            Save and publish
          </button>
        </div>
      </form>
      {preview && (
        <PreviewDialog onClose={() => setPreview(false)}>
          <ProductDetails item={item} preview />
        </PreviewDialog>
      )}
    </>
  );
}
export function ArticleEditor({
  initial,
  onDone,
}: {
  initial: Article;
  onDone: () => void;
}) {
  const [item, setItem] = useState(initial);
  const [images, setImages] = useState<ListingImage[]>(
    initial.cover_path
      ? [
          {
            path: initial.cover_path,
            url: initial.cover_url,
            alt: initial.cover_alt,
            position: 0,
            is_cover: true,
          },
        ]
      : [],
  );
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const prepared = {
    ...item,
    cover_path: images[0]?.path || null,
    cover_alt: images[0]?.alt || "",
    cover_url: images[0]?.url,
  };
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const status = ((event.nativeEvent as SubmitEvent).submitter?.getAttribute(
      "data-status",
    ) || "draft") as "draft" | "published";
    if (status === "published" && !item.body.trim()) {
      setError("Add article content before publishing.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await contentRepository.saveArticle({
        ...prepared,
        status,
        slug: item.slug || slugify(item.title),
      });
      if (initial.cover_path && initial.cover_path !== prepared.cover_path)
        await removeMedia([initial.cover_path]);
      onDone();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="workspace__head">
        <h1>{initial.title ? "Edit article" : "Write article"}</h1>
        <button
          className="button button--outline"
          onClick={() => {
            if (
              window.confirm("Leave this editor? Unsaved changes will be lost.")
            )
              onDone();
          }}
        >
          Back to Journal
        </button>
      </div>
      <form className="owner-form" onSubmit={save}>
        <div className="editor-layout">
          <fieldset className="editor-card" disabled={busy || uploading}>
            <legend>Article</legend>
            <label>
              Article title
              <input
                required
                maxLength={180}
                value={item.title}
                onChange={(e) => setItem({ ...item, title: e.target.value })}
              />
            </label>
            <label>
              Article content
              <textarea
                rows={18}
                maxLength={100000}
                value={item.body}
                onChange={(e) => setItem({ ...item, body: e.target.value })}
              />
              <small>
                Plain text. Use blank lines between paragraphs. HTML is displayed
                as text, never executed.
              </small>
            </label>
          </fieldset>
          <div>
            <fieldset className="editor-card" disabled={busy || uploading}>
              <legend>Organise</legend>
              <label>
                Article web address (slug)
                <input
                  required
                  maxLength={180}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  value={item.slug}
                  onChange={(e) => setItem({ ...item, slug: e.target.value })}
                />
              </label>
              <button
                type="button"
                className="text-link"
                onClick={() => setItem({ ...item, slug: slugify(item.title) })}
              >
                Generate from title
              </button>
              <label>
                Article category
                <input
                  maxLength={100}
                  value={item.category}
                  onChange={(e) =>
                    setItem({ ...item, category: e.target.value })
                  }
                />
              </label>
            </fieldset>
            <div className="editor-card">
              <MediaEditor
                images={images}
                onChange={setImages}
                kind="articles"
                id={item.id}
                max={1}
                onBusy={setUploading}
                disabled={busy}
              />
            </div>
          </div>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="editor-bar">
          <button
            className="button button--outline"
            type="button"
            onClick={() => setPreview(true)}
          >
            Preview article
          </button>
          <button
            className="button button--outline"
            disabled={busy || uploading}
            data-status="draft"
          >
            {busy ? "Saving…" : "Save draft / unpublish"}
          </button>
          <button
            className="button button--indigo"
            disabled={busy || uploading}
            data-status="published"
          >
            Save and publish
          </button>
        </div>
      </form>
      {preview && (
        <PreviewDialog onClose={() => setPreview(false)}>
          <ArticleBody item={prepared} />
        </PreviewDialog>
      )}
    </>
  );
}
