"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/overlays";
import { Button, Price, QtyStepper } from "@/components/ui/primitives";
import { useCart, useToast, useUI } from "@/lib/store";
import { isLowStock, isSoldOut } from "@/lib/utils";
import { ColorSelector, SizeSelector } from "./selectors";

/** Globally-mounted quick view modal, driven by UI context. */
export function QuickViewHost() {
  const { quickView: product, setQuickView, setCartOpen } = useUI();
  const { add } = useCart();
  const { push } = useToast();
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [tried, setTried] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setSize(product.sizes.length === 1 ? product.sizes[0].size : null);
      setColor(product.colors[0]?.name ?? "");
      setQty(1);
      setTried(false);
      setLoading(false);
    }
  }, [product]);

  if (!product) return null;
  const soldOut = isSoldOut(product);
  const max = product.sizes.find((s) => s.size === size)?.stock ?? 99;

  return (
    <Modal open={!!product} onClose={() => setQuickView(null)} title="Quick View" wide>
      <div className="grid gap-6 sm:grid-cols-2">
        <Link href={`/products/${product.slug}`} onClick={() => setQuickView(null)} className="relative aspect-[3/4] overflow-hidden bg-cream">
          <Image src={product.images[0].src} alt={product.images[0].alt} fill sizes="(max-width: 640px) 100vw, 384px" className="object-cover" />
        </Link>
        <div className="flex flex-col gap-4">
          <div>
            <p className="eyebrow mb-1.5">{product.category}</p>
            <h3 className="font-display text-2xl">{product.name}</h3>
            <Price amountBDT={product.priceBDT} compareAtBDT={product.compareAtBDT} className="mt-2 text-base" />
          </div>
          <p className="text-sm leading-relaxed text-ash">{product.shortDescription}</p>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ash">Colour — {color}</span>
            <ColorSelector colors={product.colors} value={color} onChange={setColor} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ash">
              Size {tried && !size && <em className="not-italic text-error">— please select a size</em>}
            </span>
            <SizeSelector sizes={product.sizes} value={size} onChange={setSize} error={tried && !size} />
          </div>
          <div className="flex items-center gap-3">
            <QtyStepper qty={qty} onChange={(q) => setQty(Math.min(q, max))} max={Math.max(1, max)} />
            {isLowStock(product) && <p className="text-xs text-[#8a6d2f]">Low stock — order soon</p>}
          </div>
          <div className="mt-1 flex flex-col gap-2.5">
            <Button
              loading={loading}
              disabled={soldOut}
              full
              onClick={() => {
                if (!size) {
                  setTried(true);
                  return;
                }
                setLoading(true);
                window.setTimeout(() => {
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
                  setLoading(false);
                  setQuickView(null);
                  push("success", `${product.name} added to your bag.`);
                  setCartOpen(true);
                }, 450);
              }}
            >
              {soldOut ? "Out of Stock" : "Add to Bag"}
            </Button>
            <Link
              href={`/products/${product.slug}`}
              onClick={() => setQuickView(null)}
              className="text-center text-[11px] font-medium uppercase tracking-[0.16em] text-ash underline-offset-4 hover:text-ink hover:underline"
            >
              View full details
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
