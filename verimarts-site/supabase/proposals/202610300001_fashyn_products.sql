-- PROPOSAL ONLY: do not apply directly.
-- This additive migration is intentionally outside supabase/migrations/.
-- It coexists with public.listings and the existing owner/storage policies.

begin;

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.product_categories(id) on delete restrict,
  slug text not null unique
    check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 120),
  name text not null check(length(trim(name)) between 1 and 120),
  description text not null default '' check(length(description) <= 1000),
  collection text not null default 'unisex'
    check(collection in ('men','women','children','unisex')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.product_categories(id) on delete restrict,
  name text not null check(length(trim(name)) between 1 and 180),
  slug text not null unique
    check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 180),
  description text not null default '' check(length(description) <= 20000),
  collection text not null
    check(collection in ('men','women','children','unisex')),
  base_price numeric(16,2) not null check(base_price >= 0),
  currency text not null default 'NGN' check(currency ~ '^[A-Z]{3}$'),
  compare_at_price numeric(16,2)
    check(compare_at_price is null or compare_at_price >= 0),
  status text not null default 'draft'
    check(status in ('draft','published')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(compare_at_price is null or compare_at_price > base_price)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text check(size is null or length(trim(size)) between 1 and 40),
  colour text check(colour is null or length(trim(colour)) between 1 and 80),
  sku text not null unique
    check(sku ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$'),
  stock_quantity integer not null default 0 check(stock_quantity >= 0),
  price_override numeric(16,2)
    check(price_override is null or price_override >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index product_variants_option_key
  on public.product_variants(
    product_id,
    lower(coalesce(trim(size), '')),
    lower(coalesce(trim(colour), ''))
  );

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  path text not null unique,
  alt text not null default '' check(length(alt) <= 500),
  position integer not null check(position >= 0 and position < 20),
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  check(path like 'products/' || product_id::text || '/%')
);

create table public.product_media_cleanup (
  path text primary key,
  product_id uuid,
  queued_at timestamptz not null default now(),
  processed_at timestamptz,
  attempts integer not null default 0 check(attempts >= 0),
  last_error text
);

create unique index product_one_cover
  on public.product_images(product_id)
  where is_cover;

create unique index product_image_position
  on public.product_images(product_id, position);

create index product_categories_parent_idx
  on public.product_categories(parent_id);

create index products_public_catalogue_idx
  on public.products(status, collection, featured, created_at desc)
  where status = 'published';

create index products_category_idx
  on public.products(category_id, created_at desc);

create index product_variants_product_idx
  on public.product_variants(product_id, active);

create index product_media_cleanup_pending_idx
  on public.product_media_cleanup(queued_at)
  where processed_at is null;

create or replace function public.prevent_product_category_cycle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'A category cannot be its own parent';
  end if;

  if exists(
    with recursive ancestors(id, visited) as (
      select c.id, array[c.id]
      from public.product_categories c
      where c.id = new.parent_id
      union all
      select c.parent_id, a.visited || c.parent_id
      from public.product_categories c
      join ancestors a on c.id = a.id
      where c.parent_id is not null
        and not c.parent_id = any(a.visited)
    )
    select 1 from ancestors where id = new.id
  ) then
    raise exception 'Category hierarchy cannot contain a cycle';
  end if;

  return new;
end;
$$;

create trigger product_categories_no_cycle
before insert or update of parent_id on public.product_categories
for each row execute function public.prevent_product_category_cycle();

create or replace function public.touch_product_catalogue()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger product_categories_touch
before insert or update on public.product_categories
for each row execute function public.touch_product_catalogue();

create trigger products_touch
before insert or update on public.products
for each row execute function public.touch_product_catalogue();

create trigger product_variants_touch
before insert or update on public.product_variants
for each row execute function public.touch_product_catalogue();

create or replace function public.queue_product_media_cleanup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.product_media_cleanup(path, product_id)
  values(old.path, old.product_id)
  on conflict(path) do update
  set product_id = excluded.product_id,
      queued_at = now(),
      processed_at = null,
      attempts = 0,
      last_error = null;
  return old;
end;
$$;

create trigger product_images_queue_cleanup
after delete on public.product_images
for each row execute function public.queue_product_media_cleanup();

revoke all on public.product_media_cleanup from public, anon, authenticated;
grant select, update on public.product_media_cleanup to authenticated;

alter table public.product_media_cleanup enable row level security;

create policy product_media_cleanup_owner_all
on public.product_media_cleanup for all to authenticated
using((select public.is_owner()))
with check((select public.is_owner()));

alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;

revoke all on public.product_categories,
  public.products,
  public.product_variants,
  public.product_images
from public, anon, authenticated;

grant select on public.product_categories,
  public.products,
  public.product_variants,
  public.product_images
to anon, authenticated;

grant insert, update, delete on public.product_categories,
  public.products,
  public.product_variants,
  public.product_images
to authenticated;

create policy product_categories_public_read
on public.product_categories for select to anon, authenticated
using(active = true);

create policy product_categories_owner_all
on public.product_categories for all to authenticated
using((select public.is_owner()))
with check((select public.is_owner()));

create policy products_published_read
on public.products for select to anon, authenticated
using(status = 'published');

create policy products_owner_all
on public.products for all to authenticated
using((select public.is_owner()))
with check((select public.is_owner()));

create policy product_variants_published_read
on public.product_variants for select to anon, authenticated
using(
  active = true
  and exists(
    select 1
    from public.products p
    where p.id = product_id
      and p.status = 'published'
  )
);

create policy product_variants_owner_all
on public.product_variants for all to authenticated
using((select public.is_owner()))
with check((select public.is_owner()));

create policy product_images_published_read
on public.product_images for select to anon, authenticated
using(
  exists(
    select 1
    from public.products p
    where p.id = product_id
      and p.status = 'published'
  )
);

create policy product_images_owner_all
on public.product_images for all to authenticated
using((select public.is_owner()))
with check((select public.is_owner()));

create or replace function public.replace_product_images(
  target_product uuid,
  new_images jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_owner() then
    raise exception 'Owner access required';
  end if;
  if jsonb_typeof(new_images) <> 'array'
     or jsonb_array_length(new_images) > 20 then
    raise exception 'Maximum 20 product images';
  end if;
  if not exists(
    select 1 from public.products where id = target_product
  ) then
    raise exception 'Product not found';
  end if;

  delete from public.product_images
  where product_id = target_product;

  insert into public.product_images(
    product_id, path, alt, position, is_cover
  )
  select
    target_product,
    x.path,
    coalesce(x.alt, ''),
    x.position,
    coalesce(x.is_cover, false)
  from jsonb_to_recordset(new_images) as x(
    path text,
    alt text,
    position integer,
    is_cover boolean
  );
end;
$$;

create or replace function public.save_product_with_variants(
  target_product uuid,
  product_data jsonb,
  variant_data jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_product uuid;
  product_name text;
  product_category_id uuid;
  product_description text;
  product_collection text;
  product_base_price numeric(16,2);
  product_currency text;
  product_compare_at_price numeric(16,2);
  product_status text;
  product_featured boolean;
begin
  if not public.is_owner() then
    raise exception 'Owner access required';
  end if;

  if jsonb_typeof(product_data) <> 'object'
     or jsonb_typeof(variant_data) <> 'array'
     or jsonb_array_length(variant_data) > 200 then
    raise exception 'Invalid product or variant payload';
  end if;

  product_name := nullif(trim(product_data->>'name'), '');
  product_category_id := nullif(product_data->>'category_id', '')::uuid;
  product_description := coalesce(product_data->>'description', '');
  product_collection := product_data->>'collection';
  product_base_price := (product_data->>'base_price')::numeric(16,2);
  product_currency := coalesce(product_data->>'currency', 'NGN');
  product_compare_at_price := nullif(product_data->>'compare_at_price', '')::numeric(16,2);
  product_status := coalesce(product_data->>'status', 'draft');
  product_featured := coalesce((product_data->>'featured')::boolean, false);

  if target_product is null then
    insert into public.products(
      category_id, name, slug, description, collection, base_price,
      currency, compare_at_price, status, featured
    )
    values(
      product_category_id,
      product_name,
      product_data->>'slug',
      product_description,
      product_collection,
      product_base_price,
      product_currency,
      product_compare_at_price,
      product_status,
      product_featured
    )
    returning id into saved_product;
  else
    update public.products
    set category_id = product_category_id,
        name = product_name,
        slug = product_data->>'slug',
        description = product_description,
        collection = product_collection,
        base_price = product_base_price,
        currency = product_currency,
        compare_at_price = product_compare_at_price,
        status = product_status,
        featured = product_featured
    where id = target_product
    returning id into saved_product;

    if saved_product is null then
      raise exception 'Product not found';
    end if;
  end if;

  delete from public.product_variants where product_id = saved_product;

  insert into public.product_variants(
    product_id, size, colour, sku, stock_quantity, price_override, active
  )
  select
    saved_product, x.size, x.colour, x.sku, x.stock_quantity,
    x.price_override, coalesce(x.active, true)
  from jsonb_to_recordset(variant_data) as x(
    size text,
    colour text,
    sku text,
    stock_quantity integer,
    price_override numeric(16,2),
    active boolean
  );

  return saved_product;
end;
$$;

create or replace function public.list_product_media_cleanup()
returns table(path text, product_id uuid, queued_at timestamptz, attempts integer, last_error text)
language sql
security invoker
set search_path = ''
as $$
  select c.path, c.product_id, c.queued_at, c.attempts, c.last_error
  from public.product_media_cleanup c
  where c.processed_at is null
  order by c.queued_at
$$;

create or replace function public.mark_product_media_cleanup(
  cleanup_paths text[],
  cleanup_error text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_owner() then
    raise exception 'Owner access required';
  end if;

  if cleanup_error is null then
    update public.product_media_cleanup
    set processed_at = now(), attempts = attempts + 1, last_error = null
    where path = any(cleanup_paths) and processed_at is null;
  else
    update public.product_media_cleanup
    set attempts = attempts + 1, last_error = left(cleanup_error, 1000)
    where path = any(cleanup_paths) and processed_at is null;
  end if;
end;
$$;

revoke all on function public.touch_product_catalogue() from public, anon, authenticated;
revoke all on function public.replace_product_images(uuid, jsonb) from public, anon;
revoke all on function public.prevent_product_category_cycle() from public, anon, authenticated;
revoke all on function public.queue_product_media_cleanup() from public, anon, authenticated;
revoke all on function public.save_product_with_variants(uuid, jsonb, jsonb) from public, anon;
revoke all on function public.list_product_media_cleanup() from public, anon;
revoke all on function public.mark_product_media_cleanup(text[], text) from public, anon;
grant execute on function public.replace_product_images(uuid, jsonb) to authenticated;
grant execute on function public.save_product_with_variants(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.list_product_media_cleanup() to authenticated;
grant execute on function public.mark_product_media_cleanup(text[], text) to authenticated;

-- Extend the existing private bucket without changing its size limit or
-- removing the legacy listing/article policies.
create policy media_products_published_read
on storage.objects for select to anon, authenticated
using(
  bucket_id = 'catalogue-media'
  and exists(
    select 1
    from public.product_images i
    join public.products p on p.id = i.product_id
    where i.path = name
      and p.status = 'published'
  )
);

create policy media_products_owner_insert
on storage.objects for insert to authenticated
with check(
  bucket_id = 'catalogue-media'
  and (select public.is_owner())
  and name ~ '^products/[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp)$'
);

create policy media_products_owner_update
on storage.objects for update to authenticated
using(
  bucket_id = 'catalogue-media'
  and (select public.is_owner())
)
with check(
  bucket_id = 'catalogue-media'
  and (select public.is_owner())
  and name ~ '^products/[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp)$'
);

commit;
