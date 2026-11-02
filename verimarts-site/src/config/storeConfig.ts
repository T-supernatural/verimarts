import { business } from "./business";

export const storeConfig = {
  brandName: business.name,
  contact: business,
  announcement:
    "Order on WhatsApp: we confirm your size, colour and availability before you pay.",
  socialLinks: business.socialLinks,
  currency: "NGN",
} as const;
