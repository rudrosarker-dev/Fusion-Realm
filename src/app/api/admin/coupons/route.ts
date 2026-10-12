import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { coupons } from "@/db/schema";

export const dynamic = "force-dynamic";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("nf_admin_session");
  if (!session?.value) return false;
  try {
    const decoded = JSON.parse(Buffer.from(session.value, "base64").toString("utf-8"));
    return decoded.role === "SUPER_ADMIN";
  } catch {
    return false;
  }
}

// ১. সব কুপন দেখা
export async function GET() {
  try {
    const allCoupons = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
    return NextResponse.json({ success: true, coupons: allCoupons });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

// ২. নতুন কুপন তৈরি করা
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await req.json();
    const { code, discountType, discountValue, minSpendBDT, maxUsage, expiresAt } = body;

    if (!code || !discountValue) {
      return NextResponse.json({ error: "Code and discount value are required" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // চেক করা কোডটি আগেই আছে কি না
    const existing = await db.select().from(coupons).where(eq(coupons.code, cleanCode)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "This coupon code already exists" }, { status: 400 });
    }

    const newCoupon = {
      id: `cpn-${Date.now()}`,
      code: cleanCode,
      discountType: discountType || "percent", // 'percent' or 'fixed'
      discountValue: Number(discountValue),
      minSpendBDT: Number(minSpendBDT || 0),
      maxUsage: maxUsage ? Number(maxUsage) : null,
      usedCount: 0,
      active: true,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    };

    await db.insert(coupons).values(newCoupon);
    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (error) {
    console.error("Create coupon error:", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}

// ৩. কুপন ডিলিট করা
export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Coupon ID required" }, { status: 400 });

    await db.delete(coupons).where(eq(coupons.id, id));
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
