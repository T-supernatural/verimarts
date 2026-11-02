import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, MessageCircle, ShoppingBag } from "lucide-react";
import { whatsappUrl } from "../../../config/business";
import {
  availabilityLabels,
  categoryName,
  comparePrice,
  coverOf,
  isFashion,
  isPurchasable,
  optionList,
  type Listing,
  fields,
} from "../../../data/marketplace";
import { useBag } from "../../../store/bag";
import { useCatalogue } from "../../../store/catalogue";
import { absoluteUrl, breadcrumbJsonLd, Seo } from "../../../seo/Seo";
import { MediaDisplay } from "../components/MediaDisplay";
import { Accordion, Breadcrumbs, QuantityStepper, Reveal } from "../components/Primitives";
import { PriceTag, ProductCard } from "../components/ProductCard";

export function ProductGallery({ item }: { item: Listing }) {
  const [index, setIndex] = useState(0);
  if (!item.images.length)
    return (
      <div className="gallery">
        <div className="gallery__main">
          <div className="media-missing">
            <span>Photo coming soon</span>
          </div>
        </div>
      </div>
    );
  const image = item.images[Math.min(index, item.images.length - 1)];
  return (
    <div className="gallery">
      <div className="gallery__main">
        <MediaDisplay media={image} alt={image.alt || item.title} controls eager />
        {item.images.length > 1 && (
          <>
            <button
              className="gallery__nav gallery__nav--prev"
              aria-label="Previous media"
              onClick={() =>
                setIndex((i) => (i - 1 + item.images.length) % item.images.length)
              }
            >
              <ChevronLeft />
            </button>
            <button
              className="gallery__nav gallery__nav--next"
              aria-label="Next media"
              onClick={() => setIndex((i) => (i + 1) % item.images.length)}
            >
              <ChevronRight />
            </button>
            <span className="gallery__count" aria-live="polite">
              {index + 1} / {item.images.length}
            </span>
          </>
        )}
      </div>
      {item.images.length > 1 && (
        <div className="gallery__thumbs">
          {item.images.map((media, i) => (
            <button
              key={media.path}
              aria-label={`Show ${media.media_type === "video" ? "video" : "photo"} ${i + 1}`}
              aria-pressed={index === i}
              onClick={() => setIndex(i)}
            >
              <MediaDisplay
                media={media}
                alt={media.alt || `${item.title} view ${i + 1}`}
                muted
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PurchasePanel({ item }: { item: Listing }) {
  const bag = useBag();
  const sizes = optionList(item.details.sizes);
  const colours = optionList(item.details.colours);
  const [size, setSize] = useState(sizes.length === 1 ? sizes[0] : "");
  const [colour, setColour] = useState(colours.length === 1 ? colours[0] : "");
  const [quantity, setQuantity] = useState(1);
  const [problem, setProblem] = useState("");
  const purchasable = isPurchasable(item);
  function addToBag() {
    if (sizes.length && !size) {
      setProblem("Please choose a size.");
      return;
    }
    if (colours.length && !colour) {
      setProblem("Please choose a colour.");
      return;
    }
    setProblem("");
    bag.add(item, { size, colour, quantity });
  }
  return (
    <>
      {colours.length > 0 && (
        <fieldset className="option">
          <legend>
            Colour{colour && <span>: {colour}</span>}
          </legend>
          <div className="chip-list">
            {colours.map((option) => (
              <button
                key={option}
                type="button"
                className="chip"
                aria-pressed={colour === option}
                onClick={() => setColour(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {sizes.length > 0 && (
        <fieldset className="option">
          <legend>
            Size{size && <span>: {size}</span>}
          </legend>
          <div className="chip-list">
            {sizes.map((option) => (
              <button
                key={option}
                type="button"
                className="chip chip--size"
                aria-pressed={size === option}
                onClick={() => setSize(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {problem && (
        <p className="form-error" role="alert">
          {problem}
        </p>
      )}
      {purchasable ? (
        <div className="purchase">
          <QuantityStepper value={quantity} onChange={setQuantity} />
          <button className="button button--indigo" onClick={addToBag}>
            <ShoppingBag size={18} aria-hidden="true" /> Add to bag
          </button>
        </div>
      ) : (
        <p className="sold-note">
          This piece is {availabilityLabels[item.availability].toLowerCase()}.
          Ask us when it might return.
        </p>
      )}
      <a
        className="button button--whatsapp-outline"
        href={whatsappUrl(item.title)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle size={18} aria-hidden="true" /> Ask about this on WhatsApp
      </a>
    </>
  );
}

/** Product content, shared by the public page and the owner's preview. */
export function ProductDetails({
  item,
  preview = false,
}: {
  item: Listing;
  preview?: boolean;
}) {
  const facts = fields[item.category].filter(
    (field) =>
      item.details[field.key] &&
      !["sizes", "colours", "product_type"].includes(field.key),
  );
  const compare = comparePrice(item);
  return (
    <div className="product">
      <ProductGallery item={item} />
      <div className="product__summary">
        <span className="eyebrow">
          {categoryName(item.category)}
          {item.details.product_type ? ` / ${item.details.product_type}` : ""}
        </span>
        <h1>{item.title}</h1>
        <div className="product__price">
          <PriceTag item={item} />
          {compare && <span className="tag tag--sale tag--inline">Sale</span>}
        </div>
        <p className={`stock stock--${item.availability}`}>
          {availabilityLabels[item.availability]}
        </p>
        {item.description && (
          <p className="product__description">{item.description}</p>
        )}
        {preview ? (
          <p className="notice">Bag and enquiry buttons appear here for shoppers.</p>
        ) : (
          <PurchasePanel key={item.id} item={item} />
        )}
        <div className="product__info">
          {facts.length > 0 && (
            <Accordion title="Details" defaultOpen>
              <dl className="facts">
                {facts.map((field) => (
                  <div key={field.key}>
                    <dt>{field.label}</dt>
                    <dd>{item.details[field.key]}</dd>
                  </div>
                ))}
              </dl>
            </Accordion>
          )}
          <Accordion title="Ordering and delivery">
            <p>
              Add your choices to the bag and send it on WhatsApp. We confirm
              availability, delivery and payment with you there. Nothing is
              charged on this website.
            </p>
            <Link className="text-link" to="/how-to-order">
              How ordering works
            </Link>
          </Accordion>
          <Accordion title="Need help with size?">
            <p>
              Message us with your usual size and the fit you prefer, and we will
              help you choose.
            </p>
          </Accordion>
        </div>
      </div>
    </div>
  );
}

function productJsonLd(item: Listing) {
  const availability = {
    available: "https://schema.org/InStock",
    unavailable: "https://schema.org/OutOfStock",
    sold: "https://schema.org/SoldOut",
    "not-provided": "https://schema.org/LimitedAvailability",
  }[item.availability];
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.title,
    description: item.description,
    url: absoluteUrl(`/product/${item.slug}`),
    category: [categoryName(item.category), item.details.product_type]
      .filter(Boolean)
      .join(" > "),
    brand: { "@type": "Brand", name: "FASHYN" },
    image: item.images
      .filter((image) => image.url && image.media_type !== "video")
      .map((image) => absoluteUrl(image.url!)),
    ...(item.details.material ? { material: item.details.material } : {}),
    ...(item.details.colours ? { color: item.details.colours } : {}),
    ...(item.details.sizes ? { size: item.details.sizes } : {}),
    ...(item.price !== null && item.currency
      ? {
          offers: {
            "@type": "Offer",
            url: absoluteUrl(`/product/${item.slug}`),
            price: item.price,
            priceCurrency: item.currency,
            availability,
            itemCondition: "https://schema.org/NewCondition",
          },
        }
      : {}),
  };
}

export function ProductPage() {
  const { slug } = useParams();
  const { listings, loading, error, retry } = useCatalogue();
  const item = listings.find((entry) => entry.slug === slug);
  if (loading)
    return (
      <p role="status" className="page-status container">
        Loading this piece…
      </p>
    );
  if (error)
    return (
      <div className="notice container page-status" role="alert">
        <p>{error}</p>
        <button className="button button--outline" onClick={retry}>
          Try again
        </button>
      </div>
    );
  if (!item || !isFashion(item.category))
    return (
      <div className="notice container page-status">
        <Seo
          title="Product not found | FASHYN"
          description="This piece is no longer available."
          noindex
        />
        <h1>We can't find that piece.</h1>
        <p>It may have sold out or moved. Plenty more to see, though.</p>
        <Link className="button button--indigo" to="/shop">
          Browse the collection
        </Link>
      </div>
    );
  const related = listings
    .filter((entry) => entry.category === item.category && entry.id !== item.id)
    .sort((a, b) =>
      a.details.product_type === item.details.product_type
        ? -1
        : b.details.product_type === item.details.product_type
          ? 1
          : 0,
    )
    .slice(0, 4);
  const department = categoryName(item.category);
  const cover = coverOf(item);
  return (
    <>
      <Seo
        title={`${item.title} | ${department}'s ${item.details.product_type || "Clothing"} | FASHYN`}
        description={
          item.description.slice(0, 155) ||
          `Shop the ${item.title} from FASHYN.`
        }
        image={cover?.media_type === "video" ? undefined : cover?.url}
        type="product"
        jsonLd={[
          productJsonLd(item),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: department, path: `/${item.category}` },
            { name: item.title, path: `/product/${item.slug}` },
          ]),
        ]}
      />
      <div className="container product-page">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: department, href: `/${item.category}` },
            { label: item.title },
          ]}
        />
        <ProductDetails item={item} />
      </div>
      {related.length > 0 && (
        <Reveal className="section container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Keep looking</span>
              <h2>You may also like.</h2>
            </div>
          </div>
          <div className="product-grid">
            {related.map((entry) => (
              <ProductCard key={entry.id} item={entry} />
            ))}
          </div>
        </Reveal>
      )}
    </>
  );
}
