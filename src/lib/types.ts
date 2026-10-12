/* NOIR FORM — domain model. Designed to map 1:1 onto future
   relational tables (products, variants, collections, orders…). */

export type Gender = "men" | "women" | "unisex";
export type Currency = "BDT" | "USD" | "GBP" | "EUR";
export type SizeSystem = "apparel" | "footwear" | "one-size";

export interface ProductImage {
  src: string;
  alt: string;
}

export interface ColorOption {
  name: string;
  hex: string;
}

export interface SizeVariant {
  size: string;
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  gender: Gender;
  collection: string; // collection slug
  priceBDT: number;
  compareAtBDT?: number;
  shortDescription: string;
  description: string;
  material: string;
  fit: string;
  care: string[];
  images: ProductImage[];
  colors: ColorOption[];
  sizes: SizeVariant[];
  sizeSystem: SizeSystem;
  sku: string;
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  rating: number;
  reviews: number;
  createdAt: string; // ISO date — drives "Newest" sort
}

export interface Collection {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  image: string;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  priceBDT: number;
  image: string;
  size: string;
  color: string;
  qty: number;
}

export interface Coupon {
  code: string;
  type: "percent" | "fixed";
  value: number; // percent (0-100) or fixed BDT
  minSubtotalBDT: number;
  expiresAt: string;
  usageLimit: number;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface OrderAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  area: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  email: string;
  items: CartItem[];
  address: OrderAddress;
  shippingMethod: "standard" | "express";
  shippingBDT: number;
  discountBDT: number;
  subtotalBDT: number;
  totalBDT: number;
  couponCode?: string;
  paymentMethod: "cod" | "card" | "mobile-banking";
  paymentStatus: "pending" | "paid" | "failed";
  status: OrderStatus;
  placedAt: string;
}

export interface JournalPost {
  slug: string;
  title: string;
  eyebrow: string;
  date: string;
  image: string;
  excerpt: string;
  body: string[];
}

export interface FaqSection {
  title: string;
  items: { q: string; a: string }[];
}

export interface CurrencyInfo {
  code: Currency;
  label: string;
  symbol: string;
  rate: number; // multiply BDT amount to get this currency
  country: string;
}
