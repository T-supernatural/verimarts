// Illustrative launch range: stock photography, invented names and placeholder NGN prices.
// Replace with confirmed products before trading. Imported only by an explicit owner action,
// or shown as a preview when no Supabase backend is configured.
type Seed = {
  n: number;
  category: "women" | "men" | "children" | "accessories";
  slug: string;
  title: string;
  price: number;
  compare?: number;
  featured?: boolean;
  type: string;
  sizes: string;
  colours: string;
  material: string;
  fit?: string;
  description: string;
  extra?: string[];
};
const seeds: Seed[] = [
  { n: 1, category: "women", slug: "ember-maxi-gown", title: "Ember Maxi Gown", price: 68000, featured: true, type: "Dresses", sizes: "XS, S, M, L, XL", colours: "Ember Red", material: "Flowing chiffon", fit: "Floor length", description: "A sweeping floor-length gown with a soft pleated skirt that catches every step. Made for weddings, galas and the evenings you want remembered." },
  { n: 2, category: "women", slug: "verdant-swing-dress", title: "Verdant Swing Dress", price: 52000, featured: true, type: "Dresses", sizes: "S, M, L, XL", colours: "Palm Green", material: "Printed cotton sateen", fit: "Fitted waist, full skirt", description: "A bold botanical print on a full swing skirt. Pair with heels for occasions or flat sandals for a long lunch." },
  { n: 3, category: "women", slug: "blush-keyhole-blouse", title: "Blush Keyhole Blouse", price: 24000, type: "Tops", sizes: "XS, S, M, L", colours: "Blush", material: "Soft crepe", fit: "Regular", description: "A polished blouse with a neat collar and a delicate keyhole front. Tuck it in for work and leave it out for the weekend." },
  { n: 4, category: "women", slug: "coastline-stripe-shirt-dress", title: "Coastline Stripe Shirt Dress", price: 38000, compare: 47000, type: "Dresses", sizes: "S, M, L, XL", colours: "Sky Stripe", material: "Breathable cotton", fit: "Belted", description: "An easy striped shirt dress with a tie waist. Cool, crisp and ready for warm days." },
  { n: 5, category: "women", slug: "apricot-oversized-shirt", title: "Apricot Oversized Shirt", price: 28000, type: "Tops", sizes: "S, M, L", colours: "Apricot", material: "Washed cotton", fit: "Oversized", description: "A relaxed, roomy shirt in a sun-warmed shade. Knot it over denim or wear it open as a light layer." },
  { n: 6, category: "women", slug: "rose-longline-coat", title: "Rose Longline Coat", price: 74000, compare: 89000, featured: true, type: "Outerwear", sizes: "S, M, L", colours: "Dusty Rose", material: "Brushed wool blend", fit: "Longline", description: "A clean longline coat that lifts any outfit. The single soft colour does all the work." },
  { n: 7, category: "women", slug: "bloom-print-jumpsuit", title: "Bloom Print Jumpsuit", price: 46000, type: "Jumpsuits", sizes: "S, M, L, XL", colours: "Ivory Bloom", material: "Lightweight viscose", fit: "Relaxed leg", description: "One easy piece with a delicate floral print and a wrap neckline. Dressed up or down in seconds." },
  { n: 8, category: "women", slug: "marigold-soft-knit", title: "Marigold Soft Knit", price: 32000, type: "Knitwear", sizes: "S, M, L", colours: "Marigold", material: "Fluffy knit", fit: "Relaxed", description: "A cloud-soft jumper in our favourite colour. Instant warmth and instant mood." },
  { n: 9, category: "women", slug: "midnight-dot-blouse", title: "Midnight Dot Blouse", price: 29000, type: "Tops", sizes: "XS, S, M, L", colours: "Midnight", material: "Fluid satin", fit: "Blouson sleeve", description: "A timeless polka dot with full sleeves and a soft tie neck." },
  { n: 10, category: "men", slug: "riviera-oxford-shirt", title: "Riviera Oxford Shirt", price: 26000, type: "Shirts", sizes: "S, M, L, XL, XXL", colours: "Pale Blue", material: "Cotton oxford", fit: "Tailored", description: "A clean everyday shirt with contrast buttons. Sharp at the office and just as good with the sleeves rolled." },
  { n: 11, category: "men", slug: "onyx-biker-jacket", title: "Onyx Biker Jacket", price: 95000, compare: 120000, featured: true, type: "Outerwear", sizes: "M, L, XL", colours: "Onyx", material: "Soft leather-look", fit: "Slim", description: "A classic asymmetric biker with an attitude that never dates. Layer it over a plain tee and go." },
  { n: 12, category: "men", slug: "saffron-pullover-hoodie", title: "Saffron Pullover Hoodie", price: 35000, type: "Hoodies", sizes: "S, M, L, XL", colours: "Saffron", material: "Heavyweight fleece", fit: "Relaxed", description: "A bright, heavy pullover with a roomy hood. Weekend uniform sorted." },
  { n: 13, category: "men", slug: "washed-denim-jacket", title: "Washed Denim Jacket", price: 48000, type: "Outerwear", sizes: "S, M, L, XL", colours: "Washed Blue", material: "Cotton denim", fit: "Regular", description: "The jacket that goes with everything, softly washed and ready to wear from day one." },
  { n: 14, category: "men", slug: "merlot-three-piece-suit", title: "Merlot Three-Piece Suit", price: 145000, featured: true, type: "Suits", sizes: "48, 50, 52, 54", colours: "Merlot", material: "Fine suiting", fit: "Tailored", description: "A confident deep-red suit with waistcoat and pocket square detail. For the moments you intend to own." },
  { n: 15, category: "men", slug: "heritage-check-blazer", title: "Heritage Check Blazer", price: 88000, type: "Blazers", sizes: "48, 50, 52", colours: "Tan Check", material: "Wool blend", fit: "Tailored", description: "A refined check blazer that dresses up denim and elevates a dark trouser." },
  { n: 16, category: "men", slug: "camel-overcoat", title: "Camel Overcoat", price: 110000, type: "Outerwear", sizes: "M, L, XL", colours: "Camel", material: "Brushed wool blend", fit: "Regular", description: "A quiet classic in warm camel. Throw it over a roll-neck and you are done." },
  { n: 17, category: "men", slug: "navy-evening-suit", title: "Navy Evening Suit", price: 125000, compare: 150000, type: "Suits", sizes: "48, 50, 52, 54", colours: "Navy", material: "Fine suiting", fit: "Tailored", description: "A deep navy two-piece with a subtle sheen, made for dinners, ceremonies and big announcements." },
  { n: 18, category: "children", slug: "sailor-stripe-set", title: "Sailor Stripe Set", price: 22000, featured: true, type: "Sets", sizes: "3-4Y, 5-6Y, 7-8Y", colours: "Navy Stripe", material: "Cotton jersey", fit: "Easy", description: "A smart, playful set for little ones who refuse to stand still. Soft enough for all-day wear.", extra: ["sailor-stripe-set-2"] },
  { n: 19, category: "children", slug: "little-gent-braces-set", title: "Little Gent Braces Set", price: 19500, type: "Sets", sizes: "3-4Y, 5-6Y, 7-8Y, 9-10Y", colours: "Grey", material: "Cotton blend", fit: "Regular", description: "Tee, braces and sturdy trousers that look sharp and survive the playground." },
  { n: 20, category: "children", slug: "sunshine-cable-vest", title: "Sunshine Cable Vest", price: 16000, compare: 21000, type: "Knitwear", sizes: "3-4Y, 5-6Y, 7-8Y", colours: "Sunshine Yellow", material: "Cable knit", fit: "Regular", description: "A cheerful cable-knit vest to layer over a checked shirt for family photos and special days." },
  { n: 21, category: "children", slug: "everyday-crew-sweatshirt", title: "Everyday Crew Sweatshirt", price: 14500, type: "Tops", sizes: "5-6Y, 7-8Y, 9-10Y", colours: "Heather Grey", material: "Brushed cotton", fit: "Relaxed", description: "An easy crew-neck sweatshirt for school runs and weekends alike." },
  { n: 22, category: "children", slug: "stripe-knit-pullover", title: "Stripe Knit Pullover", price: 15500, type: "Knitwear", sizes: "2-3Y, 3-4Y, 5-6Y", colours: "Rust Stripe", material: "Soft knit", fit: "Regular", description: "Warm stripes for small adventurers." },
  { n: 23, category: "accessories", slug: "weekend-loafers", title: "Weekend Loafers", price: 42000, type: "Shoes", sizes: "40, 41, 42, 43, 44, 45", colours: "Slate, Rust, Cobalt", material: "Textured upper", description: "Soft-structured loafers with a polished metal bar. Slip on and go." },
  { n: 24, category: "accessories", slug: "cloud-knit-sneakers", title: "Cloud Knit Sneakers", price: 39000, type: "Shoes", sizes: "37, 38, 39, 40, 41, 42", colours: "Cloud White", material: "Breathable knit", description: "Featherlight knit sneakers in clean white that finish any casual look." },
  { n: 25, category: "accessories", slug: "trailhead-backpack", title: "Trailhead Backpack", price: 36000, type: "Bags", sizes: "One size", colours: "Cobalt & Tan", material: "Canvas with tan trim", description: "A roomy canvas backpack with tan straps and buckles, built for everyday carry." },
  { n: 26, category: "accessories", slug: "tassel-drop-earrings", title: "Tassel Drop Earrings", price: 12500, type: "Jewellery", sizes: "One size", colours: "Midnight", material: "Silk-look tassel", description: "A dramatic drop with graceful movement. One detail, maximum effect." },
];
const uuid = (n: number) =>
  `fa000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const timestamp = (n: number) =>
  new Date(Date.UTC(2026, 9, 1 + (seeds.length - n))).toISOString();

export const starterMedia: Record<string, string> = {};
export const starterListings = seeds.map((seed) => {
  const id = uuid(seed.n);
  const details: Record<string, string> = {
    product_type: seed.type,
    sizes: seed.sizes,
    colours: seed.colours,
    material: seed.material,
    ...(seed.fit ? { fit: seed.fit } : {}),
    ...(seed.compare ? { compare_at_price: String(seed.compare) } : {}),
  };
  return {
    id,
    category: seed.category,
    title: seed.title,
    slug: seed.slug,
    description: seed.description,
    price: seed.price,
    currency: "NGN",
    price_label: "",
    availability: "available" as const,
    status: "published" as const,
    featured: Boolean(seed.featured),
    location: "",
    details,
    created_at: timestamp(seed.n),
    updated_at: timestamp(seed.n),
  };
});
export const starterImages = seeds.flatMap((seed) =>
  [seed.slug, ...(seed.extra || [])].map((file, position) => {
    const path = `listings/${uuid(seed.n)}/starter-${position + 1}.webp`;
    starterMedia[path] = `/media/products/${file}.webp`;
    return {
      listing_id: uuid(seed.n),
      path,
      alt: `${seed.title} in ${seed.colours}`,
      position,
      is_cover: position === 0,
    };
  }),
);

const articleSeeds = [
  {
    n: 101,
    slug: "build-a-wardrobe-that-works",
    title: "Build a wardrobe that works harder",
    category: "Style notes",
    cover: "rail",
    alt: "A shopper browsing a rail of neutral clothing",
    body: "A good wardrobe is not a big wardrobe. It is a small group of pieces that get along with one another.\n\nStart with the shapes you already reach for. Note what you wear on the days you feel most like yourself, and buy more of that, not less.\n\nThen add one piece each season that stretches you: a stronger colour, a sharper cut or an unexpected texture. Over time, those choices turn into a signature.",
  },
  {
    n: 102,
    slug: "how-to-wear-colour-with-confidence",
    title: "How to wear colour with confidence",
    category: "Colour",
    cover: "colour",
    alt: "A rail of brightly coloured printed shirts",
    body: "Colour is the fastest way to change how an outfit feels. It is also the easiest thing to overthink.\n\nBegin with one saturated piece and keep everything else quiet. A marigold knit with soft neutrals does more than a head-to-toe statement.\n\nOnce that feels natural, try two colours of the same depth together. Deep indigo and hibiscus sit beautifully side by side because neither one shouts over the other.",
  },
  {
    n: 103,
    slug: "caring-for-the-clothes-you-love",
    title: "Caring for the clothes you love",
    category: "Care",
    cover: "hangers",
    alt: "Clothes on wooden hangers",
    body: "The clothes you look after are the clothes that last. A few habits make most of the difference.\n\nWash less often and at lower temperatures. Turn prints and dark colours inside out, and dry them out of direct sun.\n\nUse wide hangers for tailoring and fold your knitwear so that it keeps its shape. Always check the care details on each piece first.",
  },
];
export const starterArticles = articleSeeds.map((a) => {
  const id = uuid(a.n);
  const path = `articles/${id}/starter-cover.webp`;
  starterMedia[path] = `/media/editorial/${a.cover}.webp`;
  return {
    id,
    title: a.title,
    slug: a.slug,
    category: a.category,
    body: a.body,
    cover_path: path,
    cover_alt: a.alt,
    status: "published" as const,
    published_at: timestamp(a.n - 100),
    created_at: timestamp(a.n - 100),
    updated_at: timestamp(a.n - 100),
  };
});
