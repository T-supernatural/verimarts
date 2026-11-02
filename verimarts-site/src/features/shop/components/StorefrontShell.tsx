import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, MessageCircle, Search, ShoppingBag, Trash2 } from "lucide-react";
import { Logo } from "../../../brand/Logo";
import { storeConfig } from "../../../config/storeConfig";
import { categories, coverOf, journalName, listingPrice } from "../../../data/marketplace";
import { subtotals, useBag } from "../../../store/bag";
import { useCatalogue } from "../../../store/catalogue";
import { Accordion, Drawer, Modal, QuantityStepper } from "./Primitives";

function typeLink(department: string, type: string) {
  return `/${department}?type=${encodeURIComponent(type)}`;
}

function SearchPanel({ onDone }: { onDone: () => void }) {
  const { listings } = useCatalogue();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const results = useMemo(
    () =>
      term
        ? listings
            .filter((item) =>
              `${item.title} ${item.details.product_type || ""} ${item.details.colours || ""} ${item.category}`
                .toLowerCase()
                .includes(term),
            )
            .slice(0, 5)
        : [],
    [listings, term],
  );
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!term) return;
    onDone();
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }
  return (
    <form className="search-panel" role="search" onSubmit={submit}>
      <label htmlFor="site-search">Search the collection</label>
      <input
        id="site-search"
        data-autofocus
        type="search"
        value={query}
        placeholder="Try dress, suit or marigold"
        onChange={(event) => setQuery(event.target.value)}
      />
      {term && (
        <p className="search-panel__count" aria-live="polite">
          {results.length
            ? "Top matches"
            : "No matches yet. Try a different word."}
        </p>
      )}
      <ul className="search-panel__results">
        {results.map((item) => (
          <li key={item.id}>
            <Link to={`/product/${item.slug}`} onClick={onDone}>
              {coverOf(item)?.url && (
                <img src={coverOf(item)?.url} alt="" loading="lazy" />
              )}
              <span>
                <strong>{item.title}</strong>
                <small>{listingPrice(item)}</small>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {!term && (
        <div className="search-panel__suggest">
          {categories.map((category) => (
            <Link key={category.id} to={`/${category.id}`} onClick={onDone}>
              {category.name}
            </Link>
          ))}
        </div>
      )}
    </form>
  );
}

export function BagContents() {
  const { lines, setQuantity, remove, setOpen } = useBag();
  const { listings } = useCatalogue();
  // Signed image links expire, so bag lines look up the current picture.
  const imageFor = (slug: string) => {
    const item = listings.find((entry) => entry.slug === slug);
    return item && coverOf(item)?.url;
  };
  if (!lines.length)
    return (
      <div className="bag-empty">
        <ShoppingBag size={34} aria-hidden="true" />
        <h3>Your bag is empty</h3>
        <p>Add a piece you love and it will wait for you here.</p>
        <Link className="button button--primary" to="/shop" onClick={() => setOpen(false)}>
          Start shopping
        </Link>
      </div>
    );
  return (
    <ul className="bag-lines">
      {lines.map((line) => (
        <li key={line.key} className="bag-line">
          {imageFor(line.slug) ? (
            <img src={imageFor(line.slug)} alt="" loading="lazy" />
          ) : (
            <span className="bag-line__blank" />
          )}
          <div>
            <Link to={`/product/${line.slug}`} onClick={() => setOpen(false)}>
              {line.title}
            </Link>
            <small>
              {[line.size && `Size ${line.size}`, line.colour]
                .filter(Boolean)
                .join(" · ")}
            </small>
            <div className="bag-line__row">
              <QuantityStepper
                label={`Quantity of ${line.title}`}
                value={line.quantity}
                onChange={(quantity) => setQuantity(line.key, quantity)}
              />
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove ${line.title}`}
                onClick={() => remove(line.key)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function BagSummary() {
  const { lines, checkoutUrl } = useBag();
  if (!lines.length) return null;
  const totals = subtotals(lines);
  return (
    <div className="bag-summary">
      {totals.length > 0 && (
        <p className="bag-summary__total">
          <span>Subtotal</span>
          <strong>{totals.join(" + ")}</strong>
        </p>
      )}
      <a
        className="button button--whatsapp"
        href={checkoutUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle size={18} aria-hidden="true" /> Order on WhatsApp
      </a>
      <p className="bag-summary__note">
        Your bag opens as a WhatsApp message. We confirm availability, delivery
        and payment with you there.
      </p>
    </div>
  );
}

export function StorefrontShell({
  children,
  onReplayIntro,
}: {
  children: ReactNode;
  onReplayIntro: () => void;
}) {
  const location = useLocation();
  const bag = useBag();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = location.pathname === "/";
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMobileOpen(false));
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.search]);
  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {storeConfig.announcement && (
        <div className="announcement">
          <span>{storeConfig.announcement}</span>
        </div>
      )}
      <header
        className={`header${isHome && !scrolled ? " header--clear" : ""}`}
      >
        <button
          className="icon-button header__menu"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={22} />
        </button>
        <nav className="header__nav" aria-label="Main navigation">
          {categories.map((department) => (
            <div className="mega" key={department.id}>
              <NavLink to={`/${department.id}`}>{department.name}</NavLink>
              <div className="mega__panel">
                <div>
                  <span className="eyebrow">{department.name}</span>
                  <Link to={`/${department.id}`}>Shop all</Link>
                  {department.types.map((type) => (
                    <Link key={type} to={typeLink(department.id, type)}>
                      {type}
                    </Link>
                  ))}
                </div>
                <Link className="mega__feature" to={`/${department.id}`} tabIndex={-1} aria-hidden="true">
                  <img src={department.image} alt="" loading="lazy" />
                </Link>
              </div>
            </div>
          ))}
          <NavLink to="/new-arrivals">New</NavLink>
          <NavLink className="header__sale" to="/sale">
            Sale
          </NavLink>
        </nav>
        <Link className="header__logo" to="/" aria-label="FASHYN home">
          <Logo />
        </Link>
        <div className="header__actions">
          <button
            className="icon-button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={21} />
          </button>
          <button
            className="icon-button header__bag"
            aria-label={`Open bag, ${bag.count} ${bag.count === 1 ? "item" : "items"}`}
            onClick={() => bag.setOpen(true)}
          >
            <ShoppingBag size={21} />
            {bag.count > 0 && <span aria-hidden="true">{bag.count}</span>}
          </button>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="footer">
        <div className="footer__brand container">
          <Logo className="footer__logo" />
          <p>{storeConfig.contact.tagline}</p>
        </div>
        <div className="footer__grid container">
          <div>
            <h2>Shop</h2>
            {categories.map((item) => (
              <Link key={item.id} to={`/${item.id}`}>
                {item.name}
              </Link>
            ))}
            <Link to="/new-arrivals">New arrivals</Link>
            <Link to="/sale">Sale</Link>
          </div>
          <div>
            <h2>Discover</h2>
            <Link to="/about">About FASHYN</Link>
            <Link to="/journal">{journalName}</Link>
            <Link to="/how-to-order">How to order</Link>
            <Link to="/photo-credits">Photo credits</Link>
            {storeConfig.socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {social.label}
              </a>
            ))}
          </div>
          <div>
            <h2>Talk to us</h2>
            <Link to="/contact">Contact</Link>
            <a href={`mailto:${storeConfig.contact.email}`}>
              {storeConfig.contact.email}
            </a>
            <a href={`tel:${storeConfig.contact.phone}`}>
              {storeConfig.contact.phone}
            </a>
            <button className="footer__replay" onClick={onReplayIntro}>
              Replay brand intro
            </button>
          </div>
        </div>
        <div className="footer__bottom container">
          <span>© {new Date().getFullYear()} FASHYN. All rights reserved.</span>
          <span className="footer__palette" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
      </footer>
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        title="Menu"
        side="left"
      >
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {categories.map((department) => (
            <Accordion key={department.id} title={department.name}>
              <Link to={`/${department.id}`}>Shop all {department.name.toLowerCase()}</Link>
              {department.types.map((type) => (
                <Link key={type} to={typeLink(department.id, type)}>
                  {type}
                </Link>
              ))}
            </Accordion>
          ))}
          <Link to="/new-arrivals">New arrivals</Link>
          <Link className="header__sale" to="/sale">
            Sale
          </Link>
          <Link to="/journal">Journal</Link>
          <Link to="/how-to-order">How to order</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </Drawer>
      <Modal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Search FASHYN"
      >
        <SearchPanel onDone={() => setSearchOpen(false)} />
      </Modal>
      <Drawer
        open={bag.isOpen}
        onClose={() => bag.setOpen(false)}
        title={`Your bag${bag.count ? ` (${bag.count})` : ""}`}
        footer={bag.lines.length ? <BagSummary /> : undefined}
      >
        <BagContents />
      </Drawer>
    </div>
  );
}
