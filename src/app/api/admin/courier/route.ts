// START OF FILE src/app/api/admin/courier/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { BRAND_CONFIG } from "@/lib/brand.config";
import { sendSMS, smsTemplates } from "@/lib/sms";

export const dynamic = "force-dynamic";

async function verifyStaffOrAdmin() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("nf_admin_session");
  const staffSession = cookieStore.get("nf_staff_session");

  if (adminSession?.value) {
    try {
      const decoded = JSON.parse(Buffer.from(adminSession.value, "base64").toString("utf-8"));
      if (decoded.role === "SUPER_ADMIN") return true;
    } catch {}
  }

  if (staffSession?.value) {
    try {
      const decoded = JSON.parse(Buffer.from(staffSession.value, "base64").toString("utf-8"));
      if (decoded.permissions?.includes("orders")) return true;
    } catch {}
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await verifyStaffOrAdmin();
    if (!isAuthorized) return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });

    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "Order ID is required" }, { status: 400 });

    const found = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    const order = found[0];
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const apiKey = process.env.STEADFAST_API_KEY;
    const secretKey = process.env.STEADFAST_SECRET_KEY;

    let trackingCode = "";
    let consignmentId = "";

    const shippingAddr: any = order.shippingAddress || {};
    const dueAmount = Number(shippingAddr?.dueAmountBDT ?? order.totalBDT);
    const recipientName = order.customerName;
    const recipientPhone = order.customerPhone;
    const recipientAddress = `${shippingAddr?.address || ""}, ${shippingAddr?.district || ""}, ${shippingAddr?.division || ""}`;

    if (apiKey && secretKey) {
      const sfRes = await fetch("https://portal.steadfast.com.bd/api/v1/create_order", {
        method: "POST",
        headers: {
          "Api-Key": apiKey,
          "Secret-Key": secretKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoice: order.id,
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          recipient_address: recipientAddress,
          cod_amount: dueAmount,
          note: `Delivered by ${BRAND_CONFIG.brandName}`,
        }),
      });

      const sfData = await sfRes.json();
      if (sfRes.ok && sfData.status === 200) {
        trackingCode = sfData.consignment?.tracking_code || `STDF-${Date.now().toString().slice(-6)}`;
        consignmentId = sfData.consignment?.consignment_id?.toString() || "";
      } else {
        return NextResponse.json({ error: sfData.message || "Steadfast Courier API error" }, { status: 400 });
      }
    } else {
      trackingCode = `STDF-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    const updatedShippingAddress = {
      ...shippingAddr,
      courier: "Steadfast Courier",
      trackingCode: trackingCode,
      consignmentId: consignmentId,
      dispatchedAt: new Date().toISOString(),
    };

    await db
      .update(orders)
      .set({
        orderStatus: "SHIPPED",
        shippingAddress: updatedShippingAddress,
      })
      .where(eq(orders.id, orderId));

    // স্বয়ংক্রিয় ট্র্যাকিং SMS সেন্ড করা
    if (order.customerPhone) {
      await sendSMS({
        to: order.customerPhone,
        message: smsTemplates.courierDispatched(order.id, trackingCode, dueAmount),
      });
    }

    return NextResponse.json({
      success: true,
      trackingCode,
      message: "কুরিয়ার বুকিং সম্পন্ন হয়েছে এবং কাস্টমারকে ট্র্যাকিং SMS পাঠানো হয়েছে!",
    });
  } catch (err: any) {
    console.error("Courier dispatch error:", err);
    return NextResponse.json({ error: "কুরিয়ার বুকিং করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
// END OF FILE src/app/api/admin/courier/route.ts
