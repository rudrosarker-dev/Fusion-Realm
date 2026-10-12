// START OF FILE src/app/api/products/route.ts
import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const liveProducts = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt));

    // ডাটাবেজে প্রোডাক্ট থাকলে বা ০টি থাকলেও শুধুই ডাটাবেজের রিয়েল ডাটা দেবে
    return NextResponse.json(
      { 
        success: true, 
        source: "neon-database", 
        count: liveProducts.length, 
        products: liveProducts 
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error: any) {
    console.error("Public products fetch error:", error);
    return NextResponse.json({
      success: true,
      source: "empty",
      count: 0,
      products: [],
    });
  }
}
// END OF FILE src/app/api/products/route.ts
