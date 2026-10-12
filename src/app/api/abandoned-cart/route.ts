// START OF FILE src/app/api/abandoned-cart/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

// ১. সকল ড্রাফট / ফেলে যাওয়া কার্ট লিস্ট আনা
export async function GET() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS abandoned_carts (
        id text PRIMARY KEY,
        customer_name text NOT NULL,
        customer_email text,
        customer_phone text NOT NULL,
        items jsonb NOT NULL,
        total_bdt integer NOT NULL,
        status text DEFAULT 'PENDING',
        created_at timestamp DEFAULT NOW()
      );
    `);

    const result: any = await db.execute(sql`
      SELECT * FROM abandoned_carts WHERE status = 'PENDING' ORDER BY created_at DESC LIMIT 50;
    `);

    return NextResponse.json({ success: true, carts: result.rows || [] });
  } catch (error) {
    console.error("Abandoned cart fetch error:", error);
    return NextResponse.json({ success: true, carts: [] });
  }
}

// ২. চেকআউট থেকে ব্যাকগ্রাউন্ডে ড্রাফট কার্ট সংরক্ষণ
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = (body.customerPhone || "").trim();

    if (!phone || phone.length < 10) {
      return NextResponse.json({ error: "Valid phone required" }, { status: 400 });
    }

    const id = `draft-${phone.replace(/[^0-9]/g, "")}`;
    const name = body.customerName || "Interested Client";
    const email = body.customerEmail || "";
    const items = body.items || [];
    const total = Number(body.totalBDT || 0);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS abandoned_carts (
        id text PRIMARY KEY,
        customer_name text NOT NULL,
        customer_email text,
        customer_phone text NOT NULL,
        items jsonb NOT NULL,
        total_bdt integer NOT NULL,
        status text DEFAULT 'PENDING',
        created_at timestamp DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      INSERT INTO abandoned_carts (id, customer_name, customer_email, customer_phone, items, total_bdt, status, created_at)
      VALUES (
        ${id},
        ${name},
        ${email},
        ${phone},
        ${JSON.stringify(items)}::jsonb,
        ${total},
        'PENDING',
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        customer_name = ${name},
        customer_email = ${email},
        items = ${JSON.stringify(items)}::jsonb,
        total_bdt = ${total},
        status = 'PENDING',
        created_at = NOW();
    `);

    return NextResponse.json({ success: true, message: "Draft cart captured." });
  } catch (error) {
    console.error("Draft capture error:", error);
    return NextResponse.json({ error: "Failed to capture draft" }, { status: 500 });
  }
}

// ৩. অর্ডার কনফার্ম হলে ড্রাফট মুছে ফেলা
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const phone = searchParams.get("phone");

    const targetId = id || (phone ? `draft-${phone.replace(/[^0-9]/g, "")}` : null);

    if (targetId) {
      await db.execute(sql`
        DELETE FROM abandoned_carts WHERE id = ${targetId};
      `);
    }

    return NextResponse.json({ success: true, message: "Draft resolved." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete draft" }, { status: 500 });
  }
}
// END OF FILE src/app/api/abandoned-cart/route.ts
