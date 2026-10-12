// START OF FILE src/components/product/selectors.tsx
"use client";

import { Ruler, Sparkles, Check } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/overlays";
import { cn } from "@/lib/utils";
import type { ColorOption, SizeVariant } from "@/lib/types";

export function SizeSelector({
  sizes,
  value,
  onChange,
  error,
}: {
  sizes: SizeVariant[];
  value: string | null;
  onChange: (size: string) => void;
  error?: boolean;
}) {
  return (
    <fieldset>
      <legend className="sr-only">Choose a size</legend>
      <div className="flex flex-wrap gap-2.5" role="radiogroup">
        {sizes.map((v) => {
          const unavailable = v.stock <= 0;
          const selected = value === v.size;
          return (
            <button
              key={v.size}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={unavailable}
              onClick={() => onChange(v.size)}
              className={cn(
                "relative flex h-11 min-w-12 items-center justify-center border px-3 text-xs font-mono font-semibold uppercase tracking-wider transition-colors duration-200 cursor-pointer rounded-xs",
                selected
                  ? "border-[#0e0d0b] bg-[#0e0d0b] text-[#f6f3eb]"
                  : "border-line bg-paper hover:border-ink text-ink",
                unavailable && "cursor-not-allowed text-fog/40 bg-cream/40 line-through hover:border-line",
                error && !value && "border-error"
              )}
            >
              {v.size}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ColorSelector({
  colors,
  value,
  onChange,
}: {
  colors: ColorOption[];
  value: string;
  onChange: (name: string) => void;
}) {
  return (
    <fieldset>
      <legend className="sr-only">Choose a colour</legend>
      <div className="flex items-center gap-2.5" role="radiogroup">
        {colors.map((c) => {
          const selected = value === c.name;
          return (
            <button
              key={c.name}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={c.name}
              title={c.name}
              onClick={() => onChange(c.name)}
              className={cn(
                "flex size-8 items-center justify-center border transition-colors duration-200 cursor-pointer rounded-xs",
                selected ? "border-[#0e0d0b] ring-1 ring-[#0e0d0b]" : "border-transparent hover:border-line"
              )}
            >
              <span className="size-5 border border-ink/15 rounded-2xs" style={{ backgroundColor: c.hex }} />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

const GUIDE = {
  head: ["Size", "Chest (cm)", "Waist (cm)", "Hip (cm)", "Inside Leg (cm)"],
  rows: [
    ["XS", "84–89", "70–75", "86–91", "76"],
    ["S", "90–95", "76–81", "92–97", "78"],
    ["M", "96–101", "82–87", "98–103", "80"],
    ["L", "102–108", "88–94", "104–110", "82"],
    ["XL", "109–115", "95–101", "111–117", "84"],
    ["XXL", "116–122", "102–108", "118–124", "86"],
  ],
};

/* স্পষ্ট ও পড়া যায় এমন সাইজ চার্ট বাটন */
export function SizeGuideButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-ink border border-ink/40 bg-cream/50 px-3 py-1.5 hover:bg-ink hover:text-paper hover:border-ink transition-colors cursor-pointer rounded-xs"
      >
        <Ruler className="size-3.5 text-gold-dark" strokeWidth={1.75} />
        <span>Size Chart</span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Size Guide" wide>
        <p className="mb-6 text-sm leading-relaxed text-ash">
          Garments are cut with relaxed contemporary tailoring. Measurements below are body measurements in centimetres.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr>
                {GUIDE.head.map((h) => (
                  <th key={h} className="border-b border-ink px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-ash">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GUIDE.rows.map((row) => (
                <tr key={row[0]} className="border-b border-line last:border-0 font-mono">
                  {row.map((cell, i) => (
                    <td key={i} className={cn("px-3 py-2.5 tabular-nums", i === 0 && "font-bold text-ink")}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </>
  );
}

/* স্পষ্ট ও পড়া যায় এমন স্মার্ট সাইজ রেকমেন্ডার বাটন */
export function SmartSizeRecommender({ onSelectSize }: { onSelectSize: (size: string) => void }) {
  const [open, setOpen] = useState(false);
  const [feet, setFeet] = useState(5);
  const [inches, setInches] = useState(7);
  const [weightKg, setWeightKg] = useState(68);
  const [preference, setPreference] = useState<"regular" | "slim" | "relaxed">("regular");
  const [recommended, setRecommended] = useState<string | null>(null);

  const calculateSize = (e: React.FormEvent) => {
    e.preventDefault();
    const totalInches = Number(feet) * 12 + Number(inches);
    const weight = Number(weightKg);

    let baseSize = "M";

    if (weight < 54 || (totalInches <= 64 && weight < 58)) {
      baseSize = "XS";
    } else if (weight <= 64 || (totalInches <= 66 && weight <= 68)) {
      baseSize = "S";
    } else if (weight <= 76 || (totalInches <= 70 && weight <= 78)) {
      baseSize = "M";
    } else if (weight <= 87 || (totalInches <= 73 && weight <= 89)) {
      baseSize = "L";
    } else if (weight <= 98) {
      baseSize = "XL";
    } else {
      baseSize = "XXL";
    }

    const sizeHierarchy = ["XS", "S", "M", "L", "XL", "XXL"];
    let currentIndex = sizeHierarchy.indexOf(baseSize);

    if (preference === "slim" && currentIndex > 0) {
      currentIndex -= 1;
    } else if (preference === "relaxed" && currentIndex < sizeHierarchy.length - 1) {
      currentIndex += 1;
    }

    setRecommended(sizeHierarchy[currentIndex]);
  };

  const handleApply = () => {
    if (recommended) {
      onSelectSize(recommended);
      setOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setRecommended(null);
        }}
        className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-ink border border-gold-dark/60 bg-gold/15 px-3 py-1.5 hover:bg-gold hover:text-ink transition-colors cursor-pointer rounded-xs"
      >
        <Sparkles className="size-3.5 text-gold-dark" />
        <span>Find My Size</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Smart Size Recommender">
        <div className="space-y-6">
          <p className="text-xs text-ash leading-relaxed">
            Enter your height and weight to receive an algorithmic silhouette recommendation.
          </p>

          <form onSubmit={calculateSize} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-medium uppercase tracking-[0.16em] text-fog block mb-1">Height (Feet)</label>
                <select value={feet} onChange={(e) => setFeet(Number(e.target.value))} className="w-full h-10 border border-line bg-paper px-3 text-xs outline-none focus:border-ink cursor-pointer font-mono">
                  {[4, 5, 6].map((f) => (
                    <option key={f} value={f}>{f} Feet</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-medium uppercase tracking-[0.16em] text-fog block mb-1">Inches</label>
                <select value={inches} onChange={(e) => setInches(Number(e.target.value))} className="w-full h-10 border border-line bg-paper px-3 text-xs outline-none focus:border-ink cursor-pointer font-mono">
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>{i} Inches</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-[0.16em] text-fog block mb-1">Weight in KG</label>
              <input type="number" min={35} max={150} required value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} className="w-full h-10 border border-line bg-paper px-3 text-xs outline-none focus:border-ink font-mono" placeholder="68" />
            </div>

            <div>
              <label className="text-[10px] font-medium uppercase tracking-[0.16em] text-fog block mb-1.5">Preferred Fit Style</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "slim", label: "Slim Fit" },
                  { id: "regular", label: "Regular" },
                  { id: "relaxed", label: "Oversized" },
                ].map((fit) => (
                  <button key={fit.id} type="button" onClick={() => setPreference(fit.id as any)} className={cn("py-2 text-[10px] font-medium uppercase tracking-wider border transition-colors cursor-pointer rounded-xs", preference === fit.id ? "bg-ink text-paper border-ink" : "border-line text-ash hover:border-ink")}>
                    {fit.label}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full bg-ink text-paper py-3 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-ash transition-colors cursor-pointer mt-2 rounded-xs">
              Calculate Best Fit
            </button>
          </form>

          {recommended && (
            <div className="border border-ink bg-cream/70 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-mono tracking-wider text-fog">Recommended Silhouette</p>
                  <p className="text-xl font-bold text-ink mt-0.5 font-mono">Size {recommended}</p>
                </div>
                <span className="text-2xl font-display font-bold px-3 py-1 bg-paper border border-line">
                  {recommended}
                </span>
              </div>
              <button type="button" onClick={handleApply} className="w-full inline-flex items-center justify-center gap-2 bg-emerald-700 text-white py-2.5 text-xs uppercase tracking-wider font-semibold hover:bg-emerald-800 transition-colors cursor-pointer rounded-xs">
                <Check className="size-4" />
                <span>Apply Size {recommended} to Garment</span>
              </button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
// END OF FILE src/components/product/selectors.tsx
