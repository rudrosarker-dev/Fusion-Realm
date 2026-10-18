// START OF FILE src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, desc, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { BRAND_CONFIG } from "@/lib/brand.config";
import { verifySession } from "@/lib/auth-token";
import { escapeHtml, checkRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

// ১. অথেন্টিকেটেড ছাড়া কেউ যেন সমস্ত কাস্টমারদের অর্ডার দেখতে না পায় (IDOR Fix)
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminSession = verifySession(cookieStore.get("nf_admin_session")?.value);
    const staffSession = verifySession(cookieStore.get("nf_staff_session")?.value);

    // স্টাফ বা অ্যাডমিন হলে সব অর্ডার দেখবে
    if (adminSession?.role === "SUPER_ADMIN" || staffSession?.permissions?.includes("orders")) {
      const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
      return NextResponse.json({ success: true, orders: allOrders });
    }

    // সাধারণ কাস্টমার হলে কোনো প্যারামিটার ছাড়া সব অর্ডার দেখা যাবে না
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`order-create-${ip}`, 10, 60)) {
      return NextResponse.json({ error: "Too many orders attempted. Please wait." }, { status: 429 });
    }

    const body = await req.json();

    if (!body.customerName || !body.customerPhone || !body.items || body.items.length === 0) {
      return NextResponse.json({ error: "Missing required order details" }, { status: 400 });
    }

    const orderId = body.id || `NF-${Math.floor(100000 + Math.random() * 900000)}`;
    const advancePaid = Number(body.advancePaidBDT || body.shippingBDT || 0);
    const totalAmount = Number(body.totalBDT || body.total || 0);
    const dueAmount = Math.max(0, totalAmount - advancePaid);
    const trxId = body.transactionId ? String(body.transactionId).trim().toUpperCase() : "N/A";
    const senderNumber = body.senderPhone ? String(body.senderPhone).trim() : "N/A";
    const customerEmail = (body.customerEmail || body.email || "guest@noirform.com").trim().toLowerCase();

    const newOrder = {
      id: orderId,
      userId: body.userId || null,
      customerName: String(body.customerName).slice(0, 100),
      customerEmail: customerEmail.slice(0, 100),
      customerPhone: String(body.customerPhone).slice(0, 20),
      shippingAddress: {
        division: body.shippingAddress?.division || "Dhaka",
        district: body.shippingAddress?.district || "Dhaka",
        address: String(body.shippingAddress?.address || "").slice(0, 300),
        notes: String(body.shippingAddress?.notes || "").slice(0, 300),
        advancePaidBDT: advancePaid,
        dueAmountBDT: dueAmount,
        senderNumber: senderNumber,
        transactionId: trxId,
      },
      items: body.items.map((item: any) => ({
        productId: item.productId || item.id || "unknown",
        name: String(item.name || "Garment").slice(0, 100),
        size: String(item.size || "M").slice(0, 10),
        color: String(item.color || "Default").slice(0, 30),
        quantity: Math.max(1, Number(item.quantity || 1)),
        priceBDT: Number(item.priceBDT || 0),
        image: item.image || "/images/product-tee.jpg",
      })),
      subtotalBDT: Number(body.subtotalBDT || 0),
      shippingBDT: Number(body.shippingBDT || 0),
      discountBDT: Number(body.discountBDT || 0),
      totalBDT: totalAmount,
      paymentMethod: `${body.paymentMethod || "COD"} [Adv: ৳${advancePaid} | Trx: ${trxId}]`,
      paymentStatus: (body.paymentStatus || "PENDING").toUpperCase(),
      orderStatus: (body.orderStatus || "PENDING").toUpperCase(),
    };

    await db.insert(orders).values(newOrder);

    // স্টক ডিডাকশন
    try {
      for (const item of newOrder.items) {
        if (item.productId && item.productId !== "unknown") {
          const foundProduct = await db
            .select()
            .from(products)
            .where(or(eq(products.id, item.productId), eq(products.slug, item.productId)))
            .limit(1);

          if (foundProduct.length > 0) {
            const p = foundProduct[0];
            let rawSizes: any = p.sizes;
            if (typeof rawSizes === "string") {
              try { rawSizes = JSON.parse(rawSizes); } catch { rawSizes = []; }
            }

            if (Array.isArray(rawSizes)) {
              let matched = false;
              const updatedSizes = rawSizes.map((s: any) => {
                if (String(s.size).toUpperCase() === String(item.size).toUpperCase()) {
                  matched = true;
                  return { ...s, stock: Math.max(0, (Number(s.stock) || 0) - item.quantity) };
                }
                return s;
              });

              if (matched) {
                await db.update(products).set({ sizes: updatedSizes }).where(eq(products.id, p.id));
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Stock deduction error:", e);
    }

    // ইমেইল পাঠানোর সময় HTML Injection প্রতিরোধে escapeHtml ব্যবহার
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        const safeItemsHtml = newOrder.items
          .map(
            (item: any) => `
            <tr style="border-bottom: 1px solid #e8e5dc;">
              <td style="padding: 12px 0;">
                <strong style="color: #161513; font-size: 13px;">${escapeHtml(item.name)}</strong><br/>
                <span style="color: #777; font-size: 11px;">Size: ${escapeHtml(item.size)} • Color: ${escapeHtml(item.color)} • Qty: ${item.quantity}</span>
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
                  <h2>Thank you, ${escapeHtml(body.customerName)}!</h2>
                  <p>Order ID: <strong>${escapeHtml(orderId)}</strong></p>
                  <table style="width: 100%; border-collapse: collapse;">${safeItemsHtml}</table>
                  <p style="margin-top: 16px;">Due to Courier: <strong>৳${dueAmount.toLocaleString()}</strong></p>
                </div>
              </div>
            `,
          }),
        });
      }
    } catch (e) {
      console.error("Resend error:", e);
    }

    return NextResponse.json({ success: true, orderId, order: newOrder });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to process order" }, { status: 500 });
  }
}

// শুধুমাত্র অথরাইজড স্টাফ বা অ্যাডমিন অর্ডার আপডেট করতে পারবে
export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminSession = verifySession(cookieStore.get("nf_admin_session")?.value);
    const staffSession = verifySession(cookieStore.get("nf_staff_session")?.value);

    if (adminSession?.role !== "SUPER_ADMIN" && !staffSession?.permissions?.includes("orders")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "Order ID required" }, { status: 400 });

    const updates: any = {};
    if (body.orderStatus) updates.orderStatus = String(body.orderStatus).toUpperCase();
    if (body.paymentStatus) updates.paymentStatus = String(body.paymentStatus).toUpperCase();

    await db.update(orders).set(updates).where(eq(orders.id, body.id));
    return NextResponse.json({ success: true, updated: updates });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

// শুধুমাত্র সুপার অ্যাডমিন অর্ডার মুছতে পারবে
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminSession = verifySession(cookieStore.get("nf_admin_session")?.value);

    if (adminSession?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only super admin can delete orders" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const purgeAll = searchParams.get("purgeAll");

    if (purgeAll === "true") {
      await db.delete(orders);
      return NextResponse.json({ success: true, message: "All orders wiped." });
    }

    if (id) {
      await db.delete(orders).where(eq(orders.id, id));
      return NextResponse.json({ success: true, deletedId: id });
    }

    const body = await req.json().catch(() => ({}));
    if (body.ids && Array.isArray(body.ids)) {
      await db.delete(orders).where(inArray(orders.id, body.ids));
      return NextResponse.json({ success: true, count: body.ids.length });
    }

    return NextResponse.json({ error: "No order ID specified" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
// END OF FILE src/app/api/orders/route.ts
