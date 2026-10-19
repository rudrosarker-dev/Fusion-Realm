import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { sendSMS, smsTemplates } from "@/lib/sms";
import { timingSafeEqualStr } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // ফেইল-ক্লোজড: সিক্রেট কনফিগার করা না থাকলে ওয়েবহুক কাজই করবে না (আগে চেক বাদ পড়ত)
    const expected = process.env.STEADFAST_WEBHOOK_SECRET;
    if (!expected || expected.length < 16) {
      console.error("STEADFAST_WEBHOOK_SECRET is not configured (min 16 chars)");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }
    // শুধু হেডার (URL query-তে সিক্রেট লগে ফাঁস হয়), এবং টাইমিং-সেফ তুলনা
    const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const provided = req.headers.get("x-webhook-secret") || bearer || "";
    if (!provided || !timingSafeEqualStr(provided, expected)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const invoice = typeof (body.invoice || body.order_id || body.id) === "string" ? (body.invoice || body.order_id || body.id) : "";
    const status = String(body.status || body.notification_type || "").toLowerCase().slice(0, 50);
    if (!invoice) return NextResponse.json({ error: "Missing invoice identifier" }, { status: 400 });

    const found = await db.select().from(orders).where(eq(orders.id, invoice)).limit(1);
    const target = found[0];
    if (!target) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    let newOrderStatus = target.orderStatus;
    let newPaymentStatus = target.paymentStatus;
    let sendDelivered = false;

    // ইতিমধ্যে চূড়ান্ত অবস্থায় থাকা অর্ডার (বিতরণ/বাতিল/ফেরত) আবার বদলানো হয় না — রিপ্লে/ওভাররাইট ঠেকায়
    const finalStates = ["DELIVERED", "CANCELLED", "REFUNDED"];
    if (finalStates.includes(target.orderStatus)) {
      return NextResponse.json({ success: true, message: "No change (order already final)." });
    }

    if (status.includes("delivered") || status === "completed") {
      newOrderStatus = "DELIVERED";
      newPaymentStatus = "PAID";
      sendDelivered = true;
    } else if (status.includes("cancel")) {
      newOrderStatus = "CANCELLED";
    } else if (status.includes("transit") || status.includes("shipped")) {
      newOrderStatus = "SHIPPED";
    } else if (status.includes("return")) {
      newOrderStatus = "REFUNDED";
    }

    await db.update(orders).set({ orderStatus: newOrderStatus, paymentStatus: newPaymentStatus }).where(eq(orders.id, target.id));

    if (sendDelivered && target.customerPhone) {
      await sendSMS({ to: target.customerPhone, message: smsTemplates.delivered(target.id) });
    }
    return NextResponse.json({ success: true, message: "Status updated successfully." });
  } catch {
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
