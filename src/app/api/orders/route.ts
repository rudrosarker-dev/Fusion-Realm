import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { eq, desc, inArray, or, sql, and } from "drizzle-orm";
import { db } from "@/db";
import { orders, products, coupons, blacklists } from "@/db/schema";
import { BRAND_CONFIG } from "@/lib/brand.config";
import { escapeHtml, checkRateLimit, clampStr, getClientIp } from "@/lib/security";
import { getCustomerUser, isDeny, requireAccess, requireSuperAdmin } from "@/lib/auth";
import { evaluateCoupon } from "@/lib/coupons-server";
import { ensureTables } from "@/lib/ensure-tables";

export const dynamic = "force-dynamic";

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED", "RETURNED", "ON_HOLD"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "PARTIAL", "UNPAID", "FAILED", "REFUNDED"];
const PHONE_RE = /^\+?[0-9\s-]{10,15}$/;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;

class OrderError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

// ১. সব অর্ডার — শুধু অর্ডার-অ্যাক্সেস আছে এমন অ্যাডমিন/স্টাফ (সাইন+DB যাচাই করা সেশন)
export async function GET() {
  try {
    const auth = await requireAccess("orders", "customers");
    if (isDeny(auth)) return auth.response;
    const all = await db.select().from(orders).orderBy(desc(orders.createdAt));
    return NextResponse.json({ success: true, orders: all });
  } catch {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// ২. নতুন অর্ডার — দাম, ডিসকাউন্ট, শিপিং, স্ট্যাটাস সবই সার্ভারে হিসাব; ক্লায়েন্টের সংখ্যা বিশ্বাস করা হয় না
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!(await checkRateLimit(`order-create-${ip}`, 8, 600))) {
      return NextResponse.json({ error: "Too many orders attempted. Please wait." }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const customerName = clampStr(body.customerName, 100);
    const customerPhone = clampStr(body.customerPhone, 20);
    const customerEmail = clampStr(body.customerEmail || body.email, 100).toLowerCase();
    if (customerName.length < 2 || !PHONE_RE.test(customerPhone)) {
      return NextResponse.json({ error: "Valid name and phone are required" }, { status: 400 });
    }
    if (customerEmail && !EMAIL_RE.test(customerEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 30) {
      return NextResponse.json({ error: "Missing order items" }, { status: 400 });
    }

    const fullPayment = body.paymentType === "full-payment";
    const trx = clampStr(body.transactionId, 12).toUpperCase();
    const senderPhone = clampStr(body.senderPhone, 11);
    if (!/^[A-Z0-9]{8,12}$/.test(trx) || !/^01[3-9]\d{8}$/.test(senderPhone)) {
      return NextResponse.json({ error: "Valid bKash/Nagad TrxID and sender number are required" }, { status: 400 });
    }

    // ব্ল্যাকলিস্টেড নম্বর শুধু ফুল-পেমেন্টে অর্ডার করতে পারবে (সার্ভারেই বাধ্যতামূলক)
    const digits = customerPhone.replace(/[^0-9+]/g, "");
    const bl = await db
      .select({ id: blacklists.id })
      .from(blacklists)
      .where(or(eq(blacklists.phone, customerPhone), eq(blacklists.phone, digits)))
      .limit(1);
    if (bl.length > 0 && !fullPayment) {
      return NextResponse.json({ error: "এই নম্বরের জন্য শুধু ফুল-পেমেন্ট প্রযোজ্য।" }, { status: 403 });
    }

    // একই TrxID দিয়ে একাধিক অর্ডার ঠেকানো
    const dupe = await db
      .select({ id: orders.id })
      .from(orders)
      .where(sql`${orders.shippingAddress}->>'transactionId' = ${trx}`)
      .limit(1);
    if (dupe.length > 0) return NextResponse.json({ error: "This TrxID has already been used." }, { status: 409 });

    // আইটেম নরমালাইজ
    const reqItems = body.items.map((it: any) => ({
      key: clampStr(it?.productId || it?.id, 100),
      size: clampStr(it?.size, 10) || "M",
      color: clampStr(it?.color, 30) || "Default",
      qty: Math.floor(Number(it?.qty ?? it?.quantity ?? 1)),
    }));
    if (reqItems.some((i: any) => !i.key || !Number.isFinite(i.qty) || i.qty < 1 || i.qty > 20)) {
      return NextResponse.json({ error: "Invalid item quantity" }, { status: 400 });
    }

    const division = clampStr(body.shippingAddress?.division, 40) || "Dhaka";
    const district = clampStr(body.shippingAddress?.district, 40) || "Dhaka";
    const address = clampStr(body.shippingAddress?.address, 300);
    if (address.length < 5) return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });

    const customer = await getCustomerUser();
    const orderId = `NF-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;

    const result = await db.transaction(async (tx) => {
      // প্রোডাক্ট লক করে স্টক পুনরায় যাচাই (একসাথে অনেক অর্ডারে ওভারসেল ঠেকায়)
      const keys: string[] = Array.from(new Set<string>(reqItems.map((i: any) => i.key)));
      const prods = await tx
        .select()
        .from(products)
        .where(or(inArray(products.id, keys), inArray(products.slug, keys)))
        .for("update");

      const byKey = new Map<string, (typeof prods)[number]>();
      for (const p of prods) {
        byKey.set(p.id, p);
        byKey.set(p.slug, p);
      }

      const lines: {
        productId: string; name: string; size: string; color: string; quantity: number; priceBDT: number; image: string;
      }[] = [];
      const stockMap = new Map<string, { size: string; stock: number }[]>();

      for (const it of reqItems) {
        const p = byKey.get(it.key);
        if (!p) throw new OrderError("একটি পণ্য আর পাওয়া যাচ্ছে না। কার্ট রিফ্রেশ করুন।");
        const sizes = stockMap.get(p.id) ?? (Array.isArray(p.sizes) ? p.sizes.map((s) => ({ ...s })) : []);
        const row = sizes.find((s) => String(s.size).toUpperCase() === it.size.toUpperCase());
        if (!row) throw new OrderError(`${p.name}: সাইজ ${it.size} পাওয়া যায়নি।`);
        if ((Number(row.stock) || 0) < it.qty) throw new OrderError(`${p.name} (${it.size}) পর্যাপ্ত স্টকে নেই।`, 409);
        row.stock = (Number(row.stock) || 0) - it.qty;
        stockMap.set(p.id, sizes);

        lines.push({
          productId: p.id,
          name: p.name.slice(0, 100),
          size: row.size,
          color: it.color,
          quantity: it.qty,
          priceBDT: p.priceBDT, // দাম সবসময় ডাটাবেজ থেকে
          image: p.images?.[0]?.src || "/images/product-tee.jpg",
        });
      }

      const subtotal = lines.reduce((s, l) => s + l.priceBDT * l.quantity, 0);

      let discount = 0;
      if (body.couponCode) {
        const c = await evaluateCoupon(String(body.couponCode), subtotal);
        if (!c.ok) throw new OrderError(c.reason);
        discount = c.discountBDT;
        if (c.dbId) {
          // ব্যবহারসীমা অ্যাটমিকভাবে বাড়ানো
          const upd = await tx
            .update(coupons)
            .set({ usedCount: sql`${coupons.usedCount} + 1` })
            .where(
              and(
                eq(coupons.id, c.dbId),
                c.maxUsage ? sql`${coupons.usedCount} < ${c.maxUsage}` : sql`true`
              )
            )
            .returning({ id: coupons.id });
          if (upd.length === 0) throw new OrderError("Coupon usage limit reached.");
        }
      }

      const inside = division === "Dhaka" && district === "Dhaka";
      const shipping =
        subtotal >= BRAND_CONFIG.shipping.freeShippingThreshold
          ? 0
          : inside
          ? BRAND_CONFIG.shipping.insideDhakaFee
          : BRAND_CONFIG.shipping.outsideDhakaFee;
      const total = Math.max(0, subtotal - discount) + shipping;
      const advance = fullPayment ? total : shipping;
      const due = fullPayment ? 0 : Math.max(0, total - shipping);

      for (const [pid, sizes] of stockMap) {
        await tx.update(products).set({ sizes }).where(eq(products.id, pid));
      }

      const newOrder = {
        id: orderId,
        userId: customer?.id ?? null, // সেশন থেকে, বডি থেকে নয়
        customerName,
        customerEmail: customerEmail || "no-email@invalid.local",
        customerPhone,
        shippingAddress: {
          division,
          district,
          address,
          notes: clampStr(body.shippingAddress?.notes, 300),
          advancePaidBDT: advance,
          dueAmountBDT: due,
          senderNumber: senderPhone,
          transactionId: trx,
        },
        items: lines,
        subtotalBDT: subtotal,
        shippingBDT: shipping,
        discountBDT: discount,
        totalBDT: total,
        paymentMethod: `${fullPayment ? "Full Paid" : "COD"} [Adv: ৳${advance} | Trx: ${trx}]`,
        paymentStatus: "PENDING", // পেমেন্ট ভেরিফাই করে স্টাফ নিজে PAID করবে
        orderStatus: "PENDING",
      };
      await tx.insert(orders).values(newOrder);
      return { newOrder, advance, due };
    });

    // ফেলে-যাওয়া কার্ট ড্রাফট সার্ভার থেকেই মুছে ফেলা
    try {
      await ensureTables();
      const draftId = `draft-${customerPhone.replace(/[^0-9]/g, "")}`;
      await db.execute(sql`DELETE FROM abandoned_carts WHERE id = ${draftId}`);
    } catch {}

    // কনফার্মেশন ইমেইল (HTML escape সহ)
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey && customerEmail) {
        const itemsHtml = result.newOrder.items
          .map(
            (item) => `
            <tr style="border-bottom: 1px solid #e8e5dc;">
              <td style="padding: 12px 0;">
                <strong style="color: #161513; font-size: 13px;">${escapeHtml(item.name)}</strong><br/>
                <span style="color: #777; font-size: 11px;">Size: ${escapeHtml(item.size)} • Color: ${escapeHtml(item.color)} • Qty: ${item.quantity}</span>
              </td>
              <td style="padding: 12px 0; text-align: right; color: #161513; font-size: 13px; font-weight: 600;">৳${(item.priceBDT * item.quantity).toLocaleString()}</td>
            </tr>`
          )
          .join("");
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || `${BRAND_CONFIG.brandName} <onboarding@resend.dev>`,
            to: [customerEmail],
            subject: `Order Confirmed: #${orderId} — ${BRAND_CONFIG.brandName}`,
            html: `<div style="font-family: sans-serif; background-color: #f7f5f0; padding: 24px;">
              <div style="max-width: 500px; margin: 0 auto; background: #fff; padding: 24px; border: 1px solid #ddd;">
                <h2>Thank you, ${escapeHtml(customerName)}!</h2>
                <p>Order ID: <strong>${escapeHtml(orderId)}</strong></p>
                <table style="width: 100%; border-collapse: collapse;">${itemsHtml}</table>
                <p style="margin-top: 16px;">Due to Courier: <strong>৳${result.due.toLocaleString()}</strong></p>
              </div></div>`,
          }),
        });
      }
    } catch {
      console.error("Order email failed");
    }

    const o = result.newOrder;
    return NextResponse.json({
      success: true,
      orderId,
      order: {
        id: o.id,
        items: o.items,
        subtotalBDT: o.subtotalBDT,
        shippingBDT: o.shippingBDT,
        discountBDT: o.discountBDT,
        totalBDT: o.totalBDT,
        advancePaidBDT: result.advance,
        dueAmountBDT: result.due,
      },
    });
  } catch (error: any) {
    if (error instanceof OrderError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Order create failed");
    return NextResponse.json({ error: "Failed to process order" }, { status: 500 });
  }
}

