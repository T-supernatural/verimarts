import { Link } from "react-router-dom";
import { Shirt } from "lucide-react";
import {
  availabilityLabels,
  categoryName,
  comparePrice,
  coverOf,
  formatMoney,
  isPurchasable,
  listingPrice,
  type Article,
  type Listing,
} from "../../../data/marketplace";
import { MediaDisplay } from "./MediaDisplay";

export function PriceTag({ item }: { item: Listing }) {
  const compare = comparePrice(item);
  return (
    <span className={`price${compare ? " price--sale" : ""}`}>
      <span>{listingPrice(item)}</span>
      {compare && item.currency && (
        <s>
          <span className="sr-only">Was </span>
          {formatMoney(compare, item.currency)}
        </s>
      )}
    </span>
  );
}

export function ProductCard({ item }: { item: Listing }) {
  const cover = coverOf(item);
  const alternate = item.images.find(
    (image) => image !== cover && image.media_type !== "video" && image.url,
  );
  const compare = comparePrice(item);
  return (
    <article className="product-card">
      <Link
        className="product-card__image"
        to={`/product/${item.slug}`}
        aria-label={item.title}
      >
        {cover?.url ? (
          <MediaDisplay media={cover} alt={cover.alt || item.title} muted />
        ) : (
          <div className="media-missing">
            <Shirt size={28} aria-hidden="true" />
            <span>Photo coming soon</span>
          </div>
        )}
        {alternate?.url && (
          <img
            className="product-card__alternate"
            src={alternate.url}
            alt=""
            loading="lazy"
          />
        )}
        {!isPurchasable(item) ? (
          <span className="tag tag--muted">
            {availabilityLabels[item.availability]}
          </span>
        ) : compare ? (
          <span className="tag tag--sale">Sale</span>
        ) : null}
      </Link>
      <div className="product-card__body">
        <span className="product-card__meta">
          {item.details.product_type || categoryName(item.category)}
        </span>
        <h3>
          <Link to={`/product/${item.slug}`}>{item.title}</Link>
        </h3>
        <PriceTag item={item} />
      </div>
    </article>
  );
}

export function ArticleCard({ item }: { item: Article }) {
  return (
    <article className="article-card">
      <Link
        className="article-card__image"
        to={`/journal/${item.slug}`}
        tabIndex={-1}
        aria-hidden="true"
      >
        {item.cover_url ? (
          <img src={item.cover_url} alt="" loading="lazy" decoding="async" />
        ) : (
          <div className="media-missing" />
        )}
      </Link>
      <span className="product-card__meta">{item.category || "Journal"}</span>
      <h3>
        <Link to={`/journal/${item.slug}`}>{item.title}</Link>
      </h3>
      <p>
        {item.body.slice(0, 120)}
        {item.body.length > 120 ? "…" : ""}
      </p>
    </article>
  );
}
