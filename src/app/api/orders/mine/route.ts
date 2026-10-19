import { NextResponse } from "next/server";
import { desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getCustomerUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// লগইন করা গ্রাহক শুধু নিজের অর্ডার দেখবে (userId বা নিজের ইমেইল মিললে)
export async function GET() {
  try {
    const u = await getCustomerUser();
    if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const rows = await db
      .select()
      .from(orders)
      .where(or(eq(orders.userId, u.id), sql`lower(${orders.customerEmail}) = ${u.email.toLowerCase()}`))
      .orderBy(desc(orders.createdAt))
      .limit(200);
    return NextResponse.json({ success: true, orders: rows });
  } catch {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
