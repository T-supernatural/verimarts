import { readFile, writeFile, mkdir } from "node:fs/promises";
const data = JSON.parse(await readFile("src/data/demoContent.json", "utf8"));
await mkdir("public/assets/handover", { recursive: true });
const prices = {
  cars: [8500000, 12500000, 19500000, 28000000, 24000000, 35000000],
  property: [45000000, 125000000, 85000000, 60000000, 25000000, 28000000],
  "farm-produce": [18000, 45000, 12000, 28000, 9500, 15000, 3500, 6500],
  electronics: [480000, 285000, 190000, 420000, 650000, 45000],
  "other-goods": [95000, 320000, 450000, 85000, 28000, 65000],
};
const counts = {};
const media = {};
function art(kind, title, n) {
  const accent = ["#FF0000", "#a70e20", "#c67628", "#438b53"][n % 4];
  const shapes = {
    property: `<path d="M280 430V230L600 100l320 130v200z" fill="#c0c0c0"/><path d="M245 240L600 65l355 175" fill="none" stroke="${accent}" stroke-width="24"/><rect x="560" y="270" width="100" height="160" fill="#202024"/><g fill="#4b6978"><rect x="340" y="250" width="130" height="95"/><rect x="730" y="250" width="130" height="95"/></g>`,
    "farm-produce": `<path d="M290 300h620l-50 155H340z" fill="#b18450"/><path d="M310 345h580M330 385h540M350 425h500" stroke="#79552e" stroke-width="10"/><g fill="${accent}" stroke="#fff" stroke-opacity=".12" stroke-width="4">${[0, 1, 2, 3, 4].map((i) => `<ellipse cx="${365 + i * 118}" cy="${250 + (i % 2) * 25}" rx="75" ry="70"/><path d="M${365 + i * 118} 205q-40-70 25-75" fill="none" stroke="#407848" stroke-width="17"/>`).join("")}</g>`,
    electronics: `<rect x="300" y="140" width="600" height="310" rx="20" fill="#c0c0c0"/><rect x="320" y="160" width="560" height="270" rx="7" fill="#1e2531"/><path d="M320 410L660 160h220v70L620 430H320z" fill="${accent}" opacity=".7"/><path d="M250 455h700l55 45H195z" fill="#999"/><rect x="870" y="260" width="125" height="245" rx="18" fill="#25252b" stroke="#c0c0c0" stroke-width="7"/><rect x="885" y="285" width="95" height="185" fill="${accent}"/>`,
    "other-goods": `<rect x="265" y="260" width="670" height="180" rx="38" fill="${accent}"/><rect x="290" y="160" width="620" height="170" rx="55" fill="${accent}"/><path d="M600 190v115M290 330h620" stroke="#111" stroke-opacity=".3" stroke-width="8"/><rect x="240" y="255" width="95" height="200" rx="25" fill="#a7192b"/><rect x="865" y="255" width="95" height="200" rx="25" fill="#a7192b"/><path d="M305 455v45M895 455v45" stroke="#b0b0b0" stroke-width="18"/>`,
    journal: `<rect x="340" y="125" width="520" height="340" rx="10" fill="#c0c0c0"/><path d="M600 140v305" stroke="#555" stroke-width="7"/><path d="M375 210h180M375 255h180M375 300h180M645 210h180M645 255h180M645 300h180" stroke="${accent}" stroke-width="15"/>`,
  };
  const escaped = title.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720"><defs><radialGradient id="g"><stop stop-color="#35353c"/><stop offset="1" stop-color="#0c0c10"/></radialGradient></defs><rect width="1200" height="720" fill="url(#g)"/><circle cx="1050" cy="100" r="210" fill="${accent}" opacity=".12"/><ellipse cx="600" cy="495" rx="420" ry="45" fill="#000" opacity=".4"/>${shapes[kind] || shapes.journal}<path d="M85 600h70" stroke="#FF0000" stroke-width="7"/><text x="85" y="655" font-family="Arial,sans-serif" font-size="32" fill="#eee">${escaped}</text></svg>`;
}
for (const item of data.listings) {
  const i = counts[item.category] || 0;
  counts[item.category] = i + 1;
  item.title = item.title.replace(/^Demo\s*—\s*/, "");
  item.slug = item.slug.replace(/^demo-/, "");
  item.price = prices[item.category][i];
  item.currency = "NGN";
  item.price_label = "";
  item.description = `Explore this ${item.title.toLowerCase()} listing. Contact Verimarts to discuss its details, current availability and the next steps.`;
  const file = `${item.slug}.svg`;
  const path = `listings/${item.id}/handover-cover.svg`;
  if (item.category === "cars") media[path] = `/assets/car-${(i % 4) + 1}.webp`;
  else {
    await writeFile(
      `public/assets/handover/${file}`,
      art(item.category, item.title, i),
    );
    media[path] = `/assets/handover/${file}`;
  }
}
for (const [i, item] of data.articles.entries()) {
  item.title = item.title.replace(/^Sample\s*—\s*/, "");
  item.slug = item.slug.replace(/^sample-/, "");
  const paragraphs = item.body
    .split("\n\n")
    .filter(
      (p) =>
        !/sample|template|demonstration|replace|handover|before publishing|the owner can|the client can|this journal space|placeholder/i.test(
          p,
        ),
    );
  item.body =
    paragraphs.join("\n\n") ||
    "Discover the categories at Verimarts and explore the details of the listings that interest you.\n\nA direct conversation helps clarify the information you need before taking the next step.";
  item.cover_path = `articles/${item.id}/handover-cover.svg`;
  item.cover_alt = `Illustration for ${item.title}`;
  const file = `journal-${i + 1}.svg`;
  await writeFile(
    `public/assets/handover/${file}`,
    art("journal", item.title, i),
  );
  media[item.cover_path] = `/assets/handover/${file}`;
}
await writeFile(
  "src/data/demoContent.json",
  JSON.stringify(data, null, 2) + "\n",
);
await writeFile(
  "src/data/handoverMedia.json",
  JSON.stringify(media, null, 2) + "\n",
);
const q = (v) =>
  v === null
    ? "null"
    : typeof v === "boolean" || typeof v === "number"
      ? String(v)
      : `'${String(typeof v === "object" ? JSON.stringify(v) : v).replace(/'/g, "''")}'`;
let sql =
  "-- Optional handover placeholders: illustrative media and invented NGN prices, not verified stock.\n-- Run as postgres. Updates earlier labelled imports; preserves subsequently edited titles.\nbegin;\n";
for (const table of ["listings", "articles"]) {
  const rows = data[table],
    keys = Object.keys(rows[0]);
  sql += `insert into public.${table} (${keys.join(",")}) values\n${rows.map((r) => `(${Object.values(r).map(q).join(",")})`).join(",\n")}\non conflict (id) do update set ${keys
    .filter((k) => k !== "id")
    .map((k) => `${k}=excluded.${k}`)
    .join(
      ",",
    )} where public.${table}.title like '${table === "listings" ? "Demo" : "Sample"} — %';\n`;
}
for (const item of data.listings)
  sql += `insert into public.listing_images(listing_id,path,alt,position,is_cover) select ${q(item.id)},${q(`listings/${item.id}/handover-cover.svg`)},${q(`Illustrative image for ${item.title}`)},0,true where not exists(select 1 from public.listing_images where listing_id=${q(item.id)}) on conflict do nothing;\n`;
sql += "commit;\n";
await writeFile("supabase/demo-content.sql", sql);
