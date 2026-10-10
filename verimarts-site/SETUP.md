# Verimarts marketplace and owner portal setup

The application is implemented locally. The owner has reported configuring Supabase and applying the migration; these instructions remain a provisioning reference. The assistant has made no hosting/DNS changes. Without backend configuration, the public site shows empty categories; the portal shows setup instructions. Optional labelled demo content requires an explicit import and is not an automatic fallback.

## Local commands

```sh
npm install
cp .env.example .env
npm run dev
# In a second terminal:
npm run dev:portal
```

On Windows PowerShell, use `Copy-Item .env.example .env`. Public development runs at `http://127.0.0.1:5173`; the portal runs at `http://127.0.0.1:5174`. Development also permits `/portal` on the storefront origin for testing. The production storefront has no owner portal route or sign-up link.

```sh
npm run build           # Public site -> dist
npm run build:portal    # Portal -> dist-portal
npm run lint
npm run typecheck
npm run test:security
npm test                # Chromium required: npx playwright install chromium
```

`npm run build:host` is the Netlify build command. It selects storefront or portal from the server-side `BUILD_TARGET` environment variable, and always writes `dist` so both Netlify projects share the same publish directory. Never set a Vite asset base of `/verimarts-site`; the repository base directory and website URL path are different settings.

## Environment variables

| Name | Value / purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | The confirmed Supabase project URL. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key, or legacy anonymous public key. These are intended for browser use; RLS is mandatory. Never use a secret/service-role key. |
| `VITE_BUSINESS_WHATSAPP` | Owner-confirmed international WhatsApp number, digits or leading `+`. Empty hides the direct link and directs visitors to setup status. |
| `VITE_BUSINESS_PHONE` | Owner-confirmed public phone number. |
| `VITE_BUSINESS_EMAIL` | Owner-confirmed public email. |
| `VITE_PUBLIC_SITE_URL` | Reserved for the confirmed storefront URL; no domain is assumed by the code. |
| `BUILD_TARGET` | Netlify build environment only: `storefront` for the public project; `portal` for the owner project. Default is `storefront`. |

Keep `.env` and all actual environment files out of Git. The example contains no credentials. Every `VITE_` variable is public and included in the client bundle. The client rejects recognizable Supabase secret/service-role keys. No service-role key is required by this frontend.

Contact location, address, business hours, maps and social links remain in `src/config/business.ts` until confirmed. The Journal name is centralized in `src/data/marketplace.ts`.

## Provision Supabase

1. Create or select a Supabase project owned by the business. Configure email/password Auth and **disable new user sign-ups**. Do not enable anonymous sign-ins or third-party public account creation. The portal provides no sign-up UI, but the provider-level setting is also required.
2. Apply `supabase/migrations/202610090001_marketplace.sql` using the Supabase SQL editor or the Supabase CLI migration workflow. With the CLI, link the intended project and use `supabase db push` after checking the target. The local `supabase/config.toml` disables sign-up and restricts password length; it does not automatically change a hosted project's Auth settings.
3. Privately create the **one authorized owner** in Supabase Authentication > Users, using the confirmed email and a strong password. Use the dashboard/secure server-side management process; do not put credentials in source or create a frontend sign-up endpoint.
4. Copy that user's UUID from the dashboard. In the trusted SQL editor, insert it into the protected singleton mapping:

```sql
insert into private.owner_account (user_id)
values ('REPLACE_WITH_CONFIRMED_OWNER_AUTH_UUID'::uuid);
```

Only one row is permitted. If ownership changes, update this row through trusted SQL. Browser users, including the owner, cannot alter or read the mapping. Do not expose the `private` schema through the Data API. Do not grant `anon` or `authenticated` access to it.

5. Set the Auth Site URL to the confirmed portal origin and allow the exact recovery URL `https://portal.<confirmed-domain>/reset-password`. Add local development recovery URLs only to the development project's configuration if needed. Replace placeholders; do not configure an unconfirmed domain or broad wildcard. Auth email links should remain on the portal origin.
6. Configure production Auth email delivery/SMTP as appropriate; verify password-reset delivery with the real owner account. Set the hosted password policy to at least 12 characters. Session renewal/expiry is handled by Supabase Auth; expired or revoked sessions return to sign-in, and database authorization remains authoritative.
7. Put the public project URL and publishable key into local/Netlify environment settings. Test owner sign-in, reset, creation and publication against the real configured project before release.

The migration creates `listings`, `listing_images`, `articles`, a protected single-owner mapping, atomic listing/image-save functions, triggers/constraints, RLS policies, and a **private** `catalogue-media` bucket. No catalogue rows, owner credentials, or fake articles are seeded.

## RLS and media behaviour

