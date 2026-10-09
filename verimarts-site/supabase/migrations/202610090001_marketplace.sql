begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.owner_account (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id) on delete cascade
);
alter table private.owner_account enable row level security;
revoke all on private.owner_account from public, anon, authenticated;

create or replace function public.is_owner() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from private.owner_account where user_id = (select auth.uid()));
$$;
revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to anon, authenticated;

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  category text not null check(category in ('cars','property','farm-produce','electronics','other-goods')),
  title text not null check(length(trim(title)) between 1 and 180),
  slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug)<=180),
  description text not null default '' check(length(description)<=20000),
  price numeric(16,2) check(price is null or price>=0),
  currency text check(currency is null or currency ~ '^[A-Z]{3}$'),
  price_label text not null default '' check(length(price_label)<=180),
  availability text not null default 'not-provided' check(availability in ('available','unavailable','sold','not-provided')),
  status text not null default 'draft' check(status in ('draft','published')),
  featured boolean not null default false,
  location text not null default '' check(length(location)<=500),
  details jsonb not null default '{}'::jsonb check(jsonb_typeof(details)='object'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(price is null or currency is not null),
  check(status='draft' or length(trim(description))>0)
);
create table public.listing_images (
  id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.listings(id) on delete cascade,
  path text not null unique, alt text not null default '' check(length(alt)<=500),
  position integer not null check(position>=0 and position<20), is_cover boolean not null default false,
  check(path like 'listings/' || listing_id::text || '/%'), unique(listing_id,position)
);
create unique index listing_one_cover on public.listing_images(listing_id) where is_cover;
create table public.articles (
  id uuid primary key default gen_random_uuid(), title text not null check(length(trim(title)) between 1 and 180),
  slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug)<=180),
  category text not null default '' check(length(category)<=100), body text not null default '' check(length(body)<=100000),
  cover_path text, cover_alt text not null default '' check(length(cover_alt)<=500),
  status text not null default 'draft' check(status in ('draft','published')),
  published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(cover_path is null or cover_path like 'articles/' || id::text || '/%'),
  check(status='draft' or length(trim(body))>0)
);
create index listings_public_category on public.listings(category,created_at desc) where status='published';
create index articles_public_date on public.articles(published_at desc) where status='published';
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.articles enable row level security;
revoke all on public.listings, public.listing_images, public.articles from anon, authenticated;
grant select on public.listings, public.listing_images, public.articles to anon, authenticated;
grant insert,update,delete on public.listings, public.listing_images, public.articles to authenticated;
create policy listings_published_read on public.listings for select to anon,authenticated using(status='published');
create policy listings_owner_all on public.listings for all to authenticated using((select public.is_owner())) with check((select public.is_owner()));
create policy images_published_read on public.listing_images for select to anon,authenticated using(exists(select 1 from public.listings l where l.id=listing_id and l.status='published'));
create policy images_owner_all on public.listing_images for all to authenticated using((select public.is_owner())) with check((select public.is_owner()));
create policy articles_published_read on public.articles for select to anon,authenticated using(status='published');
create policy articles_owner_all on public.articles for all to authenticated using((select public.is_owner())) with check((select public.is_owner()));

