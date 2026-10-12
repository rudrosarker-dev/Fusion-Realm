// START OF FILE src/app/journal/[slug]/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { Breadcrumb } from "@/components/ui/primitives";
import { BRAND_CONFIG } from "@/lib/brand.config";
import type { JournalPost } from "@/lib/types";

export const revalidate = 0; // অলওয়েজ লাইভ ডাটাবেজ

async function getArticle(slug: string): Promise<JournalPost | null> {
  try {
    const res: any = await db.execute(sql`
      SELECT * FROM store_journal WHERE slug = ${slug} LIMIT 1;
    `);
    if (res.rows && res.rows.length > 0) {
      const r = res.rows[0];
      return {
        slug: r.slug,
        title: r.title,
        eyebrow: r.eyebrow,
        date: r.date,
        image: r.image,
        excerpt: r.excerpt,
        body: Array.isArray(r.body) ? r.body : typeof r.body === "string" ? JSON.parse(r.body) : [],
      };
    }
  } catch {}

  // কোনো ডামি ব্যাকআপ নেই—ডিলিট হয়ে গেলে এটি নাল (null) রিটার্ন করবে
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getArticle(slug);
  if (!post) return { title: "Story not found" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: `${post.title} — ${BRAND_CONFIG.brandName} Journal`, description: post.excerpt },
  };
}

export default async function JournalPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getArticle(slug);

  // ডিলিট করা আর্টিকেল হলে সরাসরি ৪MD Not Found পেজে পাঠিয়ে দেবে
  if (!post) notFound();

  return (
    <article>
      <header className="container-x max-w-3xl pt-32 text-center lg:pt-40">
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Journal", href: "/journal" }, { label: post.title }]}
        />
        <p className="eyebrow mt-8">
          {post.eyebrow} — {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl text-ink">{post.title}</h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-ash sm:text-base">{post.excerpt}</p>
      </header>

      <div className="container-x mt-12">
        <div className="relative aspect-[16/8] overflow-hidden bg-cream border border-line">
          <Image
            src={post.image || "/images/story.jpg"}
            alt={post.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </div>

      <div className="container-x max-w-2xl py-16 lg:py-20">
        {(post.body || []).map((para, i) => (
          <p key={i} className="mb-7 text-base leading-[1.85] text-ash first:font-display first:text-xl first:leading-relaxed first:text-ink whitespace-pre-line">
            {para.replaceAll("NOIR FORM", BRAND_CONFIG.brandName)}
          </p>
        ))}
        <div className="mt-12 border-t border-line pt-8">
          <Link href="/journal" className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink hover:text-ash">
            <span>← Back to all stories</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
// END OF FILE src/app/journal/[slug]/page.tsx
