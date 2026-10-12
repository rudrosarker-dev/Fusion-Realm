// START OF FILE src/components/legal-page.tsx
import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { BRAND_CONFIG } from "@/lib/brand.config";
import { LEGAL } from "@/lib/data/content";

export const dynamic = "force-dynamic";

type LegalSlug = "privacy" | "terms" | "shipping-policy" | "return-policy" | "cookies";

const SLUG_META: Record<
  LegalSlug,
  { title: string; description: string; dbKey: "privacy" | "terms" | "shipping" | "returns" | "cookies" }
> = {
  privacy: {
    title: "Privacy Policy",
    description: `How ${BRAND_CONFIG.brandName} collects and protects your personal data.`,
    dbKey: "privacy",
  },
  terms: {
    title: "Terms of Service",
    description: `Commercial terms for purchasing from ${BRAND_CONFIG.brandName}.`,
    dbKey: "terms",
  },
  "shipping-policy": {
    title: "Shipping & Delivery Policy",
    description: `Nationwide delivery rates and timelines from the ${BRAND_CONFIG.brandName} Dhaka atelier.`,
    dbKey: "shipping",
  },
  "return-policy": {
    title: "14-Day Return & Exchange Policy",
    description: `Exchange and return protocol for ${BRAND_CONFIG.brandName} garments.`,
    dbKey: "returns",
  },
  cookies: {
    title: "Cookie Consent Policy",
    description: `How ${BRAND_CONFIG.brandName} uses functional browser storage.`,
    dbKey: "cookies",
  },
};

function fallbackBody(slug: LegalSlug): string {
  const staticEntry = LEGAL?.[slug];
  if (staticEntry?.body && Array.isArray(staticEntry.body)) {
    return staticEntry.body.join("\n\n");
  }
  if (typeof staticEntry?.body === "string") return staticEntry.body;
  return "Content will appear here once published from the Atelier back office.";
}

async function getLegalBody(slug: LegalSlug): Promise<string> {
  const meta = SLUG_META[slug];
  try {
    const result: any = await db.execute(sql`
      SELECT content FROM store_content WHERE id = 'site_content' LIMIT 1;
    `);
    const content = result.rows?.[0]?.content || {};
    const legal = content.legal || {};
    const fromDb = legal[meta.dbKey];
    if (typeof fromDb === "string" && fromDb.trim().length > 0) {
      return fromDb;
    }
  } catch (err) {
    console.error("Legal fetch error:", err);
  }
  return fallbackBody(slug);
}

export function legalMetadata(slug: LegalSlug): Metadata {
  const meta = SLUG_META[slug];
  return {
    title: meta.title,
    description: meta.description,
  };
}

export async function LegalPage({ slug }: { slug: LegalSlug }) {
  const meta = SLUG_META[slug];
  const body = await getLegalBody(slug);

  // Split on double newlines into paragraphs; keep single newlines inside a block
  const paragraphs = body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="container-x max-w-3xl pb-24 pt-32 lg:pt-40">
      <p className="eyebrow text-gold-dark">Legal</p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl text-ink tracking-tight">
        {meta.title}
      </h1>
      <p className="mt-4 text-sm text-ash/80">
        Last updated from the Atelier command — live with your storefront.
      </p>

      <div className="mt-12 space-y-6 border-t border-line pt-10">
        {paragraphs.map((para, i) => {
          // Bullet-looking lines starting with • or -
          const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
          const isList = lines.length > 1 && lines.every((l) => /^[•\-\*]/.test(l));

          if (isList) {
            return (
              <ul key={i} className="list-none space-y-2.5 pl-0">
                {lines.map((line, j) => (
                  <li key={j} className="flex gap-3 text-[15px] leading-relaxed text-ash">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold/70" aria-hidden />
                    <span>{line.replace(/^[•\-\*]\s*/, "")}</span>
                  </li>
                ))}
              </ul>
            );
          }

          // Section heading heuristic: short line, mostly caps or ends with policy path
          const isHeading =
            lines.length === 1 &&
            (para.length < 80 && /^[A-Z0-9][A-Z0-9\s\-&\/\(\)]+$/.test(para.replace(/[()\/]/g, "")));

          if (isHeading) {
            return (
              <h2 key={i} className="pt-4 font-display text-xl text-ink tracking-tight">
                {para}
              </h2>
            );
          }

          return (
            <p key={i} className="text-[15px] leading-[1.85] text-ash whitespace-pre-line">
              {para}
            </p>
          );
        })}
      </div>
    </div>
  );
}
// END OF FILE src/components/legal-page.tsx
