// Owner-confirmed public contact details. Kept here so older hosting variables cannot override them.
export const business = {
  name: "FASHYN",
  tagline: "Modern style, thoughtfully chosen.",
  whatsapp: "0907 041 9149",
  phone: "08144669205",
  email: "Thisislivelong@gmail.com",
  address: "",
  hours: "",
  mapUrl: "",
  socialLinks: [] as { label: string; url: string }[],
};
function whatsappNumber() {
  const digits = business.whatsapp.replace(/\D/g, "");
  return digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
}
export function whatsappMessageUrl(message: string) {
  const number = whatsappNumber();
  return number
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : undefined;
}
export function whatsappUrl(item?: string) {
  return whatsappMessageUrl(
    item
      ? `Hello FASHYN, I'd like to ask about the ${item}. Please share its current availability and details.`
      : "Hello FASHYN, I would like to ask about your collection.",
  );
}