- Anonymous visitors and unrelated authenticated accounts can read only published listing/article rows and their media metadata. Published unavailable/sold records may remain publicly visible with explicit availability; unpublish to hide the record entirely.
- Only the mapped owner can insert, update, delete, publish, unpublish or change media. Authorization uses `auth.uid()` against a server-controlled table, not an email, browser variable, or user-editable metadata.
- Storage SELECT policies permit public access only to paths associated with currently published records. Draft media is private even if someone knows the filename. Only the owner can upload, replace, or delete bucket objects.
- Images accept JPEG/PNG/WebP up to 5 MB; SVG and other MIME types are excluded. Listing metadata is saved atomically with its ordered images, so an invalid image association rolls back the entire listing edit.
- Signed image URLs expire after **60 seconds**. Once issued, a URL may remain usable until expiry, even after unpublishing; downloaded images cannot be recalled. The public data loader refreshes URLs/content every 50 seconds while the page is visible. Drafts are never served to the public in the first place.
- Uploads happen before an editor is saved. Abandoned or failed editor sessions may leave **private orphan media**. Remove unused paths through the owner's Storage dashboard as maintenance, after checking neither `listing_images.path` nor `articles.cover_path` references them. Removing an image in an editor becomes permanent on save. Content deletion removes its metadata first; a subsequent Storage failure can leave private orphan files and displays an error. Never manually delete referenced objects.
- Journal bodies are plain text, rendered through React text nodes. HTML is escaped. There are no embedded scripts or comments.

## Prepare the separate Netlify portal hostname

The existing public project is `verimarts.netlify.app`. A custom business domain and portal hostname have **not** been confirmed.

1. Keep the current public Netlify project connected to the existing repository/branch. Base: `verimarts-site` (no leading slash). Build: `npm run build:host`; publish: `dist`. Set `BUILD_TARGET=storefront` or omit it. Set the public Supabase/contact environment variables there.
2. Create a **second Netlify project** connected to the same repository/branch with the same base, command, and publish directory. Set `BUILD_TARGET=portal` in this project's build environment only. Set the same Supabase URL/publishable key; it connects to the same database. The build produces the portal at `/`, with static `noindex, nofollow` metadata. Do not set portal mode on the public project.
3. Once the owner confirms the domain, add `portal.<confirmed-domain>` to the second project's custom domains. Follow the actual DNS records Netlify supplies for that project (often a CNAME to its assigned Netlify hostname); enable/verify HTTPS. Do not repoint the existing public hostname to the portal project.
4. Update Supabase's Site URL and exact recovery redirect allowlist for this hostname, then test recovery links and owner-only access. The same codebase and backend are shared, but sessions are local to each origin and no cookie-domain sharing is introduced.
5. `_redirects` is copied into both builds so deep links and `/reset-password` refresh correctly. `_headers` adds no-sniff, framing protection and a referrer policy. Netlify badge settings remain per project in its dashboard.

These are preparation steps only. Creating projects, deploying and changing DNS must be separately authorized.

## Client inputs still required

- Owner email and owner Auth UUID; confirmed domain and portal hostname; Supabase project URL/public key.
- Actual listings, photos, currency/prices, availability and category facts; property sale/rental terms only when confirmed.
- Actual articles, categories and approved cover images; approval or replacement of the working Journal title.
- Public business contacts, location, hours, social links, and verified business policies/services.

## Validation scope

`npm run test:security` runs the migration in a local PostgreSQL engine (PGlite), with simulated Supabase Auth/Storage schemas and database roles. It executes policies, checks draft/media privacy and owner-only writes, exercises invalid-category checks, and verifies atomic image/listing rollback. It does **not** provision a real Supabase project, simulate email delivery or exercise the hosted Storage HTTP service. Browser tests mock the backend and exercise storefront, authorization gating, editors and publication transitions. Real-provider sign-in/reset/upload checks remain an environment setup step once credentials are supplied.

Before production use, confirm the hosted project has all migration policies, the bucket remains private, public sign-up is off, the owner mapping is correct, no service-role key appears in built assets, and a separate unrelated user cannot write through the API.