create function public.validate_listing() returns trigger language plpgsql set search_path='' as $$
declare allowed text[]; entry record;
begin
  allowed := case new.category
    when 'cars' then array['make','model','trim','year','mileage','transmission','fuel','body','colour','condition']
    when 'property' then array['property_type','transaction','bedrooms','bathrooms','size','features']
    when 'farm-produce' then array['produce','unit','quantity','origin','harvest']
    when 'electronics' then array['brand','model','product_type','condition','specifications','accessories']
    else array['product_type','condition','attributes'] end;
  for entry in select * from jsonb_each(new.details) loop
    if not (entry.key=any(allowed)) or jsonb_typeof(entry.value)<>'string' or length(entry.value#>>'{}')>5000 then
      raise exception 'Invalid category-specific field';
    end if;
    if entry.key in ('year','mileage','bedrooms','bathrooms') and (entry.value#>>'{}') !~ '^[0-9]+$' then raise exception 'Numeric fields must contain nonnegative integers'; end if;
    if entry.key='transaction' and (entry.value#>>'{}') not in ('Sale','Rent') then raise exception 'Property transaction must be owner-confirmed Sale or Rent, or omitted'; end if;
  end loop;
  if tg_op='UPDATE' then new.created_at:=old.created_at; end if;
  new.updated_at:=now();return new;
end;$$;
create trigger listings_validate before insert or update on public.listings for each row execute function public.validate_listing();
create function public.stamp_article() returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op='UPDATE' then new.created_at:=old.created_at; end if;
  if new.status='published' and new.published_at is null then new.published_at:=now(); end if;
  new.updated_at:=now();return new;
end;$$;
create trigger articles_stamp before insert or update on public.articles for each row execute function public.stamp_article();
revoke all on function public.validate_listing(),public.stamp_article() from public,anon,authenticated;

create function public.replace_listing_images(target_listing uuid,new_images jsonb) returns void language plpgsql security invoker set search_path='' as $$
begin
  if not public.is_owner() then raise exception 'Owner access required'; end if;
  if jsonb_typeof(new_images)<>'array' or jsonb_array_length(new_images)>20 then raise exception 'Maximum 20 images'; end if;
  if not exists(select 1 from public.listings where id=target_listing) then raise exception 'Listing not found'; end if;
  delete from public.listing_images where listing_id=target_listing;
  insert into public.listing_images(listing_id,path,alt,position,is_cover)
    select target_listing,x.path,coalesce(x.alt,''),x.position,coalesce(x.is_cover,false)
    from jsonb_to_recordset(new_images) as x(path text,alt text,position integer,is_cover boolean);
end;$$;
revoke all on function public.replace_listing_images(uuid,jsonb) from public,anon;
grant execute on function public.replace_listing_images(uuid,jsonb) to authenticated;

create function public.save_listing_with_images(listing_data jsonb,new_images jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare target_listing uuid;
begin
  if not public.is_owner() then raise exception 'Owner access required'; end if;
  target_listing := (listing_data->>'id')::uuid;
  insert into public.listings select (jsonb_populate_record(null::public.listings,listing_data)).*
    on conflict(id) do update set category=excluded.category,title=excluded.title,slug=excluded.slug,
      description=excluded.description,price=excluded.price,currency=excluded.currency,price_label=excluded.price_label,
      availability=excluded.availability,status=excluded.status,featured=excluded.featured,location=excluded.location,details=excluded.details;
  perform public.replace_listing_images(target_listing,new_images);
end;$$;
revoke all on function public.save_listing_with_images(jsonb,jsonb) from public,anon;
grant execute on function public.save_listing_with_images(jsonb,jsonb) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('catalogue-media','catalogue-media',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy media_published_read on storage.objects for select to anon,authenticated using(
  bucket_id='catalogue-media' and (
    exists(select 1 from public.listing_images i join public.listings l on l.id=i.listing_id where i.path=name and l.status='published')
    or exists(select 1 from public.articles a where a.cover_path=name and a.status='published')
  )
);
create policy media_owner_read on storage.objects for select to authenticated using(bucket_id='catalogue-media' and (select public.is_owner()));
create policy media_owner_insert on storage.objects for insert to authenticated with check(bucket_id='catalogue-media' and (select public.is_owner()) and name ~ '^(listings|articles)/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$');
create policy media_owner_update on storage.objects for update to authenticated using(bucket_id='catalogue-media' and (select public.is_owner())) with check(bucket_id='catalogue-media' and (select public.is_owner()) and name ~ '^(listings|articles)/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$');
create policy media_owner_delete on storage.objects for delete to authenticated using(bucket_id='catalogue-media' and (select public.is_owner()));
commit;
