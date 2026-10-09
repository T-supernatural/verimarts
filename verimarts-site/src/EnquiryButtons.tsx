import { Link } from "react-router-dom";
import { MessageCircle, Phone } from "lucide-react";
import { business, whatsappUrl } from "./config/business";
export function EnquiryButtons({
  vehicle,
  compact = false,
}: {
  vehicle?: string;
  compact?: boolean;
}) {
  const url = whatsappUrl(vehicle);
  const content = (
    <>
      <MessageCircle size={18} />
      {url ? "Enquire on WhatsApp" : "WhatsApp enquiry"}
      {!url && <span className="sr-only"> — contact setup pending</span>}
    </>
  );
  return (
    <div className="actions">
      {url ? (
        <a
          className="button primary"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {content}
        </a>
      ) : (
        <Link className="button primary" to="/contact">
          {content}
        </Link>
      )}
      {!compact && business.phone && (
        <a
          className="button secondary"
          href={`tel:${business.phone.replace(/[^+\d]/g, "")}`}
        >
          <Phone size={17} />
          Call Verimarts
        </a>
      )}
    </div>
  );
}
