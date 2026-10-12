"use client";

import { ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Drawer } from "@/components/ui/overlays";
import { Button, Price, QtyStepper } from "@/components/ui/primitives";
import { SHIPPING } from "@/lib/config";
import { itemKey, useCart, useToast, useUI } from "@/lib/store";

export function CartDrawer() {
  const pathname = usePathname();
  const { cartOpen, setCartOpen } = useUI();
  const { items, remove, setQty, subtotalBDT, couponCode, discountBDT } = useCart();
  const { push } = useToast();

  // কোনো পেজ পরিবর্তন হলেই (যেমন চেকআউটে ঢুকলে) ড্রয়ার নিজে নিজে স্মুথলি বন্ধ হয়ে যাবে
  useEffect(() => {
    setCartOpen(false);
  }, [pathname, setCartOpen]);

  const remaining = SHIPPING.freeOverBDT - subtotalBDT;
  const progress = Math.min(100, (subtotalBDT / SHIPPING.freeOverBDT) * 100);

  const handleClose = () => {
    setCartOpen(false);
  };

  return (
    <Drawer open={cartOpen} onClose={handleClose} title={`Your Bag ${items.length ? `(${items.reduce((s, i) => s + i.qty, 0)})` : ""}`}>
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
          <ShoppingBag className="size-10 text-fog" strokeWidth={1} />
          <p className="font-display text-2xl">Your bag is empty.</p>
          <p className="max-w-xs text-sm leading-relaxed text-ash">
            Considered garments, made to last. Start with the Core Collection.
          </p>
          <Button href="/shop" onClick={handleClose} className="mt-2">
            Shop Now
          </Button>
        </div>
      ) : (
        <>
          {/* free-shipping progress */}
          <div className="border-b border-line px-5 py-4 sm:px-7">
            <p className="text-xs text-ash">
              {remaining > 0 ? (
                <>
                  You are <Price amountBDT={remaining} className="font-medium text-ink" /> away from free standard delivery.
                </>
              ) : (
                <span className="text-success">Your order qualifies for free standard delivery.</span>
              )}
            </p>
            <div className="mt-2.5 h-px w-full bg-line">
              <div className="h-px bg-ink transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <ul className="thin-scroll flex-1 divide-y divide-line overflow-y-auto px-5 sm:px-7">
            {items.map((item) => {
              const key = itemKey(item);
              return (
                <li key={key} className="flex gap-4 py-5">
                  <Link href={`/products/${item.slug}`} onClick={handleClose} className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden bg-cream">
                    <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link href={`/products/${item.slug}`} onClick={handleClose} className="text-sm font-medium leading-snug hover:underline">
                          {item.name}
                        </Link>
                        <p className="mt-1 text-xs text-fog">
                          {item.color} / Size {item.size}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name} from bag`}
                        onClick={() => {
                          remove(key);
                          push("info", `${item.name} removed from your bag.`);
                        }}
                        className="text-fog transition-colors hover:text-error cursor-pointer"
                      >
                        <Trash2 className="size-4" strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <QtyStepper small qty={item.qty} onChange={(q) => setQty(key, q)} />
                      <Price amountBDT={item.priceBDT * item.qty} className="text-sm font-medium" />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="shrink-0 border-t border-line px-5 py-5 sm:px-7">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ash">Subtotal</span>
              <Price amountBDT={subtotalBDT} className="font-medium" />
            </div>
            {couponCode && discountBDT > 0 && (
              <div className="mt-1 flex items-center justify-between text-sm text-success">
                <span>Discount ({couponCode})</span>
                <span>
                  −<Price amountBDT={discountBDT} />
                </span>
              </div>
            )}
            <p className="mt-2 text-xs text-fog">Shipping and taxes calculated at checkout.</p>
            <div className="mt-4 flex flex-col gap-2.5">
              <Button href="/checkout" full onClick={handleClose}>
                Checkout
              </Button>
              <Button href="/cart" variant="outline" full onClick={handleClose}>
                View Bag
              </Button>
            </div>
          </div>
        </>
      )}
    </Drawer>
  );
}
