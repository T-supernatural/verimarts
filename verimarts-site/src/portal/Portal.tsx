import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, requireBackend } from "../lib/supabase";
import { categories, journalName } from "../data/marketplace";
import type { Listing, Article } from "../data/marketplace";
import { contentRepository } from "../data/contentRepository";
import {
  newArticle,
  newListing,
  ListingEditor,
  ArticleEditor,
  PreviewDialog,
} from "./Editors";
import { ListingPreview, ArticlePreview } from "../marketplace/Public";
import { FarmEditor } from "./FarmEditor";
function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The request could not be completed.";
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
  return (
    <div className="portal">
      <header className="portal-header">
        <img src="/assets/fashyn-wordmark.png" alt="FASHYN" />
        <span>PRIVATE STORE PORTAL</span>
        {session && (
          <button className="button secondary" onClick={() => void logout()}>
            Log out
          </button>
        )}
      </header>
      <main className="portal-main">
        {!supabase ? (
          <div className="content-pending">
            <h1>Owner portal setup required</h1>
            <p>
              Configure the Supabase URL and publishable key, apply the
              migrations, disable public sign-ups, and provision the single
              owner account. See the setup guide in this repository.
            </p>
          </div>
        ) : access === "checking" ? (
          <p role="status">Verifying owner access…</p>
        ) : access === "signed-out" ? (
          <div className="owner-login">
            <span className="eyebrow red-text">OWNER ACCESS ONLY</span>
            <h1>Sign in to FASHYN.</h1>
            <p className="muted">Manage the collection and published writing.</p>
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
              <div className="actions">
                <button disabled={busy} className="button primary">
                  {busy ? "Signing in…" : "Sign in"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="button secondary"
                  onClick={() => void reset()}
                >
                  Reset password
                </button>
              </div>
            </form>
            <p className="small muted">
              Accounts are created privately by the business owner. Public
              sign-up is not available.
            </p>
          </div>
        ) : access === "denied" ? (
          <div className="content-pending" role="alert">
            <h1>Owner access required</h1>
            <p>This account is not authorized to manage FASHYN.</p>
            <button className="button secondary" onClick={() => void logout()}>
              Sign out
            </button>
          </div>
        ) : recovery ? (
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
              <button className="button primary" disabled={busy}>
                Update password
              </button>
            </form>
          </div>
        ) : (
          <OwnerWorkspace />
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
      </main>
    </div>
  );
}
function OwnerWorkspace() {
  const [demoNotice, setDemoNotice] = useState("");
  const [tab, setTab] = useState<"dashboard" | "listings" | "journal" | "farm">(
    "dashboard",
  );
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
  const filtered = listings.filter(
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
  return (
    <>
      <nav className="portal-nav" aria-label="Owner navigation">
        {(["dashboard", "listings", "journal", "farm"] as const).map((name) => (
          <button
            key={name}
            aria-current={tab === name ? "page" : undefined}
            className="button secondary"
            onClick={() => {
              setTab(name);
              setEditListing(null);
              setEditArticle(null);
              setQuery("");
              setCategory("");
              setStatus("");
            }}
          >
            {name === "farm"
              ? "Livelong Farm"
              : name === "journal"
                ? journalName
                : name[0].toUpperCase() + name.slice(1)}
          </button>
        ))}
        <button
          className="button secondary"
          onClick={() => {
            setTab("listings");
            setCategory("paint-production");
            setQuery("");
            setStatus("");
            setEditListing(null);
            setEditArticle(null);
          }}
        >
          Paint Production
        </button>
      </nav>
      {loading ? (
        <p role="status">Loading owner content…</p>
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
      ) : tab === "farm" ? (
        <FarmEditor
          onManage={() => {
            setTab("listings");
            setCategory("livelong-farm");
            setQuery("");
            setStatus("");
          }}
        />
      ) : tab === "dashboard" ? (
        <>
          <div className="page-heading">
            <span className="eyebrow red-text">SINGLE-OWNER WORKSPACE</span>
            <h1>Your FASHYN catalogue.</h1>
          </div>
          <div className="content-pending">
            <h2>Handover catalogue</h2>
            <p>
              Add or update 32 listings with illustrative images and NGN prices,
              plus 10 Journal articles. Placeholder prices are for the handover;
              replace them with confirmed client details. Existing owner edits
              are kept.
            </p>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => {
                if (
                  !window.confirm(
                    "Publish or update the handover catalogue with illustrative images and placeholder NGN prices? Existing owner edits will be kept.",
                  )
                )
                  return;
                setDemoNotice("");
                void action(async () => {
                  const added = await contentRepository.addDemoContent();
                  setDemoNotice(
                    added
                      ? `${added} entries added or updated.`
                      : "Catalogue entries already exist. Existing content was kept.",
                  );
                });
              }}
            >
              {busy ? "Working…" : "Add / update handover content"}
            </button>
            {demoNotice && <p role="status">{demoNotice}</p>}
          </div>
          <div className="dashboard-grid">
            {[
              [
                "Published listings",
                listings.filter((i) => i.status === "published").length,
              ],
              [
                "Draft listings",
                listings.filter((i) => i.status === "draft").length,
              ],
              [
                "Unavailable / sold",
                listings.filter((i) =>
                  ["unavailable", "sold"].includes(i.availability),
                ).length,
              ],
              [
                "Writing drafts",
                articles.filter((a) => a.status === "draft").length,
              ],
            ].map(([label, count]) => (
              <div className="dashboard-stat" key={label}>
                <span>{label}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
          <div className="actions">
            <button
              className="button primary"
              onClick={() => {
                setTab("listings");
                setEditListing(newListing());
              }}
            >
              Create listing
            </button>
            <button
              className="button secondary"
              onClick={() => {
                setTab("journal");
                setEditArticle(newArticle());
              }}
            >
              Write article
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="section-heading">
            <h1>{tab === "listings" ? "Listings" : journalName}</h1>
            <button
              className="button primary"
              onClick={() =>
                tab === "listings"
                  ? setEditListing({
                      ...newListing(),
                      ...(category
                        ? { category: category as Listing["category"] }
                        : {}),
                    })
                  : setEditArticle(newArticle())
              }
            >
              {tab === "listings" ? "Create listing" : "Write article"}
            </button>
          </div>
          <div className="market-toolbar">
            <label>
              Search owner content
              <input value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            {tab === "listings" && (
              <label>
                Filter category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Publication status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>
          <div className="owner-records">
            {tab === "listings"
              ? filtered.map((item) => (
                  <article key={item.id} className="owner-record">
                    <div>
                      <h2>{item.title}</h2>
                      <p className="small muted">
                        {categories.find((c) => c.id === item.category)?.name} ·{" "}
                        {item.status} · {item.availability}
                      </p>
                    </div>
                    <div className="actions">
                      <button
                        className="button secondary"
                        disabled={busy}
                        onClick={() => setEditListing(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="button secondary"
                        onClick={() => setPreview(item)}
                      >
                        Preview
                      </button>
                      <button
                        className="button secondary"
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
                        {item.status === "published" ? "Unpublish" : "Publish"}
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
                          <option value="not-provided">Not provided</option>
                          <option value="available">Available</option>
                          <option value="unavailable">Unavailable</option>
                          <option value="sold">Sold</option>
                        </select>
                      </label>
                      <button
                        className="button danger"
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
                ))
              : writing.map((item) => (
                  <article key={item.id} className="owner-record">
                    <div>
                      <h2>{item.title}</h2>
                      <p className="small muted">
                        {item.category || "Journal"} · {item.status}
                      </p>
                    </div>
                    <div className="actions">
                      <button
                        className="button secondary"
                        onClick={() => setEditArticle(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="button secondary"
                        onClick={() => setPreview(item)}
                      >
                        Preview
                      </button>
                      <button
                        className="button secondary"
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
                        className="button danger"
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
          {!(tab === "listings" ? filtered.length : writing.length) && (
            <div className="empty-state">
              <h2>No matching content.</h2>
              <p>
                Create your first {tab === "listings" ? "listing" : "article"}{" "}
                or adjust the filters.
              </p>
            </div>
          )}
        </>
      )}
      {error && (
        <div className="form-error" role="alert">
          <p>{error}</p>
          <button className="button secondary" onClick={refresh}>
            Retry loading
          </button>
        </div>
      )}
      {preview && (
        <PreviewDialog onClose={() => setPreview(null)}>
          {"body" in preview ? (
            <ArticlePreview item={preview} />
          ) : (
            <ListingPreview item={preview} />
          )}
        </PreviewDialog>
      )}
    </>
  );
}
