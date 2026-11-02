begin;
-- FASHYN clothing departments. Additive: earlier categories and records stay readable
-- and editable by the owner, and the storefront simply stops showing them.
alter table public.listings drop constraint listings_category_check;
alter table public.listings add constraint listings_category_check check(category in (
  'women','men','children','accessories',
  'cars','property','farm-produce','electronics','other-goods','livelong-farm','paint-production'
));
create or replace function public.validate_listing() returns trigger language plpgsql set search_path='' as $$
declare allowed text[]; entry record;
begin
  allowed := case new.category
    when 'women' then array['product_type','sizes','colours','material','fit','care','compare_at_price']
    when 'men' then array['product_type','sizes','colours','material','fit','care','compare_at_price']
    when 'children' then array['product_type','sizes','colours','material','fit','care','compare_at_price']
    when 'accessories' then array['product_type','sizes','colours','material','fit','care','compare_at_price']
    when 'cars' then array['make','model','trim','year','mileage','transmission','fuel','body','colour','condition']
    when 'property' then array['property_type','transaction','bedrooms','bathrooms','size','features']
    when 'farm-produce' then array['produce','unit','quantity','origin','harvest']
    when 'livelong-farm' then array['offering_type','produce','unit','quantity','origin','harvest']
    when 'paint-production' then array['paint_type','colour','volume']
    when 'electronics' then array['brand','model','product_type','condition','specifications','accessories']
    else array['product_type','condition','attributes'] end;
  for entry in select * from jsonb_each(new.details) loop
    if not (entry.key=any(allowed)) or jsonb_typeof(entry.value)<>'string' or length(entry.value#>>'{}')>5000 then raise exception 'Invalid category-specific field'; end if;
    if entry.key in ('year','mileage','bedrooms','bathrooms') and (entry.value#>>'{}') !~ '^[0-9]+$' then raise exception 'Numeric fields must contain nonnegative integers'; end if;
    if entry.key='transaction' and (entry.value#>>'{}') not in ('Sale','Rent') then raise exception 'Property transaction must be owner-confirmed Sale or Rent, or omitted'; end if;
    if entry.key='offering_type' and (entry.value#>>'{}') not in ('Farm products','Aquaculture') then raise exception 'Choose Farm products or Aquaculture'; end if;
    if entry.key='compare_at_price' and (
      (entry.value#>>'{}') !~ '^[0-9]+([.][0-9]{1,2})?$'
      or new.price is null
      or (entry.value#>>'{}')::numeric <= new.price
    ) then raise exception 'The original price must be a number above the current price'; end if;
  end loop;
  if tg_op='UPDATE' then new.created_at:=old.created_at; end if;
  new.updated_at:=now();return new;
end;$$;
revoke all on function public.validate_listing() from public,anon,authenticated;
create index if not exists listings_public_fashion on public.listings(category,featured,created_at desc)
  where status='published' and category in ('women','men','children','accessories');
commit;
