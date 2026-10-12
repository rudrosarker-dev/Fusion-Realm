"use client";

import Image from "next/image";
import Link from "next/link";
import { useUI } from "@/lib/store";
import { cn, isSoldOut, onSale } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { Badge, Price } from "@/components/ui/primitives";
import { WishlistButton } from "./wishlist-button";

export function ProductCard({
  product,
  priority,
  sizes = "(max-width: 480px) 50vw, (max-width: 1024px) 33vw, 25vw",
}: {
  product: Product;
  priority?: boolean;
  sizes?: string;
}) {
  const { setQuickView } = useUI();
  const soldOut = isSoldOut(product);
  const primary = product.images[0];
  const hover = product.images[1] ?? product.images[0];

  return (
    <article className="group relative">
      <Link
        href={`/products/${product.slug}`}
        className="block"
        aria-label={`${product.name} — ${product.category}`}
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-cream">
          <Image
            src={primary.src}
            alt={primary.alt}
            fill
            priority={priority}
            sizes={sizes}
            className={cn(
              "object-cover transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-0 group-hover:scale-[1.015]",
              soldOut && "opacity-70",
            )}
          />
          <Image
            src={hover.src}
            alt={hover.alt}
            fill
            sizes={sizes}
            className="object-cover opacity-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 group-hover:scale-[1.02]"
          />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.newArrival && !soldOut && <Badge tone="new">New</Badge>}
            {onSale(product) && !soldOut && <Badge tone="sale">Sale</Badge>}
            {soldOut && <Badge tone="dark">Sold Out</Badge>}
          </div>
          <div className="absolute right-3 top-3 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <WishlistButton productId={product.id} productName={product.name} />
          </div>
          {/* quick view bar */}
          {!soldOut && (
            <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setQuickView(product);
                }}
                className="w-full bg-ink/95 py-3.5 text-[11px] font-medium uppercase tracking-[0.2em] text-paper backdrop-blur transition-colors hover:bg-ink"
              >
                Quick View
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-col items-start gap-1 pt-4">
          <div className="flex w-full items-start justify-between gap-3">
            <h3 className="text-[13px] font-medium leading-snug">{product.name}</h3>
            <Price amountBDT={product.priceBDT} compareAtBDT={product.compareAtBDT} className="text-[13px]" compareClassName="text-xs" />
          </div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-fog">{product.category}</p>
          <div className="mt-1.5 flex items-center gap-1.5" aria-label={`Available in ${product.colors.length} colours`}>
            {product.colors.map((c) => (
              <span key={c.name} title={c.name} className="size-2.5 rounded-full border border-ink/15" style={{ backgroundColor: c.hex }} />
            ))}
          </div>
        </div>
      </Link>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
