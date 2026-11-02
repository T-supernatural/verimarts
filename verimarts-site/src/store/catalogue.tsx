import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { contentRepository } from "../data/contentRepository";
import type { Article, Listing } from "../data/marketplace";

type Catalogue = {
  listings: Listing[];
  articles: Article[];
  loading: boolean;
  error: string;
  retry: () => void;
};
const CatalogueContext = createContext<Catalogue | null>(null);
const STALE_AFTER = 5 * 60 * 1000;

/** Keep signed links already on screen, so a refresh does not make every image reload. */
function keepImageLinks(next: Listing[], previous: Listing[]) {
  const known = new Map(
    previous.flatMap((item) =>
      item.images.map((image) => [image.path, image.url] as const),
    ),
  );
  return next.map((item) => ({
    ...item,
    images: item.images.map((image) => ({
      ...image,
      url: known.get(image.path) || image.url,
    })),
  }));
}

export function CatalogueProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<{
    listings: Listing[];
    articles: Article[];
  }>({ listings: [], articles: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const loadedAt = useRef(0);
  useEffect(() => {
    let active = true;
    Promise.all([contentRepository.listings(), contentRepository.articles()])
      .then(([listings, articles]) => {
        if (!active) return;
        loadedAt.current = Date.now();
        setData((current) => ({
          listings: keepImageLinks(listings, current.listings),
          articles,
        }));
        setError("");
      })
      .catch(() => {
        if (active)
          setError("The collection could not be loaded. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  useEffect(() => {
    const refreshWhenStale = () => {
      if (!document.hidden && Date.now() - loadedAt.current > STALE_AFTER)
        setAttempt((count) => count + 1);
    };
    document.addEventListener("visibilitychange", refreshWhenStale);
    const timer = setInterval(refreshWhenStale, STALE_AFTER);
    return () => {
      document.removeEventListener("visibilitychange", refreshWhenStale);
      clearInterval(timer);
    };
  }, []);
  const value = useMemo(
    () => ({
      ...data,
      loading,
      error,
      retry: () => {
        setLoading(true);
        setAttempt((count) => count + 1);
      },
    }),
    [data, loading, error],
  );
  return (
    <CatalogueContext.Provider value={value}>
      {children}
    </CatalogueContext.Provider>
  );
}
export function useCatalogue() {
  const catalogue = useContext(CatalogueContext);
  if (!catalogue)
    throw new Error("useCatalogue must be used inside CatalogueProvider");
  return catalogue;
}
