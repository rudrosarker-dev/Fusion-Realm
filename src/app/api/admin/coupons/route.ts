import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { clampStr } from "@/lib/security";
import { isDeny, requireAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

// আগে এটা পাবলিক ছিল (কুপন কোড ফাঁস হতো)। এখন শুধু অথেন্টিকেটেড অ্যাডমিন/স্টাফ।
export async function GET() {
  try {
    const auth = await requireAccess("discounts", "orders");
    if (isDeny(auth)) return auth.response;
    const all = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
    return NextResponse.json({ success: true, coupons: all });
  } catch {
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAccess("discounts");
    if (isDeny(auth)) return auth.response;

    const body = await req.json().catch(() => ({}));
    const code = clampStr(body.code, 40).toUpperCase();
    const type = body.discountType === "fixed" ? "fixed" : "percent";
    const value = Math.floor(Number(body.discountValue));

    if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
      return NextResponse.json({ error: "Coupon code must be 3-40 chars (A-Z, 0-9, - _)" }, { status: 400 });
    }
    if (!Number.isFinite(value) || value < 1 || (type === "percent" && value > 100) || value > 10_000_000) {
      return NextResponse.json({ error: "Invalid discount value" }, { status: 400 });
    }

    const existing = await db.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, code)).limit(1);
    if (existing.length > 0) return NextResponse.json({ error: "This coupon code already exists" }, { status: 400 });

    const expires = body.expiresAt ? new Date(body.expiresAt) : null;
    const newCoupon = {
      id: `cpn-${crypto.randomUUID()}`,
      code,
      discountType: type,
      discountValue: value,
      minSpendBDT: Math.max(0, Math.floor(Number(body.minSpendBDT) || 0)),
      maxUsage: body.maxUsage ? Math.max(1, Math.floor(Number(body.maxUsage))) : null,
      usedCount: 0,
      active: true,
      expiresAt: expires && !isNaN(expires.getTime()) ? expires : null,
    };

    await db.insert(coupons).values(newCoupon);
    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch {
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAccess("discounts");
    if (isDeny(auth)) return auth.response;
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Coupon ID required" }, { status: 400 });
    await db.delete(coupons).where(eq(coupons.id, id));
    return NextResponse.json({ success: true, deletedId: id });
  } catch {
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
