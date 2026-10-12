import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { orders, products, coupons } from "@/db/schema";

export const dynamic = "force-dynamic";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("nf_admin_session");
  if (!session?.value) return false;
  try {
    const decoded = JSON.parse(Buffer.from(session.value, "base64").toString("utf-8"));
    return decoded.role === "SUPER_ADMIN";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { target } = await req.json();

    if (target === "orders") {
      await db.delete(orders);
      return NextResponse.json({ success: true, message: "All orders history cleared." });
    }

    if (target === "products") {
      await db.delete(products);
      return NextResponse.json({ success: true, message: "All products catalog cleared." });
    }

    if (target === "coupons") {
      await db.delete(coupons);
      return NextResponse.json({ success: true, message: "All promotional coupons cleared." });
    }

    if (target === "all") {
      await db.delete(orders);
      await db.delete(products);
      await db.delete(coupons);
      return NextResponse.json({ success: true, message: "Store factory reset complete! All data clean." });
    }

    return NextResponse.json({ error: "Invalid reset target" }, { status: 400 });
  } catch (error: any) {
    console.error("Store reset error:", error);
    return NextResponse.json({ error: "Failed to reset store data" }, { status: 500 });
  }
}
