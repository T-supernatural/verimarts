// TODO: Replace empty values with owner-approved contact details before launch.
export const business = {
  name: "Verimarts",
  whatsapp: import.meta.env.VITE_BUSINESS_WHATSAPP || "",
  phone: import.meta.env.VITE_BUSINESS_PHONE || "",
  email: import.meta.env.VITE_BUSINESS_EMAIL || "",
  address: "",
  hours: "",
  mapUrl: "",
  socialLinks: [] as { label: string; url: string }[],
};
export function whatsappUrl(vehicle?: string) {
  const number = business.whatsapp.replace(/\D/g, "");
  return number
    ? `https://wa.me/${number}?text=${encodeURIComponent(vehicle ? `Hello Verimarts, I'd like to enquire about the ${vehicle}. Please share its current availability and details.` : "Hello Verimarts, I would like to enquire about your listings.")}`
    : undefined;
}
