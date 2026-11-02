# FASHYN storefront and owner portal

FASHYN is a clothing store for women, men and children, built with React, Vite, TypeScript and Supabase. There are two builds from one codebase:

- **Storefront**: home, departments, filters, search, product pages, a bag, Journal and a first-visit loading film. Orders are sent as a WhatsApp message; the site takes no payments and creates no customer accounts.
- **Owner portal**: private sign-in, dashboard, product and Journal editors, media uploads, previews, publishing and an archive of pre-clothing records.

## Local development

```sh
cd verimarts-site
npm install
npm run dev          # Storefront at http://127.0.0.1:5173
npm run dev:portal   # Portal at http://127.0.0.1:5174
```

Copy `.env.example` to `.env.local` to connect Supabase. **Without Supabase, the storefront previews the starter range**, so the design can be reviewed with no setup. The portal needs Supabase. See [SETUP.md](SETUP.md).

```sh
npm run build          # Storefront -> dist
npm run build:portal   # Portal -> dist-portal
npm run lint
npm run typecheck
npm run test:security  # Runs the real SQL migrations in local PostgreSQL (PGlite)
npm test               # Browser tests against a mock backend
```

Playwright needs Chromium (`npx playwright install chromium`), or set `PW_CHANNEL=chrome` to use an installed Chrome. Chrome is also the way to test the H.264 intro film.

## Brand

| Colour | Hex | Use |
| --- | --- | --- |
| Adire Indigo | `#1E2170` | Primary brand colour, dark surfaces, main buttons |
| Hibiscus | `#D81E5B` | Sale, accents, the A chevron on light backgrounds |
| Marigold | `#FFB627` | Highlights and calls to action on indigo |
| Porcelain | `#FBF7F0` | Page background |

Tokens live in `src/styles/base.css`. Type is Bricolage Grotesque (display) and Instrument Sans (body), both self-hosted. The wordmark in `src/brand/Logo.tsx` and `public/brand/` is a vector redraw of the supplied `FASHYN Minimalist Luxury Wordmark.png`, and the favicon is a new F-and-chevron mark. The chevron from the wordmark's A is the recurring graphic motif.

## Project structure

- `src/features/shop/`: storefront pages and components, including `LoadingScreen.tsx`.
- `src/store/`: the shared catalogue loader and the bag, which is saved in the browser.
- `src/seo/`: per-page metadata, JSON-LD and the route list used by the build.
- `vite.config.ts`: writes per-route HTML, `robots.txt` and `sitemap.xml` at build time.
- `src/portal/`: owner sign-in, dashboard and editors.
- `src/data/marketplace.ts`: departments, fields and shared types.
- `src/data/contentRepository.ts`: content and media access.
- `src/data/starterCatalogue.ts`: the illustrative starter range.
- `supabase/migrations/`: schema, validation, RLS and Storage policies.

## Placeholder content

The starter range uses stock photography from Pexels with invented names, descriptions and NGN prices. It must be replaced with real products before trading. Credits are in [PHOTO_CREDITS.md](PHOTO_CREDITS.md) and on `/photo-credits`.
