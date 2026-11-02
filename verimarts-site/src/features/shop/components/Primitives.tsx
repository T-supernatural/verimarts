import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ImgHTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Minus, Plus, X } from "lucide-react";

function useOverlay(open: boolean, onClose: () => void, restoreRef?: React.RefObject<HTMLElement | null>) {
  const firstRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const restore = restoreRef?.current || previous;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFirst = () => {
      firstRef.current?.focus();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-fashyn-overlay="true"] button:not([disabled]), [data-fashyn-overlay="true"] a[href], [data-fashyn-overlay="true"] input:not([disabled]), [data-fashyn-overlay="true"] select:not([disabled]), [data-fashyn-overlay="true"] textarea:not([disabled])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const frame = window.requestAnimationFrame(focusFirst);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      restore?.focus?.();
    };
  }, [open, onClose, restoreRef]);
  return firstRef;
}

export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "left" | "right";
  children: ReactNode;
}) {
  const titleId = useId();
  const firstRef = useOverlay(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className={`fashyn-overlay fashyn-overlay--${side}`} data-fashyn-overlay="true">
      <button className="fashyn-overlay__scrim" aria-label="Close dialog" onClick={onClose} />
      <aside className="fashyn-drawer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="fashyn-drawer__header">
          <h2 id={titleId} className="fashyn-display">{title}</h2>
          <button ref={firstRef as React.RefObject<HTMLButtonElement>} className="fashyn-icon-button" aria-label="Close dialog" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="fashyn-drawer__content">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const titleId = useId();
  const firstRef = useOverlay(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fashyn-overlay" data-fashyn-overlay="true">
      <button className="fashyn-overlay__scrim" aria-label="Close dialog" onClick={onClose} />
      <section className="fashyn-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="fashyn-modal__header">
          <h2 id={titleId} className="fashyn-display">{title}</h2>
          <button ref={firstRef as React.RefObject<HTMLButtonElement>} className="fashyn-icon-button" aria-label="Close dialog" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="fashyn-modal__content">{children}</div>
      </section>
    </div>,
    document.body,
  );
}

export function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="fashyn-accordion">
      <button className="fashyn-accordion__trigger" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span>{title}</span>
        <ChevronDown size={18} className={open ? "is-open" : ""} />
      </button>
      {open && <div className="fashyn-accordion__content">{children}</div>}
    </div>
  );
}

export function ResponsiveImage({
  alt,
  fallback = "Image unavailable",
  loading = "lazy",
  width,
  height,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: ReactNode;
  width: number;
  height: number;
}) {
  const [failed, setFailed] = useState(false);
  const style = { aspectRatio: `${width} / ${height}` } as CSSProperties;
  return failed ? (
    <div className="fashyn-image-fallback" style={style} role="img" aria-label={alt || (typeof fallback === "string" ? fallback : "Image unavailable")}>
      {fallback}
    </div>
  ) : (
    <img {...props} alt={alt} width={width} height={height} loading={loading} onError={() => setFailed(true)} />
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="fashyn-breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {item.href ? <a href={item.href}>{item.label}</a> : <span aria-current="page">{item.label}</span>}
          {index < items.length - 1 && <span aria-hidden="true"> / </span>}
        </span>
      ))}
    </nav>
  );
}

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="fashyn-quantity" aria-label="Quantity">
      <button className="fashyn-icon-button" aria-label="Decrease quantity" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}><Minus size={16} /></button>
      <span aria-live="polite">{value}</span>
      <button className="fashyn-icon-button" aria-label="Increase quantity" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}><Plus size={16} /></button>
    </div>
  );
}

export function Price({ price, compareAtPrice, currency = "NGN" }: { price: number; compareAtPrice?: number | null; currency?: string }) {
  const format = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  const sale = compareAtPrice != null && compareAtPrice > price;
  return <span className={`fashyn-price${sale ? " fashyn-price--sale" : ""}`}>{format(price)}{sale && <span className="fashyn-price__compare">{format(compareAtPrice)}</span>}</span>;
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className="fashyn-badge">{children}</span>;
}

export function Skeleton({ width = "100%", height = 20 }: { width?: string | number; height?: number }) {
  return <span className="fashyn-skeleton" aria-hidden="true" style={{ display: "block", width, height }} />;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return <section className="fashyn-empty-state"><h2 className="fashyn-display">{title}</h2>{children}</section>;
}

export function ErrorState({ title = "Something went wrong", onRetry }: { title?: string; onRetry?: () => void }) {
  return <section className="fashyn-error-state" role="alert"><p>{title}</p>{onRetry && <button className="fashyn-button fashyn-button--secondary" onClick={onRetry}>Try again</button>}</section>;
}
