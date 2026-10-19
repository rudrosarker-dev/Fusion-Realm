import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { isDeny, requireSuperAdmin } from "@/lib/auth";
import { ensureTables } from "@/lib/ensure-tables";
import { safeImageSrc } from "@/lib/security";

export const dynamic = "force-dynamic";

const DEFAULT_BANNERS: Record<string, string> = {
  hero: "/images/hero.jpg",
  collection: "/images/collection.jpg",
  men: "/images/category-men.jpg",
  women: "/images/category-women.jpg",
  story: "/images/story.jpg",
  journal1: "/images/story.jpg",
  journal2: "/images/collection.jpg",
  journal3: "/images/category-men.jpg",
};

export async function GET() {
  try {
    await ensureTables();
    const result: any = await db.execute(sql`SELECT banners FROM store_banners WHERE id = 'main_banners' LIMIT 1;`);
    if (result.rows && result.rows.length > 0) {
      return NextResponse.json({ success: true, banners: { ...DEFAULT_BANNERS, ...result.rows[0].banners } });
    }
    return NextResponse.json({ success: true, banners: DEFAULT_BANNERS });
  } catch {
    return NextResponse.json({ success: true, banners: DEFAULT_BANNERS });
  }
}

// আগে অথহীন ছিল — এখন শুধু SUPER_ADMIN, এবং প্রতিটি ছবির সোর্স যাচাই করা হয়
export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (isDeny(auth)) return auth.response;

    const body = await req.json().catch(() => ({}));
    const banners: Record<string, string> = {};
    for (const key of Object.keys(DEFAULT_BANNERS)) {
      banners[key] = safeImageSrc(body[key]) || DEFAULT_BANNERS[key];
    }

    await ensureTables();
    const json = JSON.stringify(banners);
    await db.execute(sql`
      INSERT INTO store_banners (id, banners, updated_at)
      VALUES ('main_banners', ${json}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET banners = ${json}::jsonb, updated_at = NOW();
    `);
    return NextResponse.json({ success: true, banners, message: "Banners updated live in database!" });
  } catch {
    return NextResponse.json({ error: "Failed to save banners" }, { status: 500 });
  }
}
