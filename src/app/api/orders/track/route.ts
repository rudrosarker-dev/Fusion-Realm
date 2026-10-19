import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { checkRateLimit, clampStr, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const digitsOnly = (s: string) => s.replace(/[^0-9]/g, "");

// IDOR/ডেটা-লিক ফিক্স: অর্ডার আইডি এবং ফোন নম্বর — দুটোই একসাথে মিলতে হবে (আগে OR ছিল)
export async function GET(req: NextRequest) {
  try {
    if (!(await checkRateLimit(`track-${getClientIp(req)}`, 10, 60))) {
      return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const id = clampStr(searchParams.get("id"), 40).toUpperCase();
    const phone = digitsOnly(clampStr(searchParams.get("phone"), 25));

    if (!id || phone.length < 10) {
      return NextResponse.json({ error: "Order ID and phone number are both required" }, { status: 400 });
    }

    const found = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    const o = found[0];
    // শেষ ১০ ডিজিট মেলানো (+880 / 0 প্রিফিক্সের পার্থক্য সামলাতে)
    const stored = digitsOnly(o?.customerPhone || "");
    const match = o && phone.slice(-10) === stored.slice(-10);

    if (!match) return NextResponse.json({ error: "Order not found" }, { status: 404 }); // কারণ আলাদা করে বলা হয় না

    const addr: any = o.shippingAddress || {};
    return NextResponse.json({
      success: true,
      orders: [
        {
          id: o.id,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          orderStatus: o.orderStatus,
          paymentStatus: o.paymentStatus,
          subtotalBDT: o.subtotalBDT,
          shippingBDT: o.shippingBDT,
          discountBDT: o.discountBDT,
          totalBDT: o.totalBDT,
          createdAt: o.createdAt,
          items: (o.items || []).map((i) => ({ name: i.name, size: i.size, color: i.color, quantity: i.quantity, priceBDT: i.priceBDT, image: i.image })),
          shippingAddress: {
            division: addr.division,
            district: addr.district,
            courier: addr.courier,
            trackingCode: addr.trackingCode,
          },
        },
      ],
    });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
