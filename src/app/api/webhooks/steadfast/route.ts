// START OF FILE src/app/api/webhooks/steadfast/route.ts
import { NextRequest, NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { sendSMS, smsTemplates } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Steadfast সাধারণত invoice, tracking_code, consignment_id এবং status পাঠায়
    const invoice = body.invoice || body.order_id || body.id;
    const trackingCode = body.tracking_code || body.consignment?.tracking_code;
    const status = (body.status || body.notification_type || "").toLowerCase();

    if (!invoice && !trackingCode) {
      return NextResponse.json({ error: "Missing invoice or tracking identifier" }, { status: 400 });
    }

    // ১. Neon Database-এ নির্দিষ্ট অর্ডারটি খুঁজে বের করা
    const found = await db
      .select()
      .from(orders)
      .where(or(
        invoice ? eq(orders.id, invoice) : undefined
      ))
      .limit(1);

    const targetOrder = found[0];

    if (!targetOrder) {
      return NextResponse.json({ error: "Order not found in database" }, { status: 404 });
    }

    // ২. Steadfast স্ট্যাটাস ম্যাপিং
    let newOrderStatus = targetOrder.orderStatus;
    let newPaymentStatus = targetOrder.paymentStatus;
    let triggerDeliveredSMS = false;

    if (status.includes("delivered") || status === "completed") {
      newOrderStatus = "DELIVERED";
      newPaymentStatus = "PAID";
      triggerDeliveredSMS = true;
    } else if (status.includes("cancel") || status === "cancelled") {
      newOrderStatus = "CANCELLED";
    } else if (status.includes("transit") || status.includes("shipped") || status.includes("picked")) {
      newOrderStatus = "SHIPPED";
    } else if (status.includes("return")) {
      newOrderStatus = "REFUNDED";
    }

    // ৩. ডাটাবেজ আপডেট
    await db
      .update(orders)
      .set({
        orderStatus: newOrderStatus,
        paymentStatus: newPaymentStatus,
      })
      .where(eq(orders.id, targetOrder.id));

    // ৪. ডেলিভারি সম্পন্ন হলে স্বয়ংক্রিয় SMS
    if (triggerDeliveredSMS && targetOrder.customerPhone) {
      await sendSMS({
        to: targetOrder.customerPhone,
        message: smsTemplates.delivered(targetOrder.id),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Order ${targetOrder.id} status updated to ${newOrderStatus}`,
    });
  } catch (error: any) {
    console.error("Steadfast webhook error:", error);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}

// Steadfast Portal Healthcheck Handshake
export async function GET() {
  return NextResponse.json({ status: "Steadfast Webhook Listener Online" });
}
// END OF FILE src/app/api/webhooks/steadfast/route.ts
