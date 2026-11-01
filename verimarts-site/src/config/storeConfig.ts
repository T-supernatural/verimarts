import { business } from "./business";

export const storeConfig = {
  brandName: business.name,
  contact: business,
  announcement: "",
  delivery: "",
  returns: "",
  supportHours: business.hours,
  socialLinks: business.socialLinks,
  paymentMethods: [] as string[],
  newsletterEndpoint: "",
  currency: "NGN",
} as const;
