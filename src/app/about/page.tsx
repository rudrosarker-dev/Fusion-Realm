// START OF FILE src/app/about/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { Reveal } from "@/components/ui/overlays";
import { Button } from "@/components/ui/primitives";
import { BRAND_CONFIG } from "@/lib/brand.config";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About",
  description: `${BRAND_CONFIG.brandName} is an independent fashion house in Dhaka designing quiet, precise garments in heavyweight natural cloth.`,
};

async function getAboutData() {
  const defaultBanners = {
    story: "/images/story.jpg",
    hero: "/images/hero.jpg",
  };

  const defaultContent = {
    heading: "Quiet clothes,\nmade loudly well.",
    story: `${BRAND_CONFIG.brandName} is an independent fashion house founded in Dhaka. We make a deliberately narrow line of garments in heavyweight natural cloth — each fitted eleven times, washed for character, and built to outlast the trend cycle.`,
    point1Title: "Cloth First",
    point1Body: "Every season starts in the fabric archive, not on a moodboard. We knit jersey between 260 and 480 grams per square metre and choose wool for how it ages.",
    point2Title: "Eleven Fittings",
    point2Body: "A silhouette is developed on a stand, then on bodies of different builds, until it forgives the most and flatters the widest.",
    point3Title: "Small, Permanent Lines",
    point3Body: "The Core Collection never goes on seasonal sale and is never replaced — only refined. Scarcity should be honest or not exist at all.",
  };

  try {
    const [bannerRes, contentRes]: any = await Promise.all([
      db.execute(sql`SELECT banners FROM store_banners WHERE id = 'main_banners' LIMIT 1;`),
      db.execute(sql`SELECT content FROM store_content WHERE id = 'site_content' LIMIT 1;`),
    ]);

    const banners = {
      story: bannerRes.rows?.[0]?.banners?.story || defaultBanners.story,
      hero: bannerRes.rows?.[0]?.banners?.hero || defaultBanners.hero,
    };

    const content = {
      ...defaultContent,
      ...(contentRes.rows?.[0]?.content?.about || {}),
    };

    return { banners, content };
  } catch {}

  return { banners: defaultBanners, content: defaultContent };
}

export default async function AboutPage() {
  const { banners, content } = await getAboutData();

  return (
    <>
      <section className="container-x grid items-end gap-10 pb-24 pt-32 lg:grid-cols-2 lg:pt-44">
        <div>
          <Reveal>
            <p className="eyebrow">About the House</p>
          </Reveal>
          <Reveal delay={120}>
            <h1 className="mt-4 font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl whitespace-pre-line">
              {content.heading}
            </h1>
          </Reveal>
        </div>
        <Reveal delay={240}>
          <p className="max-w-md text-sm leading-relaxed text-ash sm:text-base whitespace-pre-line">
            {content.story}
          </p>
        </Reveal>
      </section>

      <section className="container-x grid gap-4 lg:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden bg-cream border border-line">
          <Image
            src={banners.story}
            alt="Macro detail of textile fabric"
            fill
            sizes="(max-width:1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="relative aspect-[4/3] overflow-hidden bg-cream border border-line">
          <Image
            src={banners.hero}
            alt={`Folded ${BRAND_CONFIG.brandName} garments in atelier`}
            fill
            sizes="(max-width:1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </section>

      <section className="container-x py-24 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-3">
          {[
            { n: "01", title: content.point1Title, body: content.point1Body },
            { n: "02", title: content.point2Title, body: content.point2Body },
            { n: "03", title: content.point3Title, body: content.point3Body },
          ].map((v, i) => (
            <Reveal key={v.n} delay={i * 120}>
              <div className="border-t border-ink pt-6">
                <p className="text-xs text-fog">{v.n}</p>
                <h2 className="mt-3 font-display text-2xl">{v.title}</h2>
                <p className="mt-4 text-sm leading-relaxed text-ash whitespace-pre-line">{v.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-ink py-24 text-paper lg:py-32">
        <div className="container-x grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <Reveal>
            <h2 className="font-display text-4xl leading-tight sm:text-5xl">
              Designed in Dhaka.
              <br />
              <em className="font-light text-paper/60">Worn everywhere.</em>
            </h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-paper/70">
              Our studio sits in Banani, Dhaka — a city that understands garment-making with generational depth. We work with specialized partner ateliers, paying above the living-wage benchmark.
            </p>
            <Button href="/shop" variant="inverse" className="mt-10">
              Shop the Collection
            </Button>
          </Reveal>
          <Reveal delay={160}>
            <dl className="grid grid-cols-2 gap-px bg-paper/15">
              {[
                ["2024", "Founded in Dhaka"],
                ["11", "Fittings per silhouette"],
                ["480gsm", "Heaviest fleece we knit"],
                ["14 days", "Hassle-free returns"],
              ].map(([v, l]) => (
                <div key={l} className="bg-ink p-6">
                  <dt className="font-display text-3xl">{v}</dt>
                  <dd className="mt-2 text-xs uppercase tracking-[0.16em] text-paper/50">{l}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>
    </>
  );
}
// END OF FILE src/app/about/page.tsx
