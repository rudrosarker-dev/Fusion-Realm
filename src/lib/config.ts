import type { Coupon, CurrencyInfo } from "./types";

export const SITE = {
  name: "NOIR FORM",
  tagline: "Considered garments for everyday movement.",
  description:
    "NOIR FORM is an independent fashion house designing quiet, precise garments — heavyweight jersey, tailored wool and considered outerwear, made to be worn for years.",
  url: "https://noirform.example.com",
  email: "studio@noirform.example.com",
  phone: "+880 1700 000 000",
  address: "House 42, Road 11, Banani, Dhaka 1213, Bangladesh",
};

export const CURRENCIES: CurrencyInfo[] = [
  { code: "BDT", label: "Bangladesh (BDT ৳)", symbol: "৳", rate: 1, country: "Bangladesh" },
  { code: "USD", label: "United States (USD $)", symbol: "$", rate: 0.0083, country: "United States" },
  { code: "GBP", label: "United Kingdom (GBP £)", symbol: "£", rate: 0.0066, country: "United Kingdom" },
  { code: "EUR", label: "Europe (EUR €)", symbol: "€", rate: 0.0077, country: "Europe" },
];

export const DEFAULT_CURRENCY: CurrencyInfo = CURRENCIES[0];

export const SHIPPING = {
  standard: { id: "standard" as const, label: "Standard Delivery", time: "3–5 working days, nationwide", feeBDT: 150 },
  express: { id: "express" as const, label: "Express Delivery", time: "24–48 hours, Dhaka metro", feeBDT: 350 },
  freeOverBDT: 15000,
};

export const COUPONS: Coupon[] = [
  { code: "WELCOME10", type: "percent", value: 10, minSubtotalBDT: 5000, expiresAt: "2026-12-31", usageLimit: 5000 },
  { code: "NEWSEASON", type: "percent", value: 15, minSubtotalBDT: 15000, expiresAt: "2026-06-30", usageLimit: 1000 },
  { code: "FLAT500", type: "fixed", value: 500, minSubtotalBDT: 4000, expiresAt: "2026-12-31", usageLimit: 10000 },
  { code: "VIP15", type: "percent", value: 15, minSubtotalBDT: 25000, expiresAt: "2026-12-31", usageLimit: 250 },
];

export const PAYMENT_METHODS = [
  {
    id: "cod" as const,
    label: "Cash on Delivery",
    note: "Pay in cash when your order arrives. Available nationwide in Bangladesh.",
  },
  {
    id: "mobile-banking" as const,
    label: "Mobile Banking (bKash / Nagad)",
    note: "Demo mode — gateway credentials required before live transactions.",
  },
  {
    id: "card" as const,
    label: "Card Payment",
    note: "Demo mode — SSLCommerz integration point. No card is charged.",
  },
];

export const NAV = {
  shop: [
    { label: "New Arrivals", href: "/shop?filter=new" },
    { label: "Best Sellers", href: "/shop?filter=best" },
    { label: "All Products", href: "/shop" },
  ],
  men: [
    { label: "T-Shirts", href: "/shop?gender=men&category=T-Shirts" },
    { label: "Shirts", href: "/shop?gender=men&category=Shirts" },
    { label: "Hoodies", href: "/shop?gender=men&category=Hoodies" },
    { label: "Sweatshirts", href: "/shop?gender=men&category=Sweatshirts" },
    { label: "Knitwear", href: "/shop?gender=men&category=Knitwear" },
    { label: "Bottoms", href: "/shop?gender=men&category=Bottoms" },
    { label: "Denim", href: "/shop?gender=men&category=Denim" },
    { label: "Outerwear", href: "/shop?gender=men&category=Outerwear" },
    { label: "Tailoring", href: "/shop?gender=men&category=Tailoring" },
    { label: "Footwear", href: "/shop?gender=men&category=Footwear" },
    { label: "Accessories", href: "/shop?gender=men&category=Accessories" },
  ],
  women: [
    { label: "T-Shirts", href: "/shop?gender=women&category=T-Shirts" },
    { label: "Tops", href: "/shop?gender=women&category=Tops" },
    { label: "Dresses", href: "/shop?gender=women&category=Dresses" },
    { label: "Hoodies", href: "/shop?gender=women&category=Hoodies" },
    { label: "Knitwear", href: "/shop?gender=women&category=Knitwear" },
    { label: "Bottoms", href: "/shop?gender=women&category=Bottoms" },
    { label: "Denim", href: "/shop?gender=women&category=Denim" },
    { label: "Outerwear", href: "/shop?gender=women&category=Outerwear" },
    { label: "Footwear", href: "/shop?gender=women&category=Footwear" },
    { label: "Accessories", href: "/shop?gender=women&category=Accessories" },
  ],
  collections: [
    { label: "New Season", href: "/collections/new-season" },
    { label: "Core Collection", href: "/collections/core" },
    { label: "Essentials", href: "/collections/essentials" },
    { label: "Studio Collection", href: "/collections/studio" },
    { label: "Limited Edition", href: "/collections/limited" },
  ],
};
