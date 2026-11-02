import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import {
  categories,
  categoryName,
  comparePrice,
  isPurchasable,
  optionList,
  type FashionCategory,
  type Listing,
} from "../../../data/marketplace";
import { useCatalogue } from "../../../store/catalogue";
import { breadcrumbJsonLd, absoluteUrl, Seo } from "../../../seo/Seo";
import { routeMeta } from "../../../seo/routes";
import { Breadcrumbs, Drawer, ProductSkeleton } from "../components/Primitives";
import { ProductCard } from "../components/ProductCard";

type View =
  | { kind: "all" }
  | { kind: "department"; id: FashionCategory }
  | { kind: "new" }
  | { kind: "sale" }
  | { kind: "search" };

function viewCopy(view: View) {
  if (view.kind === "department") {
    const category = categories.find((c) => c.id === view.id)!;
    return {
      path: `/${view.id}`,
      title: category.name,
      intro: category.description,
      image: category.image as string | undefined,
    };
  }
  if (view.kind === "new")
    return {
      path: "/new-arrivals",
      title: "New arrivals",
      intro: "The latest pieces to join the collection.",
    };
  if (view.kind === "sale")
    return {
      path: "/sale",
      title: "Sale",
      intro: "Reduced styles across every department, while sizes last.",
    };
  if (view.kind === "search")
    return { path: "/search", title: "Search", intro: "" };
  return {
    path: "/shop",
    title: "Shop all",
    intro: "Everything we have, ready to filter by size, colour and price.",
  };
}

function uniqueOptions(items: Listing[], key: string) {
  const seen = new Map<string, string>();
  for (const item of items)
    for (const option of optionList(item.details[key]))
      if (!seen.has(option.toLowerCase()))
        seen.set(option.toLowerCase(), option);
  return [...seen.values()];
}
function hasOption(item: Listing, key: string, selected: string) {
  return optionList(item.details[key]).some(
    (option) => option.toLowerCase() === selected.toLowerCase(),
  );
}

