import { Search, SlidersHorizontal } from "lucide-react";
import type { Vehicle } from "./data/vehicles";
export function VehicleFilters({
  items,
  get,
  update,
  reset,
}: {
  items: Vehicle[];
  get: (key: string) => string;
  update: (key: string, value: string) => void;
  reset: () => void;
}) {
  return (
    <aside className="filters">
      <div className="filter-heading">
        <h2>
          <SlidersHorizontal size={18} />
          Refine your search
        </h2>
        <button onClick={reset}>Reset</button>
      </div>
      <label className="search-field">
        Search vehicles
        <div>
          <Search size={18} />
          <input
            value={get("q")}
            onChange={(e) => update("q", e.target.value)}
            placeholder="Make, model, keyword…"
          />
        </div>
      </label>
      {[
        ["make", "Make", Array.from(new Set(items.map((v) => v.make)))],
        ["body", "Body type", ["SUV", "Sedan", "Coupe"]],
        [
          "year",
          "Year",
          Array.from(new Set(items.map((v) => String(v.year))))
            .sort()
            .reverse(),
        ],
        [
          "transmission",
          "Transmission",
          Array.from(
            new Set(
              items.flatMap((v) => (v.transmission ? [v.transmission] : [])),
            ),
          ),
        ],
        ["availability", "Listing status", ["Demo"]],
      ].map(([key, label, options]) => (
        <label key={String(key)}>
          {label as string}
          <select
            aria-label={label as string}
            value={get(key as string)}
            onChange={(e) => update(key as string, e.target.value)}
          >
            <option value="">All {String(label).toLowerCase()}</option>
            {(options as string[]).map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      ))}
      <label>
        Maximum demo price
        <select
          value={get("price")}
          onChange={(e) => update("price", e.target.value)}
        >
          <option value="">Any price</option>
          <option value="30000000">₦30,000,000</option>
          <option value="50000000">₦50,000,000</option>
          <option value="70000000">₦70,000,000</option>
        </select>
      </label>
      <p className="small muted">
        All prices and specifications shown are sample data. Contact for price
        listings are excluded when a price limit is applied.
      </p>
    </aside>
  );
}
