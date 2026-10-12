"use client";

import { ArrowRight, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button, EmptyState, Price, QtyStepper } from "@/components/ui/primitives";
import { SHIPPING } from "@/lib/config";
import { itemKey, useCart, useToast } from "@/lib/store";

export default function CartPage() {
  const { items, remove, setQty, subtotalBDT, couponCode, discountBDT, applyCoupon, removeCoupon } = useCart();
  const { push } = useToast();
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);

  const shippingBDT = items.length === 0 ? 0 : subtotalBDT >= SHIPPING.freeOverBDT ? 0 : SHIPPING.standard.feeBDT;
  const totalBDT = Math.max(0, subtotalBDT - discountBDT) + shippingBDT;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setApplying(true);
    try {
      const r = await applyCoupon(code);
      push(r.ok ? "success" : "error", r.ok ? `Code ${code.toUpperCase()} applied.` : (r.reason ?? "Invalid code."));
      if (r.ok) setCode("");
    } finally {
      setApplying(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-x pb-24 pt-40">
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty."
          copy="Considered garments, made to last. Start with the Core Collection or this season's new pieces."
          actionLabel="Shop Now"
          actionHref="/shop"
        />
      </div>
    );
  }

  return (
    <div className="container-x pb-24 pt-32 lg:pt-36">
      <p className="eyebrow">Shopping Bag</p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl">Your Bag</h1>
      <p className="mt-2 text-sm text-fog">{items.reduce((s, i) => s + i.qty, 0)} items</p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.6fr_1fr]">
        <ul className="divide-y divide-line border-y border-line">
          {items.map((item) => {
            const key = itemKey(item);
            return (
              <li key={key} className="flex gap-5 py-6 sm:gap-7">
                <Link href={`/products/${item.slug}`} className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden bg-cream sm:w-28">
                  <Image src={item.image} alt={item.name} fill sizes="112px" className="object-cover" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link href={`/products/${item.slug}`} className="font-medium leading-snug hover:underline">
                        {item.name}
                      </Link>
                      <p className="mt-1 text-xs text-fog">
                        {item.color} / Size {item.size}
                      </p>
                      <Price amountBDT={item.priceBDT} className="mt-2 block text-xs text-ash" />
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => {
                        remove(key);
                        push("info", `${item.name} removed.`);
                      }}
                      className="text-fog transition-colors hover:text-error cursor-pointer"
                    >
                      <Trash2 className="size-4" strokeWidth={1.5} />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <QtyStepper qty={item.qty} onChange={(q) => setQty(key, q)} />
                    <Price amountBDT={item.priceBDT * item.qty} className="font-medium" />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit bg-cream p-6 sm:p-8 lg:sticky lg:top-28" aria-label="Order summary">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.24em]">Order Summary</h2>

          <div className="mt-5">
            {couponCode && discountBDT > 0 ? (
              <div className="flex items-center justify-between border border-line bg-paper px-3.5 py-3 text-sm">
                <span className="flex items-center gap-2 text-success">
                  <Tag className="size-3.5" strokeWidth={1.5} /> {couponCode} applied
                </span>
                <button aria-label="Remove coupon" onClick={removeCoupon} className="text-fog hover:text-error cursor-pointer">
                  <X className="size-4" strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <form className="flex gap-2" onSubmit={handleApply}>
                <label htmlFor="coupon" className="sr-only">
                  Promo code
                </label>
                <input
                  id="coupon"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Promo code"
                  className="h-11 flex-1 border border-line bg-paper px-3 text-sm placeholder:text-fog focus:border-ink outline-none"
                />
                <button
                  type="submit"
                  disabled={applying}
                  className="border border-ink px-4 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors hover:bg-ink hover:text-paper cursor-pointer disabled:opacity-50"
                >
                  {applying ? "..." : "Apply"}
                </button>
              </form>
            )}
            <p className="mt-2 text-[11px] text-fog">Use your created promo codes or WELCOME10.</p>
          </div>

          <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ash">Subtotal</dt>
              <dd>
                <Price amountBDT={subtotalBDT} />
              </dd>
            </div>
            {discountBDT > 0 && (
              <div className="flex justify-between text-success">
                <dt>Discount</dt>
                <dd>
                  −<Price amountBDT={discountBDT} />
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ash">Shipping (standard)</dt>
              <dd>{shippingBDT === 0 ? <span className="text-success">Free</span> : <Price amountBDT={shippingBDT} />}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
              <dt>Estimated Total</dt>
              <dd>
                <Price amountBDT={totalBDT} />
              </dd>
            </div>
          </dl>

          <Button href="/checkout" full className="mt-6">
            Checkout <ArrowRight className="size-3.5" strokeWidth={1.5} />
          </Button>
          <Link href="/shop" className="mt-4 block text-center text-[11px] font-medium uppercase tracking-[0.16em] text-ash underline-offset-4 hover:text-ink hover:underline">
            Continue Shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
