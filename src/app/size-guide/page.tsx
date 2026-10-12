import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/primitives";
import { BRAND_CONFIG } from "@/lib/brand.config";

export const metadata: Metadata = {
  title: "Size & Fitting Guide",
  description: `Official sizing and fitting manual for ${BRAND_CONFIG.brandName} garments.`,
};

const CHART = [
  { size: "XS", chestInches: "34–36", waistInches: "28–30", chestCm: "86–91", waistCm: "71–76" },
  { size: "S", chestInches: "36–38", waistInches: "30–32", chestCm: "91–96", waistCm: "76–81" },
  { size: "M", chestInches: "38–40", waistInches: "32–34", chestCm: "96–102", waistCm: "81–86" },
  { size: "L", chestInches: "40–42", waistInches: "34–36", chestCm: "102–107", waistCm: "86–91" },
  { size: "XL", chestInches: "42–44", waistInches: "36–38", chestCm: "107–112", waistCm: "91–96" },
  { size: "XXL", chestInches: "44–46", waistInches: "38–40", chestCm: "112–117", waistCm: "96–102" },
];

export default function SizeGuidePage() {
  return (
    <div className="container-x max-w-4xl pb-24 pt-32 lg:pt-36">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Size Guide" }]} />
      
      <p className="eyebrow mt-6">Atelier Specifications</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl text-ink">Size & Fitting Guide</h1>
      <p className="mt-3 text-sm leading-relaxed text-ash max-w-xl">
        {BRAND_CONFIG.brandName} garments feature relaxed architectural silhouettes with dropped shoulders.
        Measurements below are standard body measurements in both inches and centimetres.
      </p>

      {/* Measurement Table */}
      <div className="mt-10 overflow-x-auto border border-line bg-paper">
        <table className="w-full min-w-[560px] text-xs sm:text-sm">
          <thead className="bg-cream/60 border-b border-line text-[10px] uppercase tracking-[0.16em] text-fog">
            <tr>
              <th className="px-4 py-3.5 text-left font-semibold">Size</th>
              <th className="px-4 py-3.5 text-left font-semibold">Chest (Inches)</th>
              <th className="px-4 py-3.5 text-left font-semibold">Waist (Inches)</th>
              <th className="px-4 py-3.5 text-left font-semibold">Chest (CM)</th>
              <th className="px-4 py-3.5 text-left font-semibold">Waist (CM)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line font-mono">
            {CHART.map((c) => (
              <tr key={c.size} className="hover:bg-cream/30 transition-colors">
                <td className="px-4 py-3 font-bold text-ink text-sm font-sans">{c.size}</td>
                <td className="px-4 py-3 text-ash">{c.chestInches}&quot;</td>
                <td className="px-4 py-3 text-ash">{c.waistInches}&quot;</td>
                <td className="px-4 py-3 text-ash">{c.chestCm} cm</td>
                <td className="px-4 py-3 text-ash">{c.waistCm} cm</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fitting Advice */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="border border-line bg-cream/40 p-6 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink">Between Sizes?</h2>
          <p className="text-xs text-ash leading-relaxed">
            If your measurements sit between two sizes, choose the smaller size for a closer contemporary line,
            or choose your standard size for the intended oversized drape.
          </p>
        </div>
        <div className="border border-line bg-cream/40 p-6 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink">Personal Consultation</h2>
          <p className="text-xs text-ash leading-relaxed">
            Need exact sleeve or chest measurements? Connect with our Dhaka studio on{" "}
            <Link href="/contact" className="underline underline-offset-2 text-ink">
              WhatsApp or Concierge
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
