# FASHYN store and owner portal setup

## Move an existing deployment to FASHYN

Do these in order. Nothing here has been applied to your hosted project.

1. In the Supabase SQL Editor, as **postgres**, run `supabase/migrations/202611020001_fashion_catalogue.sql`. It adds the Women, Men, Children and Accessories departments and their fields. It deletes nothing. Until it runs, saving a clothing product fails with a category error.
2. Deploy this code to both Netlify projects, then set `VITE_PUBLIC_SITE_URL` on **both** (the storefront's address, for example `https://www.your-domain.com`, with no trailing slash) and redeploy. On the storefront it enables canonical links and `sitemap.xml`; on the portal it powers the View store link. Without it the site still works, but those are skipped.
3. In the portal, choose **Add sample range** if you want illustrative products to start from, then replace them with real ones. The button only appears while there are no clothing products.
4. After launch, submit `https://<your-domain>/sitemap.xml` to Google Search Console. The sitemap lists products published at build time, so redeploy after larger catalogue changes.

Old cars, property, farm, paint and electronics records stay in the database. They disappear from the storefront and move to **Archive** in the portal, where they can be edited or deleted. The `business_pages` farm table is no longer used by the app and is left in place. Old public addresses redirect to `/shop`.

The bag sends orders as a WhatsApp message. Online payment, delivery fees and returns policies are not implemented, because none have been supplied.

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

| Name                            | Value / purpose                                                                                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | The confirmed Supabase project URL.                                                                                                                  |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key, or legacy anonymous public key. These are intended for browser use; RLS is mandatory. Never use a secret/service-role key. |
| `VITE_PUBLIC_SITE_URL`          | The storefront's public address. Used for canonical links, social share images, `sitemap.xml` and the portal's View store link.                       |
| `BUILD_TARGET`                  | Netlify build environment only: `storefront` for the public project; `portal` for the owner project. Default is `storefront`.                        |

Keep `.env` and all actual environment files out of Git. The example contains no credentials. Every `VITE_` variable is public and included in the client bundle. The client rejects recognizable Supabase secret/service-role keys. No service-role key is required by this frontend.

Contact details, address, business hours, maps and social links are in `src/config/business.ts`. Social links added there also appear in the footer and structured data. The Journal name is in `src/data/marketplace.ts`.

## Provision Supabase

1. Create or select a Supabase project owned by the business. Configure email/password Auth and **disable new user sign-ups**. Do not enable anonymous sign-ins or third-party public account creation. The portal provides no sign-up UI, but the provider-level setting is also required.
2. Apply every file in `supabase/migrations/`, in filename order, using the Supabase SQL editor or the Supabase CLI migration workflow. With the CLI, link the intended project and use `supabase db push` after checking the target. The local `supabase/config.toml` disables sign-up and restricts password length; it does not automatically change a hosted project's Auth settings.
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

The migrations create `listings`, `listing_images`, `articles`, a protected single-owner mapping, atomic listing/image-save functions, triggers/constraints, RLS policies, and a **private** `catalogue-media` bucket. No clothing products, owner credentials, or articles are seeded.

## RLS and media behaviour

- Anonymous visitors and unrelated authenticated accounts can read only published listing/article rows and their media metadata. Published unavailable/sold records may remain publicly visible with explicit availability; unpublish to hide the record entirely.
- Only the mapped owner can insert, update, delete, publish, unpublish or change media. Authorization uses `auth.uid()` against a server-controlled table, not an email, browser variable, or user-editable metadata.
- Storage SELECT policies permit public access only to paths associated with currently published records. Draft media is private even if someone knows the filename. Only the owner can upload, replace, or delete bucket objects.
- Images accept JPEG/PNG/WebP up to 5 MB; SVG and other MIME types are excluded. Listing metadata is saved atomically with its ordered images, so an invalid image association rolls back the entire listing edit.
- Signed image URLs expire after **one hour**. Once issued, a URL may remain usable until expiry, even after unpublishing; downloaded images cannot be recalled. The storefront rechecks content every five minutes while visible and renews an expired image link when it fails to load. Drafts are never served to the public in the first place.
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
- Actual products, photos, prices, sizes, colours, materials and availability.
- Actual articles, categories and approved cover images; approval or replacement of the working Journal title.
- Business location, hours, social links, and delivery, returns and payment policies.

## Validation scope

`npm run test:security` runs the migration in a local PostgreSQL engine (PGlite), with simulated Supabase Auth/Storage schemas and database roles. It executes policies, checks draft/media privacy and owner-only writes, exercises invalid-category checks, and verifies atomic image/listing rollback. It does **not** provision a real Supabase project, simulate email delivery or exercise the hosted Storage HTTP service. Browser tests mock the backend and exercise storefront, authorization gating, editors and publication transitions. Real-provider sign-in/reset/upload checks remain an environment setup step once credentials are supplied.

Before production use, confirm the hosted project has all migration policies, the bucket remains private, public sign-up is off, the owner mapping is correct, no service-role key appears in built assets, and a separate unrelated user cannot write through the API.

References: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage policies](https://supabase.com/docs/guides/storage/security/access-control), [private/signed media](https://supabase.com/docs/guides/storage/serving/downloads), [Netlify Vite hosting](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/).

## Media uploads and listing videos

`supabase/migrations/202610110001_repair_media_uploads_and_videos.sql` synchronizes the existing private catalogue-media bucket with the checked-in 5 MiB project/bucket ceiling and adds MP4/WebM MIME types. The portal accepts JPEG/PNG/WebP images and MP4/WebM listing videos, each capped at 5 MiB; videos are capped at 30 seconds. The 5 MiB limit is the current supabase/config.toml global setting and existing bucket setting, so it is the maximum the app advertises; a lower hosted Storage global limit still takes precedence. Short files remain under Supabase's documented 6 MiB threshold where standard uploads are appropriate. Videos are checked in the browser before upload; the database also bounds recorded duration metadata, but it does not transcode or independently inspect video bytes. Journal covers remain images only. The portal shows transfer percentage, local preview, success and provider-specific error messages. Published media uses refreshed one-hour signed URLs, renewing on load error. No public bucket is introduced.

If an upload is denied, first confirm that `private.owner_account.user_id` matches the client's Auth UUID, then inspect the configured bucket in the Supabase SQL Editor:

```sql
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'catalogue-media';
```

Expected values: `public = false`, `file_size_limit = 5242880`, and JPEG/PNG/WebP/MP4/WebM allowed MIME types. The app reports 401 for expired sign-in, 403 for owner or RLS policy denial, 413 for Storage's global or bucket size cap, and 415 for a bucket MIME mismatch. A lower hosted Storage global limit takes precedence over the bucket cap.
