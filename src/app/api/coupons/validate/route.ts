import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { COUPONS as FALLBACK_COUPONS } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { code, subtotalBDT } = await req.json();

    if (!code) {
      return NextResponse.json({ ok: false, reason: "Please enter a coupon code." }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const subtotal = Number(subtotalBDT || 0);

    // ১. প্রথমে Neon Database-এ কুপন খুঁজবে
    const foundInDb = await db.select().from(coupons).where(eq(coupons.code, cleanCode)).limit(1);

    if (foundInDb.length > 0) {
      const c = foundInDb[0];

      if (!c.active) {
        return NextResponse.json({ ok: false, reason: "This coupon is currently inactive." });
      }

      if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) {
        return NextResponse.json({ ok: false, reason: "This coupon has expired." });
      }

      if (c.minSpendBDT && subtotal < c.minSpendBDT) {
        return NextResponse.json({
          ok: false,
          reason: `Requires a minimum order of ৳${c.minSpendBDT.toLocaleString()}.`,
        });
      }

      if (c.maxUsage && c.usedCount && c.usedCount >= c.maxUsage) {
        return NextResponse.json({ ok: false, reason: "Coupon usage limit reached." });
      }

      const discountBDT =
        c.discountType === "percent"
          ? Math.round((subtotal * c.discountValue) / 100)
          : Math.min(c.discountValue, subtotal);

      return NextResponse.json({
        ok: true,
        coupon: {
          code: c.code,
          type: c.discountType,
          value: c.discountValue,
        },
        discountBDT,
      });
    }

    // ২. ফলব্যাক সিড কুপন চেক (WELCOME10, NEWSEASON ইত্যাদি)
    const seed = FALLBACK_COUPONS.find((x) => x.code.toUpperCase() === cleanCode);
    if (seed) {
      if (subtotal < seed.minSubtotalBDT) {
        return NextResponse.json({
          ok: false,
          reason: `Requires a minimum order of ৳${seed.minSubtotalBDT.toLocaleString()}.`,
        });
      }
      const discountBDT =
        seed.type === "percent" ? Math.round((subtotal * seed.value) / 100) : Math.min(seed.value, subtotal);

      return NextResponse.json({
        ok: true,
        coupon: seed,
        discountBDT,
      });
    }

    return NextResponse.json({ ok: false, reason: "This coupon code is not valid." });
  } catch (error) {
    return NextResponse.json({ ok: false, reason: "Error validating coupon." }, { status: 500 });
  }
}
