# Verimarts digital showroom

Front-end MVP built with React, Vite, TypeScript, Tailwind CSS, React Router, and Framer Motion. No backend or payment flow. Nothing has been deployed.

## Run locally

```sh
cd verimarts-site
npm install
npm run dev
```

Open the localhost URL printed by Vite. `npm run build` performs type checking and creates `dist/`. `npm run preview` serves that build locally. Other checks: `npm run typecheck`, `npm run lint`, and `npm test` (install Chromium first with `npx playwright install chromium`).

## Implemented

- Home, Showroom, Vehicle Detail, About, Services, Contact, and a not-found page.
- Responsive navigation, featured listings, body-type category links, and enquiry callouts.
- Search, make/body/year/transmission/listing-status/maximum-price filters, sorting, reset, and empty states. Filter state lives in the URL.
- Keyboard-friendly galleries with previous/next and thumbnail controls, explicit unknown fields, and related vehicles.
- Brief silent web intro using the original geometric V logo with CSS light-sweep and road-line animation. Includes Skip intro/Escape, session memory, replay, reduced-motion transition, and a timeout/error fallback. Background is inert during the intro; no intro video is played.
- Accessible labels, focus styles, semantic landmarks, responsive layouts, image fallbacks, route titles/descriptions, and basic Open Graph metadata.
- Typed local data and a replaceable async catalogue repository, including loading/error/retry handling.

## Owner content needed

1. Fill `src/config/business.ts` with the approved WhatsApp number (international format), phone, email, address, hours, map URL, and social links. Empty values are deliberately not turned into fake links. WhatsApp buttons currently open the Contact page explaining the missing setup. Phone actions appear once a phone is provided.
2. Replace `src/data/vehicles.ts` with real stock, actual photographs, approved prices/currency, availability, specifications, and condition notes. All six current listings, years, mileage, prices, and specifications are **fictional demo data**. Photography is illustrative and may depict a different model. The use of NGN in demo prices does not establish the business's location or approved currency.
3. Confirm business history, location, service area, stock model, and pricing policy. The About page flags these gaps.
4. Confirm any additional services and terms before extending the Services page.
5. Before a future publication, set absolute social-preview image/canonical URLs for the chosen domain and ensure the static host rewrites frontend routes to `index.html`. Some social crawlers do not execute React, so route-specific previews would need prerendering. Do not publish this demo as actual stock.

## Resource review and usage

The workspace contained an empty `verimarts-site` folder and six supplied resources. Originals remain untouched at the workspace root.

- `VERIMARTS geometric V automotive logo.png`: copied unchanged into website assets; used in the navbar, footer, animated intro, favicon, About page, and basic preview metadata. Its supplied white background is preserved.
- `Verimarts four-variant logo grid.png`: reviewed during the initial build; this alternative artwork is no longer used by the website.
- `color verimarts.jpg`: reviewed; racing red `#FF0000`, black `#000000`, and silver `#C0C0C0` inform the theme.
- `Animated_logo_reveal_20261008142909.mp4`: reviewed as a visual reference for road perspective and restrained red lighting. The website now builds these effects with CSS around the unchanged geometric V artwork; it does not load or play this video.
- `Verimarts_Logo_Animation.html`: reviewed; the supplied MP4 was selected for the opening rather than reproducing the HTML's alternative drawn mark.
- `Verimarts_Business_Scope.pdf`: read in full. This is a concept draft, confirming the focus on vehicle sales and enquiries while leaving operational details unconfirmed.

Illustrative photographs were downloaded from Unsplash and converted to local WebP assets. Source IDs: `photo-1503376780353-7e6692767b70` (hero/car-3), `photo-1618843479313-40f8afb4b4d8` (car-1), `photo-1555215695-3004980ad54e` (car-2), `photo-1519641471654-76ce0107ad1b` (car-4). Source URLs follow `https://images.unsplash.com/<source-id>`. Replace them with owner-approved stock photography.

## Intentionally omitted

Unconfirmed sourcing, inspections, test-drive arrangements, warranties, financing, delivery, trade-ins, registration, and after-sales guarantees. Also omitted: authentication, admin, accounts, forms pretending to submit, Supabase/server APIs, checkout, orders, deposits, reservations, and payments.

## Maintenance

Page layouts live in `src/pages.tsx`, with navigation and the intro in `src/App.tsx`. Presentation is separated from `src/data/catalogue.ts`; replace its `list`/`find` implementations for a future backend. Shared cards, badges, galleries, loading states, and enquiry controls live in `src/components.tsx`; filters are reusable in `src/VehicleFilters.tsx`. Contact details and safely encoded WhatsApp messages are centralized in `src/config/business.ts`. The package lock records installed versions; TypeScript 6.0 is selected to satisfy the lint parser's supported version range.

Temporary PDF/video inspection dependencies live in the ignored `.tools` directory and are not needed to run the website.

## Validation results

Verified on 8 October 2026: production build, TypeScript checking, and ESLint all passed. Six Playwright checks cover encoded WhatsApp messages, catalogue search/filter/reset/sorting, vehicle galleries and missing contact paths, all pages at a mobile viewport with image-load checks, session/replay/reduced-motion intro behaviour without video, and failed-logo recovery. Desktop and mobile screenshots are saved in `review/`. Dependency installation reported zero known vulnerabilities. Vite and Playwright required execution outside the workspace sandbox to launch their compiler/browser processes.
