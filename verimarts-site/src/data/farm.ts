export interface FarmProfile {
  id: "livelong-farm";
  heading: string;
  intro: string;
  main_address: string;
  branch_address: string;
  whatsapp: string;
  phone: string;
  email: string;
  website: string;
  products: string[];
  aquaculture: string[];
  status: "draft" | "published";
}
export function farmWhatsapp(number: string, item?: string) {
  const digits = number.replace(/\D/g, "");
  const international = digits.startsWith("0")
    ? `234${digits.slice(1)}`
    : digits;
  return international
    ? `https://wa.me/${international}?text=${encodeURIComponent(item ? `Hello Livelong Farm, I would like to enquire about ${item}. Please share its details and current availability.` : "Hello Livelong Farm, I would like to enquire about your farm products and aquaculture services.")}`
    : undefined;
}
export function farmWebsite(value: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
