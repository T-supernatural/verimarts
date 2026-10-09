# Verimarts marketplace

The existing React/Vite/TypeScript storefront now supports a single owner's Cars, Property, Farm & Produce, Electronics, Other Goods, and Journal. The approved geometric V logo, racing red/black/silver styling, logo reveal, scroll animations, and direction-aware navbar are preserved.

Public pages show published content only. The separate owner build includes sign-in, password recovery, dashboard, listing and article editors, previews, publishing, availability, confirmed deletion, and ordered image uploads with cover selection. Transactions remain direct enquiries: no vendors, customer accounts, checkout, payments, or comments.

Supabase Auth, Postgres, and private Storage provide the backend. The migration enforces owner-only writes and published-only public reads through database and Storage policies. The owner has reported configuring Supabase and applying the migration. No deployment or DNS changes were made by the assistant.

## Local development

```sh
cd verimarts-site
npm install
```

Copy `.env.example` to `.env.local`, configure the public Supabase credentials, and follow [SETUP.md](SETUP.md) to apply the migration and provision the authorized owner.

```sh
npm run dev
npm run dev:portal
npm run build
npm run build:portal
npm run lint
npm run typecheck
npm run test:security
npm test
```

The portal development server uses port 5174. Browser tests use isolated fixtures and a mock API; security tests execute the actual SQL migration in local PostgreSQL via PGlite. Hosted authentication, email delivery, and Storage still require verification against the owner's configured Supabase project.

## Project structure

- `src/marketplace/Public.tsx`: category discovery, filters, galleries, listing details, Journal.
- `src/portal/`: private authentication, dashboard, editors, media management.
- `src/data/marketplace.ts`: categories, editable Journal name, typed content fields.
- `src/data/contentRepository.ts`: replaceable content and media access layer.
- `src/lib/supabase.ts`: browser client using public credentials only.
- `supabase/migrations/`: schema, validation, atomic listing saves, RLS, Storage policies.
- `scripts/test-security.mjs` and `tests/marketplace.spec.ts`: SQL and browser verification.
- `netlify.toml` and `scripts/build-host.mjs`: separate storefront/portal hostname builds.

See [SETUP.md](SETUP.md) for environment variables, owner provisioning, separate Netlify hostname configuration, security limits, and required business inputs.

## Supplied resources

All four supplied scope PDFs were reviewed: the original business/MVP scopes and expanded marketplace business/website-and-portal scopes. Existing application code, assets, routes, scripts, and Netlify configuration were inspected before editing. Original resources remain untouched.

The approved geometric V automotive logo is used in the navbar, footer, reveal, and favicon. The alternate logo remains unused. The supplied intro video serves as a reference for the existing sharp CSS reveal and is not played. Existing illustrative photography is retained as decoration and is not presented as verified stock.

No confirmed inventory, articles, owner account, business contacts, or custom domain were supplied. Fictional catalogue records were removed; public empty states remain until the owner publishes real content. Optional contact variables remain unset rather than fabricating business details.

## Handover content

The owner dashboard's **Add / update handover content** button imports or upgrades 32 listings with illustrative covers and placeholder NGN prices, plus 10 Journal articles with covers. Public demo/sample labels have been removed at the user's request. The catalogue must be replaced with confirmed client facts and actual item photographs. Existing owner edits are preserved. The updated supabase/demo-content.sql provides the same import through trusted SQL. See SETUP.md for details.
