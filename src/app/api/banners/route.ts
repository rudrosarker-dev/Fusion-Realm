import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

const DEFAULT_BANNERS = {
  hero: "/images/hero.jpg",
  collection: "/images/collection.jpg",
  men: "/images/category-men.jpg",
  women: "/images/category-women.jpg",
  story: "/images/story.jpg",
  journal1: "/images/story.jpg",
  journal2: "/images/collection.jpg",
  journal3: "/images/category-men.jpg",
};

// ১. ডাটাবেজ থেকে ব্যানার আনা
export async function GET() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS store_banners (
        id text PRIMARY KEY,
        banners jsonb NOT NULL,
        updated_at timestamp DEFAULT NOW()
      );
    `);

    const result: any = await db.execute(sql`
      SELECT banners FROM store_banners WHERE id = 'main_banners' LIMIT 1;
    `);

    if (result.rows && result.rows.length > 0) {
      return NextResponse.json({ success: true, banners: result.rows[0].banners });
    }

    return NextResponse.json({ success: true, banners: DEFAULT_BANNERS });
  } catch (error) {
    console.error("Banner fetch error:", error);
    return NextResponse.json({ success: true, banners: DEFAULT_BANNERS });
  }
}

// ২. অ্যাডমিন থেকে ব্যানার সেভ করা
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const banners = {
      hero: body.hero || DEFAULT_BANNERS.hero,
      collection: body.collection || DEFAULT_BANNERS.collection,
      men: body.men || DEFAULT_BANNERS.men,
      women: body.women || DEFAULT_BANNERS.women,
      story: body.story || DEFAULT_BANNERS.story,
      journal1: body.journal1 || DEFAULT_BANNERS.journal1,
      journal2: body.journal2 || DEFAULT_BANNERS.journal2,
      journal3: body.journal3 || DEFAULT_BANNERS.journal3,
    };

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS store_banners (
        id text PRIMARY KEY,
        banners jsonb NOT NULL,
        updated_at timestamp DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      INSERT INTO store_banners (id, banners, updated_at)
      VALUES ('main_banners', ${JSON.stringify(banners)}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET
        banners = ${JSON.stringify(banners)}::jsonb,
        updated_at = NOW();
    `);

    return NextResponse.json({ success: true, banners, message: "Banners updated live in database!" });
  } catch (error) {
    console.error("Banner save error:", error);
    return NextResponse.json({ error: "Failed to save banners" }, { status: 500 });
  }
}
