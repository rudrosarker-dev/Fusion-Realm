import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { BRAND_CONFIG } from "@/lib/brand.config";
import { sendSMS, smsTemplates } from "@/lib/sms";
import { isDeny, requireAccess } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAccess("orders");
    if (isDeny(auth)) return auth.response;
    if (!(await checkRateLimit(`courier-${auth.actor.user.id}`, 60, 60))) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { orderId } = await req.json().catch(() => ({}));
    if (typeof orderId !== "string" || !orderId) return NextResponse.json({ error: "Order ID is required" }, { status: 400 });

    const found = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    const order = found[0];
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    // একই অর্ডার দুইবার কুরিয়ারে বুক হওয়া ঠেকানো
    if ((order.shippingAddress as any)?.trackingCode) {
      return NextResponse.json({ error: "This order is already dispatched." }, { status: 409 });
    }

    const apiKey = process.env.STEADFAST_API_KEY;
    const secretKey = process.env.STEADFAST_SECRET_KEY;

    let trackingCode = "";
    let consignmentId = "";

    const shippingAddr: any = order.shippingAddress || {};
    const dueAmount = Number(shippingAddr?.dueAmountBDT ?? order.totalBDT);
    const recipientAddress = `${shippingAddr?.address || ""}, ${shippingAddr?.district || ""}, ${shippingAddr?.division || ""}`;

    if (apiKey && secretKey) {
      const sfRes = await fetch("https://portal.steadfast.com.bd/api/v1/create_order", {
        method: "POST",
        headers: { "Api-Key": apiKey, "Secret-Key": secretKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice: order.id,
          recipient_name: order.customerName,
          recipient_phone: order.customerPhone,
          recipient_address: recipientAddress,
          cod_amount: dueAmount,
          note: `Delivered by ${BRAND_CONFIG.brandName}`,
        }),
      });
      const sfData = await sfRes.json().catch(() => ({}));
      if (sfRes.ok && sfData.status === 200) {
        trackingCode = sfData.consignment?.tracking_code || "";
        consignmentId = sfData.consignment?.consignment_id?.toString() || "";
        if (!trackingCode) return NextResponse.json({ error: "Courier returned no tracking code" }, { status: 502 });
      } else {
        return NextResponse.json({ error: "Steadfast Courier API error" }, { status: 400 });
      }
    } else if (process.env.NODE_ENV === "production") {
      // প্রোডাকশনে কী না থাকলে নকল ট্র্যাকিং কোড বানানো হবে না
      return NextResponse.json({ error: "Courier API is not configured" }, { status: 500 });
    } else {
      trackingCode = `STDF-DEV-${Date.now().toString().slice(-6)}`;
    }

    await db
      .update(orders)
      .set({
        orderStatus: "SHIPPED",
        shippingAddress: {
          ...shippingAddr,
          courier: "Steadfast Courier",
          trackingCode,
          consignmentId,
          dispatchedAt: new Date().toISOString(),
        },
      })
      .where(eq(orders.id, orderId));

    if (order.customerPhone) {
      await sendSMS({ to: order.customerPhone, message: smsTemplates.courierDispatched(order.id, trackingCode, dueAmount) });
    }

    return NextResponse.json({
      success: true,
      trackingCode,
      message: "কুরিয়ার বুকিং সম্পন্ন হয়েছে এবং কাস্টমারকে ট্র্যাকিং SMS পাঠানো হয়েছে!",
    });
  } catch {
    return NextResponse.json({ error: "কুরিয়ার বুকিং করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
