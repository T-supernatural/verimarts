// Shared by the runtime <Seo> tag manager and the build step that writes per-route HTML.
export type RouteMeta = {
  path: string;
  title: string;
  description: string;
  /** Text and links for crawlers that do not run JavaScript. */
  heading: string;
  priority: string;
};
export const siteName = "FASHYN";
export const defaultImage = "/brand/og-image.jpg";
export const staticRoutes: RouteMeta[] = [
  {
    path: "/",
    title: "FASHYN | Modern Clothing for Women, Men & Children in Nigeria",
    description:
      "Shop FASHYN for modern dresses, tailoring, knitwear, childrenswear and accessories. Order easily on WhatsApp and confirm your size before you pay.",
    heading: "Modern style, thoughtfully chosen.",
    priority: "1.0",
  },
  {
    path: "/shop",
    title: "Shop All Clothing & Accessories | FASHYN",
    description:
      "Browse the full FASHYN collection. Filter by department, size, colour and price, and order your favourite pieces directly on WhatsApp.",
    heading: "Shop all clothing and accessories",
    priority: "0.9",
  },
  {
    path: "/women",
    title: "Women's Clothing: Dresses, Tops & Coats | FASHYN",
    description:
      "Discover women's clothing at FASHYN: occasion gowns, everyday dresses, blouses, soft knitwear and statement coats.",
    heading: "Women's clothing",
    priority: "0.9",
  },
  {
    path: "/men",
    title: "Men's Clothing: Suits, Shirts & Jackets | FASHYN",
    description:
      "Shop men's clothing at FASHYN: sharp suits, blazers, shirts, hoodies and outerwear for work, ceremonies and weekends.",
    heading: "Men's clothing",
    priority: "0.9",
  },
  {
    path: "/children",
    title: "Children's Clothing: Sets, Tops & Knitwear | FASHYN",
    description:
      "Comfortable, characterful children's clothing from FASHYN, with playful sets, soft tops and knitwear for every day and special occasions.",
    heading: "Children's clothing",
    priority: "0.9",
  },
  {
    path: "/accessories",
    title: "Accessories: Shoes, Bags & Jewellery | FASHYN",
    description:
      "Finish the look with FASHYN accessories: loafers, sneakers, backpacks and statement jewellery.",
    heading: "Accessories",
    priority: "0.8",
  },
  {
    path: "/new-arrivals",
    title: "New Arrivals | FASHYN",
    description:
      "See the newest pieces at FASHYN, from fresh occasionwear to everyday essentials for women, men and children.",
    heading: "New arrivals",
    priority: "0.8",
  },
  {
    path: "/sale",
    title: "Sale: Reduced Clothing & Accessories | FASHYN",
    description:
      "Shop reduced styles at FASHYN across womenswear, menswear, childrenswear and accessories while sizes last.",
    heading: "Sale",
    priority: "0.8",
  },
  {
    path: "/journal",
    title: "The FASHYN Journal: Style Notes & Clothing Care",
    description:
      "Style advice, colour ideas and practical clothing care from the FASHYN Journal.",
    heading: "The FASHYN Journal",
    priority: "0.6",
  },
  {
    path: "/about",
    title: "About FASHYN | Style, With Intention",
    description:
      "FASHYN is a clothing brand for women, men and children, built around considered choices and a personal way to shop.",
    heading: "About FASHYN",
    priority: "0.5",
  },
  {
    path: "/how-to-order",
    title: "How to Order on WhatsApp | FASHYN",
    description:
      "Ordering from FASHYN is simple: choose your pieces, send your bag on WhatsApp, and we confirm size, availability, delivery and payment with you.",
    heading: "How to order",
    priority: "0.5",
  },
  {
    path: "/contact",
    title: "Contact FASHYN | WhatsApp, Phone & Email",
    description:
      "Questions about fit, availability or an order? Reach the FASHYN team directly by WhatsApp, phone or email.",
    heading: "Contact FASHYN",
    priority: "0.5",
  },
  {
    path: "/photo-credits",
    title: "Photo Credits | FASHYN",
    description: "Sources and licences for the photography used on this site.",
    heading: "Photo credits",
    priority: "0.1",
  },
];
export function routeMeta(path: string) {
  return staticRoutes.find((route) => route.path === path);
}
