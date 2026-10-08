export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year?: number;
  body: "SUV" | "Sedan" | "Coupe";
  price?: number;
  mileage?: number;
  transmission?: string;
  fuel?: string;
  status: "Demo";
  listedAt: string;
  images: string[];
  notes?: string;
  demo: boolean;
}
// Fictional examples for UI demonstration. Photos are illustrative, not actual stock.
export const vehicles: Vehicle[] = [
  {
    id: "mercedes-gle",
    make: "Mercedes-Benz",
    model: "GLE 350",
    year: 2022,
    body: "SUV",
    price: 68000000,
    mileage: 24000,
    transmission: "Automatic",
    fuel: "Petrol",
    status: "Demo",
    listedAt: "2026-10-06",
    images: ["/assets/car-1.webp", "/assets/car-2.webp"],
    demo: true,
  },
  {
    id: "bmw-5-series",
    make: "BMW",
    model: "5 Series",
    year: 2021,
    body: "Sedan",
    price: 42000000,
    mileage: 35000,
    transmission: "Automatic",
    fuel: "Petrol",
    status: "Demo",
    listedAt: "2026-10-05",
    images: ["/assets/car-2.webp", "/assets/car-3.webp"],
    demo: true,
  },
  {
    id: "porsche-911",
    make: "Porsche",
    model: "911 Carrera",
    year: 2023,
    body: "Coupe",
    transmission: "Automatic",
    fuel: "Petrol",
    status: "Demo",
    listedAt: "2026-10-08",
    images: ["/assets/car-3.webp", "/assets/car-1.webp"],
    demo: true,
  },
  {
    id: "toyota-land-cruiser",
    make: "Toyota",
    model: "Land Cruiser",
    year: 2020,
    body: "SUV",
    price: 56000000,
    transmission: "Automatic",
    status: "Demo",
    listedAt: "2026-10-03",
    images: ["/assets/car-4.webp", "/assets/car-1.webp"],
    demo: true,
  },
  {
    id: "mercedes-c-class",
    make: "Mercedes-Benz",
    model: "C-Class",
    year: 2019,
    body: "Sedan",
    price: 29000000,
    mileage: 62000,
    transmission: "Automatic",
    fuel: "Petrol",
    status: "Demo",
    listedAt: "2026-10-02",
    images: ["/assets/car-1.webp"],
    demo: true,
  },
  {
    id: "bmw-4-series",
    make: "BMW",
    model: "4 Series",
    year: 2022,
    body: "Coupe",
    price: 48000000,
    mileage: 19000,
    transmission: "Automatic",
    fuel: "Petrol",
    status: "Demo",
    listedAt: "2026-10-01",
    images: ["/assets/car-2.webp"],
    demo: true,
  },
];
export const priceLabel = (v: Vehicle) =>
  v.price
    ? new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
      }).format(v.price)
    : "Contact for price";
