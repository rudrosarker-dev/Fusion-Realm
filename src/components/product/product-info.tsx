"use client";

import { Check, ShoppingBag, Truck, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Price, QtyStepper } from "@/components/ui/primitives";
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

  const [size, setSize] = useState<string | null>(product?.sizes?.length === 1 ? product.sizes[0].size : null);
  const [color, setColor] = useState(product?.colors?.[0]?.name ?? "Default");
  const [qty, setQty] = useState(1);
  const [tried, setTried] = useState(false);
  const [loading, setLoading] = useState<"add" | "buy" | null>(null);

  useEffect(() => {
    if (!product) return;
    fbEvents.viewContent({
      id: product.id,
      name: product.name,
      priceBDT: product.priceBDT,
      category: product.category,
    });
  }, [product]);

  if (!product) return null;

  const soldOut = isSoldOut(product);
  const stock = stockLabel(product);
  const maxForSize = product.sizes?.find((s) => s.size === size)?.stock ?? 99;

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
        image: product.images?.[0]?.src || "/images/product-tee.jpg",
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
    }, 250);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="eyebrow !text-gold-dark font-mono font-medium">
            {product.collection === "limited" ? "Limited Edition" : product.collection === "studio" ? "Studio Collection" : product.category}
          </p>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink bg-cream/70 px-2.5 py-1 border border-line rounded-2xs">
            SKU: {product.sku}
          </span>
        </div>

        <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl text-ink font-normal">{product.name}</h1>
        <div className="mt-3 flex items-center gap-3">
          <Price amountBDT={product.priceBDT} compareAtBDT={product.compareAtBDT} className="text-xl font-bold text-ink" />
          <span
            className={
              stock.tone === "out" ? "text-xs text-error font-medium" : stock.tone === "low" ? "text-xs text-amber-700 font-medium" : "text-xs text-emerald-700 font-medium"
            }
            role="status"
          >
            {stock.label}
          </span>
        </div>
        {currency !== "BDT" && <p className="mt-1 text-xs text-fog font-mono">Billed in ৳ BDT — {formatPrice(product.priceBDT, "BDT")}</p>}
      </div>

      <p className="text-sm leading-relaxed text-ash font-light">{product.shortDescription}</p>

      <div className="flex flex-col gap-2 border-t border-line pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">Colour — {color}</p>
        <ColorSelector colors={product.colors || []} value={color} onChange={setColor} />
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
        <SizeSelector sizes={product.sizes || []} value={size} onChange={setSize} error={tried && !size} />
        {isLowStock(product) && (
          <p className="text-xs text-amber-700 font-medium">Low stock — only a few pieces remaining.</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">Quantity</p>
        <QtyStepper qty={qty} onChange={(q) => setQty(Math.min(q, maxForSize))} max={Math.max(1, maxForSize)} />
      </div>

      {/* পরিপাটি এক সমান বাটন দুটি */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          disabled={soldOut || loading !== null}
          onClick={() => addToBag("add")}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xs border border-ink bg-transparent text-[11px] font-semibold uppercase tracking-[0.2em] text-ink transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink hover:text-paper hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] active:translate-y-0 active:scale-[0.98] cursor-pointer disabled:pointer-events-none disabled:opacity-40"
        >
          <ShoppingBag className="size-4" strokeWidth={1.5} />
          <span>{loading === "add" ? "Adding..." : soldOut ? "Out of Stock" : "Add to Bag"}</span>
        </button>

        <button
          type="button"
          disabled={soldOut || loading !== null}
          onClick={() => addToBag("buy")}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xs border border-ink bg-ink text-[11px] font-semibold uppercase tracking-[0.2em] text-paper shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_14px_rgba(0,0,0,0.14)] transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-dark hover:bg-gold-dark hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] active:translate-y-0 active:scale-[0.98] cursor-pointer disabled:pointer-events-none disabled:opacity-40"
        >
          <Zap className="size-3.5 fill-current" />
          <span>{loading === "buy" ? "Processing..." : "Buy Now"}</span>
        </button>
      </div>

      <WishlistButton productId={product.id} productName={product.name} withLabel className="w-fit" />

      <div className="flex flex-col gap-2.5 border-t border-line pt-6 text-xs leading-relaxed text-ash">
        <p className="flex items-center gap-2">
          <Truck className="size-4 shrink-0 text-gold-dark" strokeWidth={1.5} />
          Free delivery over ৳15,000 — nationwide across Bangladesh
        </p>
        <p className="flex items-center gap-2">
          <Check className="size-4 shrink-0 text-emerald-700" strokeWidth={1.5} />
          14-day hassle-free returns with security tags intact
        </p>
      </div>
    </div>
  );
}
