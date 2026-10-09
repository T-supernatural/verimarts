import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Menu, X, Play } from "lucide-react";
import { LogoTransparencyFilter } from "./Motion";
import { About, Services, Contact, NotFound } from "./pages";
import {
  MarketplaceHome as Home,
  MarketplaceBrowse,
  MarketplaceDetail as Detail,
  Journal,
  JournalDetail,
} from "./marketplace/Public";
import { categories, journalName } from "./data/marketplace";
import { PhotoCredits } from "./marketplace/PhotoCredits";
const links = [
  ["/", "Home"],
  ["/farm-produce", "Farm & Produce"],
  ["/shop", "Shop All"],
  ["/cars", "Cars"],
  ["/property", "Property"],
  ["/electronics", "Electronics"],
  ["/other-goods", "Other Goods"],
  ["/journal", "Journal"],
  ["/about", "About"],
  ["/contact", "Contact"],
];
function sessionSeen() {
  try {
    return sessionStorage.getItem("verimarts-intro") === "seen";
  } catch {
    return false;
  }
}
function Intro({ close }: { close: () => void }) {
  const reduced = useReducedMotion();
  const skip = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    skip.current?.focus();
    const timer = setTimeout(close, reduced ? 450 : 4500);
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        e.preventDefault();
        skip.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", escape);
    };
  }, [close, reduced]);
  return (
    <motion.div
      className="intro"
      role="dialog"
      aria-modal="true"
      aria-label="Verimarts logo introduction"
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.25 }}
    >
      <div className="intro-stage">
        <div className="intro-horizon" aria-hidden="true" />
        <div className="intro-road" aria-hidden="true">
          <span />
        </div>
        <div className="intro-streak" aria-hidden="true" />
        <div className="intro-identity">
          <div className="intro-artwork">
            <img
              src="/assets/logo.png"
              width="1774"
              height="887"
              alt="Verimarts"
              onError={close}
            />
          </div>
          <p className="intro-caption">DRIVEN BY CHOICE.</p>
          <div className="intro-progress" aria-hidden="true">
            <span />
          </div>
        </div>
      </div>
      <button ref={skip} className="button secondary" onClick={close}>
        Skip intro <ArrowRight size={16} />
      </button>
    </motion.div>
  );
}
export default function App() {
  const [intro, setIntro] = useState(!sessionSeen());
  const [menu, setMenu] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const location = useLocation();
  useEffect(() => {
    let previous = Math.max(0, window.scrollY);
    const onScroll = () => {
      const current = Math.max(0, window.scrollY);
      if (current === previous) return;
      setHeaderHidden(current > 90 && current > previous);
      previous = current;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const close = useCallback(() => {
    try {
      sessionStorage.setItem("verimarts-intro", "seen");
    } catch {
      /* Storage may be unavailable. */
    }
    setIntro(false);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    const titles: Record<string, string> = {
      "/": "One marketplace. Many possibilities.",
      "/shop": "Shop All",
      "/journal": journalName,
      ...Object.fromEntries(categories.map((c) => [`/${c.id}`, c.name])),
      "/showroom": "Explore the showroom",
      "/about": "About Verimarts",
      "/services": "Our services",
      "/contact": "Contact Verimarts",
      "/photo-credits": "Photo credits",
    };
    document.title = `${titles[location.pathname] ?? "Vehicle details"} | Verimarts`;
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute(
      "content",
      `${titles[location.pathname] ?? "Explore published content"} at Verimarts. Discover listings and published writing, and enquire directly.`,
    );
  }, [location.pathname]);
  return (
    <>
      <LogoTransparencyFilter />
      <AnimatePresence>{intro && <Intro close={close} />}</AnimatePresence>
      <div inert={intro}>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <header
          className={`header${headerHidden && !menu ? " header--hidden" : ""}`}
        >
          <Link
            to="/"
            className="brand"
            aria-label="Verimarts home"
            onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
          >
            <img src="/assets/logo.png" alt="Verimarts" />
          </Link>
          <nav
            className={menu ? "nav open" : "nav"}
            aria-label="Main navigation"
          >
            {links.map(([to, label]) => (
              <NavLink
                end={to === "/"}
                key={to}
                to={to}
                onClick={() => {
                  setMenu(false);
                  window.scrollTo({ top: 0, behavior: "instant" });
                }}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <Link
            to="/shop"
            className="header-cta"
            onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
          >
            Explore listings <ArrowUpRight size={17} />
          </Link>
          <button
            className="menu-toggle"
            aria-label={menu ? "Close navigation" : "Open navigation"}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </header>
        <main id="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<MarketplaceBrowse />} />
            {categories.map((c) => (
              <Route
                key={c.id}
                path={`/${c.id}`}
                element={<MarketplaceBrowse category={c.id} />}
              />
            ))}
            <Route
              path="/showroom"
              element={<MarketplaceBrowse category="cars" />}
            />
            <Route path="/showroom/:id" element={<Detail />} />
            <Route path="/listings/:slug" element={<Detail />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/journal/:slug" element={<JournalDetail />} />
            <Route
              path="/about"
              element={<About replay={() => setIntro(true)} />}
            />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/photo-credits" element={<PhotoCredits />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer>
          <div className="footer-top">
            <div>
              <img
                className="footer-logo"
                src="/assets/logo.png"
                alt="Verimarts"
              />
              <p>
                Your next possibility starts
                <br />
                with a closer look.
              </p>
            </div>
            <div>
              <span className="eyebrow">EXPLORE</span>
              {links.slice(1).map(([to, label]) => (
                <Link key={to} to={to}>
                  {label}
                </Link>
              ))}
            </div>
            <div>
              <span className="eyebrow">LET’S TALK</span>
              <p>
                Discover an item you like?
                <br />
                Start with an enquiry.
              </p>
              <Link to="/contact">
                Contact Verimarts <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} Verimarts. All rights reserved.
            </span>
            <span>One owner · Direct enquiries</span>
            <Link to="/photo-credits">Photo credits</Link>
            <button onClick={() => setIntro(true)}>
              <Play size={13} />
              Replay brand intro
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}
