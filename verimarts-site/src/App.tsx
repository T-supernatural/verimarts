import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import { categories } from "./data/marketplace";
import { LoadingScreen } from "./features/shop/components/LoadingScreen";
import { StorefrontShell } from "./features/shop/components/StorefrontShell";
import { Catalogue } from "./features/shop/pages/Catalogue";
import { Home } from "./features/shop/pages/Home";
import {
  About,
  BagPage,
  Contact,
  HowToOrder,
  NotFound,
  PhotoCredits,
} from "./features/shop/pages/Info";
import { Journal, JournalArticle } from "./features/shop/pages/Journal";
import { ProductPage } from "./features/shop/pages/Product";
import { BagProvider } from "./store/bag";
import { CatalogueProvider } from "./store/catalogue";
import "./styles/store.css";

const retiredPaths = [
  "/cars",
  "/property",
  "/electronics",
  "/other-goods",
  "/paint-production",
  "/farm-produce",
  "/livelong-farm",
  "/showroom",
  "/showroom/:id",
];
function sessionSeen() {
  try {
    return sessionStorage.getItem("fashyn-intro") === "seen";
  } catch {
    return false;
  }
}
function LegacyListing() {
  const { slug } = useParams();
  return <Navigate to={`/product/${slug}`} replace />;
}
export default function App() {
  const reduced = useReducedMotion();
  const [intro, setIntro] = useState(() => !sessionSeen());
  const location = useLocation();
  const close = useCallback(() => {
    try {
      sessionStorage.setItem("fashyn-intro", "seen");
    } catch {
      /* Storage may be unavailable. */
    }
    setIntro(false);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <CatalogueProvider>
      <BagProvider>
        <AnimatePresence>
          {intro && <LoadingScreen key="loader" onDone={close} />}
        </AnimatePresence>
        <div className="store" inert={intro && !reduced}>
          <StorefrontShell onReplayIntro={() => setIntro(true)}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Catalogue view={{ kind: "all" }} />} />
              {categories.map((category) => (
                <Route
                  key={category.id}
                  path={`/${category.id}`}
                  element={
                    <Catalogue
                      key={category.id}
                      view={{ kind: "department", id: category.id }}
                    />
                  }
                />
              ))}
              <Route
                path="/new-arrivals"
                element={<Catalogue key="new" view={{ kind: "new" }} />}
              />
              <Route
                path="/sale"
                element={<Catalogue key="sale" view={{ kind: "sale" }} />}
              />
              <Route
                path="/search"
                element={<Catalogue key="search" view={{ kind: "search" }} />}
              />
              <Route path="/bag" element={<BagPage />} />
              <Route path="/product/:slug" element={<ProductPage />} />
              <Route path="/listings/:slug" element={<LegacyListing />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/journal/:slug" element={<JournalArticle />} />
              <Route path="/about" element={<About replay={() => setIntro(true)} />} />
              <Route path="/how-to-order" element={<HowToOrder />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/photo-credits" element={<PhotoCredits />} />
              <Route path="/services" element={<Navigate to="/how-to-order" replace />} />
              {retiredPaths.map((path) => (
                <Route key={path} path={path} element={<Navigate to="/shop" replace />} />
              ))}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </StorefrontShell>
        </div>
      </BagProvider>
    </CatalogueProvider>
  );
}
