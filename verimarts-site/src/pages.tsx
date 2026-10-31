import { Reveal } from "./Motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CarFront,
  MessageCircle,
  Play,
  ChevronRight,
  Mail,
  MapPin,
  Clock,
  Phone,
} from "lucide-react";
import { business, whatsappUrl } from "./config/business";
import { EnquiryButtons } from "./EnquiryButtons";
function ContactCallout() {
  return (
    <Reveal className="contact-callout">
      <div>
        <span className="eyebrow">START A CONVERSATION</span>
        <h2>See something you like?</h2>
        <p>Find your next piece with FASHYN.</p>
      </div>
      <Link to="/contact" className="button white">
        Let’s talk <ArrowUpRight size={19} />
      </Link>
    </Reveal>
  );
}
function PageHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="page-heading">
      <span className="eyebrow red-text">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{copy}</p>
    </div>
  );
}
export function About({ replay }: { replay: () => void }) {
  return (
    <>
      <Reveal className="section">
        <PageHeading
          eyebrow="ABOUT FASHYN"
          title="Style, with intention."
          copy="Discover a considered point of view on modern fashion."
        />
        <div className="about-layout">
          <img
            src="/assets/logo.png"
            alt="FASHYN wordmark"
          />
          <div>
            <h2>
              Your next possibility starts
              <br />
              with a closer look.
            </h2>
            <p>
              FASHYN is a premium fashion brand shaped by quality, confidence,
              and modern style for every generation.
            </p>
            <p>
              Browse at your own pace, review the information available, and
              speak directly with FASHYN about your next style choice.
            </p>
            <button className="button secondary" onClick={replay}>
              <Play size={17} />
              Watch the brand intro
            </button>
          </div>
        </div>
        <div className="content-pending">
          <h2>Business information to complete</h2>
          <p>
            The supplied business scope is a concept draft. Before launch, the
            owner needs to confirm:
          </p>
          <ul>
            <li>Business history, location, and service area.</li>
            <li>Listing stock model, approved listings, and pricing policy.</li>
            <li>Contact information, enquiry hours, and verified services.</li>
          </ul>
        </div>
      </Reveal>
      <ContactCallout />
    </>
  );
}
export function Services() {
  return (
    <>
      <Reveal className="section">
        <PageHeading
          eyebrow="WHAT WE DO"
          title="A focused marketplace experience."
          copy="A refined discovery experience for the pieces that feel like you."
        />
        <div className="service-grid">
          <article>
            <CarFront size={32} />
            <span className="eyebrow red-text">01 / LISTING DISCOVERY</span>
            <h2>Explore your options.</h2>
            <p>
              Explore owner-managed listings and review their information.
              Availability, pricing, and transaction terms are confirmed
              directly.
            </p>
            <Link to="/shop" className="text-link">
              Browse listings <ArrowUpRight size={18} />
            </Link>
          </article>
          <article>
            <MessageCircle size={32} />
            <span className="eyebrow red-text">02 / CUSTOMER ENQUIRIES</span>
            <h2>Ask. Understand. Decide.</h2>
            <p>
              Continue the conversation directly with FASHYN to ask questions
              and find the right fit.
            </p>
            <Link to="/contact" className="text-link">
              Contact details <ArrowUpRight size={18} />
            </Link>
          </article>
        </div>
        <div className="content-pending">
          <h2>Additional service content pending</h2>
          <p>
            Further service descriptions will be added after the business owner
            confirms what is offered and the applicable terms.
          </p>
        </div>
      </Reveal>
      <ContactCallout />
    </>
  );
}
export function Contact() {
  return (
    <Reveal className="section contact-page">
      <PageHeading
        eyebrow="START A CONVERSATION"
        title="Let’s talk about your next find."
        copy="Questions about the collection, fit, or availability? We are here to help."
      />
      <div className="contact-layout">
        <div>
          <span className="eyebrow red-text">DIRECT CONTACT</span>
          <h2>
            A personal conversation.
            <br />A clear next step.
          </h2>
          {business.whatsapp ? (
            <EnquiryButtons />
          ) : (
            <div className="content-pending">
              <MessageCircle size={24} />
              <h3>Contact details coming soon</h3>
              <p>
                The owner’s WhatsApp and phone numbers have not been supplied.
                Direct enquiry links will be enabled once those details are
                confirmed.
              </p>
              <Link className="text-link" to="/shop">
                Explore the marketplace <ArrowRight size={17} />
              </Link>
            </div>
          )}
          <div className="contact-details">
            <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={20} />
              WhatsApp: {business.whatsapp}
            </a>
            {business.phone && (
              <a href={`tel:${business.phone.replace(/[^+\d]/g, "")}`}>
                <Phone size={20} />
                {business.phone}
              </a>
            )}
            {business.email && (
              <a href={`mailto:${business.email}`}>
                <Mail size={20} />
                {business.email}
              </a>
            )}
            {business.address && (
              <p>
                <MapPin size={20} />
                {business.address}
              </p>
            )}
            {business.hours && (
              <p>
                <Clock size={20} />
                {business.hours}
              </p>
            )}
            {business.mapUrl && (
              <a
                href={business.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View location <ArrowUpRight size={17} />
              </a>
            )}
            {business.socialLinks.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
        <aside className="contact-guide">
          <span className="eyebrow">BEFORE YOU ENQUIRE</span>
          <h2>Have a listing in mind?</h2>
          <p>
            Open its detail page and use the enquiry link to include the listing
            name in your WhatsApp message once contact setup is complete.
          </p>
          <hr />
          <p>
            Confirm current availability, price, condition, and transaction
            arrangements directly with the business.
          </p>
          <p className="small">
            This website does not collect enquiry form data or accept payments.
            A message is an enquiry, not a reservation.
          </p>
          <ChevronRight size={28} />
        </aside>
      </div>
    </Reveal>
  );
}
export function NotFound() {
  return (
    <Reveal className="section empty-state">
      <span className="eyebrow red-text">404 / A DIFFERENT ROAD</span>
      <h1>This page isn’t here.</h1>
      <p>The listing or page you’re looking for could not be found.</p>
      <Link to="/shop" className="button primary">
        Explore showroom <ArrowUpRight size={18} />
      </Link>
    </Reveal>
  );
}
