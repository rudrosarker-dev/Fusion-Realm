// START OF FILE src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { COLLECTIONS } from "@/lib/data/collections";
import { BRAND_CONFIG } from "@/lib/brand.config";

export const revalidate = 3600; // প্রতি ১ ঘণ্টায় স্বয়ংক্রিয়ভাবে রিভ্যালিডেট হবে

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://tholvexstudio.vercel.app").replace(/\/$/, "");

  // ১. প্রধান স্ট্যাটিক ও পলিসি রাউটসমূহ
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/journal`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/size-guide`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/shipping-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/return-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/cookies`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // ২. কালেকশন পেজসমূহ
  const collectionRoutes: MetadataRoute.Sitemap = COLLECTIONS.map((c) => ({
    url: `${siteUrl}/collections/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // ৩. লাইভ ডাটাবেজ থেকে প্রোডাক্ট ফেচ করা (Drizzle ORM)
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const liveProducts = await db
      .select({
        slug: products.slug,
        createdAt: products.createdAt,
      })
      .from(products)
      .orderBy(desc(products.createdAt));

    if (liveProducts && liveProducts.length > 0) {
      productRoutes = liveProducts.map((p) => ({
        url: `${siteUrl}/products/${p.slug}`,
        lastModified: p.createdAt ? new Date(p.createdAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.9,
      }));
    }
  } catch (err) {
    console.error("Sitemap Products DB query error:", err);
  }

  // ৪. লাইভ ডাটাবেজ থেকে জার্নাল আর্টিকেলস ফেচ করা
  let journalRoutes: MetadataRoute.Sitemap = [];
  try {
    const journalRes: any = await db.execute(sql`
      SELECT slug, created_at FROM store_journal ORDER BY created_at DESC;
    `);

    if (journalRes?.rows && journalRes.rows.length > 0) {
      journalRoutes = journalRes.rows.map((row: any) => ({
        url: `${siteUrl}/journal/${row.slug}`,
        lastModified: row.created_at ? new Date(row.created_at) : new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.error("Sitemap Journal DB query error:", err);
  }

  return [...staticRoutes, ...collectionRoutes, ...productRoutes, ...journalRoutes];
}
// END OF FILE src/app/sitemap.ts
