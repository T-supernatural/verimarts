import { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
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
import {
  StorefrontPlaceholder,
  StorefrontShell,
} from "./features/shop/components/StorefrontShell";
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
  const location = useLocation();
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
      <div className="fashyn-store" inert={intro}>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <StorefrontShell onReplayIntro={() => setIntro(true)}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<MarketplaceBrowse />} />
            <Route path="/women" element={<StorefrontPlaceholder title="Women" />} />
            <Route path="/men" element={<StorefrontPlaceholder title="Men" />} />
            <Route path="/children" element={<StorefrontPlaceholder title="Children" />} />
            <Route path="/new-arrivals" element={<StorefrontPlaceholder title="New arrivals" />} />
            <Route path="/sale" element={<StorefrontPlaceholder title="Sale" />} />
            <Route path="/search" element={<StorefrontPlaceholder title="Search" />} />
            <Route path="/bag" element={<StorefrontPlaceholder title="Your bag" />} />
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
        </StorefrontShell>
      </div>
    </>
  );
}
