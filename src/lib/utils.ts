import { clsx, type ClassValue } from "clsx";
import { CURRENCIES, DEFAULT_CURRENCY, type COUPONS } from "./config";
import type { Coupon, Currency, Product } from "./types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getCurrency(code: Currency) {
  return CURRENCIES.find((c) => c.code === code) ?? DEFAULT_CURRENCY;
}

/** Format a BDT base amount into the chosen display currency. */
export function formatPrice(amountBDT: number, code: Currency = "BDT"): string {
  const cur = getCurrency(code);
  const converted = Math.round(amountBDT * cur.rate);
  const locale = code === "BDT" ? "en-IN" : "en-US";
  const num = converted.toLocaleString(locale, { maximumFractionDigits: 0 });
  return `${cur.symbol}${num}`;
}

export function totalStock(p: Product): number {
  return p.sizes.reduce((s, v) => s + v.stock, 0);
}

export function isSoldOut(p: Product): boolean {
  return totalStock(p) === 0;
}

export function isLowStock(p: Product): boolean {
  const t = totalStock(p);
  return t > 0 && t <= 8;
}

export function stockLabel(p: Product): { label: string; tone: "ok" | "low" | "out" } {
  if (isSoldOut(p)) return { label: "Out of Stock", tone: "out" };
  if (isLowStock(p)) return { label: "Low Stock", tone: "low" };
  return { label: "In Stock", tone: "ok" };
}

export function onSale(p: Product): boolean {
  return typeof p.compareAtBDT === "number" && p.compareAtBDT > p.priceBDT;
}

type CouponDef = (typeof COUPONS)[number];

export function validateCoupon(
  code: string,
  subtotalBDT: number,
  coupons: CouponDef[],
): { ok: true; coupon: Coupon; discountBDT: number } | { ok: false; reason: string } {
  const c = coupons.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!c) return { ok: false, reason: "This code is not recognised." };
  if (new Date(c.expiresAt).getTime() < Date.now()) return { ok: false, reason: "This code has expired." };
  if (subtotalBDT < c.minSubtotalBDT)
    return { ok: false, reason: `Requires a minimum subtotal of ${formatPrice(c.minSubtotalBDT, "BDT")}.` };
  const discountBDT =
    c.type === "percent" ? Math.round((subtotalBDT * c.value) / 100) : Math.min(c.value, subtotalBDT);
  return { ok: true, coupon: c, discountBDT };
}

export function orderId(): string {
  return `NF-${Math.floor(100000 + Math.random() * 900000)}`;
}

/** Local-storage helpers with SSR guards. */
export function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLS<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full/blocked — fail silently */
  }
}

export const LS_KEYS = {
  cart: "nf-cart",
  wishlist: "nf-wishlist",
  recent: "nf-recent",
  searches: "nf-searches",
  orders: "nf-orders",
  currency: "nf-currency",
  user: "nf-user",
  cookie: "nf-consent",
  addresses: "nf-addresses",
} as const;
