// src/lib/coupons-server.ts — কুপন যাচাই (সার্ভারই একমাত্র সত্য; ক্লায়েন্টের পাঠানো ডিসকাউন্ট বিশ্বাস করা হয় না)
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { COUPONS as SEED } from "@/lib/config";

export type CouponResult =
  | { ok: true; code: string; type: string; value: number; discountBDT: number; dbId: string | null; maxUsage: number | null }
  | { ok: false; reason: string };

export async function evaluateCoupon(rawCode: string, subtotalBDT: number): Promise<CouponResult> {
  const code = String(rawCode || "").trim().toUpperCase().slice(0, 40);
  if (!code) return { ok: false, reason: "Please enter a coupon code." };

  const found = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
  const c = found[0];
  if (c) {
    if (!c.active) return { ok: false, reason: "This coupon is currently inactive." };
    if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) return { ok: false, reason: "This coupon has expired." };
    if (c.minSpendBDT && subtotalBDT < c.minSpendBDT)
      return { ok: false, reason: `Requires a minimum order of ৳${c.minSpendBDT.toLocaleString()}.` };
    if (c.maxUsage && (c.usedCount ?? 0) >= c.maxUsage) return { ok: false, reason: "Coupon usage limit reached." };
    const discountBDT =
      c.discountType === "percent"
        ? Math.round((subtotalBDT * c.discountValue) / 100)
        : Math.min(c.discountValue, subtotalBDT);
    return { ok: true, code: c.code, type: c.discountType, value: c.discountValue, discountBDT, dbId: c.id, maxUsage: c.maxUsage ?? null };
  }

  const seed = SEED.find((x) => x.code.toUpperCase() === code);
  if (seed) {
    if (new Date(seed.expiresAt).getTime() < Date.now()) return { ok: false, reason: "This coupon has expired." };
    if (subtotalBDT < seed.minSubtotalBDT)
      return { ok: false, reason: `Requires a minimum order of ৳${seed.minSubtotalBDT.toLocaleString()}.` };
    const discountBDT = seed.type === "percent" ? Math.round((subtotalBDT * seed.value) / 100) : Math.min(seed.value, subtotalBDT);
    return { ok: true, code: seed.code, type: seed.type, value: seed.value, discountBDT, dbId: null, maxUsage: null };
  }
  return { ok: false, reason: "This coupon code is not valid." };
}
