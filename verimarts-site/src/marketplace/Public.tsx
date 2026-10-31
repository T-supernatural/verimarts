import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  MessageCircle,
  CarFront,
  Building2,
  Sprout,
  Monitor,
  Package,
  BookOpen,
  Search,
  ChevronLeft,
  ChevronRight,
  Paintbrush,
} from "lucide-react";
import { Reveal } from "../Motion";
import { EnquiryButtons } from "../EnquiryButtons";
import {
  categories,
  fields,
  journalName,
  listingPrice,
} from "../data/marketplace";
import type { Listing, Article, Category } from "../data/marketplace";
import { contentRepository } from "../data/contentRepository";
import { FarmEnquiry } from "./Farm";
import { MediaDisplay } from "./MediaDisplay";
const icons = {
  cars: CarFront,
  property: Building2,
  "farm-produce": Sprout,
  electronics: Monitor,
  "other-goods": Package,
  "livelong-farm": Sprout,
  "paint-production": Paintbrush,
};
const fashionCategories = [
  { id: "women", name: "Women", description: "Refined pieces for your everyday." },
  { id: "men", name: "Men", description: "Modern essentials with confidence." },
  { id: "children", name: "Children", description: "Thoughtful style for every age." },
] as const;
export function usePublishedContent() {
  const [data, setData] = useState<{
    listings: Listing[];
    articles: Article[];
  }>({ listings: [], articles: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const load = () =>
      Promise.all([contentRepository.listings(), contentRepository.articles()])
        .then(([listings, articles]) => {
          if (active) {
            setData({ listings, articles });
            setError("");
          }
        })
        .catch(() => {
          if (active)
            setError("Content could not be loaded. Please try again.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, 50000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [attempt]);
  return { ...data, loading, error, retry: () => setAttempt((x) => x + 1) };
}
function State({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string;
  retry: () => void;
}) {
  return loading ? (
    <p role="status" className="empty-state">
      Loading content…
    </p>
  ) : error ? (
    <div role="alert" className="empty-state">
      <p>{error}</p>
      <button className="button secondary" onClick={retry}>
        Try again
      </button>
    </div>
  ) : null;
}
function Empty({ kind = "listings" }: { kind?: string }) {
  return (
    <div className="empty-state">
      <h2>No published {kind} yet.</h2>
      <p>New content will appear here when the owner publishes it.</p>
      <Link to="/contact" className="text-link">
        Contact FASHYN <ArrowUpRight size={18} />
      </Link>
    </div>
  );
}
export function ListingCard({ item }: { item: Listing }) {
  const cover = item.images.find((i) => i.is_cover) || item.images[0];
  const Icon = icons[item.category];
  return (
    <article className="vehicle-card">
      <Link className="card-photo" to={`/listings/${item.slug}`}>
        {cover?.url ? (
          <MediaDisplay media={cover} alt={cover.alt || item.title} muted />
        ) : (
          <div className="listing-no-image">
            <Icon size={40} />
            <span>Photos not provided</span>
          </div>
        )}
        <span className="badge">
          {item.availability === "not-provided"
            ? "Availability not provided"
            : item.availability}
        </span>
        <span className="photo-arrow">
          <ArrowUpRight />
        </span>
      </Link>
      <div className="card-body">
        <span className="card-overline">
          {categories.find((c) => c.id === item.category)?.name}
        </span>
        <h3>
          <Link to={`/listings/${item.slug}`}>{item.title}</Link>
        </h3>
        {item.location && <p className="small muted">{item.location}</p>}
        <div className="spec-line">
          {fields[item.category]
            .slice(0, 3)
            .map((f) => item.details[f.key])
            .filter(Boolean)
            .join(" · ")}
        </div>
        <div className="card-bottom">
          <strong>{listingPrice(item)}</strong>
          <Link to={`/listings/${item.slug}`} aria-label={`View ${item.title}`}>
            <ArrowUpRight size={19} />
          </Link>
        </div>
      </div>
    </article>
  );
}
function ArticleCard({ item }: { item: Article }) {
  return (
    <article className="vehicle-card">
      {item.cover_url && (
        <Link className="card-photo" to={`/journal/${item.slug}`}>
          <MediaDisplay
            media={{
              path: item.cover_path!,
              alt: item.cover_alt,
              position: 0,
              is_cover: true,
              media_type: "image",
              url: item.cover_url,
            }}
            alt={item.cover_alt || item.title}
          />
        </Link>
      )}
      <div className="card-body">
        <span className="card-overline">
          {item.category || "Journal"}
          {item.published_at &&
            ` · ${new Date(item.published_at).toLocaleDateString()}`}
        </span>
        <h3>
          <Link to={`/journal/${item.slug}`}>{item.title}</Link>
        </h3>
        <p className="small muted">
          {item.body.slice(0, 150)}
          {item.body.length > 150 ? "…" : ""}
        </p>
        <Link className="text-link" to={`/journal/${item.slug}`}>
          Read article <ArrowUpRight size={17} />
        </Link>
      </div>
    </article>
  );
}
export function MarketplaceHome() {
  const state = usePublishedContent();
  const featured = state.listings.filter((i) => i.featured).slice(0, 3);
  return (
    <>
      <section className="hero">
        <div className="hero-shade" />
        <div className="hero-content">
          <div className="eyebrow">
            <span className="red-line" />
            FASHYN / THE COLLECTION
          </div>
          <h1>
            Modern style.
            <br />
            <span>Thoughtfully chosen.</span>
          </h1>
          <p>
            A refined point of view on clothing for men, women, and children.
            <br />
            Discover pieces made to feel like you.
          </p>
          <div className="actions">
            <Link className="button primary" to="/shop">
              Explore the collection <ArrowUpRight size={19} />
            </Link>
            <Link className="button glass" to="/livelong-farm">
              <ArrowUpRight size={19} />
              About FASHYN
            </Link>
          </div>
        </div>
        <div className="hero-bottom">
          <span>STYLE, WITH INTENTION.</span>
          <span>SCROLL TO EXPLORE ↓</span>
        </div>
      </section>
      <div className="value-strip">
        <span>
          <Search size={21} />
          Discover your style
        </span>
        <span>
          <Sprout size={21} />
          Quality materials
        </span>
        <span>
          <MessageCircle size={21} />
          Personal service
        </span>
      </div>
      <Reveal className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow red-text">DISCOVER FASHYN</span>
            <h2>Find your signature.</h2>
          </div>
          <Link className="text-link" to="/shop">
            View the collection <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="market-categories">
          {fashionCategories.map((c) => {
            return (
              <Link
                key={c.id}
                className="market-category"
                to="/shop"
              >
                <Package size={28} />
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                <ArrowUpRight size={20} />
              </Link>
            );
          })}
          <Link className="market-category" to="/journal">
            <BookOpen size={28} />
            <h3>{journalName}</h3>
            <p>Stories, ideas, and the FASHYN point of view.</p>
            <ArrowUpRight size={20} />
          </Link>
        </div>
      </Reveal>
      <Reveal className="section farm-feature">
        <div>
          <Sprout size={36} />
          <span className="eyebrow red-text">FARM & PRODUCE</span>
          <h2>Made for every expression.</h2>
          <p>
            FASHYN brings together a considered wardrobe for men, women, and
            children, with quality and confidence at the centre.
          </p>
          <Link className="button primary" to="/livelong-farm">
            About FASHYN <ArrowUpRight size={18} />
          </Link>
          <p className="small">
            Premium clothing · Modern essentials · Personal style.
          </p>
        </div>
        <div>
          <h3>The FASHYN promise</h3>
          {state.listings
            .filter((i) => i.category === "livelong-farm")
            .slice(0, 1)
            .map((i) => (
              <ListingCard key={i.id} item={i} />
            ))}
          {!state.loading &&
            !state.error &&
            !state.listings.some((i) => i.category === "livelong-farm") && (
              <p className="muted">
                A considered collection is coming soon.
              </p>
            )}
        </div>
      </Reveal>
      <Reveal className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow red-text">THE COLLECTION</span>
            <h2>Featured pieces.</h2>
          </div>
          <Link className="text-link" to="/shop">
            View the collection <ArrowUpRight size={18} />
          </Link>
        </div>
        <State {...state} />
        <div className="vehicle-grid">
          {featured.map((i) => (
            <ListingCard key={i.id} item={i} />
          ))}
        </div>
        {!state.loading && !state.error && !featured.length && (
          <p className="muted">
            Featured listings will appear here when selected by the owner.
          </p>
        )}
      </Reveal>
      <Reveal className="section journey">
        <div>
          <span className="eyebrow red-text">A SIMPLE WAY FORWARD</span>
          <h2>
            From curiosity
            <br />
            to conversation.
          </h2>
          <p>Browse, review the details, and contact FASHYN directly.</p>
        </div>
        <div className="steps">
          {[
            [
              "01",
              "Explore your options",
              "Browse categories to find an item of interest.",
            ],
            [
              "02",
              "Review the information",
              "Look through photos and details provided by the owner.",
            ],
            [
              "03",
              "Start a conversation",
              "Confirm availability and transaction arrangements directly.",
            ],
          ].map(([n, title, body]) => (
            <div className="step" key={n}>
              <span>{n}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
      <Reveal className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow red-text">PUBLISHED WRITING</span>
            <h2>{journalName}</h2>
          </div>
          <Link className="text-link" to="/journal">
            Visit the Journal <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="vehicle-grid">
          {state.articles.slice(0, 3).map((a) => (
            <ArticleCard key={a.id} item={a} />
          ))}
        </div>
        {!state.loading && !state.error && !state.articles.length && (
          <p className="muted">
            The owner’s published articles will appear here.
          </p>
        )}
      </Reveal>
      <Reveal className="contact-callout">
        <div>
          <span className="eyebrow">START A CONVERSATION</span>
          <h2>See something you like?</h2>
          <p>Find your next piece with FASHYN.</p>
        </div>
        <Link to="/contact" className="button white">
          Let’s talk <ArrowUpRight size={19} />
        </Link>
      </Reveal>
    </>
  );
}
export function MarketplaceBrowse({
  category,
  embedded = false,
}: {
  category?: Category;
  embedded?: boolean;
}) {
  const state = usePublishedContent();
  const [params, setParams] = useSearchParams();
  const get = (k: string) => params.get(k) || "";
  const update = (k: string, v: string) => {
    const next = new URLSearchParams(window.location.search);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k === "currency" && !v) {
      next.delete("max");
      if (next.get("sort") === "price") next.delete("sort");
    }
    setParams(next, { replace: true });
  };
  const selected = category || get("category");
  const title = categories.find((c) => c.id === category)?.name || "Shop All";
  const items = state.listings
    .filter(
      (i) =>
        (!selected || i.category === selected) &&
        `${i.title} ${i.description} ${i.location} ${Object.values(i.details).join(" ")}`
          .toLowerCase()
          .includes(get("q").toLowerCase()) &&
        (!get("availability") || i.availability === get("availability")) &&
        (!get("currency") || i.currency === get("currency")) &&
        (selected !== "cars" ||
          ["make", "body", "year", "transmission"].every(
            (key) => !get(key) || i.details[key] === get(key),
          )) &&
        (!get("max") ||
          (i.price !== null &&
            i.price <= Number(get("max")) &&
            i.currency === get("currency"))),
    )
    .sort((a, b) =>
      get("sort") === "price"
        ? (a.price ?? Infinity) - (b.price ?? Infinity)
        : get("sort") === "title"
          ? a.title.localeCompare(b.title)
          : b.created_at.localeCompare(a.created_at),
    );
  const currencies = Array.from(
    new Set(state.listings.flatMap((i) => (i.currency ? [i.currency] : []))),
  );
  return (
    <Reveal className="section showroom">
      <div className="page-heading">
        <span className="eyebrow red-text">FASHYN / THE COLLECTION</span>
        {embedded ? <h2>Published farm listings</h2> : <h1>{title}</h1>}
        <p>
          {categories.find((c) => c.id === category)?.description ||
            "Explore the collection and contact FASHYN for personal assistance."}
        </p>
      </div>
      <div className="market-toolbar">
        {selected === "cars" &&
          ["make", "body", "year", "transmission"].map((key) => (
            <label key={key}>
              {fields.cars.find((f) => f.key === key)?.label}
              <select
                aria-label={fields.cars.find((f) => f.key === key)?.label}
                value={get(key)}
                onChange={(e) => update(key, e.target.value)}
              >
                <option value="">All</option>
                {Array.from(
                  new Set(
                    state.listings
                      .filter((i) => i.category === "cars")
                      .map((i) => i.details[key])
                      .filter(Boolean),
                  ),
                )
                  .sort()
                  .map((value) => (
                    <option key={value}>{value}</option>
                  ))}
              </select>
            </label>
          ))}
        <label>
          Search listings
          <input
            value={get("q")}
            onChange={(e) => update("q", e.target.value)}
            placeholder="Name, keyword, location…"
          />
        </label>
        {!category && (
          <label>
            Category
            <select
              aria-label="Category"
              value={get("category")}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Availability
          <select
            aria-label="Availability"
            value={get("availability")}
            onChange={(e) => update("availability", e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
            <option value="sold">Sold</option>
            <option value="not-provided">Not provided</option>
          </select>
        </label>
        <label>
          Currency
          <select
            aria-label="Currency"
            value={get("currency")}
            onChange={(e) => {
              update("currency", e.target.value);
            }}
          >
            <option value="">All currencies</option>
            {currencies.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Maximum price
          <input
            type="number"
            min="0"
            value={get("max")}
            disabled={!get("currency")}
            onChange={(e) => update("max", e.target.value)}
          />
        </label>
        <label>
          Sort by
          <select
            aria-label="Sort by"
            value={get("sort")}
            onChange={(e) => update("sort", e.target.value)}
          >
            <option value="">Newest listed</option>
            <option value="title">Title</option>
            <option
              value="price"
              disabled={!get("currency") && currencies.length > 1}
            >
              Price: low to high
            </option>
          </select>
        </label>
        <button className="button secondary" onClick={() => setParams({})}>
          Reset filters
        </button>
      </div>
      <p className="small muted" aria-live="polite">
        {items.length} published listings. Select a currency to compare prices.
      </p>
      <State {...state} />
      <div className="vehicle-grid">
        {items.map((i) => (
          <ListingCard key={i.id} item={i} />
        ))}
      </div>
      {!state.loading &&
        !state.error &&
        !items.length &&
        (category === "paint-production" ? (
          <div className="empty-state">
            <h2>No paint products published yet.</h2>
            <p>
              Product details and prices will appear here when provided by the
              owner.
            </p>
            <EnquiryButtons compact />
          </div>
        ) : (
          <Empty />
        ))}
    </Reveal>
  );
}
export function ListingGallery({ item }: { item: Listing }) {
  const [index, setIndex] = useState(0);
  if (!item.images.length)
    return <div className="empty-state">Media not provided.</div>;
  const image = item.images[Math.min(index, item.images.length - 1)];
  return (
    <div className="gallery">
      <div className="gallery-main">
        <MediaDisplay media={image} alt={image.alt || item.title} controls />
        {item.images.length > 1 && (
          <>
            <button
              className="gallery-prev"
              aria-label="Previous media"
              onClick={() =>
                setIndex(
                  (i) => (i - 1 + item.images.length) % item.images.length,
                )
              }
            >
              <ChevronLeft />
            </button>
            <button
              className="gallery-next"
              aria-label="Next media"
              onClick={() => setIndex((i) => (i + 1) % item.images.length)}
            >
              <ChevronRight />
            </button>
          </>
        )}
        <span className="photo-count" aria-live="polite">
          {index + 1} / {item.images.length}
        </span>
      </div>
      <div className="thumbnails">
        {item.images.map((img, i) => (
          <button
            key={img.path}
            aria-label={`Show ${img.media_type === "video" ? "video" : "photo"} ${i + 1}`}
            aria-pressed={index === i}
            onClick={() => setIndex(i)}
          >
            <MediaDisplay
              media={img}
              alt={img.alt || `Listing media ${i + 1}`}
              muted
            />
          </button>
        ))}
      </div>
    </div>
  );
}
export function ListingPreview({ item }: { item: Listing }) {
  return (
    <div className="detail-layout">
      <ListingGallery item={item} />
      <div className="detail-summary">
        <span className="eyebrow red-text">
          {categories.find((c) => c.id === item.category)?.name}
        </span>
        <h1>{item.title}</h1>
        <div className="detail-price">{listingPrice(item)}</div>
        <p className="muted">
          Availability:{" "}
          {item.availability === "not-provided"
            ? "Not provided"
            : item.availability}
        </p>
        <p className="preserve-lines">{item.description}</p>
        {item.location && <p>Location: {item.location}</p>}
        <dl className="specs">
          {fields[item.category]
            .filter((f) => item.details[f.key])
            .map((f) => (
              <div key={f.key}>
                <dt>{f.label}</dt>
                <dd className="preserve-lines">{item.details[f.key]}</dd>
              </div>
            ))}
        </dl>
        {item.category === "property" && !item.details.transaction && (
          <p className="muted small">
            Sale or rental terms have not been provided.
          </p>
        )}
        {item.category === "livelong-farm" ? (
          <FarmEnquiry item={item.title} />
        ) : (
          <EnquiryButtons vehicle={item.title} />
        )}
        <div className="detail-note">
          Confirm availability, pricing, and transaction details directly with
          FASHYN. An enquiry does not confirm a purchase or reservation.
        </div>
      </div>
    </div>
  );
}
export function MarketplaceDetail() {
  const { slug, id } = useParams();
  const state = usePublishedContent();
  const item = state.listings.find((i) => i.slug === (slug || id));
  useEffect(() => {
    if (item) document.title = `${item.title} | FASHYN`;
  }, [item]);
  return (
    <Reveal className="section detail">
      <Link className="text-link" to="/shop">
        ← Back to listings
      </Link>
      <State {...state} />
      {item ? (
        <ListingPreview key={item.id} item={item} />
      ) : (
        !state.loading &&
        !state.error && (
          <div className="empty-state">
            <h1>Listing not found.</h1>
            <p>This listing is not available for public viewing.</p>
          </div>
        )
      )}
    </Reveal>
  );
}
export function Journal() {
  const state = usePublishedContent();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const items = state.articles.filter(
    (a) =>
      `${a.title} ${a.body}`.toLowerCase().includes(q.toLowerCase()) &&
      (!category || a.category === category),
  );
  return (
    <Reveal className="section">
      <div className="page-heading">
        <span className="eyebrow red-text">THE OWNER’S WRITING</span>
        <h1>{journalName}</h1>
        <p>Articles and reflections published by the owner.</p>
      </div>
      <div className="market-toolbar">
        <label>
          Search articles
          <input
            value={q}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              next.set("q", e.target.value);
              setParams(next);
            }}
          />
        </label>
        <label>
          Article category
          <select
            aria-label="Article category"
            value={category}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              next.set("category", e.target.value);
              setParams(next);
            }}
          >
            <option value="">All categories</option>
            {Array.from(
              new Set(state.articles.map((a) => a.category).filter(Boolean)),
            ).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <button className="button secondary" onClick={() => setParams({})}>
          Reset filters
        </button>
      </div>
      <State {...state} />
      <div className="vehicle-grid">
        {items.map((a) => (
          <ArticleCard key={a.id} item={a} />
        ))}
      </div>
      {!state.loading && !state.error && !items.length && (
        <Empty kind="articles" />
      )}
    </Reveal>
  );
}
export function ArticlePreview({ item }: { item: Article }) {
  return (
    <article className="journal-reading">
      <span className="eyebrow red-text">{item.category || journalName}</span>
      <h1>{item.title}</h1>
      {item.published_at && (
        <p className="muted small">
          {new Date(item.published_at).toLocaleDateString()}
        </p>
      )}
      {item.cover_url && item.cover_path && (
        <MediaDisplay
          className="journal-cover"
          media={{
            path: item.cover_path,
            alt: item.cover_alt,
            position: 0,
            is_cover: true,
            media_type: "image",
            url: item.cover_url,
          }}
          alt={item.cover_alt || item.title}
        />
      )}
      <div className="article-body">
        {item.body.split(/\n\s*\n/).map((paragraph, i) => (
          <p className="preserve-lines" key={i}>
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
export function JournalDetail() {
  const { slug } = useParams();
  const state = usePublishedContent();
  const item = state.articles.find((a) => a.slug === slug);
  useEffect(() => {
    if (item) document.title = `${item.title} | ${journalName}`;
  }, [item]);
  return (
    <Reveal className="section">
      <Link className="text-link" to="/journal">
        ← Back to Journal
      </Link>
      <State {...state} />
      {item ? (
        <ArticlePreview item={item} />
      ) : (
        !state.loading &&
        !state.error && (
          <div className="empty-state">
            <h1>Article not found.</h1>
            <p>This article is not published.</p>
          </div>
        )
      )}
    </Reveal>
  );
}
