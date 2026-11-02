import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { business } from "../config/business";
import { defaultImage, siteName } from "./routes";

const configuredOrigin = (
  (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) || ""
).replace(/\/$/, "");
export function siteOrigin() {
  return configuredOrigin || window.location.origin;
}
export function absoluteUrl(path: string) {
  return /^https?:\/\//.test(path) ? path : `${siteOrigin()}${path}`;
}
function upsertMeta(attribute: "name" | "property", key: string, value: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  );
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.append(tag);
  }
  tag.content = value;
}
function upsertCanonical(href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!tag) {
    tag = document.createElement("link");
    tag.rel = "canonical";
    document.head.append(tag);
  }
  tag.href = href;
}
export type JsonLd = Record<string, unknown>;

/** Keeps the document head in step with the current page. */
export function Seo({
  title,
  description,
  image = defaultImage,
  type = "website",
  noindex = false,
  jsonLd,
}: {
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article" | "product";
  noindex?: boolean;
  jsonLd?: JsonLd[];
}) {
  const { pathname } = useLocation();
  const structured = jsonLd ? JSON.stringify(jsonLd) : "";
  useEffect(() => {
    const url = absoluteUrl(pathname);
    const picture = absoluteUrl(image);
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noindex ? "noindex, follow" : "index, follow");
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", picture);
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", picture);
    upsertCanonical(url);
  }, [pathname, title, description, image, type, noindex]);
  useEffect(() => {
    if (!structured) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.seo = "page";
    script.text = structured.replace(/</g, "\\u003c");
    document.head.append(script);
    return () => script.remove();
  }, [structured]);
  return null;
}
export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: siteName,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/brand/icon-512.png"),
    image: absoluteUrl(defaultImage),
    slogan: business.tagline,
    email: business.email,
    telephone: business.phone,
    currenciesAccepted: "NGN",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: business.phone,
      email: business.email,
    },
    ...(business.socialLinks.length
      ? { sameAs: business.socialLinks.map((link) => link.url) }
      : {}),
  };
}
export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/search")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
