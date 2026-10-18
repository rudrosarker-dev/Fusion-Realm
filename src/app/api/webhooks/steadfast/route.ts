// START OF FILE src/app/api/webhooks/steadfast/route.ts
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { sendSMS, smsTemplates } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // ১. ওয়েবহুক সিক্রেট ভ্যালিডেশন (Unverified Webhook Prevention)
    const expectedSecret = process.env.STEADFAST_WEBHOOK_SECRET;
    const providedSecret = req.headers.get("x-webhook-secret") || req.nextUrl.searchParams.get("secret");

    if (expectedSecret && providedSecret !== expectedSecret) {
      return NextResponse.json({ error: "Invalid webhook secret authorization" }, { status: 401 });
    }

    const body = await req.json();
    const invoice = body.invoice || body.order_id || body.id;
    const status = (body.status || body.notification_type || "").toLowerCase();

    if (!invoice) {
      return NextResponse.json({ error: "Missing invoice identifier" }, { status: 400 });
    }

    const found = await db
      .select()
      .from(orders)
      .where(eq(orders.id, invoice))
      .limit(1);

    const targetOrder = found[0];
    if (!targetOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    let newOrderStatus = targetOrder.orderStatus;
    let newPaymentStatus = targetOrder.paymentStatus;
    let triggerDeliveredSMS = false;

    if (status.includes("delivered") || status === "completed") {
      newOrderStatus = "DELIVERED";
      newPaymentStatus = "PAID";
      triggerDeliveredSMS = true;
    } else if (status.includes("cancel") || status === "cancelled") {
      newOrderStatus = "CANCELLED";
    } else if (status.includes("transit") || status.includes("shipped")) {
      newOrderStatus = "SHIPPED";
    } else if (status.includes("return")) {
      newOrderStatus = "REFUNDED";
    }

    await db
      .update(orders)
      .set({
        orderStatus: newOrderStatus,
        paymentStatus: newPaymentStatus,
      })
      .where(eq(orders.id, targetOrder.id));

    if (triggerDeliveredSMS && targetOrder.customerPhone) {
      await sendSMS({
        to: targetOrder.customerPhone,
        message: smsTemplates.delivered(targetOrder.id),
      });
    }

    return NextResponse.json({ success: true, message: "Status updated successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Steadfast Webhook Listener Online" });
}
// END OF FILE src/app/api/webhooks/steadfast/route.ts
