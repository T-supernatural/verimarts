import { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Menu,
  X,
  Play,
} from "lucide-react";
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
import { LivelongFarm } from "./marketplace/Farm";
import { business, whatsappUrl } from "./config/business";
const links = [
  ["/", "Home"],
  ["/shop", "Collection"],
  ["/journal", "Journal"],
  ["/about", "About"],
  ["/contact", "Contact"],
];
function sessionSeen() {
  try {
    return (
      sessionStorage.getItem("fashyn-intro") === "seen" ||
      sessionStorage.getItem("verimarts-intro") === "seen"
    );
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
      aria-label="FASHYN logo introduction"
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.25 }}
    >
      <div className="intro-stage">
        <video
          className="intro-video"
          autoPlay
          muted
          playsInline
          poster="/assets/fashyn-wordmark.png"
          onEnded={close}
          onError={close}
          aria-label="FASHYN logo reveal"
        >
          <source src="/assets/fashyn-intro.mp4" type="video/mp4" />
        </video>
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
  const closeNavigation = () => {
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  useEffect(() => {
    return undefined;
  }, []);
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
      sessionStorage.setItem("fashyn-intro", "seen");
      sessionStorage.setItem("verimarts-intro", "seen");
    } catch {
      /* Storage may be unavailable. */
    }
    setIntro(false);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    const titles: Record<string, string> = {
      "/": "Modern style, thoughtfully chosen.",
      "/shop": "The Collection",
      "/journal": journalName,
      ...Object.fromEntries(categories.map((c) => [`/${c.id}`, c.name])),
      "/showroom": "Explore the showroom",
      "/about": "About FASHYN",
      "/services": "The FASHYN approach",
      "/contact": "Contact FASHYN",
      "/photo-credits": "Photo credits",
    };
    document.title = `${titles[location.pathname] ?? "Discover the collection"} | FASHYN`;
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute(
      "content",
      `${titles[location.pathname] ?? "Discover considered fashion"} at FASHYN. Explore a refined collection shaped by quality, confidence, and modern style.`,
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
            aria-label="FASHYN home"
            onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
          >
            <img src="/assets/fashyn-wordmark.png" alt="FASHYN" />
          </Link>
          <nav
            className={menu ? "nav open" : "nav"}
            aria-label="Main navigation"
          >
            <NavLink to="/" end onClick={closeNavigation}>
              Home
            </NavLink>
            {links.slice(1).map(([to, label]) => (
                <NavLink
                  end={to === "/"}
                  key={to}
                  to={to}
                  onClick={closeNavigation}
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
            Explore collection <ArrowUpRight size={17} />
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
            <Route
              path="/farm-produce"
              element={<Navigate to="/livelong-farm" replace />}
            />
            {categories.map((c) => (
              <Route
                key={c.id}
                path={`/${c.id}`}
                element={
                  c.id === "livelong-farm" ? (
                    <LivelongFarm />
                  ) : (
                    <MarketplaceBrowse category={c.id} />
                  )
                }
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
          <div className="footer-invitation">
            <div>
              <span className="eyebrow">FIND YOUR NEXT POSSIBILITY</span>
              <h2>Take a closer look.</h2>
              <p>Explore the collection. Find your FASHYN.</p>
            </div>
            <Link className="button" to="/shop">
              Explore collection <ArrowUpRight size={20} />
            </Link>
          </div>
          <div className="footer-top">
            <div>
              <img
                className="footer-logo"
                src="/assets/fashyn-wordmark.png"
                alt="FASHYN"
              />
              <p>
                Your signature starts
                <br />
                with FASHYN.
              </p>
            </div>
            <div>
              <span className="eyebrow">THE COLLECTION</span>
              <Link to="/shop">Shop the collection</Link>
              <Link to="/shop">New arrivals</Link>
              <Link to="/shop">Featured pieces</Link>
              <Link to="/shop">Women · Men · Children</Link>
            </div>
            <div>
              <span className="eyebrow">DISCOVER FASHYN</span>
              <Link to="/about">Our story</Link>
              <Link to="/journal">{journalName}</Link>
              <Link to="/contact">
                Contact FASHYN <ArrowUpRight size={15} />
              </Link>
              <Link className="footer-farm-note" to="/journal">
                <span>
                  FASHYN Journal<strong>Stories in style</strong>
                </span>
                <ArrowUpRight size={18} />
              </Link>
            </div>
            <div className="footer-contact">
              <span className="eyebrow">LET’S TALK</span>
              <a
                className="footer-whatsapp"
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp enquiry <ArrowUpRight size={18} />
              </a>
              <a href={`tel:${business.phone}`}>{business.phone}</a>
              <a href={`mailto:${business.email}`}>{business.email}</a>
              <p>WhatsApp: {business.whatsapp}</p>
              <button
                className="footer-top-button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Back to top ↑
              </button>
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} FASHYN. All rights reserved.
            </span>
            <span>Considered fashion · Personal service</span>
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
