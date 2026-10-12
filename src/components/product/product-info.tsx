// START OF FILE src/components/product/product-info.tsx
"use client";

import { Check, ShoppingBag, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Price, QtyStepper } from "@/components/ui/primitives";
import { useCart, useToast, useUI } from "@/lib/store";
import { formatPrice, isLowStock, isSoldOut, stockLabel } from "@/lib/utils";
import { fbEvents } from "@/lib/analytics";
import type { Product } from "@/lib/types";
import { ColorSelector, SizeGuideButton, SizeSelector, SmartSizeRecommender } from "./selectors";
import { WishlistButton } from "./wishlist-button";

export function ProductInfo({ product }: { product: Product }) {
  const router = useRouter();
  const { add } = useCart();
  const { setCartOpen, currency } = useUI();
  const { push } = useToast();

  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0].size : null);
  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const [qty, setQty] = useState(1);
  const [tried, setTried] = useState(false);
  const [loading, setLoading] = useState<"add" | "buy" | null>(null);

  useEffect(() => {
    fbEvents.viewContent({
      id: product.id,
      name: product.name,
      priceBDT: product.priceBDT,
      category: product.category,
    });
  }, [product]);

  const soldOut = isSoldOut(product);
  const stock = stockLabel(product);
  const maxForSize = product.sizes.find((s) => s.size === size)?.stock ?? 99;

  const addToBag = (mode: "add" | "buy") => {
    if (!size) {
      setTried(true);
      push("error", "Please select a size first.");
      return;
    }
    setLoading(mode);
    window.setTimeout(() => {
      fbEvents.addToCart({
        productId: product.id,
        name: product.name,
        priceBDT: product.priceBDT,
        qty: qty,
        size: size!,
        color: color,
      });

      add({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        priceBDT: product.priceBDT,
        image: product.images[0].src,
        size: size!,
        color,
        qty,
      });
      setLoading(null);
      if (mode === "buy") {
        router.push("/checkout");
      } else {
        push("success", `${product.name} added to your bag.`);
        setCartOpen(true);
      }
    }, 450);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="eyebrow !text-[#a68352] font-mono">
            {product.collection === "limited" ? "Limited Edition" : product.collection === "studio" ? "Studio Collection" : product.category}
          </p>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink bg-cream px-2.5 py-1 border border-line rounded-2xs">
            SKU: {product.sku}
          </span>
        </div>

        <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl text-ink">{product.name}</h1>
        <div className="mt-3 flex items-center gap-3">
          <Price amountBDT={product.priceBDT} compareAtBDT={product.compareAtBDT} className="text-xl font-bold text-ink" />
          <span
            className={
              stock.tone === "out" ? "text-xs text-error font-medium" : stock.tone === "low" ? "text-xs text-[#8a6d2f] font-medium" : "text-xs text-success font-medium"
            }
            role="status"
          >
            {stock.label}
          </span>
        </div>
        {currency !== "BDT" && <p className="mt-1 text-xs text-fog font-mono">Billed in ৳ BDT — {formatPrice(product.priceBDT, "BDT")}</p>}
      </div>

      <p className="text-sm leading-relaxed text-ash">{product.shortDescription}</p>

      <div className="flex flex-col gap-2 border-t border-line pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">Colour — {color}</p>
        <ColorSelector colors={product.colors} value={color} onChange={setColor} />
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">
            Size {tried && !size && <em className="not-italic text-error">— required</em>}
          </p>
          <div className="flex items-center gap-2.5">
            <SmartSizeRecommender onSelectSize={(selected) => setSize(selected)} />
            <SizeGuideButton />
          </div>
        </div>
        <SizeSelector sizes={product.sizes} value={size} onChange={setSize} error={tried && !size} />
        {isLowStock(product) && (
          <p className="text-xs text-[#8a6d2f] font-medium">Low stock — only a few pieces remaining.</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">Quantity</p>
        <QtyStepper qty={qty} onChange={(q) => setQty(Math.min(q, maxForSize))} max={Math.max(1, maxForSize)} />
      </div>

      {/* বাই নাও বাটনে লাক্সারি গোল্ডেন গ্লো যুক্ত করা হয়েছে */}
      <div className="flex flex-col gap-3 sm:flex-row pt-2">
        <Button full loading={loading === "add"} disabled={soldOut || loading !== null} onClick={() => addToBag("add")}>
          <ShoppingBag className="size-4" strokeWidth={1.5} />
          {soldOut ? "Out of Stock" : "Add to Bag"}
        </Button>
        <button
          type="button"
          disabled={soldOut || loading !== null}
          onClick={() => addToBag("buy")}
          className="w-full h-11 bg-gradient-to-b from-[#1e1c18] to-[#0e0d0b] text-paper border border-[#a68352]/70 shadow-[0_4px_16px_-2px_rgba(166,131,82,0.4)] hover:shadow-[0_6px_22px_-2px_rgba(166,131,82,0.65)] hover:border-[#a68352] hover:text-gold-light active:scale-[0.98] font-semibold text-[11px] uppercase tracking-[0.18em] transition-all rounded-xs cursor-pointer flex items-center justify-center"
        >
          {loading === "buy" ? "Processing..." : "Buy Now"}
        </button>
      </div>

      <WishlistButton productId={product.id} productName={product.name} withLabel className="w-fit" />

      <div className="flex flex-col gap-2.5 border-t border-line pt-6 text-xs leading-relaxed text-ash">
        <p className="flex items-center gap-2">
          <Truck className="size-4 shrink-0 text-[#a68352]" strokeWidth={1.5} />
          Free delivery over ৳15,000 — nationwide across Bangladesh
        </p>
        <p className="flex items-center gap-2">
          <Check className="size-4 shrink-0 text-success" strokeWidth={1.5} />
          14-day hassle-free returns with security tags intact
        </p>
      </div>
    </div>
  );
}
// END OF FILE src/components/product/product-info.tsx
