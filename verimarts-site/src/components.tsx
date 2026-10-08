import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  MessageCircle,
  Phone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { business, whatsappUrl } from "./config/business";
import type { Vehicle } from "./data/vehicles";
import { priceLabel } from "./data/vehicles";
import { catalogue } from "./data/catalogue";

export function EnquiryButtons({
  vehicle,
  compact = false,
}: {
  vehicle?: string;
  compact?: boolean;
}) {
  const url = whatsappUrl(vehicle);
  return (
    <div className="actions">
      <LinkOrAnchor url={url} className="button primary">
        <MessageCircle size={18} />
        {url ? "Enquire on WhatsApp" : "WhatsApp enquiry"}
        {!url && <span className="sr-only"> — contact setup pending</span>}
      </LinkOrAnchor>
      {!compact && business.phone && (
        <a
          className="button secondary"
          href={`tel:${business.phone.replace(/[^+\d]/g, "")}`}
        >
          <Phone size={17} />
          Call Verimarts
        </a>
      )}
    </div>
  );
}
function LinkOrAnchor({
  url,
  children,
  className,
}: {
  url?: string;
  children: React.ReactNode;
  className: string;
}) {
  return url ? (
    <a
      className={className}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ) : (
    <Link className={className} to="/contact">
      {children}
    </Link>
  );
}
export function DemoNotice() {
  return (
    <div className="demo-notice">
      <span className="dot" />
      Preview catalogue · Sample vehicles and illustrative photography. These
      are not confirmed stock.
    </div>
  );
}
export function AvailabilityBadge({ vehicle }: { vehicle: Vehicle }) {
  return (
    <span className="badge">
      {vehicle.demo ? "DEMO LISTING" : vehicle.status}
    </span>
  );
}
export function VehicleCard({ vehicle: v }: { vehicle: Vehicle }) {
  return (
    <article className="vehicle-card">
      <Link to={`/showroom/${v.id}`} className="card-photo">
        <img
          src={v.images[0]}
          alt={`Illustrative automotive photo for ${v.make} ${v.model} demo listing`}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "/assets/photo-fallback.svg";
          }}
        />
        <AvailabilityBadge vehicle={v} />
        <span className="photo-arrow">
          <ArrowUpRight size={21} />
        </span>
      </Link>
      <div className="card-body">
        <div className="card-overline">
          {v.year} <span>·</span> {v.body}
        </div>
        <h3>
          <Link to={`/showroom/${v.id}`}>
            {v.make} {v.model}
          </Link>
        </h3>
        <div className="spec-line">
          {[
            v.mileage ? `${v.mileage.toLocaleString()} km` : undefined,
            v.transmission,
            v.fuel,
          ]
            .filter(Boolean)
            .join(" · ")}
        </div>
        <div className="card-bottom">
          <strong>{priceLabel(v)}</strong>
          <Link
            to={`/showroom/${v.id}`}
            aria-label={`View ${v.make} ${v.model}`}
          >
            <ArrowUpRight size={19} />
          </Link>
        </div>
      </div>
    </article>
  );
}
export function Gallery({ vehicle: v }: { vehicle: Vehicle }) {
  const [index, setIndex] = useState(0);
  return (
    <div className="gallery">
      <div className="gallery-main">
        <img
          src={v.images[index]}
          alt={`Illustrative photo ${index + 1} for ${v.make} ${v.model}; not actual vehicle stock`}
          onError={(e) => {
            e.currentTarget.src = "/assets/photo-fallback.svg";
          }}
        />
        {v.images.length > 1 && (
          <>
            <button
              className="gallery-prev"
              aria-label="Previous photo"
              onClick={() =>
                setIndex((index - 1 + v.images.length) % v.images.length)
              }
            >
              <ChevronLeft />
            </button>
            <button
              className="gallery-next"
              aria-label="Next photo"
              onClick={() => setIndex((index + 1) % v.images.length)}
            >
              <ChevronRight />
            </button>
          </>
        )}
        <span className="photo-count" aria-live="polite">
          {index + 1} / {v.images.length}
        </span>
      </div>
      <div className="thumbnails">
        {v.images.map((src, i) => (
          <button
            key={src}
            aria-label={`Show photo ${i + 1}`}
            aria-pressed={i === index}
            onClick={() => setIndex(i)}
          >
            <img src={src} alt="" />
          </button>
        ))}
      </div>
      <p className="muted small">
        Demo gallery: representative automotive photography, not photos of this
        vehicle.
      </p>
    </div>
  );
}
export function useCatalogue() {
  const [items, setItems] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    catalogue
      .list()
      .then((data) => {
        if (active) {
          setItems(data);
          setError(false);
        }
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  return {
    items,
    loading,
    error,
    retry: () => {
      setLoading(true);
      setAttempt((v) => v + 1);
    },
  };
}
export function CatalogueState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: boolean;
  retry: () => void;
}) {
  return loading ? (
    <p role="status" className="empty-state">
      Loading the showroom…
    </p>
  ) : error ? (
    <div className="empty-state" role="alert">
      <h2>We couldn’t load the catalogue.</h2>
      <button className="button secondary" onClick={retry}>
        Try again
      </button>
    </div>
  ) : null;
}
