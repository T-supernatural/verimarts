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
  const demoSeed = await readFile("supabase/demo-content.sql", "utf8");
  await db.exec(demoSeed);
  await equal(
    "select count(*)::int as value from public.listings where id::text like 'de000000-%'",
    32,
    "all demo listings satisfy schema validation",
  );
  await equal(
    "select count(*)::int as value from public.articles where id::text like 'de000000-%'",
    10,
    "all sample articles satisfy schema validation",
  );
  await db.exec(
    "update public.listings set title='Owner replacement' where slug='city-hatchback'",
  );
  await db.exec(demoSeed);
  await equal(
    "select count(*)::int as value from public.listings where id::text like 'de000000-%'",
    32,
    "rerunning seed does not duplicate listings",
  );
  await equal(
    "select title='Owner replacement' as value from public.listings where slug='city-hatchback'",
    true,
    "seed preserves owner edits",
  );
  await role("anon");
  await equal(
    "select count(*)::int as value from public.articles",
    10,
    "published samples are visible publicly",
  );
  await equal("select count(*)::int as value from public.listing_images where listing_id::text like 'de000000-%'",32,"handover listings have image metadata");
  await equal("select count(*)::int as value from public.listings where id::text like 'de000000-%' and price>0 and currency='NGN'",32,"handover listings have NGN prices");
  await db.exec("reset role; update public.listings set title='Demo — Family sedan',slug='demo-family-sedan',price=null,currency=null where slug='family-sedan'");
  await db.exec(demoSeed);
  await equal("select title='Family sedan' and price=12500000 and slug='family-sedan' as value from public.listings where id='de000000-0000-4000-8000-000000000002'",true,"seed upgrades earlier labelled catalogue");
  console.log(
    `${assertions} PostgreSQL RLS, authorization, validation and Storage-policy assertions passed.`,
  );
} finally {
  await db.close();
}
