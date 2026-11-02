# Data Architecture & Persistence Layer

The application currently uses Supabase Postgres, Supabase Auth, and private Supabase Storage through a React/TypeScript repository layer. The proposed FASHYN foundation adds four relational product entities alongside the existing marketplace entities without renaming, dropping, or rewriting legacy data.

## Database Configuration

| Service/Module | DB Type | Profile | Driver | Connection | Migration Tool |
|---|---|---|---|---|---|
| Public storefront and owner portal | PostgreSQL via Supabase | Hosted project and local Supabase/PGlite security test fixture | `@supabase/supabase-js` Data API client; PGlite for tests | `VITE_SUPABASE_URL` and publishable key; no secret key in browser | Versioned SQL files under `supabase/migrations/`; proposal under `supabase/proposals/` |
| Media persistence | Supabase Storage backed by the Supabase project | Hosted and local policy fixture | Supabase Storage HTTP/API client | Existing private `catalogue-media` bucket | SQL bucket and Storage policy migrations |

## Data Ownership per Service

| Service | Tables Owned | ORM Framework | Caching | Notes |
|---|---|---|---|---|
| Public content repository | `listings`, `listing_images`, `articles`, `business_pages` | None; typed Supabase query layer | No application cache; signed media URLs are temporary | Legacy marketplace content remains isolated from the proposed clothing tables |
| FASHYN product repository | `product_categories`, `products`, `product_variants`, `product_images` | None; typed Supabase query layer proposed | No application cache proposed | Product mutations are owner-only through RLS and owner-guarded functions |
| Supabase Auth and authorization | `auth.users`, `private.owner_account` | Supabase-managed | Browser session persistence and token refresh | Existing `public.is_owner()` remains the authorization boundary |
| Supabase Storage | `storage.buckets`, `storage.objects` | Supabase-managed | Signed URL lifetime is the only current media cache behavior | Product files use `products/<product-id>/<image-id>.<extension>` |

## Entity Model

