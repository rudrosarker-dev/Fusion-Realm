// START OF FILE src/app/faq/page.tsx
import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { Accordion } from "@/components/ui/primitives";
import { BRAND_CONFIG } from "@/lib/brand.config";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers on ordering, shipping, returns, sizing, payments and accounts.",
};

async function getLiveFaqs() {
  const defaultFaqs = [
    {
      q: "How do I track my order?",
      a: `Once your order is confirmed and dispatched from our Dhaka studio, you will receive an SMS and email notification with your courier tracking reference (Steadfast / Pathao).`,
    },
    {
      q: "Where do you deliver and what are the rates?",
      a: `We deliver nationwide across all 64 districts in Bangladesh. Standard delivery inside Dhaka metro is ৳100 (24–48 hours). Delivery outside Dhaka is ৳150 (2–4 working days). Orders exceeding ৳15,000 receive complimentary delivery.`,
    },
    {
      q: "How does Cash on Delivery (COD) work?",
      a: `To confirm a Cash on Delivery order, the parcel delivery charge (৳100 inside Dhaka or ৳150 outside Dhaka) must be paid in advance via bKash or Nagad. The remaining garment price is paid directly in cash to the courier upon receiving your parcel.`,
    },
    {
      q: "What is your exchange and return policy?",
      a: `Unworn garments with security tags attached in original packaging may be exchanged for size or store credit within 14 days of delivery.`,
    },
    {
      q: "Which payment options do you support?",
      a: `We accept Cash on Delivery (with advance delivery fee), as well as Full Payment via bKash and Nagad Personal Send Money to ${BRAND_CONFIG.payment.bkashNagadNumber}.`,
    },
  ];

  try {
    const res: any = await db.execute(sql`
      SELECT content FROM store_content WHERE id = 'site_content' LIMIT 1;
    `);

    if (res.rows && res.rows.length > 0 && Array.isArray(res.rows[0].content?.faqs)) {
      if (res.rows[0].content.faqs.length > 0) {
        return res.rows[0].content.faqs;
      }
    }
  } catch {}

  return defaultFaqs;
}

export default async function FaqPage() {
  const faqsList = await getLiveFaqs();

  return (
    <div className="container-x max-w-3xl pb-24 pt-32 lg:pt-36">
      <p className="eyebrow">Help & Atelier Guidelines</p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl text-ink">Frequently Asked</h1>
      <p className="mt-4 text-sm leading-relaxed text-ash">
        Everything about ordering, delivery, and caring for your garments. Still unsure?{" "}
        <a href="/contact" className="underline underline-offset-2 text-ink">
          Contact our studio
        </a>.
      </p>

      <div className="mt-12">
        <Accordion
          items={faqsList.map((item: { q: string; a: string }) => ({
            title: item.q,
            content: <p className="whitespace-pre-line">{item.a}</p>,
          }))}
        />
      </div>
    </div>
  );
}
// END OF FILE src/app/faq/page.tsx
