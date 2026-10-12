"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductGrid } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/primitives";
import { PRODUCTS } from "@/lib/data/products";
import { useToast, useWishlist } from "@/lib/store";

export default function WishlistPage() {
  const { ids } = useWishlist();
  const { push } = useToast();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const products = mounted ? PRODUCTS.filter((p) => ids.includes(p.id)) : [];

  return (
    <div className="container-x pb-24 pt-32 lg:pt-36">
      <p className="eyebrow">Saved Pieces</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl sm:text-5xl">Wishlist</h1>
        {products.length > 0 && (
          <p className="text-sm text-fog">
            {products.length} {products.length === 1 ? "piece" : "pieces"}
          </p>
        )}
      </div>

      <div className="mt-12">
        {products.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty."
            copy="Tap the heart on any product to keep it here — it will wait for you on this device."
            actionLabel="Discover the Collection"
            actionHref="/shop"
          />
        ) : (
          <>
            <ProductGrid products={products} priorityCount={4} />
            <p className="mt-10 text-center text-xs text-fog">
              Wishlist is stored on this device.{" "}
              <a
                href="/account"
                className="underline underline-offset-2"
                onClick={() => push("info", "Sign in to sync your wishlist across devices (demo).")}
              >
                Sign in
              </a>{" "}
              to sync it across devices.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
