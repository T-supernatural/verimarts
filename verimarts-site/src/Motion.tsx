import { useRef } from "react";
import type { ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return <motion.section className={className} initial={reduced ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.08 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.section>;
}

export function HeroImage() {
  const ref = useRef<HTMLImageElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 65]);
  return <motion.img ref={ref} className="hero-image" src="/assets/hero.webp" alt="Illustrative performance car on an open road" fetchPriority="high" style={reduced ? undefined : { y, scale: 1.08 }} />;
}

// Remove white in the browser; keep the supplied logo file and its geometry intact.
export function LogoTransparencyFilter() {
  return <svg className="logo-filter-definitions" aria-hidden="true" focusable="false"><defs><filter id="logo-without-background" colorInterpolationFilters="sRGB" x="-2%" y="-2%" width="104%" height="104%"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1 -1 -1 0 3" /><feComponentTransfer><feFuncA type="table" tableValues="0 0 1 1" /></feComponentTransfer></filter></defs></svg>;
}
