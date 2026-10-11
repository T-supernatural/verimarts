begin;

-- The existing deployment has a 5 MiB project-wide Storage ceiling and a
-- matching private bucket ceiling. Keep the bucket aligned if it pre-existed.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'catalogue-media',
  'catalogue-media',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp','video/mp4','video/webm']
)
on conflict(id) do update set
  name=excluded.name,
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

alter table public.listing_images
  add column media_type text not null default 'image'
    check(media_type in ('image','video')),
  add column duration_seconds integer,
  add constraint listing_images_media_metadata_check check(
    (media_type='image' and duration_seconds is null and path ~* '[.](jpg|png|webp|svg)$')
    or
    (media_type='video' and duration_seconds between 1 and 30 and path ~* '[.](mp4|webm)$')
  );

create or replace function public.replace_listing_images(target_listing uuid,new_images jsonb)
returns void language plpgsql security invoker set search_path='' as $$
begin
  if not public.is_owner() then raise exception 'Owner access required'; end if;
  if jsonb_typeof(new_images)<>'array' or jsonb_array_length(new_images)>20 then raise exception 'Maximum 20 media files'; end if;
  if not exists(select 1 from public.listings where id=target_listing) then raise exception 'Listing not found'; end if;
  delete from public.listing_images where listing_id=target_listing;
  insert into public.listing_images(listing_id,path,alt,position,is_cover,media_type,duration_seconds)
    select target_listing,x.path,coalesce(x.alt,''),x.position,coalesce(x.is_cover,false),coalesce(x.media_type,'image'),x.duration_seconds
    from jsonb_to_recordset(new_images) as x(path text,alt text,position integer,is_cover boolean,media_type text,duration_seconds integer);
end;$$;
revoke all on function public.replace_listing_images(uuid,jsonb) from public,anon;
grant execute on function public.replace_listing_images(uuid,jsonb) to authenticated;

drop policy if exists media_owner_insert on storage.objects;
drop policy if exists media_owner_update on storage.objects;
create policy media_owner_insert on storage.objects for insert to authenticated
  with check(bucket_id='catalogue-media' and (select public.is_owner()) and (
    name ~ '^articles/[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp)$'
    or name ~ '^listings/[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp|mp4|webm)$'
  ));
create policy media_owner_update on storage.objects for update to authenticated
  using(bucket_id='catalogue-media' and (select public.is_owner()))
  with check(bucket_id='catalogue-media' and (select public.is_owner()) and (
    name ~ '^articles/[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp)$'
    or name ~ '^listings/[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp|mp4|webm)$'
  ));

commit;
