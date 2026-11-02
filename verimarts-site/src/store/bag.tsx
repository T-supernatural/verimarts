import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { whatsappMessageUrl } from "../config/business";
import { formatMoney, type Listing } from "../data/marketplace";

export type BagLine = {
  key: string;
  slug: string;
  title: string;
  price: number | null;
  currency: string | null;
  priceLabel: string;
  size: string;
  colour: string;
  quantity: number;
};
const storageKey = "fashyn-bag";
const MAX_QUANTITY = 20;

function readBag(): BagLine[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
export function subtotals(lines: BagLine[]) {
  const totals = new Map<string, number>();
  for (const line of lines)
    if (line.price !== null && line.currency)
      totals.set(
        line.currency,
        (totals.get(line.currency) || 0) + line.price * line.quantity,
      );
  return [...totals].map(([currency, value]) => formatMoney(value, currency));
}
function linePrice(line: BagLine) {
  return line.price !== null && line.currency
    ? formatMoney(line.price, line.currency)
    : line.priceLabel || "Price on request";
}
/** A complete, readable order for the owner. No personal data is collected by the site. */
export function orderMessage(lines: BagLine[]) {
  const rows = lines.map((line, index) => {
    const options = [
      line.size && `Size ${line.size}`,
      line.colour && line.colour,
    ]
      .filter(Boolean)
      .join(", ");
    return `${index + 1}. ${line.title}${options ? ` (${options})` : ""} x ${line.quantity} - ${linePrice(line)} each`;
  });
  const total = subtotals(lines).join(" + ");
  return [
    "Hello FASHYN, I would like to place this order:",
    "",
    ...rows,
    "",
    ...(total ? [`Subtotal: ${total}`, ""] : []),
    "Please confirm availability, delivery and how to pay.",
  ].join("\n");
}
type Bag = {
  lines: BagLine[];
  count: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  add: (
    item: Listing,
    options: { size: string; colour: string; quantity: number },
  ) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  checkoutUrl: string | undefined;
};
const BagContext = createContext<Bag | null>(null);

export function BagProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<BagLine[]>(readBag);
  const [isOpen, setOpen] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(lines));
    } catch {
      /* Storage may be unavailable; the bag still works for this visit. */
    }
  }, [lines]);
  const add = useCallback<Bag["add"]>((item, options) => {
    const key = `${item.slug}|${options.size}|${options.colour}`;
    setLines((current) =>
      current.some((line) => line.key === key)
        ? current.map((line) =>
            line.key === key
              ? {
                  ...line,
                  quantity: Math.min(
                    MAX_QUANTITY,
                    line.quantity + options.quantity,
                  ),
                }
              : line,
          )
        : [
            ...current,
            {
              key,
              slug: item.slug,
              title: item.title,
              price: item.price,
              currency: item.currency,
              priceLabel: item.price_label,
              size: options.size,
              colour: options.colour,
              quantity: options.quantity,
            },
          ],
    );
    setOpen(true);
  }, []);
  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((current) =>
      current.map((line) =>
        line.key === key
          ? {
              ...line,
              quantity: Math.max(1, Math.min(MAX_QUANTITY, quantity)),
            }
          : line,
      ),
    );
  }, []);
  const remove = useCallback((key: string) => {
    setLines((current) => current.filter((line) => line.key !== key));
  }, []);
  const clear = useCallback(() => setLines([]), []);
  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      isOpen,
      setOpen,
      add,
      setQuantity,
      remove,
      clear,
      checkoutUrl: lines.length
        ? whatsappMessageUrl(orderMessage(lines))
        : undefined,
    }),
    [lines, isOpen, add, setQuantity, remove, clear],
  );
  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}
export function useBag() {
  const bag = useContext(BagContext);
  if (!bag) throw new Error("useBag must be used inside BagProvider");
  return bag;
}
