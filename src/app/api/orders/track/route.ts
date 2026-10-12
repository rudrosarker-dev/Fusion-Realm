import { NextRequest, NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const phone = searchParams.get("phone");

    if (!id && !phone) {
      return NextResponse.json({ error: "Order ID or Phone is required" }, { status: 400 });
    }

    // Search in DB
    const results = await db
      .select()
      .from(orders)
      .where(or(
        id ? eq(orders.id, id.trim().toUpperCase()) : undefined,
        phone ? eq(orders.customerPhone, phone.trim()) : undefined
      ));

    if (!results || results.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, orders: results });
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
