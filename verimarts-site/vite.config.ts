import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { staticRoutes, type RouteMeta } from "./src/seo/routes.ts";
import { categories } from "./src/data/marketplace.ts";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Fills a route's head so crawlers and link previews get real metadata without running JavaScript. */
function routeHtml(template: string, route: RouteMeta, origin: string) {
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(
      /(<meta\s+(?:name|property)="(?:description|og:description|twitter:description)"\s+content=")[^"]*(")/g,
      `$1${description}$2`,
    )
    .replace(
      /(<meta\s+(?:name|property)="(?:og:title|twitter:title)"\s+content=")[^"]*(")/g,
      `$1${title}$2`,
    );
  if (origin) {
    html = html
      .replace(
        /(<meta\s+(?:name|property)="(?:og:image|twitter:image)"\s+content=")\//g,
        `$1${origin}/`,
      )
      .replace(
        "<!--seo:route-->",
        `<link rel="canonical" href="${origin}${route.path}" /><meta property="og:url" content="${origin}${route.path}" />`,
      );
  }
  const links = [
    ...categories.map((c) => [`/${c.id}`, c.name]),
    ["/new-arrivals", "New arrivals"],
    ["/sale", "Sale"],
    ["/journal", "Journal"],
    ["/about", "About"],
    ["/how-to-order", "How to order"],
    ["/contact", "Contact"],
  ]
    .map(([href, label]) => `<a href="${href}">${label}</a>`)
    .join(" ");
  return html.replace(
    "<!--seo:noscript-->",
    `<noscript><h1>${escapeHtml(route.heading)}</h1><p>${description}</p><nav>${links}</nav></noscript>`,
  );
}

async function publishedProducts(url?: string, key?: string) {
  if (!url || !key) return [];
  try {
    const response = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/listings?select=slug,updated_at&status=eq.published&category=in.(${categories.map((c) => c.id).join(",")})`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as { slug: string; updated_at: string }[];
  } catch (error) {
    console.warn(`Sitemap: published products were not added (${error}).`);
    return [];
  }
}

function seo(mode: string, env: Record<string, string>): Plugin {
  const isPortal = mode === "portal";
  const origin = (env.VITE_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  let outDir = "dist";
  let isBuild = false;
  return {
    name: "fashyn-seo",
    configResolved(config) {
      outDir = config.build.outDir;
      isBuild = config.command === "build";
    },
    transformIndexHtml(html: string) {
      if (!isPortal) return html;
      return html
        .replace(
          /<title>[\s\S]*?<\/title>/,
          '<title>Owner portal | FASHYN</title><meta name="robots" content="noindex, nofollow" />',
        )
        .replace(/<meta\s+property="og:[\s\S]*?\/>\s*/g, "")
        .replace(/<meta\s+name="twitter:[\s\S]*?\/>\s*/g, "");
    },
    async closeBundle() {
      if (!isBuild) return;
      const write = async (relative: string, content: string) => {
        const target = path.resolve(outDir, relative);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, content);
      };
      if (isPortal) {
        await write("robots.txt", "User-agent: *\nDisallow: /\n");
        return;
      }
      const template = await readFile(path.resolve(outDir, "index.html"), "utf8");
      for (const route of staticRoutes)
        await write(
          path.join(route.path.slice(1), "index.html"),
          routeHtml(template, route, origin),
        );
      const blocked = ["/bag", "/search"].map((p) => `Disallow: ${p}`).join("\n");
      if (!origin) {
        console.warn(
          "VITE_PUBLIC_SITE_URL is not set: skipping sitemap.xml and canonical links.",
        );
        await write("robots.txt", `User-agent: *\nAllow: /\n${blocked}\n`);
        return;
      }
      await write(
        "robots.txt",
        `User-agent: *\nAllow: /\n${blocked}\n\nSitemap: ${origin}/sitemap.xml\n`,
      );
      const products = await publishedProducts(
        env.VITE_SUPABASE_URL,
        env.VITE_SUPABASE_PUBLISHABLE_KEY,
      );
      const urls = [
        ...staticRoutes.map(
          (route) =>
            `<url><loc>${origin}${route.path}</loc><priority>${route.priority}</priority></url>`,
        ),
        ...products.map(
          (product) =>
            `<url><loc>${origin}/product/${product.slug}</loc><lastmod>${product.updated_at.slice(0, 10)}</lastmod><priority>0.7</priority></url>`,
        ),
      ];
      await write(
        "sitemap.xml",
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`,
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd()) } as Record<
    string,
    string
  >;
  return { plugins: [react(), seo(mode, env)] };
});
