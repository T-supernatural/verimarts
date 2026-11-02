import { Link } from "react-router-dom";
import { ArrowUpRight, MessageCircle, Ruler, ShieldCheck } from "lucide-react";
import { business } from "../../../config/business";
import { categories, comparePrice } from "../../../data/marketplace";
import { useCatalogue } from "../../../store/catalogue";
import { Chevron, ProductSkeleton, Reveal } from "../components/Primitives";
import { ArticleCard, ProductCard } from "../components/ProductCard";
import { organizationJsonLd, Seo, websiteJsonLd } from "../../../seo/Seo";
import { routeMeta } from "../../../seo/routes";

const words = [
  "New season",
  "Occasionwear",
  "Everyday essentials",
  "Tailoring",
  "Childrenswear",
  "Accessories",
];
const promises = [
  {
    icon: MessageCircle,
    title: "Order by chat",
    body: "Send your bag on WhatsApp and talk to a real person.",
  },
  {
    icon: Ruler,
    title: "Help with fit",
    body: "Not sure about a size? Ask us before you decide.",
  },
  {
    icon: ShieldCheck,
    title: "Confirm before you pay",
    body: "We check availability and delivery with you first.",
  },
];

export function Home() {
  const { listings, articles, loading, error, retry } = useCatalogue();
  const meta = routeMeta("/")!;
  const featured = listings.filter((item) => item.featured).slice(0, 4);
  const showcase = (featured.length ? featured : listings).slice(0, 4);
  const newest = [...listings]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .filter((item) => !showcase.includes(item))
    .slice(0, 8);
  const reduced = listings.filter((item) => comparePrice(item) !== null);
  return (
    <>
      <Seo
        title={meta.title}
        description={meta.description}
        jsonLd={[organizationJsonLd(), websiteJsonLd()]}
      />
      <section className="hero">
        <div className="hero__copy">
          <span className="eyebrow eyebrow--marigold">New season at FASHYN</span>
          <h1>
            Modern style.
            <em>Thoughtfully chosen.</em>
          </h1>
          <p>
            Clothing and accessories for women, men and children, picked to feel
            like you from the first wear.
          </p>
          <div className="hero__actions">
            <Link className="button button--marigold" to="/shop">
              Shop the collection <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
            <Link className="button button--ghost" to="/new-arrivals">
              See what's new
            </Link>
          </div>
        </div>
        <div className="hero__media">
          <span className="hero__block" aria-hidden="true" />
          <Chevron className="hero__chevron" />
          <img
            className="hero__main"
            src="/media/editorial/hero-main.webp"
            alt="A woman in a white tee with natural curls, photographed among autumn leaves"
            width="1200"
            height="1500"
            fetchPriority="high"
          />
          <img
            className="hero__side"
            src="/media/editorial/hero-side.webp"
            alt="A woman wearing an oversized apricot shirt and blue jeans"
            width="1200"
            height="1500"
          />
        </div>
      </section>
      <div className="ticker" aria-hidden="true">
        <div className="ticker__track">
          {[0, 1].map((copy) => (
            <span key={copy}>
              {words.map((word) => (
                <span key={word}>
                  {word}
                  <Chevron />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
      <Reveal className="section container">
        <div className="section-head">
          <div>
            <span className="eyebrow">Shop by department</span>
            <h2>Find your signature.</h2>
          </div>
          <Link className="text-link" to="/shop">
            View everything <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <div className="departments">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/${category.id}`}
              className="department"
            >
              <img src={category.image} alt="" loading="lazy" decoding="async" />
              <span className="department__label">
                <strong>{category.name}</strong>
                <ArrowUpRight size={20} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </Reveal>
      <Reveal className="section container">
        <div className="section-head">
          <div>
            <span className="eyebrow">Handpicked</span>
            <h2>The edit.</h2>
          </div>
          <Link className="text-link" to="/shop">
            Shop all <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
        {loading ? (
          <ProductSkeleton />
        ) : error ? (
          <div className="notice" role="alert">
            <p>{error}</p>
            <button className="button button--outline" onClick={retry}>
              Try again
            </button>
          </div>
        ) : showcase.length ? (
          <div className="product-grid">
            {showcase.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="notice">
            The new collection is on its way. Check back soon, or{" "}
            <Link to="/contact">talk to us</Link>.
          </p>
        )}
      </Reveal>
      <Reveal className="story">
        <div className="story__image">
          <img
            src="/media/editorial/print.webp"
            alt="A hand reaching for a richly patterned garment on a rail"
            loading="lazy"
          />
        </div>
        <div className="story__copy">
          <Chevron />
          <span className="eyebrow eyebrow--ink">Our point of view</span>
          <h2>Style, with intention.</h2>
          <p>
            We believe clothes should earn their place. So we choose pieces with
            colour, character and shape, then help you find the one that fits
            your life.
          </p>
          <Link className="button button--indigo" to="/about">
            About FASHYN <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </Reveal>
      {newest.length > 0 && (
        <Reveal className="section container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Just landed</span>
              <h2>New arrivals.</h2>
            </div>
            <Link className="text-link" to="/new-arrivals">
              All new pieces <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="product-rail" tabIndex={0} aria-label="New arrivals">
            {newest.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        </Reveal>
      )}
      {reduced.length > 0 && (
        <Reveal className="sale-band">
          <div className="container sale-band__inner">
            <div>
              <span className="eyebrow eyebrow--light">Reduced for now</span>
              <h2>The sale edit.</h2>
              <p>{reduced.length} pieces at a lower price, while sizes last.</p>
            </div>
            <Link className="button button--light" to="/sale">
              Shop the sale <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </Reveal>
      )}
      <Reveal className="section container promises">
        {promises.map(({ icon: Icon, title, body }) => (
          <div key={title} className="promise">
            <Icon size={24} aria-hidden="true" />
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        ))}
      </Reveal>
      {articles.length > 0 && (
        <Reveal className="section container">
          <div className="section-head">
            <div>
              <span className="eyebrow">The Journal</span>
              <h2>Notes on getting dressed.</h2>
            </div>
            <Link className="text-link" to="/journal">
              Read more <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="article-grid">
            {articles.slice(0, 3).map((article) => (
              <ArticleCard key={article.id} item={article} />
            ))}
          </div>
        </Reveal>
      )}
      <ContactBand />
    </>
  );
}

export function ContactBand() {
  return (
    <Reveal className="contact-band">
      <div className="container contact-band__inner">
        <h2>See something you like?</h2>
        <p>
          Message us with the piece you have in mind. {business.name} will take
          it from there.
        </p>
        <Link className="button button--marigold" to="/contact">
          Talk to us <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </Reveal>
  );
}