export function Catalogue({ view }: { view: View }) {
  const { listings, loading, error, retry } = useCatalogue();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const copy = viewCopy(view);
  const meta = routeMeta(copy.path);
  const get = (key: string) => params.get(key) || "";
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  const query = get("q").trim().toLowerCase();
  const base = useMemo(() => {
    let items = listings;
    if (view.kind === "department")
      items = items.filter((item) => item.category === view.id);
    if (view.kind === "sale")
      items = items.filter((item) => comparePrice(item) !== null);
    if (view.kind === "new")
      items = [...items]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 12);
    return items;
  }, [listings, view]);
  const types = uniqueOptions(base, "product_type");
  const sizes = uniqueOptions(base, "sizes");
  const colours = uniqueOptions(base, "colours");
  const items = base
    .filter(
      (item) =>
        (!query ||
          `${item.title} ${item.description} ${Object.values(item.details).join(" ")} ${categoryName(item.category)}`
            .toLowerCase()
            .includes(query)) &&
        (!get("department") || item.category === get("department")) &&
        (!get("type") || hasOption(item, "product_type", get("type"))) &&
        (!get("size") || hasOption(item, "sizes", get("size"))) &&
        (!get("colour") || hasOption(item, "colours", get("colour"))) &&
        (!get("stock") || isPurchasable(item)) &&
        (!get("max") ||
          (item.price !== null && item.price <= Number(get("max")))),
    )
    .sort((a, b) =>
      get("sort") === "price-asc"
        ? (a.price ?? Infinity) - (b.price ?? Infinity)
        : get("sort") === "price-desc"
          ? (b.price ?? -1) - (a.price ?? -1)
          : get("sort") === "name"
            ? a.title.localeCompare(b.title)
            : b.created_at.localeCompare(a.created_at),
    );
  const active = ["department", "type", "size", "colour", "max", "stock"].filter(
    (key) => get(key),
  );
  const chipLabel = (key: string) =>
    key === "max"
      ? `Under ${Number(get("max")).toLocaleString("en-NG")}`
      : key === "stock"
        ? "In stock"
        : key === "department"
          ? categoryName(get("department"))
          : get(key);
  const title =
    view.kind === "search"
      ? query
        ? `Results for “${get("q")}”`
        : "Search"
      : copy.title;
  const filters = (
    <div className="filters">
      {view.kind !== "department" && (
        <label>
          Department
          <select
            value={get("department")}
            onChange={(event) => update("department", event.target.value)}
          >
            <option value="">All departments</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {types.length > 0 && (
        <fieldset>
          <legend>Type</legend>
          <div className="chip-list">
            {types.map((type) => (
              <button
                key={type}
                type="button"
                className="chip"
                aria-pressed={get("type") === type}
                onClick={() => update("type", get("type") === type ? "" : type)}
              >
                {type}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {sizes.length > 0 && (
        <fieldset>
          <legend>Size</legend>
          <div className="chip-list">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                className="chip chip--size"
                aria-pressed={get("size") === size}
                onClick={() => update("size", get("size") === size ? "" : size)}
              >
                {size}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {colours.length > 0 && (
        <label>
          Colour
          <select
            value={get("colour")}
            onChange={(event) => update("colour", event.target.value)}
          >
            <option value="">All colours</option>
            {colours.map((colour) => (
              <option key={colour}>{colour}</option>
            ))}
          </select>
        </label>
      )}
      <label>
        Maximum price (₦)
        <input
          type="number"
          min="0"
          step="1000"
          inputMode="numeric"
          value={get("max")}
          onChange={(event) => update("max", event.target.value)}
        />
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={Boolean(get("stock"))}
          onChange={(event) => update("stock", event.target.checked ? "1" : "")}
        />
        In stock only
      </label>
    </div>
  );
  const crumbs = [
    { name: "Home", path: "/" },
    { name: copy.title, path: copy.path },
  ];
  return (
    <>
      <Seo
        title={meta?.title ?? `${title} | FASHYN`}
        description={meta?.description ?? `Search the FASHYN collection.`}
        image={copy.image}
        noindex={view.kind === "search"}
        jsonLd={
          view.kind === "search"
            ? undefined
            : [
                breadcrumbJsonLd(crumbs),
                {
                  "@context": "https://schema.org",
                  "@type": "CollectionPage",
                  name: meta?.title ?? title,
                  description: meta?.description,
                  url: absoluteUrl(copy.path),
                  mainEntity: {
                    "@type": "ItemList",
                    numberOfItems: base.length,
                    itemListElement: base.slice(0, 24).map((item, index) => ({
                      "@type": "ListItem",
                      position: index + 1,
                      url: absoluteUrl(`/product/${item.slug}`),
                      name: item.title,
                    })),
                  },
                },
              ]
        }
      />
      <header
        className={`page-banner${copy.image ? " page-banner--image" : ""}`}
      >
        {copy.image && <img src={copy.image} alt="" fetchPriority="high" />}
        <div className="container">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: copy.title }]}
          />
          <h1>{title}</h1>
          {copy.intro && <p>{copy.intro}</p>}
        </div>
      </header>
      <div className="catalogue container">
        <aside className="catalogue__filters" aria-label="Filters">
          <h2>Filter</h2>
          {filters}
        </aside>
        <div className="catalogue__main">
          <div className="catalogue__bar">
            <button
              className="button button--outline catalogue__filter-button"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal size={16} aria-hidden="true" /> Filters
              {active.length > 0 && ` (${active.length})`}
            </button>
            {view.kind === "search" && (
              <label className="catalogue__search">
                <span className="sr-only">Search products</span>
                <input
                  type="search"
                  placeholder="Search products"
                  value={get("q")}
                  onChange={(event) => update("q", event.target.value)}
                />
              </label>
            )}
            <p aria-live="polite">
              {loading
                ? "Loading…"
                : `${items.length} ${items.length === 1 ? "piece" : "pieces"}`}
            </p>
            <label className="catalogue__sort">
              Sort
              <select
                value={get("sort")}
                onChange={(event) => update("sort", event.target.value)}
              >
                <option value="">Newest</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>
          {active.length > 0 && (
            <div className="active-filters">
              {active.map((key) => (
                <button
                  key={key}
                  className="active-filter"
                  onClick={() => update(key, "")}
                  aria-label={`Remove filter ${chipLabel(key)}`}
                >
                  {chipLabel(key)} <X size={14} aria-hidden="true" />
                </button>
              ))}
              <button
                className="text-link"
                onClick={() =>
                  setParams(
                    query ? { q: get("q") } : {},
                    { replace: true },
                  )
                }
              >
                Clear all
              </button>
            </div>
          )}
          {loading ? (
            <ProductSkeleton count={8} />
          ) : error ? (
            <div className="notice" role="alert">
              <p>{error}</p>
              <button className="button button--outline" onClick={retry}>
                Try again
              </button>
            </div>
          ) : items.length ? (
            <div className="product-grid product-grid--catalogue">
              {items.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="notice">
              <h2>
                {base.length && (active.length || query)
                  ? "Nothing matches just yet."
                  : view.kind === "sale"
                    ? "No sale pieces right now."
                    : "New pieces are on the way."}
              </h2>
              <p>
                {base.length && (active.length || query)
                  ? "Try removing a filter or searching for something else."
                  : "Take a look at the rest of the collection or ask us what is coming."}
              </p>
              <Link className="button button--indigo" to="/shop">
                Browse everything
              </Link>
            </div>
          )}
        </div>
      </div>
      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        side="left"
        footer={
          <button
            className="button button--indigo button--full"
            onClick={() => setFiltersOpen(false)}
          >
            Show {items.length} {items.length === 1 ? "piece" : "pieces"}
          </button>
        }
      >
        {filters}
      </Drawer>
    </>
  );
}
