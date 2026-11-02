import { Link, useParams, useSearchParams } from "react-router-dom";
import { journalName, type Article } from "../../../data/marketplace";
import { useCatalogue } from "../../../store/catalogue";
import { absoluteUrl, breadcrumbJsonLd, Seo } from "../../../seo/Seo";
import { routeMeta } from "../../../seo/routes";
import { Breadcrumbs, Reveal } from "../components/Primitives";
import { ArticleCard } from "../components/ProductCard";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function Journal() {
  const { articles, loading, error, retry } = useCatalogue();
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const meta = routeMeta("/journal")!;
  const topics = Array.from(
    new Set(articles.map((article) => article.category).filter(Boolean)),
  );
  const items = articles.filter(
    (article) => !category || article.category === category,
  );
  return (
    <>
      <Seo title={meta.title} description={meta.description} />
      <header className="page-banner">
        <div className="container">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Journal" }]}
          />
          <h1>{journalName}</h1>
          <p>Style notes, colour ideas and practical care for what you wear.</p>
        </div>
      </header>
      <section className="section container">
        {topics.length > 1 && (
          <div className="chip-list journal-topics">
            <button
              className="chip"
              aria-pressed={!category}
              onClick={() => setParams({})}
            >
              All
            </button>
            {topics.map((topic) => (
              <button
                key={topic}
                className="chip"
                aria-pressed={category === topic}
                onClick={() => setParams({ category: topic })}
              >
                {topic}
              </button>
            ))}
          </div>
        )}
        {loading ? (
          <p role="status">Loading articles…</p>
        ) : error ? (
          <div className="notice" role="alert">
            <p>{error}</p>
            <button className="button button--outline" onClick={retry}>
              Try again
            </button>
          </div>
        ) : items.length ? (
          <div className="article-grid">
            {items.map((article) => (
              <ArticleCard key={article.id} item={article} />
            ))}
          </div>
        ) : (
          <div className="notice">
            <h2>No articles yet.</h2>
            <p>New writing will appear here soon.</p>
          </div>
        )}
      </section>
    </>
  );
}

export function ArticleBody({ item }: { item: Article }) {
  return (
    <article className="article">
      <span className="eyebrow">{item.category || "Journal"}</span>
      <h1>{item.title}</h1>
      {item.published_at && (
        <time dateTime={item.published_at}>{formatDate(item.published_at)}</time>
      )}
      {item.cover_url && (
        <img
          className="article__cover"
          src={item.cover_url}
          alt={item.cover_alt || item.title}
        />
      )}
      <div className="article__body">
        {item.body.split(/\n\s*\n/).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}

export function JournalArticle() {
  const { slug } = useParams();
  const { articles, loading, error, retry } = useCatalogue();
  const item = articles.find((article) => article.slug === slug);
  if (loading)
    return (
      <p role="status" className="page-status container">
        Loading article…
      </p>
    );
  if (error)
    return (
      <div className="notice container page-status" role="alert">
        <p>{error}</p>
        <button className="button button--outline" onClick={retry}>
          Try again
        </button>
      </div>
    );
  if (!item)
    return (
      <div className="notice container page-status">
        <Seo
          title="Article not found | FASHYN"
          description="This article is not available."
          noindex
        />
        <h1>Article not found.</h1>
        <p>This article is not available.</p>
        <Link className="button button--indigo" to="/journal">
          Back to the Journal
        </Link>
      </div>
    );
  return (
    <Reveal className="container article-page">
      <Seo
        title={`${item.title} | ${journalName}`}
        description={item.body.replace(/\s+/g, " ").slice(0, 155)}
        image={item.cover_url}
        type="article"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: item.title,
            articleSection: item.category || undefined,
            datePublished: item.published_at || undefined,
            dateModified: item.updated_at,
            image: item.cover_url ? absoluteUrl(item.cover_url) : undefined,
            mainEntityOfPage: absoluteUrl(`/journal/${item.slug}`),
            author: { "@type": "Organization", name: "FASHYN" },
            publisher: {
              "@type": "Organization",
              name: "FASHYN",
              logo: {
                "@type": "ImageObject",
                url: absoluteUrl("/brand/icon-512.png"),
              },
            },
          },
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Journal", path: "/journal" },
            { name: item.title, path: `/journal/${item.slug}` },
          ]),
        ]}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Journal", href: "/journal" },
          { label: item.title },
        ]}
      />
      <ArticleBody item={item} />
    </Reveal>
  );
}
