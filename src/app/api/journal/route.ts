import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { isDeny, requireSuperAdmin } from "@/lib/auth";
import { ensureTables } from "@/lib/ensure-tables";
import { clampStr, safeImageSrc } from "@/lib/security";

export const dynamic = "force-dynamic";

const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "").slice(0, 80);

export async function GET() {
  try {
    await ensureTables();
    const result: any = await db.execute(sql`SELECT * FROM store_journal ORDER BY created_at DESC;`);
    return NextResponse.json({ success: true, articles: result.rows || [] });
  } catch {
    return NextResponse.json({ success: true, articles: [] });
  }
}

// আগে অথহীন ছিল — এখন শুধু SUPER_ADMIN
export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (isDeny(auth)) return auth.response;

    const body = await req.json().catch(() => ({}));
    const title = clampStr(body.title, 200);
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const id = /^art-[A-Za-z0-9-]{1,60}$/.test(String(body.id || "")) ? String(body.id) : `art-${crypto.randomUUID()}`;
    const slug = slugify(clampStr(body.slug, 100) || title) || `post-${Date.now()}`;
    const dateStr = clampStr(body.date, 30) || new Date().toISOString().split("T")[0];
    const paragraphs = (Array.isArray(body.body) ? body.body : typeof body.body === "string" ? body.body.split("\n\n") : ["Story body..."])
      .map((p: unknown) => clampStr(p, 10000))
      .filter(Boolean)
      .slice(0, 100);
    const image = safeImageSrc(body.image) || "/images/story.jpg";
    const eyebrow = clampStr(body.eyebrow, 60) || "Editorial";
    const excerpt = clampStr(body.excerpt, 500);

    await ensureTables();
    await db.execute(sql`
      INSERT INTO store_journal (id, slug, title, eyebrow, date, image, excerpt, body, created_at)
      VALUES (${id}, ${slug}, ${title}, ${eyebrow}, ${dateStr}, ${image}, ${excerpt}, ${JSON.stringify(paragraphs)}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug, title = EXCLUDED.title, eyebrow = EXCLUDED.eyebrow, date = EXCLUDED.date,
        image = EXCLUDED.image, excerpt = EXCLUDED.excerpt, body = EXCLUDED.body;
    `);

    revalidatePath("/journal");
    revalidatePath(`/journal/${slug}`);
    revalidatePath("/journal/[slug]", "page");
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, message: "Journal article saved live!" });
  } catch {
    return NextResponse.json({ error: "Failed to save article" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (isDeny(auth)) return auth.response;

    const { searchParams } = new URL(req.url);
    const id = clampStr(searchParams.get("id"), 100);
    const slug = clampStr(searchParams.get("slug"), 100);
    if (!id && !slug) return NextResponse.json({ error: "id or slug required" }, { status: 400 });

    await ensureTables();
    await db.execute(sql`DELETE FROM store_journal WHERE id = ${id} OR slug = ${id} OR slug = ${slug};`);

    revalidatePath("/journal");
    if (slug) revalidatePath(`/journal/${slug}`);
    revalidatePath("/journal/[slug]", "page");
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, message: "Article deleted successfully." });
  } catch {
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
