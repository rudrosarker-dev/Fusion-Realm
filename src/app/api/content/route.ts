// START OF FILE src/app/api/content/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { LEGAL } from "@/lib/data/content";
import { isDeny, requireSuperAdmin } from "@/lib/auth";
import { ensureTables } from "@/lib/ensure-tables";
import { clampStr, safeHref } from "@/lib/security";

export const dynamic = "force-dynamic";

const FALLBACK_MARQUEE = "Dhaka Atelier Hand-Finished | Numbered Micro Runs | Heavyweight Japanese Twill | Garment Washed Character | Complimentary Delivery Over ৳15,000";

const DEFAULT_CONTENT = {
  homepageMode: "editorial",
  marqueeItems: FALLBACK_MARQUEE,
  homeContent: {
    heroEyebrow: "Winter Edit — 2026",
    heroHeading: "Quiet warmth.\nLasting form.",
    heroBody: "Considered layers, tactile knits and outerwear for the colder days. Made to move with you, season after season.",
    featuredEyebrow: "The Winter Edit",
    featuredHeading: "Texture\nmeets form.",
    featuredBody: "A considered winter wardrobe in rich texture, quiet colour and enduring silhouettes.",
    storyEyebrow: "The Atelier Philosophy",
    storyHeading: "Made for the\nslower season.",
    storyBody: "Thoughtful materials, precise construction and garments made to be worn often.",
    coreEyebrow: "Permanent Line",
    coreHeading: "Core 01",
    coreBody: "Everyday essentials, refined for colder days and made to stay in rotation.",
    newsletterEyebrow: "Atelier Dispatch",
    newsletterHeading: "Notes from the studio",
    newsletterBody: "New pieces, studio notes and considered updates, delivered occasionally.",
  },
  shopContent: {
    eyebrow: "Tholvex Studio — Winter Edit",
    heading: "All Products",
    description: "Considered garments and everyday layers for the winter season.",
    badgeLabel: "garments in atelier",
  },
  about: {
    heading: "Quiet clothes,\nmade loudly well.",
    story: "Tholvex Studio is an independent fashion house founded in Dhaka. We make a deliberately narrow line of garments in heavyweight natural cloth — each fitted eleven times, washed for character, and built to outlast the trend cycle.",
    point1Title: "Cloth First",
    point1Body: "Every season starts in the fabric archive, not on a moodboard. We knit jersey between 260 and 480 grams per square metre and choose wool for how it ages.",
    point2Title: "Eleven Fittings",
    point2Body: "A silhouette is developed on a stand, then on bodies of different builds, until it forgives the most and flatters the widest.",
    point3Title: "Small, Permanent Lines",
    point3Body: "The Core Collection never goes on seasonal sale and is never replaced — only refined. Scarcity should be honest or not exist at all.",
  },
  legal: {
    shipping: LEGAL?.["shipping-policy"]?.body?.join("\n\n") || "",
    returns: LEGAL?.["return-policy"]?.body?.join("\n\n") || "",
    privacy: LEGAL?.["privacy"]?.body?.join("\n\n") || "",
    terms: LEGAL?.["terms"]?.body?.join("\n\n") || "",
    cookies: LEGAL?.["cookies"]?.body?.join("\n\n") || "",
  },
  socials: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    tiktok: "https://tiktok.com",
    pinterest: "https://pinterest.com",
  },
  faqs: [
    {
      q: "How do I track my order?",
      a: "Once your order is confirmed and dispatched from our Dhaka studio, you will receive an SMS and email notification with your courier tracking reference.",
    },
    {
      q: "Where do you deliver and what are the rates?",
      a: "We deliver nationwide across all 64 districts in Bangladesh.",
    },
  ],
};

export async function GET() {
  try {
    await ensureTables();

    const result: any = await db.execute(sql`
      SELECT content FROM store_content WHERE id = 'site_content' LIMIT 1;
    `);

    if (result && result.rows && result.rows.length > 0) {
      const data = result.rows[0].content || {};
      return NextResponse.json({
        success: true,
        content: {
          about: { ...DEFAULT_CONTENT.about, ...(data.about || {}) },
          legal: { ...DEFAULT_CONTENT.legal, ...(data.legal || {}) },
          socials: { ...DEFAULT_CONTENT.socials, ...(data.socials || {}) },
          faqs: Array.isArray(data.faqs) && data.faqs.length > 0 ? data.faqs : DEFAULT_CONTENT.faqs,
          homepageMode: data.homepageMode || "editorial",
          marqueeItems: data.marqueeItems || DEFAULT_CONTENT.marqueeItems,
          homeContent: { ...(DEFAULT_CONTENT as any).homeContent, ...(data.homeContent || {}) },
          shopContent: { ...(DEFAULT_CONTENT as any).shopContent, ...(data.shopContent || {}) },
        },
      });
    }

    return NextResponse.json({ success: true, content: DEFAULT_CONTENT });
  } catch (error) {
    console.error("Content fetch error:", error);
    return NextResponse.json({ success: true, content: DEFAULT_CONTENT });
  }
}

const SOCIAL_KEYS = ["instagram", "facebook", "tiktok", "pinterest"];
const ALLOWED_KEYS = ["homepageMode", "marqueeItems", "homeContent", "shopContent", "about", "legal", "socials", "faqs"];

export async function POST(req: NextRequest) {
  try {
    // আগে কোনো অথ ছিল না — এখন শুধু SUPER_ADMIN
    const auth = await requireSuperAdmin();
    if (isDeny(auth)) return auth.response;

    const raw = await req.text();
    if (raw.length > 400_000) return NextResponse.json({ error: "Content too large" }, { status: 413 });
    let input: any;
    try {
      input = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }

    // শুধু অনুমোদিত কী রাখা হয়
    const body: Record<string, any> = {};
    for (const k of ALLOWED_KEYS) if (input[k] !== undefined) body[k] = input[k];

    // সোশ্যাল লিংক: শুধু http(s) — javascript: URL (Stored XSS) বাতিল
    if (body.socials && typeof body.socials === "object") {
      const clean: Record<string, string> = {};
      for (const k of SOCIAL_KEYS) clean[k] = safeHref(body.socials[k], "");
      body.socials = clean;
    }
    if (body.homepageMode !== undefined) body.homepageMode = clampStr(body.homepageMode, 40);
    if (body.marqueeItems !== undefined) body.marqueeItems = clampStr(body.marqueeItems, 1000);

    await ensureTables();
    const json = JSON.stringify(body);
    await db.execute(sql`
      INSERT INTO store_content (id, content, updated_at)
      VALUES ('site_content', ${json}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET content = ${json}::jsonb, updated_at = NOW();
    `);

    try {
      revalidatePath("/", "layout");
      revalidatePath("/about");
      revalidatePath("/shop");
      revalidatePath("/contact");
    } catch {}

    return NextResponse.json({ success: true, message: "Website content & settings updated live in database!" });
  } catch {
    return NextResponse.json({ error: "Failed to save website content" }, { status: 500 });
  }
}
