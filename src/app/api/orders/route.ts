// START OF FILE src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { eq, desc, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { BRAND_CONFIG } from "@/lib/brand.config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));

    return NextResponse.json({ success: true, orders: allOrders });
  } catch (error: any) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders from database" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.customerName || !body.customerPhone || !body.items || body.items.length === 0) {
      return NextResponse.json({ error: "Missing required order details" }, { status: 400 });
    }

    const orderId = body.id || `NF-${Math.floor(100000 + Math.random() * 900000)}`;

    const advancePaid = Number(body.advancePaidBDT || body.shippingBDT || 0);
    const totalAmount = Number(body.totalBDT || body.total || 0);
    const dueAmount = Math.max(0, totalAmount - advancePaid);
    const trxId = body.transactionId ? body.transactionId.trim().toUpperCase() : "N/A";
    const senderNumber = body.senderPhone ? body.senderPhone.trim() : "N/A";
    const customerEmail = (body.customerEmail || body.email || "guest@noirform.com").trim().toLowerCase();

    const newOrder = {
      id: orderId,
      userId: body.userId || null,
      customerName: body.customerName,
      customerEmail: customerEmail,
      customerPhone: body.customerPhone,
      shippingAddress: {
        division: body.shippingAddress?.division || "Dhaka",
        district: body.shippingAddress?.district || "Dhaka",
        address: body.shippingAddress?.address || "",
        notes: body.shippingAddress?.notes || "",
        advancePaidBDT: advancePaid,
        dueAmountBDT: dueAmount,
        senderNumber: senderNumber,
        transactionId: trxId,
      },
      items: body.items.map((item: any) => ({
        productId: item.productId || item.id || item.pId || "unknown",
        name: item.name || item.pName,
        size: item.size || "M",
        color: item.color || "Default",
        quantity: Number(item.quantity || item.qty || 1),
        priceBDT: Number(item.priceBDT || item.price || 0),
        image: item.image || item.images?.[0]?.src || "/images/product-tee.jpg",
      })),
      subtotalBDT: Number(body.subtotalBDT || body.subtotal || 0),
      shippingBDT: Number(body.shippingBDT || body.shipping || 0),
      discountBDT: Number(body.discountBDT || 0),
      totalBDT: totalAmount,
      paymentMethod: `${body.paymentMethod || "COD"} [Adv: ৳${advancePaid} | Trx: ${trxId}]`,
      paymentStatus: (body.paymentStatus || "PENDING").toUpperCase(),
      orderStatus: (body.orderStatus || "PENDING").toUpperCase(),
    };

    // ১. অর্ডার ডাটাবেজে সংরক্ষণ
    await db.insert(orders).values(newOrder);

    // ২. রিয়েল-টাইম স্টক ডিডাকশন (Bulletproof Automated Inventory Deduction)
    try {
      for (const item of newOrder.items) {
        const prodId = item.productId;
        if (prodId && prodId !== "unknown") {
          // প্রোডাক্ট আইডি অথবা স্লাগ দিয়ে প্রোডাক্ট লোড করা
          const foundProduct = await db
            .select()
            .from(products)
            .where(or(eq(products.id, prodId), eq(products.slug, prodId)))
            .limit(1);

          if (foundProduct.length > 0) {
            const p = foundProduct[0];
            let rawSizes: any = p.sizes;

            // ডাটাবেজ যদি স্ট্রিং রিটার্ন করে তবে সেফ JSON পার্সিং
            if (typeof rawSizes === "string") {
              try {
                rawSizes = JSON.parse(rawSizes);
              } catch {
                rawSizes = [];
              }
            }

            if (Array.isArray(rawSizes)) {
              let sizeMatched = false;
              const updatedSizes = rawSizes.map((s: any) => {
                const sName = String(s.size || "").trim().toUpperCase();
                const targetSize = String(item.size || "").trim().toUpperCase();

                if (sName === targetSize) {
                  sizeMatched = true;
                  const currentStock = Number(s.stock) || 0;
                  const deductQty = Number(item.quantity) || 1;
                  return { ...s, stock: Math.max(0, currentStock - deductQty) };
                }
                return s;
              });

              // যদি নির্দিষ্ট সাইজ পাওয়া যায়, ডাটাবেজ লাইভ আপডেট করা
              if (sizeMatched) {
                await db
                  .update(products)
                  .set({ sizes: updatedSizes })
                  .where(eq(products.id, p.id));
              }
            }
          }
        }
      }
    } catch (stockErr) {
      console.error("Critical Stock deduction error:", stockErr);
    }

    // ৩. Resend email memo
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        const itemsHtml = newOrder.items
          .map(
            (item: any) => `
            <tr style="border-bottom: 1px solid #e8e5dc;">
              <td style="padding: 12px 0;">
                <strong style="color: #161513; font-size: 13px;">${item.name}</strong><br/>
                <span style="color: #777; font-size: 11px;">Size: ${item.size} • Color: ${item.color} • Qty: ${item.quantity}</span>
              </td>
              <td style="padding: 12px 0; text-align: right; color: #161513; font-size: 13px; font-weight: 600;">
                ৳${(item.priceBDT * item.quantity).toLocaleString()}
              </td>
            </tr>
          `
          )
          .join("");

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${BRAND_CONFIG.brandName} <onboarding@resend.dev>`,
            to: [customerEmail],
            subject: `Order Confirmed: #${orderId} — ${BRAND_CONFIG.brandName}`,
            html: `
              <div style="font-family: sans-serif; background-color: #f7f5f0; padding: 24px;">
                <div style="max-width: 500px; margin: 0 auto; background: #fff; padding: 24px; border: 1px solid #ddd;">
                  <h2>Thank you, ${body.customerName}!</h2>
                  <p>Order ID: <strong>${orderId}</strong></p>
                  <table style="width: 100%; border-collapse: collapse;">${itemsHtml}</table>
                  <p style="margin-top: 16px;">Due to Courier: <strong>৳${dueAmount.toLocaleString()}</strong></p>
                </div>
              </div>
            `,
          }),
        });
      }
    } catch (e) {
      console.error("Resend memo error", e);
    }

    return NextResponse.json({ success: true, orderId, order: newOrder });
  } catch (error: any) {
    console.error("Failed to place order:", error);
    return NextResponse.json({ error: "Failed to save order to database" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const updates: any = {};
    if (body.orderStatus) updates.orderStatus = body.orderStatus.toUpperCase();
    if (body.paymentStatus) updates.paymentStatus = body.paymentStatus.toUpperCase();

    await db.update(orders).set(updates).where(eq(orders.id, body.id));
    return NextResponse.json({ success: true, updated: updates });
  } catch (error: any) {
    console.error("Failed to update order:", error);
    return NextResponse.json({ error: "Failed to update order in database" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const purgeAll = searchParams.get("purgeAll");

    if (purgeAll === "true") {
      await db.delete(orders);
      return NextResponse.json({ success: true, message: "All test orders wiped for clean client handover." });
    }

    if (id) {
      await db.delete(orders).where(eq(orders.id, id));
      return NextResponse.json({ success: true, deletedId: id });
    }

    const body = await req.json().catch(() => ({}));
    if (body.ids && Array.isArray(body.ids) && body.ids.length > 0) {
      await db.delete(orders).where(inArray(orders.id, body.ids));
      return NextResponse.json({ success: true, count: body.ids.length });
    }

    return NextResponse.json({ error: "No order ID specified" }, { status: 400 });
  } catch (error: any) {
    console.error("Failed to delete order:", error);
    return NextResponse.json({ error: "Failed to delete order from database" }, { status: 500 });
  }
}
// END OF FILE src/app/api/orders/route.ts
