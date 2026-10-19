import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, products, coupons } from "@/db/schema";
import { isDeny, requireSuperAdmin } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

// ধ্বংসাত্মক অপারেশন: শুধু SUPER_ADMIN (DB থেকে যাচাই করা) + সীমিত হারে
export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (isDeny(auth)) return auth.response;
    if (!(await checkRateLimit(`reset-${auth.actor.user.id}`, 3, 3600))) {
      return NextResponse.json({ error: "Too many reset attempts." }, { status: 429 });
    }

    const { target } = await req.json().catch(() => ({}));

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
  } catch {
    return NextResponse.json({ error: "Failed to reset store data" }, { status: 500 });
  }
}
