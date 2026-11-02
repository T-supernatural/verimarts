import { Link } from "react-router-dom";
import { ArrowUpRight, Mail, MessageCircle, Phone, Play } from "lucide-react";
import { business, whatsappUrl } from "../../../config/business";
import { useBag } from "../../../store/bag";
import { breadcrumbJsonLd, Seo } from "../../../seo/Seo";
import { routeMeta } from "../../../seo/routes";
import { Chevron, Reveal } from "../components/Primitives";
import { BagContents, BagSummary } from "../components/StorefrontShell";
import { ContactBand } from "./Home";
import photoCredits from "../../../data/photoCredits.json";

function InfoSeo({ path }: { path: string }) {
  const meta = routeMeta(path)!;
  return (
    <Seo
      title={meta.title}
      description={meta.description}
      jsonLd={[
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: meta.heading, path },
        ]),
      ]}
    />
  );
}

export function About({ replay }: { replay: () => void }) {
  return (
    <>
      <InfoSeo path="/about" />
      <section className="about-hero">
        <div className="container about-hero__inner">
          <span className="eyebrow eyebrow--marigold">About FASHYN</span>
          <h1>Style, with intention.</h1>
          <p>
            FASHYN is a clothing brand for women, men and children, built around
            one simple idea: every piece you own should earn its place.
          </p>
        </div>
      </section>
      <Reveal className="about-split container">
        <img
          src="/media/editorial/store.webp"
          alt="A clothing store with rails of bold red garments"
          loading="lazy"
        />
        <div>
          <h2>Considered, not complicated.</h2>
          <p>
            We look for colour, character and shape, then keep shopping personal.
            There are no accounts to create and no complicated checkout. You
            choose what you love and talk to us directly.
          </p>
          <p>
            That way you get real answers about fit and availability before you
            commit to anything.
          </p>
          <button className="button button--outline" onClick={replay}>
            <Play size={16} aria-hidden="true" /> Watch the brand intro
          </button>
        </div>
      </Reveal>
      <Reveal className="palette container">
        <h2>Our colours</h2>
        <div className="palette__grid">
          <div className="palette__swatch palette__swatch--indigo">
            <strong>Adire Indigo</strong>
            <span>Depth, craft and calm confidence.</span>
          </div>
          <div className="palette__swatch palette__swatch--hibiscus">
            <strong>Hibiscus</strong>
            <span>Energy for the moments that count.</span>
          </div>
          <div className="palette__swatch palette__swatch--marigold">
            <strong>Marigold</strong>
            <span>Warmth, optimism and a little sunshine.</span>
          </div>
        </div>
      </Reveal>
      <ContactBand />
    </>
  );
}

const steps = [
  {
    title: "Choose your pieces",
    body: "Browse the collection, pick your size and colour, and add what you love to your bag.",
  },
  {
    title: "Send your bag on WhatsApp",
    body: "One tap turns your bag into a clear message listing each piece, size, colour and quantity.",
  },
  {
    title: "We confirm the details",
    body: "We check availability and agree delivery and payment with you directly in the chat.",
  },
];
const questions = [
  {
    q: "Do I pay on this website?",
    a: "No. Nothing is charged here. Payment is arranged directly with us once your order is confirmed.",
  },
  {
    q: "Is my order confirmed once I send the message?",
    a: "Your message is a request. Your order is confirmed once we have checked availability and replied to you.",
  },
  {
    q: "Can you help me choose a size?",
    a: "Yes. Tell us your usual size and how you like things to fit, and we will help you decide.",
  },
  {
    q: "How do delivery and returns work?",
    a: "Ask us in the chat and we will explain the options for your location and order before you pay.",
  },
];

export function HowToOrder() {
  return (
    <>
      <InfoSeo path="/how-to-order" />
      <header className="page-banner">
        <div className="container">
          <h1>How to order</h1>
          <p>Three simple steps, with a real person at the other end.</p>
        </div>
      </header>
      <section className="section container">
        <ol className="steps">
          {steps.map((step, index) => (
            <li key={step.title}>
              <span aria-hidden="true">{index + 1}</span>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="faq">
          <h2>Good to know</h2>
          {questions.map(({ q, a }) => (
            <div key={q}>
              <h3>{q}</h3>
              <p>{a}</p>
            </div>
          ))}
        </div>
        <Link className="button button--indigo" to="/shop">
          Start shopping <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </section>
    </>
  );
}

export function Contact() {
  return (
    <>
      <InfoSeo path="/contact" />
      <header className="page-banner">
        <div className="container">
          <h1>Let's talk.</h1>
          <p>
            Questions about the collection, fit or availability? We are happy to
            help.
          </p>
        </div>
      </header>
      <section className="section container contact-cards">
        <a
          className="contact-card contact-card--primary"
          href={whatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={26} aria-hidden="true" />
          <h2>WhatsApp</h2>
          <p>The fastest way to reach us.</p>
          <strong>{business.whatsapp}</strong>
        </a>
        <a
          className="contact-card"
          href={`tel:${business.phone.replace(/[^+\d]/g, "")}`}
        >
          <Phone size={26} aria-hidden="true" />
          <h2>Call</h2>
          <p>Prefer to talk it through?</p>
          <strong>{business.phone}</strong>
        </a>
        <a className="contact-card" href={`mailto:${business.email}`}>
          <Mail size={26} aria-hidden="true" />
          <h2>Email</h2>
          <p>For anything longer.</p>
          <strong>{business.email}</strong>
        </a>
      </section>
    </>
  );
}

export function BagPage() {
  const { lines } = useBag();
  return (
    <>
      <Seo
        title="Your bag | FASHYN"
        description="Review your bag and send your order on WhatsApp."
        noindex
      />
      <header className="page-banner">
        <div className="container">
          <h1>Your bag</h1>
        </div>
      </header>
      <section className="section container bag-page">
        <BagContents />
        {lines.length > 0 && <BagSummary />}
      </section>
    </>
  );
}

export function PhotoCredits() {
  return (
    <>
      <InfoSeo path="/photo-credits" />
      <header className="page-banner">
        <div className="container">
          <h1>Photo credits</h1>
          <p>
            Photography on this site is illustrative stock from Pexels, used
            under the Pexels License. Images show the style of the range and are
            not photographs of specific stock.
          </p>
        </div>
      </header>
      <section className="section container">
        <ul className="credits">
          {photoCredits.map((photo) => (
            <li key={photo.id}>
              <img src={photo.asset} alt="" loading="lazy" />
              <a href={photo.source} target="_blank" rel="noopener noreferrer">
                {photo.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export function NotFound() {
  return (
    <div className="not-found container">
      <Seo
        title="Page not found | FASHYN"
        description="We couldn't find that page."
        noindex
      />
      <Chevron />
      <h1>This page has left the rail.</h1>
      <p>The page you are looking for isn't here, but the collection is.</p>
      <Link className="button button--indigo" to="/shop">
        Explore the collection <ArrowUpRight size={18} aria-hidden="true" />
      </Link>
    </div>
  );
}
