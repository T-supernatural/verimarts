import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import console from "node:console";
const db = new PGlite();
const owner = "11111111-1111-4111-8111-111111111111",
  outsider = "22222222-2222-4222-8222-222222222222";
const draft = "33333333-3333-4333-8333-333333333333",
  published = "44444444-4444-4444-8444-444444444444";
const draftArticle = "55555555-5555-4555-8555-555555555555",
  publishedArticle = "66666666-6666-4666-8666-666666666666";
const draftPath = `listings/${draft}/77777777-7777-4777-8777-777777777777.jpg`,
  publicPath = `listings/${published}/88888888-8888-4888-8888-888888888888.jpg`;
let assertions = 0;
async function equal(sql, value, label) {
  const result = await db.query(sql);
  assert.equal(result.rows[0].value, value, label);
  assertions++;
}
async function denied(sql, label) {
  await assert.rejects(() => db.exec(sql), undefined, label);
  assertions++;
}
async function role(name, id = "") {
  await db.exec(
    `reset role; select set_config('request.jwt.claim.sub','${id}',false); set role ${name};`,
  );
}
try {
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text unique);
    alter table storage.objects enable row level security;
    grant usage on schema public,auth,storage to anon,authenticated;
    grant select on storage.objects to anon;grant select,insert,update,delete on storage.objects to authenticated;`);
  await db.exec(
    await readFile("supabase/migrations/202610090001_marketplace.sql", "utf8"),
  );
  await db.exec(
    `insert into auth.users values('${owner}'),('${outsider}');insert into private.owner_account(user_id) values('${owner}');`,
  );
  await role("authenticated", owner);
  await equal("select public.is_owner() as value", true, "owner recognized");
  await db.exec(`insert into public.listings(id,category,title,slug,description,status) values
    ('${draft}','property','Private draft','private-draft','','draft'),('${published}','farm-produce','Published produce','published-produce','Owner-provided facts','published');
    insert into public.articles(id,title,slug,body,status) values('${draftArticle}','Private article','private-article','','draft'),('${publishedArticle}','Published article','published-article','Approved writing','published');
    insert into public.listing_images(listing_id,path,position,is_cover) values('${draft}','${draftPath}',0,true),('${published}','${publicPath}',0,true);
    insert into storage.objects(bucket_id,name) values('catalogue-media','${draftPath}'),('catalogue-media','${publicPath}');`);
  await equal(
    "select count(*)::int as value from public.listings",
    2,
    "owner sees drafts",
  );
  await denied(
    `insert into private.owner_account(user_id) values('${outsider}')`,
    "owner cannot grant account access through API role",
  );
  await denied(
    `update public.listings set details='{"transaction":"Auction"}' where id='${draft}'`,
    "invalid property transaction blocked",
  );
  await denied(
    `update public.listings set details='{"make":"Invented field"}' where id='${draft}'`,
    "wrong category fields blocked",
  );
  await denied(
    `update public.listings set status='published' where id='${draft}'`,
    "empty draft cannot publish",
  );
  await denied(
    `insert into storage.objects(bucket_id,name) values('catalogue-media','unsafe.svg')`,
    "unsafe storage path blocked",
  );
  await role("anon");
  await equal(
    "select public.is_owner() as value",
    false,
    "anonymous is not owner",
  );
  await equal(
    "select count(*)::int as value from public.listings",
    1,
    "anonymous only sees published listings",
  );
  await equal(
    "select count(*)::int as value from public.articles",
    1,
    "anonymous only sees published articles",
  );
  await equal(
    "select count(*)::int as value from public.listing_images",
    1,
    "draft image metadata hidden",
  );
  await equal(
    "select count(*)::int as value from storage.objects",
    1,
    "draft storage objects hidden",
  );
  await denied(
    `insert into public.listings(category,title,slug) values('cars','Unauthorized','unauthorized')`,
    "anonymous cannot insert",
  );
  await denied(`delete from public.listings`, "anonymous cannot delete");
  await denied(
    `select * from private.owner_account`,
    "owner account mapping is private",
  );
  await role("authenticated", outsider);
  await equal(
    "select public.is_owner() as value",
    false,
    "other signed-in user is not owner",
  );
  await equal(
    "select count(*)::int as value from public.listings",
    1,
    "other user cannot read drafts",
  );
  await equal(
    "select count(*)::int as value from storage.objects",
    1,
    "other user cannot read draft media",
  );
  await denied(
    `insert into public.articles(title,slug) values('Attack','attack')`,
    "other user cannot insert article",
  );
  await db.exec(
    `update public.listings set title='Changed' where id='${published}';delete from public.articles where id='${publishedArticle}';`,
  );
  await equal(
    `select title='Published produce' as value from public.listings where id='${published}'`,
    true,
    "other user update touches no rows",
  );
  await equal(
    "select count(*)::int as value from public.articles",
    1,
    "other user delete touches no rows",
  );
  await denied(
    `select public.replace_listing_images('${published}','[]')`,
    "other user cannot invoke image replacement",
  );
  await denied(
    `insert into storage.objects(bucket_id,name) values('catalogue-media','listings/${draft}/99999999-9999-4999-8999-999999999999.jpg')`,
    "other user cannot upload",
  );
  await role("authenticated", owner);
  await denied(
    `select public.replace_listing_images('${published}','[{"path":"${draftPath}","position":0}]')`,
    "cross-listing media association blocked atomically",
  );
  await equal(
    `select count(*)::int as value from public.listing_images where listing_id='${published}'`,
    1,
    "failed replacement preserves existing image",
  );
  await denied(
    `select public.save_listing_with_images((select to_jsonb(l)||'{"title":"Must roll back"}'::jsonb from public.listings l where id='${published}'),'[{"path":"${draftPath}","position":0}]')`,
    "invalid image aborts whole listing save",
  );
  await equal(
    `select title='Published produce' as value from public.listings where id='${published}'`,
    true,
    "listing fields roll back with failed images",
  );
  await db.exec(
    `select public.save_listing_with_images((select to_jsonb(l)||'{"title":"Owner edited produce"}'::jsonb from public.listings l where id='${published}'),'[{"path":"${publicPath}","position":0,"is_cover":true}]')`,
  );
  await equal(
    `select title='Owner edited produce' as value from public.listings where id='${published}'`,
    true,
    "owner can save listing and images atomically",
  );
  await db.exec(
    `update public.listings set status='draft' where id='${published}';update public.articles set status='draft' where id='${publishedArticle}';`,
  );
  await role("anon");
  await equal(
    "select count(*)::int as value from public.listings",
    0,
    "unpublished listings hidden immediately",
  );
  await equal(
    "select count(*)::int as value from public.articles",
    0,
    "unpublished articles hidden immediately",
  );
  await equal(
    "select count(*)::int as value from storage.objects",
    0,
    "unpublished media select denied immediately",
  );
  await db.exec("reset role");
  const listingsBeforeFarm = (
    await db.query("select count(*)::int as c from public.listings")
  ).rows[0].c;
  await db.exec(
    await readFile(
      "supabase/migrations/202610100001_farm_and_paint.sql",
      "utf8",
    ),
  );
  await equal(
    "select count(*)::int as value from public.listings",
    listingsBeforeFarm,
    "new migration preserves existing listings",
  );
  await role("anon");
  await equal(
    "select whatsapp='09070419149' as value from public.business_pages where id='livelong-farm'",
    true,
    "public farm contacts match supplied information",
  );
  await denied(
    "update public.business_pages set heading='Unauthorized'",
    "anonymous visitor cannot edit farm page",
  );
  await role("authenticated", outsider);
  await db.exec("update public.business_pages set heading='Unauthorized'");
  await equal(
    "select heading='Organic Farm Produce & Aquaculture.' as value from public.business_pages",
    true,
    "unrelated account cannot change farm information",
  );
  await denied(
    "insert into public.listings(category,title,slug,description,status) values('paint-production','Unauthorized paint','unauthorized-paint','No','published')",
    "unrelated account cannot create paint products",
  );
  await role("authenticated", owner);
  await db.exec(
    "update public.business_pages set status='draft'; insert into public.listings(category,title,slug,description,details,status) values('livelong-farm','Test catfish','test-catfish','Confirmed test data','{\"offering_type\":\"Farm products\",\"unit\":\"kg\"}','draft'),('paint-production','Test paint','test-paint','Confirmed test data','{\"paint_type\":\"Test type\",\"colour\":\"Test colour\",\"volume\":\"Test volume\"}','draft')",
  );
  await role("anon");
  await equal(
    "select count(*)::int as value from public.business_pages",
    0,
    "farm page drafts are private",
  );
  await equal(
    "select count(*)::int as value from public.listings where category in ('livelong-farm','paint-production')",
    0,
    "new category drafts are private",
  );
  await role("authenticated", owner);
  await db.exec(
    "update public.business_pages set status='published'; update public.listings set status='published' where slug in ('test-catfish','test-paint')",
  );
  await denied(
    "update public.listings set details='{\"made_up_field\":\"bad\"}' where slug='test-paint'",
    "paint fields are enforced at database level",
  );
  await denied(
    "update public.business_pages set products='[123]'",
    "farm offering names are validated",
  );
  await role("anon");
  await equal(
    "select count(*)::int as value from public.listings where category in ('livelong-farm','paint-production')",
    2,
    "published new category listings are public",
  );
  await db.exec("reset role");
  await db.exec(
    "insert into public.listings(category,title,slug,description,details,status) values('farm-produce','Legacy farm','legacy-farm','Existing farm listing','{\"origin\":\"Owner supplied origin\"}','draft')",
  );
  await db.exec(
    await readFile(
      "supabase/migrations/202610100002_merge_farm_categories.sql",
      "utf8",
    ),
  );
  await equal(
    "select count(*)::int as value from public.listings where category='farm-produce'",
    0,
    "legacy farm category is merged",
  );
  await equal(
    "select details->>'origin' as value from public.listings where slug='legacy-farm' and category='livelong-farm'",
    "Owner supplied origin",
    "merge preserves farm details",
  );
  await role("anon");
  await equal(
    "select count(*)::int as value from public.listings where slug='legacy-farm'",
    0,
    "merged draft remains private",
  );
  await db.exec("reset role");
  await db.exec(
    await readFile(
      "supabase/migrations/202610110001_repair_media_uploads_and_videos.sql",
      "utf8",
    ),
  );
  await equal(
    "select file_size_limit as value from storage.buckets where id='catalogue-media'",
    5242880,
    "media bucket enforces configured 5 MiB cap",
  );
  await equal(
    "select 'video/webm'=any(allowed_mime_types) as value from storage.buckets where id='catalogue-media'",
    true,
    "media bucket allows WebM uploads",
  );
  await role("authenticated", owner);
  await db.exec(
    `insert into storage.objects(bucket_id,name) values('catalogue-media','listings/${published}/99999999-9999-4999-8999-999999999999.webm'); insert into public.listing_images(listing_id,path,position,is_cover,media_type,duration_seconds) values('${published}','listings/${published}/99999999-9999-4999-8999-999999999999.webm',1,false,'video',30)`,
  );
  await denied(
    `insert into public.listing_images(listing_id,path,position,is_cover,media_type,duration_seconds) values('${published}','listings/${published}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.mp4',2,false,'video',31)`,
    "database rejects videos over 30 seconds",
  );
  await role("authenticated", outsider);
  await denied(
    `insert into storage.objects(bucket_id,name) values('catalogue-media','listings/${published}/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.mp4')`,
    "non-owner cannot upload video media",
  );
  await db.exec("reset role");
  const earlierListings = (
    await db.query(
      "select count(*)::int as c from public.listings where category not in ('women','men','children','accessories')",
    )
  ).rows[0].c;
  assert.ok(earlierListings > 0, "fixture includes earlier categories");
  await db.exec(
    await readFile(
      "supabase/migrations/202611020001_fashion_catalogue.sql",
      "utf8",
    ),
  );
  const { starterListings, starterImages, starterArticles } = await import(
    "../src/data/starterCatalogue.ts"
  );
  await role("authenticated", owner);
  await db.query(
    "insert into public.listings select * from jsonb_populate_recordset(null::public.listings,$1::jsonb)",
    [JSON.stringify(starterListings)],
  );
  await db.query(
    "insert into public.listing_images(listing_id,path,alt,position,is_cover) select listing_id,path,alt,position,is_cover from jsonb_populate_recordset(null::public.listing_images,$1::jsonb)",
    [JSON.stringify(starterImages)],
  );
  await db.query(
    "insert into public.articles select * from jsonb_populate_recordset(null::public.articles,$1::jsonb)",
    [JSON.stringify(starterArticles)],
  );
  await equal(
    "select count(*)::int as value from public.listings where category in ('women','men','children','accessories')",
    starterListings.length,
    "every starter product satisfies catalogue validation",
  );
  await denied(
    "update public.listings set details='{\"make\":\"Invented\"}' where slug='ember-maxi-gown'",
    "clothing departments reject vehicle fields",
  );
  await denied(
    "update public.listings set details='{\"compare_at_price\":\"100\"}' where slug='ember-maxi-gown'",
    "sale price must sit above the current price",
  );
  await denied(
    "update public.listings set details='{\"compare_at_price\":\"abc\"}' where slug='ember-maxi-gown'",
    "sale price must be numeric",
  );
  await equal(
    "select count(*)::int as value from public.listings where category not in ('women','men','children','accessories')",
    earlierListings,
    "earlier records survive the fashion migration",
  );
  await role("authenticated", outsider);
  await denied(
    "insert into public.listings(category,title,slug,description,status) values('women','Unauthorized','unauthorized-dress','No','published')",
    "unrelated account cannot create clothing products",
  );
  await role("anon");
  await denied(
    "insert into public.listings(category,title,slug,description,status) values('men','Anonymous','anonymous-shirt','No','published')",
    "anonymous visitor cannot create clothing products",
  );
  console.log(
    `${assertions} PostgreSQL RLS, authorization, validation and Storage-policy assertions passed.`,
  );
} finally {
  await db.close();
}
