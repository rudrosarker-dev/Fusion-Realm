// START OF FILE src/app/journal/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { Reveal } from "@/components/ui/overlays";
import { EmptyState } from "@/components/ui/primitives";
import { BRAND_CONFIG } from "@/lib/brand.config";
import type { JournalPost } from "@/lib/types";

export const revalidate = 0; // অলওয়েজ লাইভ ডাটাবেজ

export const metadata: Metadata = {
  title: "Journal",
  description: `Design notes, material studies and process writing from the ${BRAND_CONFIG.brandName} studio.`,
};

// ডাটাবেজ থেকে লাইভ পোস্ট আনা (কোনো ডামি ব্যাকআপ ছাড়া)
async function getLiveArticles(): Promise<JournalPost[]> {
  try {
    const res: any = await db.execute(sql`
      SELECT * FROM store_journal ORDER BY created_at DESC;
    `);
    if (res.rows && res.rows.length > 0) {
      return res.rows.map((r: any) => ({
        slug: r.slug,
        title: r.title,
        eyebrow: r.eyebrow,
        date: r.date,
        image: r.image,
        excerpt: r.excerpt,
        body: Array.isArray(r.body) ? r.body : typeof r.body === "string" ? JSON.parse(r.body) : [],
      }));
    }
  } catch {}
  return []; // ডিলিট করা থাকলে একদম ০টি পোস্ট দেখাবে
}

export default async function JournalPage() {
  const articles = await getLiveArticles();

  // যদি সব পোস্ট ডিলিট করে দেওয়া হয়
  if (articles.length === 0) {
    return (
      <div className="container-x pb-24 pt-36">
        <EmptyState
          title="No stories published yet."
          copy="New editorial notes and studio stories published in your back office will appear here live."
          actionLabel="Explore Storefront"
          actionHref="/"
        />
      </div>
    );
  }

  const [first, ...rest] = articles;

  return (
    <div className="container-x pb-24 pt-32 lg:pt-36">
      <p className="eyebrow">Editorial Archive</p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl text-ink">The Journal</h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-ash">
        Occasional writing on cloth, construction and the discipline of keeping an architectural wardrobe.
      </p>

      {/* Main Top Featured Story */}
      <Reveal className="mt-14">
        <Link href={`/journal/${first.slug}`} className="group grid gap-6 lg:grid-cols-2 lg:gap-12">
          <div className="relative aspect-[16/10] overflow-hidden bg-cream border border-line">
            <Image
              src={first.image || "/images/story.jpg"}
              alt={first.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
            />
          </div>
          <div className="flex flex-col justify-center">
            <p className="eyebrow">{first.eyebrow} — {new Date(first.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
            <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl text-ink">{first.title}</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ash">{first.excerpt}</p>
            <span className="link-line mt-6 w-fit text-[11px] font-medium uppercase tracking-[0.2em]">Read Story</span>
          </div>
        </Link>
      </Reveal>

      {/* Sub Stories Grid (শুধুই আপনার লাইভ পোস্টগুলো আসবে) */}
      {rest.length > 0 && (
        <div className="mt-16 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post, i) => (
            <Reveal key={post.slug} delay={i * 100}>
              <Link href={`/journal/${post.slug}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden bg-cream border border-line">
                  <Image
                    src={post.image || "/images/story.jpg"}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                  />
                </div>
                <p className="eyebrow mt-5">{post.eyebrow}</p>
                <h3 className="mt-2 font-display text-2xl leading-snug text-ink">{post.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ash">{post.excerpt}</p>
                <p className="mt-3 text-xs text-fog font-mono">
                  {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
// END OF FILE src/app/journal/page.tsx
