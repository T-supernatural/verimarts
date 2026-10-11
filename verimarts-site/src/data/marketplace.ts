export const categories = [
  {
    id: "cars",
    name: "Cars",
    description: "Explore vehicle listings and their details.",
  },
  {
    id: "property",
    name: "Property",
    description: "Review property information supplied by the owner.",
  },
  {
    id: "livelong-farm",
    name: "Livelong Farm",
    description:
      "Verimarts’ farm produce and aquaculture section, handled by Livelong Farm.",
  },
  {
    id: "electronics",
    name: "Electronics",
    description: "Browse electronics, appliances, and gadgets.",
  },
  {
    id: "paint-production",
    name: "Paint Production",
    description: "Explore paint products and enquire directly.",
  },
  {
    id: "other-goods",
    name: "Other Goods",
    description: "Explore general merchandise from Verimarts.",
  },
] as const;
export type Category = (typeof categories)[number]["id"] | "farm-produce"; // Legacy database records remain readable.
export const journalName = "Verimarts Journal"; // Working title: change here.
export type Publication = "draft" | "published";
export type Availability =
  "available" | "unavailable" | "sold" | "not-provided";
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
export const fields: Record<
  Category,
  { key: string; label: string; options?: string[]; numeric?: boolean }[]
> = {
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
export function listingPrice(item: Listing) {
  if (item.price !== null && item.currency) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: item.currency,
        maximumFractionDigits: 2,
      }).format(item.price);
    } catch {
      return `${item.price} ${item.currency}`;
    }
  }
  return item.price_label || "Price not provided";
}
export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
