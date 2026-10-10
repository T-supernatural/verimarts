begin;
-- Extend the existing catalogue without deleting or recategorizing records.
alter table public.listings drop constraint listings_category_check;
alter table public.listings add constraint listings_category_check check(category in ('cars','property','farm-produce','electronics','other-goods','livelong-farm','paint-production'));
create or replace function public.validate_listing() returns trigger language plpgsql set search_path='' as $$
declare allowed text[]; entry record;
begin
  allowed := case new.category
    when 'cars' then array['make','model','trim','year','mileage','transmission','fuel','body','colour','condition']
    when 'property' then array['property_type','transaction','bedrooms','bathrooms','size','features']
    when 'farm-produce' then array['produce','unit','quantity','origin','harvest']
    when 'livelong-farm' then array['offering_type','produce','unit','quantity','harvest']
    when 'paint-production' then array['paint_type','colour','volume']
    when 'electronics' then array['brand','model','product_type','condition','specifications','accessories']
    else array['product_type','condition','attributes'] end;
  for entry in select * from jsonb_each(new.details) loop
    if not (entry.key=any(allowed)) or jsonb_typeof(entry.value)<>'string' or length(entry.value#>>'{}')>5000 then raise exception 'Invalid category-specific field'; end if;
    if entry.key in ('year','mileage','bedrooms','bathrooms') and (entry.value#>>'{}') !~ '^[0-9]+$' then raise exception 'Numeric fields must contain nonnegative integers'; end if;
    if entry.key='transaction' and (entry.value#>>'{}') not in ('Sale','Rent') then raise exception 'Property transaction must be owner-confirmed Sale or Rent, or omitted'; end if;
    if entry.key='offering_type' and (entry.value#>>'{}') not in ('Farm products','Aquaculture') then raise exception 'Choose Farm products or Aquaculture'; end if;
  end loop;
  if tg_op='UPDATE' then new.created_at:=old.created_at; end if;
  new.updated_at:=now();return new;
end;$$;
revoke all on function public.validate_listing() from public,anon,authenticated;

create table public.business_pages (
  id text primary key check(id='livelong-farm'),
  heading text not null check(length(trim(heading)) between 1 and 180),
  intro text not null default '' check(length(intro)<=10000),
  main_address text not null default '' check(length(main_address)<=500),
  branch_address text not null default '' check(length(branch_address)<=500),
  whatsapp text not null default '' check(length(whatsapp)<=30 and whatsapp ~ '^[+0-9 ()-]*$'),
  phone text not null default '' check(length(phone)<=30 and phone ~ '^[+0-9 ()-]*$'),
  email text not null default '' check(length(email)<=254),
  website text not null default '' check(length(website)<=500),
  products jsonb not null default '[]'::jsonb check(jsonb_typeof(products)='array' and jsonb_array_length(products)<=30),
  aquaculture jsonb not null default '[]'::jsonb check(jsonb_typeof(aquaculture)='array' and jsonb_array_length(aquaculture)<=30),
  status text not null default 'draft' check(status in ('draft','published'))
);
create function public.validate_business_page() returns trigger language plpgsql set search_path='' as $$
declare entry jsonb;
begin
  for entry in select value from jsonb_array_elements(new.products || new.aquaculture) loop
    if jsonb_typeof(entry)<>'string' or length(trim(entry#>>'{}')) not between 1 and 180 then raise exception 'Offerings must be nonempty names of at most 180 characters'; end if;
  end loop;
  return new;
end;$$;
create trigger business_pages_validate before insert or update on public.business_pages for each row execute function public.validate_business_page();
revoke all on function public.validate_business_page() from public,anon,authenticated;
alter table public.business_pages enable row level security;
revoke all on public.business_pages from public,anon,authenticated;
grant select on public.business_pages to anon,authenticated;
grant insert,update,delete on public.business_pages to authenticated;
create policy business_pages_published_read on public.business_pages for select to anon,authenticated using(status='published');
create policy business_pages_owner_all on public.business_pages for all to authenticated using((select public.is_owner())) with check((select public.is_owner()));
-- Only owner-supplied information, transcribed in the request. No stock or paint rows are seeded.
insert into public.business_pages(id,heading,main_address,branch_address,whatsapp,phone,email,website,products,aquaculture,status)
values('livelong-farm','Organic Farm Produce & Aquaculture.','No. 15, Ayinde Street, Iyana-Cele, Ogun State.','Abijo by Destiny Home Estate, Sangotedo, Ajah, Lekki, Lagos.','09070419149','08144669205','thisislivelong@gmail.com','thisislivelong.com','["Fruit smoothies and parfait","Fresh palm oil","Fresh live catfish","Cassava farm / cassava produce"]','["Pond rental","Fingerlings and juvenile fish rearing"]','published');
-- Existing listing/image/article RLS and private Storage policies cover both new categories.
commit;
