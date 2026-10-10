import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sprout, Fish, ArrowUpRight } from "lucide-react";
import { Reveal } from "../Motion";
import { contentRepository } from "../data/contentRepository";
import type { FarmProfile } from "../data/farm";
import type { Listing } from "../data/marketplace";
import { farmWhatsapp, farmWebsite } from "../data/farm";
import { ListingCard, MarketplaceBrowse, usePublishedContent } from "./Public";

export function useFarmProfile() {
  const [profile, setProfile] = useState<FarmProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const load = () =>
      contentRepository
        .farmProfile()
        .then((value) => {
          if (active) {
            setProfile(value);
            setError("");
          }
        })
        .catch(() => {
          if (active)
            setError("Farm information could not be loaded. Please try again.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, 50000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [attempt]);
  return { profile, loading, error, retry: () => setAttempt((n) => n + 1) };
}
export function FarmEnquiry({
  item,
  compact = false,
}: {
  item?: string;
  compact?: boolean;
}) {
  const { profile } = useFarmProfile();
  const url = profile ? farmWhatsapp(profile.whatsapp, item) : undefined;
  return (
    <div className="actions">
      {url ? (
        <a
          className="button primary"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Enquire on WhatsApp
        </a>
      ) : (
        <Link className="button primary" to="/livelong-farm">
          Contact Livelong Farm
        </Link>
      )}
      {!compact && profile?.phone && (
        <a
          className="button secondary"
          href={`tel:${profile.phone.replace(/[^+\d]/g, "")}`}
        >
          Call Livelong Farm
        </a>
      )}
    </div>
  );
}
export function FarmProfileView({
  profile,
  featured = [],
  children,
}: {
  profile: FarmProfile;
  featured?: Listing[];
  children?: ReactNode;
}) {
  const url = farmWhatsapp(profile.whatsapp);
  const website = farmWebsite(profile.website);
  return (
    <>
      <Reveal className="section farm-hero">
        <div>
          <Sprout size={36} />
          <span className="eyebrow red-text">A VERIMARTS SUBSIDIARY</span>
          <h1>Livelong Farm</h1>
          <h2>{profile.heading}</h2>
          {profile.intro && <p className="preserve-lines">{profile.intro}</p>}
          <p>The farm section of Verimarts, owned and run by Livelong Farm.</p>
          <div className="actions">
            <a className="button primary" href="#farm-products">
              Explore farm products <ArrowUpRight size={18} />
            </a>
            {url && (
              <a
                className="button secondary"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Enquire with Livelong Farm <ArrowUpRight size={18} />
              </a>
            )}
          </div>
        </div>
        <div className="farm-hero-products">
          <span className="eyebrow">FROM THE FARM</span>
          {featured.length ? (
            <div className="farm-hero-grid">
              {featured.slice(0, 2).map((item) => (
                <ListingCard item={item} key={item.id} />
              ))}
            </div>
          ) : (
            <div className="farm-hero-offerings">
              {profile.products.map((name) => (
                <a key={name} href="#farm-products">
                  <Sprout size={22} />
                  <span>{name}</span>
                  <ArrowUpRight size={18} />
                </a>
              ))}
            </div>
          )}
        </div>
      </Reveal>
      <div id="farm-products" className="farm-products-anchor">
        {children}
      </div>
      <Reveal className="section">
        {[
          { title: "Farm products", items: profile.products, Icon: Sprout },
          { title: "Aquaculture", items: profile.aquaculture, Icon: Fish },
        ].map((group) => (
          <div key={group.title} className="farm-offering-group">
            <h2>
              <group.Icon size={24} /> {group.title}
            </h2>
            <div className="vehicle-grid">
              {group.items.map((name) => (
                <article className="vehicle-card" key={name}>
                  <div className="card-body">
                    <span className="card-overline">LIVELONG FARM</span>
                    <h3>{name}</h3>
                    <p className="small muted">
                      Enquire for details, pricing and current availability.
                    </p>
                    {profile.whatsapp && (
                      <a
                        className="text-link"
                        href={farmWhatsapp(profile.whatsapp, name)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Enquire about {name} <ArrowUpRight size={16} />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
        <p className="detail-note">
          An enquiry does not confirm a purchase or reserve stock. Confirm
          product and service details directly with Livelong Farm.
        </p>
      </Reveal>
      <Reveal className="section farm-contact-section">
        <div>
          <span className="eyebrow red-text">DIRECT FROM LIVELONG FARM</span>
          <h2>Seen something you like?</h2>
          <p>
            Ask the farm about product details, pricing, and current
            availability. For aquaculture enquiries, speak directly with the
            team.
          </p>
          {url && (
            <a
              className="button primary"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Talk to Livelong Farm <ArrowUpRight size={18} />
            </a>
          )}
        </div>
        <div className="contact-card">
          <h2>Contact Livelong Farm</h2>
          {profile.main_address && (
            <p>
              <strong>Main address</strong>
              <br />
              {profile.main_address}
            </p>
          )}
          {profile.branch_address && (
            <p>
              <strong>Branch address</strong>
              <br />
              {profile.branch_address}
            </p>
          )}
          {url && (
            <p>
              WhatsApp:{" "}
              <a href={url} target="_blank" rel="noopener noreferrer">
                {profile.whatsapp}
              </a>
            </p>
          )}
          {profile.phone && (
            <p>
              Phone:{" "}
              <a href={`tel:${profile.phone.replace(/[^+\d]/g, "")}`}>
                {profile.phone}
              </a>
            </p>
          )}
          {profile.email && (
            <p>
              Email:{" "}
              <a
                href={`mailto:${encodeURIComponent(profile.email).replace(/%40/g, "@")}`}
              >
                {profile.email}
              </a>
            </p>
          )}
          {website && (
            <p>
              Website:{" "}
              <a href={website} target="_blank" rel="noopener noreferrer">
                {profile.website}
              </a>
            </p>
          )}
        </div>
      </Reveal>
    </>
  );
}
export function LivelongFarm() {
  const state = useFarmProfile();
  const content = usePublishedContent();
  return (
    <>
      {state.loading ? (
        <p className="section" role="status">
          Loading farm information…
        </p>
      ) : state.error ? (
        <div className="section" role="alert">
          <p>{state.error}</p>
          <button className="button secondary" onClick={state.retry}>
            Try again
          </button>
        </div>
      ) : state.profile ? (
        <FarmProfileView
          profile={state.profile}
          featured={content.listings.filter(
            (item) => item.category === "livelong-farm",
          )}
        >
          <MarketplaceBrowse category="livelong-farm" embedded />
        </FarmProfileView>
      ) : (
        <div className="section empty-state">
          <h1>Livelong Farm</h1>
          <p>Farm information will appear when published.</p>
        </div>
      )}
      {!state.profile && (
        <MarketplaceBrowse category="livelong-farm" embedded />
      )}
    </>
  );
}
