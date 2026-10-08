import { Reveal, HeroImage } from "./Motion";
import { VehicleFilters } from "./VehicleFilters";
import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  CarFront,
  MessageCircle,
  Compass,
  Play,
  ChevronRight,
  Mail,
  MapPin,
  Clock,
  Phone,
} from "lucide-react";
import { business } from "./config/business";
import { priceLabel } from "./data/vehicles";
import {
  CatalogueState,
  DemoNotice,
  EnquiryButtons,
  Gallery,
  VehicleCard,
  useCatalogue,
} from "./components";
export function Home() {
  const reduced = useReducedMotion();
  const { items, ...state } = useCatalogue();
  return (
    <>
      <Reveal className="hero">
        <HeroImage />
        <div className="hero-shade" />
        <div className="hero-content">
          <div className="eyebrow">
            <span className="red-line" />
            THE VERIMARTS DIGITAL SHOWROOM
          </div>
          <motion.h1
            initial={reduced ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.6 }}
          >
            A new road.
            <br />A new <span>possibility.</span>
          </motion.h1>
          <p>
            Find the drive that fits your life.
            <br />
            Explore the details. Make your next move.
          </p>
          <div className="actions">
            <Link className="button primary" to="/showroom">
              Browse vehicles <ArrowUpRight size={19} />
            </Link>
            <Link className="button glass" to="/contact">
              <MessageCircle size={18} />
              WhatsApp enquiry
            </Link>
          </div>
        </div>
        <div className="hero-bottom">
          <span>DRIVEN BY CHOICE.</span>
          <span>
            SCROLL TO EXPLORE <span className="down-arrow">↓</span>
          </span>
        </div>
        <div className="hero-index">
          <span>01</span> / THE NEXT CHAPTER
        </div>
      </Reveal>
      <div className="value-strip">
        <span>
          <CarFront size={21} />
          Explore your options
        </span>
        <span>
          <Compass size={21} />
          Details that matter
        </span>
        <span>
          <MessageCircle size={21} />A direct conversation
        </span>
      </div>
      <Reveal className="section featured">
        <div className="section-heading">
          <div>
            <span className="eyebrow red-text">THE SHOWROOM</span>
            <h2>Find your next drive.</h2>
            <p>
              A glimpse of what your showroom can be. Explore our demo
              collection.
            </p>
          </div>
          <Link className="text-link" to="/showroom">
            View all vehicles <ArrowUpRight size={19} />
          </Link>
        </div>
        <DemoNotice />
        <CatalogueState {...state} />
        <div className="vehicle-grid">
          {items.slice(0, 3).map((v, index) => (
            <VehicleCard key={v.id} vehicle={v} delay={(index % 3) * 0.08} />
          ))}
        </div>
      </Reveal>
      <Reveal className="category-section section">
        <div className="section-heading">
          <div>
            <span className="eyebrow red-text">YOUR LIFE. YOUR DRIVE.</span>
            <h2>Different roads. One destination.</h2>
          </div>
          <p>Start with the shape of your next adventure.</p>
        </div>
        <div className="category-grid">
          {[
            ["SUV", "Room for more.", "/assets/car-4.webp"],
            ["Sedan", "An everyday statement.", "/assets/car-2.webp"],
            ["Coupe", "A little less ordinary.", "/assets/car-3.webp"],
          ].map(([name, copy, image]) => (
            <Link
              className="category-card"
              to={`/showroom?body=${name}`}
              key={name}
            >
              <img
                src={image}
                alt={`Illustrative ${name.toLowerCase()} category photography`}
                loading="lazy"
              />
              <div>
                <span className="eyebrow">EXPLORE {name.toUpperCase()}S</span>
                <h3>{copy}</h3>
                <ArrowUpRight />
              </div>
            </Link>
          ))}
        </div>
      </Reveal>
      <Reveal className="section journey">
        <div>
          <span className="eyebrow red-text">A SIMPLE WAY FORWARD</span>
          <h2>
            From curiosity
            <br />
            to conversation.
          </h2>
          <p>Your next vehicle starts with a closer look.</p>
        </div>
        <div className="steps">
          {[
            [
              "01",
              "Explore the showroom",
              "Browse vehicles and narrow down what fits your needs.",
            ],
            [
              "02",
              "Get into the details",
              "Look through photos, specifications, and listing information.",
            ],
            [
              "03",
              "Start a conversation",
              "Contact Verimarts directly to confirm availability and next steps.",
            ],
          ].map(([number, title, copy]) => (
            <div className="step" key={number}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
              <ArrowUpRight size={20} />
            </div>
          ))}
        </div>
      </Reveal>
      <Reveal className="service-preview section">
        <span className="eyebrow red-text">WHAT WE DO</span>
        <div className="section-heading">
          <h2>
            Vehicle discovery.
            <br />
            Personal conversation.
          </h2>
          <div>
            <p>
              Explore vehicles for sale and ask the questions that matter. Our
              first chapter is a focused digital showroom.
            </p>
            <Link className="text-link" to="/services">
              Explore our services <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </Reveal>
      <ContactCallout />
    </>
  );
}
function ContactCallout() {
  return (
    <Reveal className="contact-callout">
      <div>
        <span className="eyebrow">LET’S FIND YOUR NEXT CHAPTER</span>
        <h2>See something you like?</h2>
        <p>Start an enquiry. Confirm the details directly with Verimarts.</p>
      </div>
      <Link to="/contact" className="button white">
        Let’s talk <ArrowUpRight size={19} />
      </Link>
    </Reveal>
  );
}
function PageHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="page-heading">
      <span className="eyebrow red-text">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{copy}</p>
    </div>
  );
}
export function Showroom() {
  const { items, ...state } = useCatalogue();
  const [params, setParams] = useSearchParams();
  const get = (key: string) => params.get(key) || "";
  const update = (key: string, value: string) => {
    // Read the current URL so rapid changes do not restore an older filter snapshot.
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  const filtered = items
    .filter((v) => {
      const keyword =
        `${v.make} ${v.model} ${v.body} ${v.year ?? ""} ${v.fuel ?? ""}`.toLowerCase();
      return (
        keyword.includes(get("q").toLowerCase()) &&
        (!get("make") || v.make === get("make")) &&
        (!get("body") || v.body === get("body")) &&
        (!get("year") || String(v.year) === get("year")) &&
        (!get("transmission") || v.transmission === get("transmission")) &&
        (!get("availability") || v.status === get("availability")) &&
        (!get("price") ||
          (v.price !== undefined && v.price <= Number(get("price"))))
      );
    })
    .sort((a, b) =>
      get("sort") === "price"
        ? (a.price ?? Infinity) - (b.price ?? Infinity)
        : get("sort") === "year"
          ? (b.year ?? 0) - (a.year ?? 0)
          : b.listedAt.localeCompare(a.listedAt),
    );
  return (
    <Reveal className="section showroom">
      <PageHeading
        eyebrow="THE DIGITAL SHOWROOM"
        title="Your next drive is here."
        copy="Explore the collection. Take a closer look. Start a conversation."
      />
      <DemoNotice />
      <div className="inventory-layout">
        <VehicleFilters
          items={items}
          get={get}
          update={update}
          reset={() => setParams({})}
        />
        <div>
          <div className="results-toolbar">
            <p aria-live="polite">
              <strong>{filtered.length}</strong> demo vehicles
            </p>
            <label>
              Sort by
              <select
                value={get("sort")}
                onChange={(e) => update("sort", e.target.value)}
              >
                <option value="">Newest listed</option>
                <option value="price">Price: low to high</option>
                <option value="year">Year: newest first</option>
              </select>
            </label>
          </div>
          <CatalogueState {...state} />
          <div className="vehicle-grid inventory-grid">
            {filtered.map((v, index) => (
              <VehicleCard key={v.id} vehicle={v} delay={(index % 3) * 0.08} />
            ))}
          </div>
          {!state.loading && !state.error && !filtered.length && (
            <div className="empty-state">
              <Search size={32} />
              <h2>No matching vehicles.</h2>
              <p>Try a different keyword or broaden your filters.</p>
              <button className="button primary" onClick={() => setParams({})}>
                Reset filters
              </button>
            </div>
          )}
        </div>
      </div>
    </Reveal>
  );
}
export function Detail() {
  const { id } = useParams();
  const { items, ...state } = useCatalogue();
  const v = items.find((item) => item.id === id);
  useEffect(() => {
    if (v) document.title = `${v.make} ${v.model} | Verimarts demo showroom`;
  }, [v]);
  if (state.loading || state.error)
    return (
      <Reveal className="section">
        <CatalogueState {...state} />
      </Reveal>
    );
  if (!v) return <NotFound />;
  return (
    <Reveal className="section detail" key={v.id}>
      <Link className="text-link" to="/showroom">
        ← Back to showroom
      </Link>
      <DemoNotice />
      <div className="detail-layout">
        <Gallery key={v.id} vehicle={v} />
        <div className="detail-summary">
          <span className="eyebrow red-text">
            {v.year} · {v.body} · DEMO LISTING
          </span>
          <h1>
            {v.make}
            <br />
            {v.model}
          </h1>
          <div className="detail-price">{priceLabel(v)}</div>
          <p className="muted">
            {v.price
              ? "Sample price for demonstration only."
              : "Pricing has not been provided."}{" "}
            Actual availability is not confirmed.
          </p>
          <EnquiryButtons
            vehicle={`${v.make} ${v.model}${v.year ? ` (${v.year})` : ""}`}
          />
          {!business.whatsapp && (
            <p className="small muted">
              Business contact details are pending. View the Contact page for
              setup status.
            </p>
          )}
          <div className="detail-note">
            Availability and transaction details must be confirmed directly with
            Verimarts. An enquiry does not confirm a purchase or reservation.
          </div>
          <h2>At a glance</h2>
          <dl className="specs">
            {[
              ["Year", v.year],
              ["Body type", v.body],
              [
                "Mileage",
                v.mileage ? `${v.mileage.toLocaleString()} km` : undefined,
              ],
              ["Transmission", v.transmission],
              ["Fuel type", v.fuel],
              ["Availability", "Demo — not confirmed stock"],
            ].map(([name, value]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{value ?? "Not provided"}</dd>
              </div>
            ))}
          </dl>
          <h2>Condition notes</h2>
          <p className="muted">
            {v.notes ??
              "No verified condition notes have been supplied. Ask Verimarts for the actual vehicle history and condition before proceeding."}
          </p>
        </div>
      </div>
      <div className="section-heading related-heading">
        <h2>Keep exploring.</h2>
        <Link className="text-link" to="/showroom">
          All vehicles <ArrowUpRight size={18} />
        </Link>
      </div>
      <div className="vehicle-grid">
        {items
          .filter((item) => item.id !== id)
          .slice(0, 3)
          .map((item) => (
            <VehicleCard key={item.id} vehicle={item} />
          ))}
      </div>
    </Reveal>
  );
}
export function About({ replay }: { replay: () => void }) {
  return (
    <>
      <Reveal className="section">
        <PageHeading
          eyebrow="ABOUT VERIMARTS"
          title="Driven by choice."
          copy="A clearer way to discover your next vehicle."
        />
        <div className="about-layout">
          <img
            src="/assets/logo.png"
            alt="Supplied Verimarts geometric road-inspired V logo"
          />
          <div>
            <h2>
              Your journey starts
              <br />
              with a closer look.
            </h2>
            <p>
              Verimarts is an automotive retail brand with a digital showroom.
              It brings vehicle discovery, listing details, and direct customer
              enquiries into one place.
            </p>
            <p>
              Browse at your own pace, review the information available, and
              speak directly with the business about your next steps.
              Transactions are arranged directly with Verimarts.
            </p>
            <button className="button secondary" onClick={replay}>
              <Play size={17} />
              Watch the brand intro
            </button>
          </div>
        </div>
        <div className="content-pending">
          <h2>Business information to complete</h2>
          <p>
            The supplied business scope is a concept draft. Before launch, the
            owner needs to confirm:
          </p>
          <ul>
            <li>Business history, location, and service area.</li>
            <li>Vehicle stock model, approved listings, and pricing policy.</li>
            <li>Contact information, enquiry hours, and verified services.</li>
          </ul>
        </div>
      </Reveal>
      <ContactCallout />
    </>
  );
}
export function Services() {
  return (
    <>
      <Reveal className="section">
        <PageHeading
          eyebrow="WHAT WE DO"
          title="A focused automotive experience."
          copy="Vehicle discovery and direct enquiries are the foundation of the Verimarts showroom."
        />
        <div className="service-grid">
          <article>
            <CarFront size={32} />
            <span className="eyebrow red-text">01 / VEHICLE SALES</span>
            <h2>Discover the right drive.</h2>
            <p>
              Explore the showroom and review vehicle information. Actual stock,
              pricing, and sale terms will be confirmed by Verimarts.
            </p>
            <Link to="/showroom" className="text-link">
              Browse showroom <ArrowUpRight size={18} />
            </Link>
          </article>
          <article>
            <MessageCircle size={32} />
            <span className="eyebrow red-text">02 / CUSTOMER ENQUIRIES</span>
            <h2>Ask. Understand. Decide.</h2>
            <p>
              Continue the conversation directly with Verimarts to ask questions
              and understand the next steps.
            </p>
            <Link to="/contact" className="text-link">
              Contact details <ArrowUpRight size={18} />
            </Link>
          </article>
        </div>
        <div className="content-pending">
          <h2>Additional service content pending</h2>
          <p>
            Further service descriptions will be added after the business owner
            confirms what is offered and the applicable terms.
          </p>
        </div>
      </Reveal>
      <ContactCallout />
    </>
  );
}
export function Contact() {
  return (
    <Reveal className="section contact-page">
      <PageHeading
        eyebrow="START A CONVERSATION"
        title="Let’s talk about your next drive."
        copy="Vehicle questions, availability, and next steps — confirmed directly with Verimarts."
      />
      <div className="contact-layout">
        <div>
          <span className="eyebrow red-text">DIRECT CONTACT</span>
          <h2>
            A personal conversation.
            <br />A clear next step.
          </h2>
          {business.whatsapp ? (
            <EnquiryButtons />
          ) : (
            <div className="content-pending">
              <MessageCircle size={24} />
              <h3>Contact details coming soon</h3>
              <p>
                The owner’s WhatsApp and phone numbers have not been supplied.
                Direct enquiry links will be enabled once those details are
                confirmed.
              </p>
              <Link className="text-link" to="/showroom">
                Explore the demo showroom <ArrowRight size={17} />
              </Link>
            </div>
          )}
          <div className="contact-details">
            {business.phone && (
              <a href={`tel:${business.phone.replace(/[^+\d]/g, "")}`}>
                <Phone size={20} />
                {business.phone}
              </a>
            )}
            {business.email && (
              <a href={`mailto:${business.email}`}>
                <Mail size={20} />
                {business.email}
              </a>
            )}
            {business.address && (
              <p>
                <MapPin size={20} />
                {business.address}
              </p>
            )}
            {business.hours && (
              <p>
                <Clock size={20} />
                {business.hours}
              </p>
            )}
            {business.mapUrl && (
              <a
                href={business.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View location <ArrowUpRight size={17} />
              </a>
            )}
            {business.socialLinks.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
        <aside className="contact-guide">
          <span className="eyebrow">BEFORE YOU ENQUIRE</span>
          <h2>Have a vehicle in mind?</h2>
          <p>
            Open its detail page and use the enquiry link to include the vehicle
            name in your WhatsApp message once contact setup is complete.
          </p>
          <hr />
          <p>
            Confirm current availability, price, condition, and transaction
            arrangements directly with the business.
          </p>
          <p className="small">
            This website does not collect enquiry form data or accept payments.
            A message is an enquiry, not a reservation.
          </p>
          <ChevronRight size={28} />
        </aside>
      </div>
    </Reveal>
  );
}
export function NotFound() {
  return (
    <Reveal className="section empty-state">
      <span className="eyebrow red-text">404 / A DIFFERENT ROAD</span>
      <h1>This page isn’t here.</h1>
      <p>The vehicle or page you’re looking for could not be found.</p>
      <Link to="/showroom" className="button primary">
        Explore showroom <ArrowUpRight size={18} />
      </Link>
    </Reveal>
  );
}