References: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage policies](https://supabase.com/docs/guides/storage/security/access-control), [private/signed media](https://supabase.com/docs/guides/storage/serving/downloads), [Netlify Vite hosting](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/).

## Handover catalogue

Sign into the owner portal and choose Dashboard > Add / update handover content. Confirm to publish or upgrade 32 listings and 10 articles. The earlier labelled entries are upgraded automatically; owner-edited titles are preserved. Retry an interrupted import safely. Alternatively, run supabase/demo-content.sql as postgres. Use the updated site code along with the updated SQL.

The user explicitly requested invented NGN prices and removal of visible demo/sample labels for client handover. These values are placeholders, not verified business offers. Car pictures reuse existing illustrative photography; the other product and Journal covers are locally authored vector illustrations, not actual inventory photographs. Replace prices, descriptions, covers and specifications with confirmed client content. Property transaction type remains unset. The client can edit, unpublish and delete entries through normal portal controls.

Exact handover media paths are mapped in src/data/handoverMedia.json to public decorative assets. These nonconfidential illustrations are public static assets; they are not private uploaded stock photos. Real uploads continue to use the private bucket and its RLS policies. Public listing/article visibility still requires publication. The repository resolves only the exact registered illustration paths; arbitrary URLs or local paths are not accepted. Removing static illustrations from a listing deletes its metadata without attempting a Storage deletion.

Dataset: src/data/demoContent.json. Asset/SQL preparation: scripts/prepare-handover.mjs. The import is explicit and never an automatic public fallback.

## Product photography update

All 26 non-car product illustrations now resolve to locally hosted JPEG photographs. Existing car photographs remain in place. No Supabase update or re-import is needed: the registered handover paths map to the new assets through src/data/handoverMedia.json. Redeploy the updated code/assets on both Netlify projects to show the photos on the public site and in portal previews.

Photo source, author and license records are in src/data/productPhotos.json and PHOTO_CREDITS.md. The public /photo-credits page is linked in the footer. Wikimedia photographs retain their individual Creative Commons licenses; Pexels photographs use the Pexels License. These are illustrative stock photographs, not verified actual-item pictures. The client's actual uploads continue to use private Supabase Storage. The handover preparation script preserves the photographic mappings.

## Livelong Farm and Paint Production update

Apply only the new migration `supabase/migrations/202610100001_farm_and_paint.sql` as **postgres** in Supabase SQL Editor, after the original marketplace migration. Do not rerun the original migration or owner-account insertion. The new migration preserves existing listings, media and articles, extends category validation, and adds `business_pages` with published-only public reads and owner-only writes. Existing image/Storage policies protect uploads in the new listing categories. No new environment variables are required.

Public routes: `/livelong-farm` and `/paint-production`. Both appear in navigation, homepage category discovery and the footer. The existing `/farm-produce` category remains available; its earlier handover entries are not presented as confirmed Livelong Farm stock. The farm page displays the six offerings and exact contacts provided in the request. It makes no third-party organic-certification claim, invents no prices or availability, and links enquiries to the farm's supplied WhatsApp number. Paint Production starts empty.

Owner portal: open **Livelong Farm** to edit its heading, introduction, addresses, displayed phone/WhatsApp numbers, email, website and offering groups; preview, save, publish or unpublish the page. Choose **Manage farm listings** for farm products and aquaculture services. Create those listings with the Livelong Farm category, group, name, quantity/unit and optional notes; normal images, prices, availability and publication controls apply. Choose **Paint Production** to filter and create paint listings with optional type, colour/options and size/volume. Both categories reuse the existing gallery editor and confirmed-delete workflow.

Resource review: the requested `WhatsApp Image 2026-10-09 at 19.42.35.jpeg` was not found in the workspace or supplied attachments. The implementation uses the user's explicit transcription; the original flyer still needs visual verification. No flyer artwork or unconfirmed slogan was added, and Verimarts branding is unchanged.

Still needed from the client: actual paint names/brand if applicable, descriptions, paint types, colours, sizes/volumes, confirmed prices/currency, availability and real photos. Farm listing prices, quantities, units, stock, actual-item photos and service details must also be provided by the owner. No paint or Livelong Farm inventory is seeded by this migration.

After applying the migration, publish the updated repository code to both existing Netlify projects using their current storefront/portal build targets. No deployment or DNS changes were performed for this update. Verify the supplied contacts and owner workflows against the real configured project before handover; automated browser checks use fixtures and database checks use local PostgreSQL.

### Unified farm section
Run supabase/migrations/202610100002_merge_farm_categories.sql after the farm-and-paint migration. It preserves existing listings and their origin fields while moving the old farm-produce category into livelong-farm. The app also groups legacy records into Livelong Farm before this migration is applied. Old /farm-produce links redirect to /livelong-farm. The navigation, category cards, filters, and owner portal now offer one farm category.


### Current public contact details
The owner-confirmed phone, WhatsApp display number, and email are stored in src/config/business.ts. They override the previous environment-based contact setup: 08144669205, 0907 041 9149, and Thisislivelong@gmail.com. WhatsApp links convert the Nigerian local number to 2349070419149 and encode enquiry messages. Existing VITE_BUSINESS contact variables do not override these confirmed values. The editable Livelong Farm profile remains managed separately in the owner portal.

