export const categories = [
  {
    id: "women",
    name: "Women",
    description:
      "Dresses, blouses, coats and everyday pieces cut to move with you.",
    image: "/media/editorial/women.webp",
    types: ["Dresses", "Tops", "Knitwear", "Outerwear", "Jumpsuits"],
  },
  {
    id: "men",
    name: "Men",
    description:
      "Sharp tailoring, easy layers and off-duty staples for every occasion.",
    image: "/media/editorial/men.webp",
    types: ["Shirts", "Suits", "Blazers", "Outerwear", "Hoodies"],
  },
  {
    id: "children",
    name: "Children",
    description: "Comfortable, characterful outfits for play and special days.",
    image: "/media/editorial/children.webp",
    types: ["Sets", "Tops", "Knitwear"],
  },
  {
    id: "accessories",
    name: "Accessories",
    description: "The finishing details: shoes, bags and statement jewellery.",
    image: "/media/editorial/accessories.webp",
    types: ["Shoes", "Bags", "Jewellery"],
  },
] as const;
/** Records from before the move to clothing. Owner-only: never shown on the storefront. */
export const archivedCategories = [
  { id: "cars", name: "Cars" },
  { id: "property", name: "Property" },
  { id: "livelong-farm", name: "Livelong Farm" },
  { id: "farm-produce", name: "Farm produce" },
  { id: "electronics", name: "Electronics" },
  { id: "paint-production", name: "Paint production" },
  { id: "other-goods", name: "Other goods" },
] as const;
export type FashionCategory = (typeof categories)[number]["id"];
export type Category =
  | FashionCategory
  | (typeof archivedCategories)[number]["id"];
export const fashionCategoryIds: string[] = categories.map((c) => c.id);
export function isFashion(category: string): category is FashionCategory {
  return fashionCategoryIds.includes(category);
}
export function categoryName(category: string) {
  return (
    [...categories, ...archivedCategories].find((c) => c.id === category)
      ?.name ?? category
  );
}
export const journalName = "The FASHYN Journal";
export type Publication = "draft" | "published";
export type Availability =
  | "available"
  | "unavailable"
  | "sold"
  | "not-provided";
export const availabilityLabels: Record<Availability, string> = {
  available: "In stock",
  unavailable: "Out of stock",
  sold: "Sold out",
  "not-provided": "Ask for availability",
};
export interface ListingImage {
  id?: string;
  listing_id?: string;
  path: string;
  alt: string;
  position: number;
  is_cover: boolean;
  media_type?: "image" | "video";
  duration_seconds?: number | null;
  url?: string;
}
export interface Listing {
  id: string;
  category: Category;
  title: string;
  slug: string;
  description: string;
  price: number | null;
  currency: string | null;
  price_label: string;
  availability: Availability;
  status: Publication;
  featured: boolean;
  location: string;
  details: Record<string, string>;
  created_at: string;
  updated_at: string;
  images: ListingImage[];
}
export interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  body: string;
  cover_path: string | null;
  cover_alt: string;
  status: Publication;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  cover_url?: string;
}
type Field = {
  key: string;
  label: string;
  hint?: string;
  options?: string[];
  numeric?: boolean;
};
const fashionFields: Field[] = [
  { key: "product_type", label: "Product type", hint: "For example Dresses" },
  { key: "sizes", label: "Sizes", hint: "Comma separated: S, M, L, XL" },
  { key: "colours", label: "Colours", hint: "Comma separated: Indigo, Sand" },
  { key: "material", label: "Material" },
  { key: "fit", label: "Fit", hint: "For example Relaxed" },
  { key: "care", label: "Care instructions" },
];
export const fields: Record<Category, Field[]> = {
  women: fashionFields,
  men: fashionFields,
  children: fashionFields,
  accessories: fashionFields,
  // Kept so archived records still validate and remain editable.
  "livelong-farm": [
    {
      key: "offering_type",
      label: "Offering group",
      options: ["Farm products", "Aquaculture"],
    },
    { key: "produce", label: "Product or service name" },
    { key: "unit", label: "Unit or pack size" },
    { key: "quantity", label: "Quantity" },
    { key: "origin", label: "Origin" },
    { key: "harvest", label: "Harvest / rearing notes" },
  ],
  "paint-production": [
    { key: "paint_type", label: "Paint type" },
    { key: "colour", label: "Colour / colour options" },
    { key: "volume", label: "Size / volume (include unit)" },
  ],
  cars: [
    { key: "make", label: "Make" },
    { key: "model", label: "Model" },
    { key: "trim", label: "Trim" },
    { key: "year", label: "Year", numeric: true },
    { key: "mileage", label: "Mileage (km)", numeric: true },
    { key: "transmission", label: "Transmission" },
    { key: "fuel", label: "Fuel type" },
    { key: "body", label: "Body type" },
    { key: "colour", label: "Colour" },
    { key: "condition", label: "Condition notes" },
  ],
  property: [
    { key: "property_type", label: "Property type" },
    {
      key: "transaction",
      label: "Owner-confirmed transaction type",
      options: ["Sale", "Rent"],
    },
    { key: "bedrooms", label: "Bedrooms", numeric: true },
    { key: "bathrooms", label: "Bathrooms", numeric: true },
    { key: "size", label: "Size (include unit)" },
    { key: "features", label: "Features" },
  ],
  "farm-produce": [
    { key: "produce", label: "Produce/product name" },
    { key: "unit", label: "Unit or pack size" },
    { key: "quantity", label: "Quantity" },
    { key: "origin", label: "Origin" },
    { key: "harvest", label: "Harvest notes" },
  ],
  electronics: [
    { key: "brand", label: "Brand" },
    { key: "model", label: "Model" },
    { key: "product_type", label: "Product type" },
    { key: "condition", label: "Condition" },
    { key: "specifications", label: "Specifications" },
    { key: "accessories", label: "Included accessories" },
  ],
  "other-goods": [
    { key: "product_type", label: "Goods category" },
    { key: "condition", label: "Condition" },
    { key: "attributes", label: "Additional attributes" },
  ],
};
export function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}
export function listingPrice(item: Listing) {
  if (item.price !== null && item.currency)
    return formatMoney(item.price, item.currency);
  return item.price_label || "Price on request";
}
/** The pre-sale price when this piece is genuinely reduced, otherwise null. */
export function comparePrice(item: Listing) {
  const value = Number(item.details.compare_at_price);
  return item.price !== null && value > item.price ? value : null;
}
export function optionList(value: string | undefined) {
  return (value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}
export function coverOf(item: Listing) {
  return item.images.find((image) => image.is_cover) || item.images[0];
}
export function isPurchasable(item: Listing) {
  return item.availability !== "sold" && item.availability !== "unavailable";
}
export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
