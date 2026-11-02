import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Archive,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Newspaper,
  Plus,
  Shirt,
} from "lucide-react";
import { Logo } from "../brand/Logo";
import { supabase, requireBackend } from "../lib/supabase";
import {
  archivedCategories,
  availabilityLabels,
  categories,
  categoryName,
  coverOf,
  isFashion,
  journalName,
  listingPrice,
} from "../data/marketplace";
import type { Availability, Listing, Article } from "../data/marketplace";
import { contentRepository } from "../data/contentRepository";
import {
  newArticle,
  newListing,
  ListingEditor,
  ArticleEditor,
  PreviewDialog,
} from "./Editors";
import { ProductDetails } from "../features/shop/pages/Product";
import { ArticleBody } from "../features/shop/pages/Journal";
import "../styles/store.css";
import "../styles/portal.css";

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The request could not be completed.";
}
function LoginFrame({ children }: { children: ReactNode }) {
  return (
    <div className="portal-login">
      <aside className="portal-login__brand">
        <Logo />
        <h2>
          Run your store.
          <em>Dress the moment.</em>
        </h2>
        <span className="portal-login__stripes" aria-hidden="true">
          <i />
          <i />
        </span>
      </aside>
      <main className="portal-login__form">{children}</main>
    </div>
  );
}
export default function Portal() {
  const [session, setSession] = useState<Session | null>(null);
  const [access, setAccess] = useState<
    "checking" | "signed-out" | "owner" | "denied"
  >("checking");
  const [recovery, setRecovery] = useState(
    window.location.pathname.endsWith("/reset-password") ||
      window.location.hash.includes("type=recovery"),
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    document.title = "Owner portal | FASHYN";
    document.querySelector('meta[name="robots"]')?.remove();
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.append(meta);
    return () => meta.remove();
  }, []);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let version = 0;
    const client = supabase;
    const receive = (next: Session | null) => {
      const sequence = ++version;
      setSession(next);
      if (!next) {
        setAccess("signed-out");
        return;
      }
      setAccess("checking");
      setTimeout(() => {
        void client.rpc("is_owner").then(({ data, error }) => {
          if (active && sequence === version) {
            setAccess(!error && data === true ? "owner" : "denied");
            if (error)
              setError(
                "Owner authorization could not be verified. Try signing in again.",
              );
          }
        });
      }, 0);
    };
    void client.auth.getSession().then(({ data, error }) => {
      if (active) {
        receive(data.session);
        if (error) setError(error.message);
      }
    });
    const { data } = client.auth.onAuthStateChange((event, next) => {
      if (active) {
        if (event === "PASSWORD_RECOVERY") setRecovery(true);
        receive(next);
      }
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  async function signIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { error } = await requireBackend().auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setPassword("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function reset() {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter your owner email address first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const prefix = window.location.pathname.startsWith("/portal")
        ? "/portal"
        : "";
      const { error } = await requireBackend().auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}${prefix}/reset-password` },
      );
      if (error) throw error;
      setNotice(
        "If this account is eligible, a password-reset email will arrive.",
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function updatePassword(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error } = await requireBackend().auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setRecovery(false);
      setNotice("Password updated.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setError("");
    const { error } = await requireBackend().auth.signOut();
    if (error) setError(error.message);
    else {
      setRecovery(false);
      setPassword("");
    }
  }
  const messages = (
    <>
      {error && (
        <p className="form-error portal-alert" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="portal-alert" role="status">
          {notice}
        </p>
      )}
    </>
  );
  if (session && access === "owner" && !recovery)
    return (
      <div className="portal">
        <OwnerWorkspace onLogout={() => void logout()} />
        {messages}
      </div>
    );
  return (
    <div className="portal">
      <LoginFrame>
        {!supabase ? (
          <div className="owner-login">
            <h1>Owner portal setup required</h1>
            <p>
              Configure the Supabase URL and publishable key, apply the
              migrations, disable public sign-ups, and provision the single
              owner account. See SETUP.md in this repository.
            </p>
          </div>
        ) : access === "checking" ? (
          <p role="status">Verifying owner access…</p>
        ) : access === "signed-out" ? (
          <div className="owner-login">
            <span className="eyebrow">Owner access only</span>
            <h1>Sign in to FASHYN.</h1>
            <p>Manage your products, prices and Journal.</p>
            <form className="owner-form" onSubmit={signIn}>
              <label>
                Owner email
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <button disabled={busy} className="button button--indigo">
                {busy ? "Signing in…" : "Sign in"}
              </button>
              <button
                type="button"
                disabled={busy}
                className="text-link"
                onClick={() => void reset()}
              >
                Reset password
              </button>
            </form>
            <p>
              Accounts are created privately by the business owner. Public
              sign-up is not available.
            </p>
          </div>
        ) : access === "denied" ? (
          <div className="owner-login" role="alert">
            <h1>Owner access required</h1>
            <p>This account is not authorized to manage FASHYN.</p>
            <button
              className="button button--outline"
              onClick={() => void logout()}
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="owner-login">
            <h1>Set your new password.</h1>
            <form className="owner-form" onSubmit={updatePassword}>
              <label>
                New password
                <input
                  type="password"
                  minLength={12}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <button className="button button--indigo" disabled={busy}>
                Update password
              </button>
            </form>
          </div>
        )}
        {messages}
      </LoginFrame>
    </div>
  );
}
type Tab = "dashboard" | "products" | "journal" | "archive";

function OwnerWorkspace({ onLogout }: { onLogout: () => void }) {
  const [starterNotice, setStarterNotice] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [listings, setListings] = useState<Listing[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [editListing, setEditListing] = useState<Listing | null>(null);
  const [editArticle, setEditArticle] = useState<Article | null>(null);
  const [preview, setPreview] = useState<Listing | Article | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([
      contentRepository.listings(true),
      contentRepository.articles(true),
    ])
      .then(([items, writing]) => {
        if (active) {
          setListings(items);
          setArticles(writing);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  const refresh = () => setAttempt((n) => n + 1);
  const done = () => {
    setEditListing(null);
    setEditArticle(null);
    refresh();
  };
  async function action(operation: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await operation();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
      refresh();
    }
  }
  function go(next: Tab) {
    setTab(next);
    setEditListing(null);
    setEditArticle(null);
    setQuery("");
    setCategory("");
    setStatus("");
  }
  const products = useMemo(
    () => listings.filter((item) => isFashion(item.category)),
    [listings],
  );
  const archived = useMemo(
    () => listings.filter((item) => !isFashion(item.category)),
    [listings],
  );
  const pool = tab === "archive" ? archived : products;
  const filtered = pool.filter(
    (i) =>
      i.title.toLowerCase().includes(query.toLowerCase()) &&
      (!category || i.category === category) &&
      (!status || i.status === status),
  );
  const writing = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) &&
      (!status || a.status === status),
  );
  const published = products.filter((i) => i.status === "published");
  const needsAttention = products.flatMap((item) => {
    const problems = [
      !item.images.length && "Add a photo",
      item.price === null && !item.price_label && "Add a price",
      !item.details.sizes && "Add sizes",
      item.status === "draft" && "Not published yet",
    ].filter(Boolean) as string[];
    return problems.length ? [{ item, problems }] : [];
  });
  const nav: {
    id: Tab;
    label: string;
    icon: typeof Shirt;
    count?: number;
  }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Shirt, count: products.length },
    {
      id: "journal",
      label: "Journal",
      icon: Newspaper,
      count: articles.length,
    },
    ...(archived.length
      ? [
          {
            id: "archive" as const,
            label: "Archive",
            icon: Archive,
            count: archived.length,
          },
        ]
      : []),
  ];
  const storefront = import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined;
  const heading = (title: string, sub: string, actions?: ReactNode) => (
    <div className="workspace__head">
      <div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      {actions && <div className="workspace__actions">{actions}</div>}
    </div>
  );
  const addProduct = (
    <button
      className="button button--indigo"
      onClick={() => {
        setTab("products");
        setEditListing(newListing());
      }}
    >
      <Plus size={17} aria-hidden="true" /> Add product
    </button>
  );
  const addArticle = (
    <button
      className="button button--outline"
      onClick={() => {
        setTab("journal");
        setEditArticle(newArticle());
      }}
    >
      Write article
    </button>
  );
  return (
    <div className="workspace">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <Logo />
          <small>OWNER PORTAL</small>
        </div>
        <nav aria-label="Owner navigation">
          {nav.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => go(id)}
            >
              <Icon size={18} aria-hidden="true" /> {label}
              {count !== undefined && (
                <span className="sidebar__count">{count}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar__footer">
          {storefront && (
            <a href={storefront} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={16} aria-hidden="true" /> View store
            </a>
          )}
          <button onClick={onLogout}>
            <LogOut size={16} aria-hidden="true" /> Log out
          </button>
        </div>
      </aside>
      <main className="workspace__main">
        {loading ? (
          <p role="status">Loading your store…</p>
        ) : editListing ? (
          <ListingEditor
            key={editListing.id}
            initial={editListing}
            onDone={done}
          />
        ) : editArticle ? (
          <ArticleEditor
            key={editArticle.id}
            initial={editArticle}
            onDone={done}
          />
        ) : tab === "dashboard" ? (
          <>
            {heading(
              "Your FASHYN store.",
              "A quick view of what shoppers can see and what needs your attention.",
              <>
                {addProduct}
                {addArticle}
              </>,
            )}
            <div className="stat-grid">
              {(
                [
                  ["Live products", published.length],
                  ["Draft products", products.length - published.length],
                  [
                    "Out of stock / sold",
                    products.filter((i) =>
                      ["unavailable", "sold"].includes(i.availability),
                    ).length,
                  ],
                  [
                    "Journal drafts",
                    articles.filter((a) => a.status === "draft").length,
                  ],
                ] as const
              ).map(([label, count]) => (
                <div className="stat" key={label}>
                  <span>{label}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
            {!products.length && (
              <div className="panel panel--starter">
                <h2>Start with a sample range</h2>
                <p>
                  Add 26 sample products and 3 Journal articles so you can see
                  the store fully dressed. They use stock photos, invented names
                  and placeholder prices, and go live immediately. Replace them
                  with your real products before you start selling.
                </p>
                <button
                  className="button button--indigo"
                  disabled={busy}
                  onClick={() => {
                    if (
                      !window.confirm(
                        "Publish the sample range with stock photos and placeholder prices? Your existing records will not be changed.",
                      )
                    )
                      return;
                    setStarterNotice("");
                    void action(async () => {
                      const added =
                        await contentRepository.addStarterCatalogue();
                      setStarterNotice(`${added} sample entries added.`);
                    });
                  }}
                >
                  {busy ? "Working…" : "Add sample range"}
                </button>
              </div>
            )}
            {starterNotice && <p role="status">{starterNotice}</p>}
            <div className="dashboard-columns">
              <section className="panel">
                <h2>Needs attention</h2>
                {needsAttention.length ? (
                  <ul className="attention">
                    {needsAttention.slice(0, 6).map(({ item, problems }) => (
                      <li key={item.id}>
                        <span>
                          {item.title}
                          <small>{problems.join(" · ")}</small>
                        </span>
                        <button
                          className="button button--outline button--small"
                          onClick={() => {
                            setTab("products");
                            setEditListing(item);
                          }}
                        >
                          Fix
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Everything looks complete. Nice work.</p>
                )}
              </section>
              <section className="panel">
                <h2>Live products by department</h2>
                <ul className="department-counts">
                  {categories.map((department) => (
                    <li key={department.id}>
                      <span>{department.name}</span>
                      <strong>
                        {
                          published.filter(
                            (item) => item.category === department.id,
                          ).length
                        }
                      </strong>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        ) : tab === "journal" ? (
          <>
            {heading(
              journalName,
              "Style notes and stories for your shoppers.",
              <button
                className="button button--indigo"
                onClick={() => setEditArticle(newArticle())}
              >
                <Plus size={17} aria-hidden="true" /> Write article
              </button>,
            )}
            <div className="toolbar">
              <label>
                Search articles
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <StatusFilter value={status} onChange={setStatus} />
            </div>
            {writing.length ? (
              <div className="owner-records">
                {writing.map((item) => (
                  <article key={item.id} className="owner-record">
                    {item.cover_url ? (
                      <img
                        className="owner-record__thumb"
                        src={item.cover_url}
                        alt=""
                      />
                    ) : (
                      <span className="owner-record__thumb" />
                    )}
                    <div>
                      <h2>{item.title}</h2>
                      <p className="owner-record__meta">
                        <span>{item.category || "Journal"}</span>
                        <span className={`status status--${item.status}`}>
                          {item.status}
                        </span>
                      </p>
                    </div>
                    <div className="owner-record__actions">
                      <button
                        className="button button--outline button--small"
                        onClick={() => setEditArticle(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="button button--outline button--small"
                        onClick={() => setPreview(item)}
                      >
                        Preview
                      </button>
                      <button
                        className="button button--outline button--small"
                        disabled={busy}
                        onClick={() =>
                          void action(() =>
                            contentRepository.changeArticle(
                              item.id,
                              item.status === "published"
                                ? "draft"
                                : "published",
                            ),
                          )
                        }
                      >
                        {item.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        className="button button--danger button--small"
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete “${item.title}” permanently? This cannot be undone.`,
                            )
                          )
                            void action(() =>
                              contentRepository.removeArticle(item),
                            );
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="portal-empty">
                <h2>No matching articles.</h2>
                <p>Write your first article or adjust the filters.</p>
              </div>
            )}
          </>
        ) : (
          <>
            {tab === "archive"
              ? heading(
                  "Archive",
                  "Records from before FASHYN became a clothing store.",
                )
              : heading(
                  "Products",
                  "Everything in your clothing catalogue.",
                  <button
                    className="button button--indigo"
                    onClick={() =>
                      setEditListing({
                        ...newListing(),
                        ...(category
                          ? { category: category as Listing["category"] }
                          : {}),
                      })
                    }
                  >
                    <Plus size={17} aria-hidden="true" /> Add product
                  </button>,
                )}
            {tab === "archive" && (
              <p className="archive-note">
                These never appear on the storefront, whatever their status.
                Keep them for reference or delete them when you no longer need
                them.
              </p>
            )}
            <div className="toolbar">
              <label>
                Search {tab === "archive" ? "archive" : "products"}
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <label>
                {tab === "archive" ? "Old category" : "Department"}
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">All</option>
                  {(tab === "archive" ? archivedCategories : categories).map(
                    (c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <StatusFilter value={status} onChange={setStatus} />
            </div>
            {filtered.length ? (
              <div className="owner-records">
                {filtered.map((item) => {
                  const cover = coverOf(item);
                  return (
                    <article key={item.id} className="owner-record">
                      {cover?.url && cover.media_type !== "video" ? (
                        <img
                          className="owner-record__thumb"
                          src={cover.url}
                          alt=""
                          loading="lazy"
                        />
                      ) : (
                        <span className="owner-record__thumb" />
                      )}
                      <div>
                        <h2>{item.title}</h2>
                        <p className="owner-record__meta">
                          <span>{categoryName(item.category)}</span>
                          <span>{listingPrice(item)}</span>
                          <span className={`status status--${item.status}`}>
                            {item.status}
                          </span>
                        </p>
                      </div>
                      <div className="owner-record__actions">
                        <button
                          className="button button--outline button--small"
                          disabled={busy}
                          onClick={() => setEditListing(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="button button--outline button--small"
                          onClick={() => setPreview(item)}
                        >
                          Preview
                        </button>
                        <button
                          className="button button--outline button--small"
                          disabled={busy}
                          onClick={() =>
                            void action(() =>
                              contentRepository.changeListing(item.id, {
                                status:
                                  item.status === "published"
                                    ? "draft"
                                    : "published",
                              }),
                            )
                          }
                        >
                          {item.status === "published"
                            ? "Unpublish"
                            : "Publish"}
                        </button>
                        <label>
                          Availability for {item.title}
                          <select
                            disabled={busy}
                            value={item.availability}
                            onChange={(e) =>
                              void action(() =>
                                contentRepository.changeListing(item.id, {
                                  availability: e.target.value,
                                }),
                              )
                            }
                          >
                            {(
                              Object.keys(availabilityLabels) as Availability[]
                            ).map((value) => (
                              <option key={value} value={value}>
                                {availabilityLabels[value]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          className="button button--danger button--small"
                          disabled={busy}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete “${item.title}” permanently? This cannot be undone.`,
                              )
                            )
                              void action(() =>
                                contentRepository.removeListing(item),
                              );
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="portal-empty">
                <h2>No matching products.</h2>
                <p>Add your first product or adjust the filters.</p>
              </div>
            )}
          </>
        )}
        {error && (
          <div className="form-error" role="alert">
            <p>{error}</p>
            <button
              className="button button--outline button--small"
              onClick={refresh}
            >
              Retry loading
            </button>
          </div>
        )}
      </main>
      {preview && (
        <PreviewDialog onClose={() => setPreview(null)}>
          {"body" in preview ? (
            <ArticleBody item={preview} />
          ) : (
            <ProductDetails item={preview} preview />
          )}
        </PreviewDialog>
      )}
    </div>
  );
}
function StatusFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      Publication status
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All statuses</option>
        <option value="draft">Draft</option>
        <option value="published">Published</option>
      </select>
    </label>
  );
}
