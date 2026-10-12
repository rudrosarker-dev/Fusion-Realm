// START OF FILE src/app/api/journal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

// ১. সব জার্নাল আর্টিকেল আনা (ডাটাবেজ থেকে লাইভ)
export async function GET() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS store_journal (
        id text PRIMARY KEY,
        slug text UNIQUE NOT NULL,
        title text NOT NULL,
        eyebrow text NOT NULL,
        date text NOT NULL,
        image text NOT NULL,
        excerpt text NOT NULL,
        body jsonb NOT NULL,
        created_at timestamp DEFAULT NOW()
      );
    `);

    const result: any = await db.execute(sql`
      SELECT * FROM store_journal ORDER BY created_at DESC;
    `);

    return NextResponse.json({ success: true, articles: result.rows || [] });
  } catch (error) {
    console.error("Journal fetch error:", error);
    return NextResponse.json({ success: true, articles: [] });
  }
}

// ২. নতুন আর্টিকেল যোগ বা আপডেট করা
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.id || `art-${Date.now()}`;
    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const dateStr = body.date || new Date().toISOString().split("T")[0];
    const paragraphs = Array.isArray(body.body)
      ? body.body
      : typeof body.body === "string"
      ? body.body.split("\n\n").filter(Boolean)
      : ["Story body..."];

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS store_journal (
        id text PRIMARY KEY,
        slug text UNIQUE NOT NULL,
        title text NOT NULL,
        eyebrow text NOT NULL,
        date text NOT NULL,
        image text NOT NULL,
        excerpt text NOT NULL,
        body jsonb NOT NULL,
        created_at timestamp DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      INSERT INTO store_journal (id, slug, title, eyebrow, date, image, excerpt, body, created_at)
      VALUES (
        ${id},
        ${slug},
        ${body.title},
        ${body.eyebrow || "Editorial"},
        ${dateStr},
        ${body.image || "/images/story.jpg"},
        ${body.excerpt || ""},
        ${JSON.stringify(paragraphs)}::jsonb,
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug,
        title = EXCLUDED.title,
        eyebrow = EXCLUDED.eyebrow,
        date = EXCLUDED.date,
        image = EXCLUDED.image,
        excerpt = EXCLUDED.excerpt,
        body = EXCLUDED.body;
    `);

    // 🔥 রিয়েল-টাইম ইনস্ট্যান্ট ক্যাশ ক্লিয়ার
    revalidatePath("/journal");
    revalidatePath(`/journal/${slug}`);
    revalidatePath("/journal/[slug]", "page");
    revalidatePath("/", "layout");

    return NextResponse.json({ success: true, message: "Journal article saved live!" });
  } catch (error) {
    console.error("Journal save error:", error);
    return NextResponse.json({ error: "Failed to save article" }, { status: 500 });
  }
}

// ৩. আর্টিকেল ডিলিট করা
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");

    await db.execute(sql`
      DELETE FROM store_journal WHERE id = ${id} OR slug = ${id} OR slug = ${slug};
    `);

    // 🔥 রিয়েল-টাইম ইনস্ট্যান্ট ক্যাশ ক্লিয়ার
    revalidatePath("/journal");
    if (slug) {
      revalidatePath(`/journal/${slug}`);
    }
    revalidatePath("/journal/[slug]", "page");
    revalidatePath("/", "layout");

    return NextResponse.json({ success: true, message: "Article deleted successfully." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
// END OF FILE src/app/api/journal/route.ts
