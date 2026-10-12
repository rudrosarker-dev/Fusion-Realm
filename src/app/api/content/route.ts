// START OF FILE src/app/api/content/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { LEGAL } from "@/lib/data/content";

export const dynamic = "force-dynamic";

const DEFAULT_CONTENT = {
  homepageMode: "editorial",
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
    shipping: LEGAL["shipping-policy"]?.body?.join("\n\n") || "",
    returns: LEGAL["return-policy"]?.body?.join("\n\n") || "",
    privacy: LEGAL["privacy"]?.body?.join("\n\n") || "",
    terms: LEGAL["terms"]?.body?.join("\n\n") || "",
    cookies: LEGAL["cookies"]?.body?.join("\n\n") || "",
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
      a: "Once your order is confirmed and dispatched from our Dhaka studio, you will receive an SMS and email notification with your courier tracking reference (Steadfast / Pathao).",
    },
    {
      q: "Where do you deliver and what are the rates?",
      a: "We deliver nationwide across all 64 districts in Bangladesh. Standard delivery inside Dhaka metro is ৳100 (24–48 hours). Delivery outside Dhaka is ৳150 (2–4 working days). Orders exceeding ৳15,000 receive complimentary delivery.",
    },
    {
      q: "How does Cash on Delivery (COD) work?",
      a: "To confirm a Cash on Delivery order, the parcel delivery charge (৳100 inside Dhaka or ৳150 outside Dhaka) must be paid in advance via bKash or Nagad. The remaining garment price is paid directly in cash to the courier upon receiving your parcel.",
    },
    {
      q: "What is your exchange and return policy?",
      a: "Unworn garments with security tags attached in original packaging may be exchanged for size or store credit within 14 days of delivery.",
    },
    {
      q: "Which payment options do you support?",
      a: "We accept Cash on Delivery (with advance delivery fee), as well as Full Payment via bKash and Nagad Personal Send Money.",
    },
  ],
};

export async function GET() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS store_content (
        id text PRIMARY KEY,
        content jsonb NOT NULL,
        updated_at timestamp DEFAULT NOW()
      );
    `);

    const result: any = await db.execute(sql`
      SELECT content FROM store_content WHERE id = 'site_content' LIMIT 1;
    `);

    if (result.rows && result.rows.length > 0) {
      const data = result.rows[0].content || {};
      return NextResponse.json({
        success: true,
        content: {
          about: { ...DEFAULT_CONTENT.about, ...(data.about || {}) },
          legal: { ...DEFAULT_CONTENT.legal, ...(data.legal || {}) },
          socials: { ...DEFAULT_CONTENT.socials, ...(data.socials || {}) },
          faqs: Array.isArray(data.faqs) && data.faqs.length > 0 ? data.faqs : DEFAULT_CONTENT.faqs,
          homepageMode: data.homepageMode || "editorial",
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS store_content (
        id text PRIMARY KEY,
        content jsonb NOT NULL,
        updated_at timestamp DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      INSERT INTO store_content (id, content, updated_at)
      VALUES ('site_content', ${JSON.stringify(body)}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET
        content = ${JSON.stringify(body)}::jsonb,
        updated_at = NOW();
    `);

    // 🔥 CRITICAL: bust cache so storefront reflects CMS instantly
    revalidatePath("/", "layout");
    revalidatePath("/privacy");
    revalidatePath("/terms");
    revalidatePath("/shipping-policy");
    revalidatePath("/return-policy");
    revalidatePath("/cookies");
    revalidatePath("/faq");
    revalidatePath("/about");
    revalidatePath("/shop");
    revalidatePath("/contact");
    revalidatePath("/journal");

    return NextResponse.json({
      success: true,
      message: "Website content & socials updated live!",
    });
  } catch (error) {
    console.error("Content save error:", error);
    return NextResponse.json({ error: "Failed to save website content" }, { status: 500 });
  }
}
// END OF FILE src/app/api/content/route.ts
