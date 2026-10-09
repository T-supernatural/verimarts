import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { categories, fields, slugify } from "../data/marketplace";
import type {
  Listing,
  ListingImage,
  Article,
  Category,
} from "../data/marketplace";
import {
  contentRepository,
  removeMedia,
  uploadImage,
} from "../data/contentRepository";
import { ListingPreview, ArticlePreview } from "../marketplace/Public";

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
        <strong>Owner preview · Not a public publication</strong>
        <button
          className="button secondary"
          onClick={() => {
            ref.current?.close();
            onClose();
          }}
        >
          Close preview
        </button>
      </div>
      {children}
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
      setError(`Maximum ${max} images.`);
      return;
    }
    setBusy(true);
    onBusy(true);
    setError("");
    const next = [...images];
    try {
      for (const file of Array.from(files)) {
        const image = await uploadImage(file, kind, id);
        const url = URL.createObjectURL(file);
        objectUrls.current.push(url);
        next.push({
          ...image,
          url,
          is_cover: next.length === 0,
          position: next.length,
        });
        onChange([...next]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
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
      <legend>{max === 1 ? "Cover image" : "Listing images"}</legend>
      <p className="small muted">
        JPEG, PNG or WebP · Up to 5 MB each · {max} image{max === 1 ? "" : "s"}{" "}
        maximum. Uploads stay private until the content is published.
      </p>
      <label>
        Upload {max === 1 ? "cover" : "images"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple={max > 1}
          onChange={(e) => {
            void upload(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {busy && <p role="status">Uploading images…</p>}
      {error && <p role="alert">{error}</p>}
      <div className="image-edit-grid">
        {images.map((image, index) => (
          <div className="image-edit-card" key={image.path}>
            <img src={image.url} alt={image.alt || "Uploaded image preview"} />
            <label>
              Image description
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
            <div className="actions">
              <button
                type="button"
                className="button secondary"
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
                className="button secondary"
                aria-label={`Move image ${index + 1} earlier`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                ←
              </button>
              <button
                type="button"
                className="button secondary"
                aria-label={`Move image ${index + 1} later`}
                disabled={index === images.length - 1}
                onClick={() => move(index, 1)}
              >
                →
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  const next = images.filter((_, n) => n !== index);
                  if (!next.some((i) => i.is_cover) && next.length)
                    next[0] = { ...next[0], is_cover: true };
                  onChange(next);
                }}
              >
                Remove image
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
    category: "farm-produce",
    title: "",
    slug: "",
    description: "",
    price: null,
    currency: null,
    price_label: "",
    availability: "not-provided",
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
      setError("Add an owner-approved description before publishing.");
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
  return (
    <>
      <div className="section-heading">
        <div>
          <span className="eyebrow red-text">OWNER CONTENT</span>
          <h1>{initial.title ? "Edit listing" : "Create listing"}</h1>
        </div>
        <button
          className="button secondary"
          onClick={() => {
            if (
              window.confirm("Leave this editor? Unsaved changes will be lost.")
            )
              onDone();
          }}
        >
          Back to listings
        </button>
      </div>
      <form className="owner-form" onSubmit={save}>
        <fieldset disabled={busy || uploading}>
          <legend>Listing information</legend>
          <div className="form-grid">
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
              Slug
              <input
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxLength={180}
                value={item.slug}
                onChange={(e) => change("slug", e.target.value)}
                placeholder="lowercase-hyphenated-slug"
              />
              <button
                className="text-link"
                type="button"
                onClick={() => change("slug", slugify(item.title))}
              >
                Generate from title
              </button>
            </label>
            <label>
              Listing category
              <select
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
              </select>
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
                <option value="not-provided">Not provided</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="sold">Sold</option>
              </select>
            </label>
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
                placeholder="Only the owner-confirmed currency"
              />
            </label>
            <label>
              Price label when price is missing
              <input
                maxLength={180}
                value={item.price_label}
                onChange={(e) => change("price_label", e.target.value)}
                placeholder="Leave empty if not provided"
              />
            </label>
            <label>
              Public location
              <input
                maxLength={500}
                value={item.location}
                onChange={(e) => change("location", e.target.value)}
              />
            </label>
          </div>
          <label>
            Description
            <textarea
              maxLength={20000}
              rows={6}
              value={item.description}
              onChange={(e) => change("description", e.target.value)}
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={item.featured}
              onChange={(e) => change("featured", e.target.checked)}
            />
            Feature this listing on the homepage
          </label>
          <h2>
            {categories.find((c) => c.id === item.category)?.name} details
          </h2>
          <p className="small muted">
            Only enter facts you can confirm. Blank fields are omitted publicly.
            Changing category clears its fields.
          </p>
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
              </label>
            ))}
          </div>
        </fieldset>
        <MediaEditor
          images={item.images}
          onChange={(images) => change("images", images)}
          kind="listings"
          id={item.id}
          onBusy={setUploading}
          disabled={busy}
        />
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="actions">
          <button
            disabled={busy || uploading}
            className="button secondary"
            data-status="draft"
          >
            {busy ? "Saving…" : "Save draft / unpublish"}
          </button>
          <button
            disabled={busy || uploading}
            className="button primary"
            data-status="published"
          >
            Save and publish
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() => setPreview(true)}
          >
            Preview listing
          </button>
        </div>
        <p className="small muted">
          Saving as draft removes the listing from the public catalogue.
          Previewing does not publish it.
        </p>
      </form>
      {preview && (
        <PreviewDialog onClose={() => setPreview(false)}>
          <ListingPreview item={item} />
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
      <div className="section-heading">
        <h1>{initial.title ? "Edit article" : "Create article"}</h1>
        <button
          className="button secondary"
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
        <fieldset disabled={busy || uploading}>
          <legend>Journal article</legend>
          <div className="form-grid">
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
              Article slug
              <input
                required
                maxLength={180}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                value={item.slug}
                onChange={(e) => setItem({ ...item, slug: e.target.value })}
              />
              <button
                type="button"
                className="text-link"
                onClick={() => setItem({ ...item, slug: slugify(item.title) })}
              >
                Generate from title
              </button>
            </label>
            <label>
              Article category
              <input
                maxLength={100}
                value={item.category}
                onChange={(e) => setItem({ ...item, category: e.target.value })}
              />
            </label>
          </div>
          <label>
            Article content
            <textarea
              rows={18}
              maxLength={100000}
              value={item.body}
              onChange={(e) => setItem({ ...item, body: e.target.value })}
            />
          </label>
          <p className="small muted">
            Plain text. Use blank lines between paragraphs. HTML is displayed as
            text, never executed.
          </p>
        </fieldset>
        <MediaEditor
          images={images}
          onChange={setImages}
          kind="articles"
          id={item.id}
          max={1}
          onBusy={setUploading}
          disabled={busy}
        />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="actions">
          <button
            className="button secondary"
            disabled={busy || uploading}
            data-status="draft"
          >
            {busy ? "Saving…" : "Save draft / unpublish"}
          </button>
          <button
            className="button primary"
            disabled={busy || uploading}
            data-status="published"
          >
            Save and publish
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() => setPreview(true)}
          >
            Preview article
          </button>
        </div>
      </form>
      {preview && (
        <PreviewDialog onClose={() => setPreview(false)}>
          <ArticlePreview item={prepared} />
        </PreviewDialog>
      )}
    </>
  );
}