<!-- mermaid-checked: every attribute is `<type> <name> [<key>] ["<description>"]` with at most one of PK/FK/UK, no \n in descriptions, no {} in descriptions, every relationship label is double-quoted -->
~~~mermaid
erDiagram
    ProductCategory ||--o{ ProductCategory : "contains child categories"
    ProductCategory ||--o{ Product : "classifies"
    Product ||--o{ ProductVariant : "has purchasable variants"
    Product ||--o{ ProductImage : "has ordered images"
    ProductCategory {
        uuid id PK
        uuid parentId FK "self-referencing parent category"
        string slug UK
        string name
        string collection
        boolean active
    }
    Product {
        uuid id PK
        uuid categoryId FK
        string name
        string slug UK
        string collection
        decimal basePrice
        string currency
        decimal compareAtPrice
        string status
        boolean featured
    }
    ProductVariant {
        uuid id PK
        uuid productId FK
        string size
        string colour
        string sku UK
        int stockQuantity
        decimal priceOverride
        boolean active
    }
    ProductImage {
        uuid id PK
        uuid productId FK
        string path UK
        string alt
        int position
        boolean isCover
    }
~~~

The proposed entities coexist with legacy `listings`, `listing_images`, `articles`, and `business_pages`. Orders, payments, and carts are intentionally outside this phase.

### Proposed Initial FASHYN Category Hierarchy

The following is a seed proposal only. It must be reviewed and inserted through a separate controlled seed operation; this Phase 3A proposal does not insert category records.

```text
Men
  Shirts
  Trousers
  Jeans
  Jackets and Coats
  Knitwear
  Suits
  Shoes
  Accessories
    Bags
    Belts
    Hats
    Watches

Women
  Dresses
  Tops and Shirts
  Trousers
  Skirts
  Jeans
  Jackets and Coats
  Knitwear
  Shoes
  Accessories
    Bags
    Belts
    Jewellery
    Hats

Children
  Boys Clothing
  Girls Clothing
  Baby Clothing
  Shoes
  Schoolwear
  Accessories
```

The self-referencing category relationship allows additional categories, shared categories, and future collections without schema changes. The proposed database trigger rejects self-parenting and any parent assignment that would make a category an ancestor of itself.

### Atomic Product and Variant Writes

`save_product_with_variants(target_product, product_data, variant_data)` is an owner-only, security-invoker RPC. It inserts or updates one product, replaces that product's variants, and returns the product ID. PostgreSQL executes the function in one transaction: a malformed variant, duplicate SKU, duplicate size/colour combination, or any other constraint failure aborts the entire call and rolls back the product and variant changes.

The function is deliberately explicit about product fields rather than accepting arbitrary column names. It retains the existing `public.is_owner()` authorization boundary and remains subject to table RLS.

### Product Media Cleanup

Database metadata and Storage objects are separate resources. Deleting a `product_images` row queues its Storage path in `product_media_cleanup`; the trigger also captures image rows removed by product deletion or image replacement. An owner-authorized cleanup worker or future repository should:

1. Read pending paths through `list_product_media_cleanup()`.
2. Call Supabase Storage removal for those paths using the existing owner-only Storage permission.
3. Call `mark_product_media_cleanup(paths)` only after Storage confirms deletion.
4. On failure, call the same function with an error so the path remains pending and retryable.

Uploads should use a two-phase application flow: upload to the product namespace, then commit the corresponding image metadata. If metadata insertion fails, the upload remains an unreferenced file and should be queued for cleanup by the upload failure handler. Unreferenced files from interrupted sessions are recoverable through a periodic owner-only namespace reconciliation job; public users receive no deletion capability.

## Key Repository Methods

| Service | Repository | Notable Methods | Purpose |
|---|---|---|---|
| Legacy content | `contentRepository` in `src/data/contentRepository.ts` | `listings(owner)`, `listing(slug)`, `articles(owner)`, `saveListing(item)`, `saveArticle(item)`, `changeListing(id, values)` | Preserve current marketplace and owner portal behavior |
| Legacy media | `contentRepository` in `src/data/contentRepository.ts` | `uploadMedia(file, kind, id, onProgress)`, `refreshMediaUrl(path)`, `removeMedia(paths)` | Preserve private Storage upload and signed URL behavior |
| Proposed product catalogue | New `productRepository` in `src/data/productRepository.ts` | `categories()`, `products(filters)`, `product(slug)`, `variants(productId)`, `saveProduct(product)`, `saveVariants(productId, variants)`, `replaceProductImages(productId, images)` | Keep product reads and owner mutations separate from legacy listing logic |
| Proposed product media | New product media helper | `uploadProductImage(file, productId, onProgress)`, `removeProductMedia(paths)` | Reuse `catalogue-media` with the `products/` namespace |

The existing repository uses direct Supabase queries and RPC calls rather than an ORM. A future product repository should preserve that pattern but use product-specific TypeScript types and query helpers.

The future product repository should call `save_product_with_variants` instead of issuing separate product and variant mutations. It should keep Storage deletion outside the database transaction and use the cleanup queue protocol described above.

## Caching Strategy

No Redis, CDN cache, ORM second-level cache, or application query cache is configured. Supabase Auth persists the browser session, while private Storage media is delivered through expiring signed URLs. The proposed product foundation should initially use direct reads and browser-level UI state only; product caching can be reconsidered after catalogue size and traffic are measured.

## Data Ownership Boundaries

The existing Supabase project is a shared PostgreSQL data store with logical table boundaries. Legacy marketplace tables remain owned by the existing content repository. The proposed product repository owns only the new product tables and does not reinterpret legacy listing rows. Public reads are filtered by RLS to published products, active variants, active categories, and images belonging to published products. Owner mutations are guarded by the existing `private.owner_account` mapping through `public.is_owner()`.

The existing `catalogue-media` bucket is shared, but object namespaces are separated: legacy records use `listings/` and `articles/`, while FASHYN products use `products/`. Product Storage policies are additive and do not replace legacy policies. Carts, orders, payments, and customer PII are not part of this proposal.

### Migration Safety Review

- The proposal is additive: it creates only new product tables, indexes, functions, triggers, policies, and the cleanup queue. It does not rename, alter, or delete legacy tables, records, owner mappings, or existing policies.
- It is intentionally not idempotent. The safest deployment is to review the proposal, copy it once into a new chronologically versioned file under `supabase/migrations/`, apply it through the normal Supabase migration pipeline, and record the migration in source control. Re-running the same file or manually executing fragments risks duplicate-object errors and partial operational state.
- The entire SQL file is wrapped in one transaction. PostgreSQL will roll back the schema change if a statement fails, although Storage files uploaded before a failed deployment are outside that database transaction and must be handled separately.
- Before live application, compare the hosted schema and Storage policies against the inspected migration history, especially any later policy repairs. Validate the SQL in a disposable database and run the existing RLS regression suite.
- Rollback should be a separately reviewed down migration or an explicit controlled operation. Dropping the new tables would remove product data and is not an automatic recovery action. Storage objects should be reconciled before any table rollback.

### Security Review

- Customer roles have no write policy that can pass `public.is_owner()`, so they cannot change product prices, comparison prices, publication status, variant prices, or stock.
- Product and variant public reads are restricted to published products and active variants. Draft products and their variants are not returned through the proposed table policies.
- Product image metadata is readable only for published products. Storage reads additionally require a matching published product image row, so an unpublished product path is not publicly readable through the proposed policy.
- Product media cleanup metadata is owner-only. Storage deletion remains owner-only; no anonymous or customer delete policy is introduced.
- Legacy marketplace RLS and Storage policies are left unchanged. The new `products/` namespace is isolated from `listings/` and `articles/`.

### Data Classification & Sensitivity

| Entity | Sensitive Fields | Classification (PII/PHI/PCI/None) | Controls in Place |
|---|---|---|---|
| ProductCategory | None | None | Public active-category RLS; owner-only writes |
| Product | None in the proposed fields | None | Published-only public reads; owner-only writes |
| ProductVariant | SKU and stock are business-sensitive, not personal data | None | Published active-variant reads; owner-only writes including stock |
| ProductImage | Product media paths and alt text | None | Published-product RLS and product namespace Storage policies |
| ProductMediaCleanup | Storage paths and cleanup errors | None | Owner-only RLS and owner-only cleanup functions |
| `private.owner_account` | `user_id` | PII-adjacent identifier | Private schema, revoked browser access, owner function boundary |

No PHI or PCI data is introduced. Customer names, addresses, phone numbers, emails, orders, and payment data are intentionally deferred to a later phase.

## Remaining Decisions Requiring Approval

1. Approve the initial category seed hierarchy, separately from the schema migration.
2. Confirm whether the owner portal should run cleanup retries in the browser or whether a scheduled server-side reconciliation job will be provided later.
3. Confirm the maximum of 200 variants per atomic product save and 20 images per product.
4. Confirm whether empty active categories should remain publicly visible or be filtered to categories containing published products.
