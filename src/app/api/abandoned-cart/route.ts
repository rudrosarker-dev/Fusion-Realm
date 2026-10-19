import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { isDeny, requireAccess } from "@/lib/auth";
import { ensureTables } from "@/lib/ensure-tables";
import { checkRateLimit, clampStr, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

// আগে গ্রাহকদের নাম/ফোন/ইমেইল সবার জন্য খোলা ছিল — এখন শুধু অর্ডার/CRM অ্যাক্সেসধারী
export async function GET() {
  try {
    const auth = await requireAccess("orders", "customers");
    if (isDeny(auth)) return auth.response;
    await ensureTables();
    const result: any = await db.execute(sql`
      SELECT * FROM abandoned_carts WHERE status = 'PENDING' ORDER BY created_at DESC LIMIT 50;
    `);
    return NextResponse.json({ success: true, carts: result.rows || [] });
  } catch {
    return NextResponse.json({ success: true, carts: [] });
  }
}

// চেকআউট থেকে ড্রাফট সংরক্ষণ (পাবলিক, কিন্তু রেট-লিমিট ও ইনপুট-সীমা সহ)
export async function POST(req: NextRequest) {
  try {
    if (!(await checkRateLimit(`draft-${getClientIp(req)}`, 20, 60))) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const body = await req.json().catch(() => ({}));
    const phone = clampStr(body.customerPhone, 20);
    const digits = phone.replace(/[^0-9]/g, "");
    if (digits.length < 10 || digits.length > 15) {
      return NextResponse.json({ error: "Valid phone required" }, { status: 400 });
    }

    const id = `draft-${digits}`;
    const name = clampStr(body.customerName, 100) || "Interested Client";
    const email = clampStr(body.customerEmail, 200);
    const items = (Array.isArray(body.items) ? body.items : []).slice(0, 30).map((i: any) => ({
      productId: clampStr(i?.productId, 100),
      name: clampStr(i?.name, 150),
      size: clampStr(i?.size, 10),
      color: clampStr(i?.color, 30),
      qty: Math.max(1, Math.min(99, Math.floor(Number(i?.qty ?? i?.quantity) || 1))),
      priceBDT: Math.max(0, Math.floor(Number(i?.priceBDT) || 0)),
    }));
    const total = Math.max(0, Math.min(100_000_000, Math.floor(Number(body.totalBDT) || 0)));

    await ensureTables();
    const itemsJson = JSON.stringify(items);
    await db.execute(sql`
      INSERT INTO abandoned_carts (id, customer_name, customer_email, customer_phone, items, total_bdt, status, created_at)
      VALUES (${id}, ${name}, ${email}, ${phone}, ${itemsJson}::jsonb, ${total}, 'PENDING', NOW())
      ON CONFLICT (id) DO UPDATE SET
        customer_name = ${name}, customer_email = ${email}, items = ${itemsJson}::jsonb,
        total_bdt = ${total}, status = 'PENDING', created_at = NOW();
    `);
    return NextResponse.json({ success: true, message: "Draft cart captured." });
  } catch {
    return NextResponse.json({ error: "Failed to capture draft" }, { status: 500 });
  }
}

// মুছে ফেলা — শুধু অথেন্টিকেটেড অ্যাডমিন/স্টাফ (অর্ডার হলে সার্ভার নিজেই ড্রাফট মুছে দেয়)
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAccess("orders", "customers");
    if (isDeny(auth)) return auth.response;
    const { searchParams } = new URL(req.url);
    const id = clampStr(searchParams.get("id"), 100);
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await ensureTables();
    await db.execute(sql`DELETE FROM abandoned_carts WHERE id = ${id}`);
    return NextResponse.json({ success: true, message: "Draft resolved." });
  } catch {
    return NextResponse.json({ error: "Failed to delete draft" }, { status: 500 });
  }
}
