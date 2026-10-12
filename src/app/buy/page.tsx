// START OF FILE src/app/buy/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCart, useToast } from "@/lib/store";
import { PRODUCTS } from "@/lib/data/products";
import type { Product } from "@/lib/types";

function MagicBuyExecutor() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { add, clear, applyCoupon } = useCart();
  const { push } = useToast();
  const [status, setStatus] = useState("Preparing your garment...");

  useEffect(() => {
    async function execute() {
      const productId = searchParams.get("product") || searchParams.get("id");
      const slug = searchParams.get("slug");
      const sizeParam = searchParams.get("size");
      const colorParam = searchParams.get("color");
      const couponParam = searchParams.get("coupon");
      const qtyParam = Number(searchParams.get("qty") || 1);

      if (!productId && !slug) {
        router.push("/shop");
        return;
      }

      // ১. প্রোডাক্ট লোড করা (ডাটাবেজ বা সিড থেকে)
      let product: Product | undefined;
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          product = data.products?.find((p: Product) => p.id === productId || p.slug === slug);
        }
      } catch {}

      if (!product) {
        product = PRODUCTS.find((p) => p.id === productId || p.slug === slug);
      }

      if (!product) {
        push("error", "Garment not found.");
        router.push("/shop");
        return;
      }

      setStatus(`Adding ${product.name} to checkout...`);

      // ২. সাইজ ও কালার নির্বাচন
      const availableSizes = product.sizes || [];
      const chosenSize = sizeParam || (availableSizes.find((s) => s.stock > 0)?.size || "M");
      const chosenColor = colorParam || (product.colors?.[0]?.name || "Default");

      // কার্ট রিসেট করে সরাসরি এই প্রোডাক্ট যোগ করা
      clear();
      add({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        priceBDT: product.priceBDT,
        image: product.images?.[0]?.src || "/images/product-tee.jpg",
        size: chosenSize,
        color: chosenColor,
        qty: qtyParam,
      });

      // ৩. কুপন থাকলে স্বয়ংক্রিয়ভাবে প্রয়োগ
      if (couponParam) {
        try {
          applyCoupon(couponParam);
        } catch {}
      }

      // ৪. সরাসরি চেকআউটে রিডাইরেক্ট
      router.push("/checkout");
    }

    execute();
  }, [searchParams, router, add, clear, applyCoupon, push]);

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-8 text-ink animate-spin" strokeWidth={1.5} />
        <p className="font-display text-2xl text-ink">{status}</p>
        <p className="text-[11px] uppercase tracking-[0.2em] text-fog font-mono">
          Redirecting straight to express checkout...
        </p>
      </div>
    </div>
  );
}

export default function MagicBuyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <MagicBuyExecutor />
    </Suspense>
  );
}
// END OF FILE src/app/buy/page.tsx
