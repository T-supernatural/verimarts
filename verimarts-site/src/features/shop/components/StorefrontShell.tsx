import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, Search, ShoppingBag } from "lucide-react";
import { storeConfig } from "../../../config/storeConfig";
import { Accordion, Drawer, Modal } from "./Primitives";

const departments = [
  { label: "Women", href: "/women", children: ["Dresses", "Tops", "Trousers", "Accessories"] },
  { label: "Men", href: "/men", children: ["Shirts", "Trousers", "Jackets", "Accessories"] },
  { label: "Children", href: "/children", children: ["Clothing", "Shoes", "Schoolwear", "Accessories"] },
];

export function StorefrontPlaceholder({ title }: { title: string }) {
  return <section className="fashyn-placeholder fashyn-container"><span className="fashyn-eyebrow">FASHYN</span><h1 className="fashyn-display">{title}</h1><p>This storefront section is being prepared. The clothing catalogue will appear here once approved products are available.</p></section>;
}

export function StorefrontShell({ children, onReplayIntro }: { children: ReactNode; onReplayIntro: () => void }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const isHome = location.pathname === "/";
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  useEffect(() => setMobileOpen(false), [location.pathname]);
  return (
    <div className={`fashyn-shell${isHome && !scrolled ? " fashyn-shell--transparent" : ""}`}>
      {storeConfig.announcement && <div className="fashyn-announcement">{storeConfig.announcement}</div>}
      <header className="fashyn-header">
        <button className="fashyn-icon-button fashyn-mobile-menu" aria-label="Open menu" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
        <nav className="fashyn-desktop-nav" aria-label="Fashion navigation">
          {departments.map((department) => (
            <div className="fashyn-mega" key={department.label}>
              <NavLink to={department.href} onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}>{department.label}</NavLink>
              <div className="fashyn-mega__panel">
                {department.children.map((child) => <Link key={child} to={`${department.href}?category=${child.toLowerCase()}`}>{child}</Link>)}
              </div>
            </div>
          ))}
          <NavLink to="/new-arrivals">New Arrivals</NavLink>
          <NavLink to="/sale">Sale</NavLink>
        </nav>
        <Link className="fashyn-wordmark" to="/" aria-label="FASHYN home"><img src="/assets/fashyn-wordmark.png" alt="FASHYN" /></Link>
        <div className="fashyn-header-actions">
          <button ref={searchTrigger} className="fashyn-icon-button" aria-label="Search" onClick={() => setSearchOpen(true)}><Search size={20} /></button>
          <button className="fashyn-icon-button" aria-label="Open bag" onClick={() => setBagOpen(true)}><ShoppingBag size={20} /><span className="fashyn-bag-count">0</span></button>
        </div>
      </header>
      <main>{children}</main>
      <footer className="fashyn-footer">
        <div className="fashyn-footer__inner fashyn-container">
          <div><img className="fashyn-footer__logo" src="/assets/fashyn-wordmark.png" alt="FASHYN" /><p>Modern style, thoughtfully chosen.</p></div>
          <div><span className="fashyn-eyebrow">Shop</span>{departments.map((item) => <Link key={item.label} to={item.href}>{item.label}</Link>)}<Link to="/new-arrivals">New Arrivals</Link></div>
          <div><span className="fashyn-eyebrow">Discover</span><Link to="/about">About FASHYN</Link><Link to="/contact">Contact</Link>{storeConfig.socialLinks.map((social) => <a key={social.label} href={social.url}>{social.label}</a>)}</div>
          {(storeConfig.contact.email || storeConfig.contact.phone) && <div><span className="fashyn-eyebrow">Contact</span>{storeConfig.contact.email && <a href={`mailto:${storeConfig.contact.email}`}>{storeConfig.contact.email}</a>}{storeConfig.contact.phone && <a href={`tel:${storeConfig.contact.phone}`}>{storeConfig.contact.phone}</a>}<button className="fashyn-footer__replay" onClick={onReplayIntro}>Replay brand intro</button></div>}
        </div>
        <div className="fashyn-footer__bottom fashyn-container">© {new Date().getFullYear()} FASHYN. All rights reserved.</div>
      </footer>
      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} title="Menu" side="left">
        <nav className="fashyn-mobile-nav" aria-label="Mobile fashion navigation">
          {departments.map((department) => <Accordion key={department.label} title={department.label}><Link to={department.href}>{department.label} collection</Link>{department.children.map((child) => <Link key={child} to={`${department.href}?category=${child.toLowerCase()}`}>{child}</Link>)}</Accordion>)}
          <Link to="/new-arrivals">New Arrivals</Link><Link to="/sale">Sale</Link>
        </nav>
      </Drawer>
      <Modal open={searchOpen} onClose={() => { setSearchOpen(false); searchTrigger.current?.focus(); }} title="Search FASHYN">
        <form className="fashyn-search-form" onSubmit={(event) => event.preventDefault()}><label htmlFor="fashyn-search">Search the collection</label><input id="fashyn-search" autoFocus placeholder="Search products or categories" /><p>Search will be available when the clothing catalogue is connected.</p></form>
      </Modal>
      <Drawer open={bagOpen} onClose={() => setBagOpen(false)} title="Your bag"><div className="fashyn-empty-state"><h3 className="fashyn-display">Your bag is empty</h3><p>Your bag will be available when shopping is connected.</p></div></Drawer>
    </div>
  );
}
