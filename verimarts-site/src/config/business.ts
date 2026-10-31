// Owner-confirmed public contact details. Kept here so older hosting variables cannot override them.
export const business = {
  name: "FASHYN",
  whatsapp: "0907 041 9149",
  phone: "08144669205",
  email: "Thisislivelong@gmail.com",
  address: "",
  hours: "",
  mapUrl: "",
  socialLinks: [] as { label: string; url: string }[],
};
export function whatsappUrl(vehicle?: string) {
  const digits = business.whatsapp.replace(/\D/g, "");
  const number = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  return number
    ? `https://wa.me/${number}?text=${encodeURIComponent(vehicle ? `Hello FASHYN, I'd like to enquire about the ${vehicle}. Please share its current availability and details.` : "Hello FASHYN, I would like to enquire about your collection.")}`
    : undefined;
}