// ৩. স্ট্যাটাস আপডেট (শুধু অনুমোদিত মান)
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAccess("orders");
    if (isDeny(auth)) return auth.response;

    const body = await req.json().catch(() => ({}));
    if (typeof body.id !== "string" || !body.id) return NextResponse.json({ error: "Order ID required" }, { status: 400 });

    const updates: { orderStatus?: string; paymentStatus?: string } = {};
    if (body.orderStatus) {
      const v = String(body.orderStatus).toUpperCase();
      if (!ORDER_STATUSES.includes(v)) return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
      updates.orderStatus = v;
    }
    if (body.paymentStatus) {
      const v = String(body.paymentStatus).toUpperCase();
      if (!PAYMENT_STATUSES.includes(v)) return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
      updates.paymentStatus = v;
    }
    if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

    await db.update(orders).set(updates).where(eq(orders.id, body.id));
    return NextResponse.json({ success: true, updated: updates });
  } catch {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

// ৪. মুছে ফেলা — শুধু SUPER_ADMIN
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (isDeny(auth)) return auth.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (searchParams.get("purgeAll") === "true") {
      await db.delete(orders);
      return NextResponse.json({ success: true, message: "All orders wiped." });
    }
    if (id) {
      await db.delete(orders).where(eq(orders.id, id));
      return NextResponse.json({ success: true, deletedId: id });
    }
    const body = await req.json().catch(() => ({}));
    if (Array.isArray(body.ids) && body.ids.length > 0 && body.ids.length <= 500 && body.ids.every((x: unknown) => typeof x === "string")) {
      await db.delete(orders).where(inArray(orders.id, body.ids));
      return NextResponse.json({ success: true, count: body.ids.length });
    }
    return NextResponse.json({ error: "No order ID specified" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
