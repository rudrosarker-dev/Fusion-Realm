"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle, Info, XCircle, X } from "lucide-react";
import { COUPONS } from "./config";
import type { CartItem, Currency, Product } from "./types";
import { cn, LS_KEYS, readLS, validateCoupon, writeLS } from "./utils";

type ToastTone = "success" | "error" | "info";
interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

const ToastCtx = createContext<{ push: (tone: ToastTone, message: string) => void }>({ push: () => {} });
export const useToast = () => useContext(ToastCtx);

function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((tone: ToastTone, message: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-2), { id, tone, message }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed bottom-6 left-1/2 z-[120] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 bg-ink px-4 py-3 text-sm text-paper shadow-lg img-fade"
          >
            {t.tone === "success" && <CheckCircle className="size-4 shrink-0" strokeWidth={1.5} />}
            {t.tone === "error" && <XCircle className="size-4 shrink-0 text-[#e08a78]" strokeWidth={1.5} />}
            {t.tone === "info" && <Info className="size-4 shrink-0" strokeWidth={1.5} />}
            <p className="flex-1">{t.message}</p>
            <button
              aria-label="Dismiss notification"
              className="opacity-60 transition hover:opacity-100"
              onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}
            >
              <X className="size-4" strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

interface UIState {
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  quickView: Product | null;
  setQuickView: (p: Product | null) => void;
}

const UICtx = createContext<UIState | null>(null);
export function useUI() {
  const ctx = useContext(UICtx);
  if (!ctx) throw new Error("useUI must be used inside Providers");
  return ctx;
}

function UIProvider({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [currency, setCurrencyState] = useState<Currency>("BDT");

  useEffect(() => {
    setCurrencyState(readLS<Currency>(LS_KEYS.currency, "BDT"));
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    writeLS(LS_KEYS.currency, c);
  }, []);

  const value = useMemo(
    () => ({ searchOpen, setSearchOpen, cartOpen, setCartOpen, menuOpen, setMenuOpen, currency, setCurrency, quickView, setQuickView }),
    [searchOpen, cartOpen, menuOpen, currency, quickView, setCurrency],
  );
  return <UICtx.Provider value={value}>{children}</UICtx.Provider>;
}

export const itemKey = (i: Pick<CartItem, "productId" | "size" | "color">) =>
  `${i.productId}__${i.size}__${i.color}`;

interface CartState {
  items: CartItem[];
  count: number;
  subtotalBDT: number;
  couponCode: string | null;
  discountBDT: number;
  add: (item: CartItem) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  applyCoupon: (code: string) => { ok: boolean; reason?: string };
  removeCoupon: () => void;
}

const CartCtx = createContext<CartState | null>(null);
export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used inside Providers");
  return ctx;
}

function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [customDiscount, setCustomDiscount] = useState<number>(0);
  const [activeCoupons, setActiveCoupons] = useState<any[]>(COUPONS);
  const hydrated = useRef(false);

  useEffect(() => {
    setItems(readLS<CartItem[]>(LS_KEYS.cart, []));
    hydrated.current = true;

    fetch("/api/admin/coupons", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.coupons && Array.isArray(data.coupons)) {
          const mapped = data.coupons.map((c: any) => ({
            code: c.code,
            type: c.discountType,
            value: c.discountValue,
            minSubtotalBDT: c.minSpendBDT || 0,
            expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString() : "2099-12-31",
            usageLimit: c.maxUsage || 99999,
          }));
          setActiveCoupons([...mapped, ...COUPONS]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (hydrated.current) writeLS(LS_KEYS.cart, items);
  }, [items]);

  const add = useCallback((item: CartItem) => {
    setItems((cur) => {
      const k = itemKey(item);
      const existing = cur.find((i) => itemKey(i) === k);
      if (existing) return cur.map((i) => (itemKey(i) === k ? { ...i, qty: i.qty + item.qty } : i));
      return [...cur, item];
    });
  }, []);

  const remove = useCallback((key: string) => setItems((cur) => cur.filter((i) => itemKey(i) !== key)), []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((cur) =>
      qty <= 0 ? cur.filter((i) => itemKey(i) !== key) : cur.map((i) => (itemKey(i) === key ? { ...i, qty } : i)),
    );
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setCouponCode(null);
    setCustomDiscount(0);
  }, []);

  const subtotalBDT = useMemo(() => items.reduce((s, i) => s + i.priceBDT * i.qty, 0), [items]);
  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);

  const discountBDT = useMemo(() => {
    if (!couponCode) return 0;
    if (customDiscount > 0) return customDiscount;
    const r = validateCoupon(couponCode, subtotalBDT, activeCoupons);
    return r.ok ? r.discountBDT : 0;
  }, [couponCode, customDiscount, subtotalBDT, activeCoupons]);

  const applyCoupon = useCallback(
    (code: string): { ok: boolean; reason?: string } => {
      const r = validateCoupon(code, subtotalBDT, activeCoupons);
      if (!r.ok) return { ok: false, reason: r.reason };
      setCouponCode(r.coupon.code);
      setCustomDiscount(r.discountBDT);
      return { ok: true };
    },
    [subtotalBDT, activeCoupons]
  );

  const removeCoupon = useCallback(() => {
    setCouponCode(null);
    setCustomDiscount(0);
  }, []);

  const value = useMemo(
    () => ({ items, count, subtotalBDT, couponCode, discountBDT, add, remove, setQty, clear, applyCoupon, removeCoupon }),
    [items, count, subtotalBDT, couponCode, discountBDT, add, remove, setQty, clear, applyCoupon, removeCoupon],
  );
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

const WishlistCtx = createContext<{ ids: string[]; toggle: (id: string) => boolean; has: (id: string) => boolean } | null>(
  null,
);

export function useWishlist() {
  const ctx = useContext(WishlistCtx);
  if (!ctx) throw new Error("useWishlist must be used inside Providers");
  return ctx;
}

function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const hydrated = useRef(false);

  useEffect(() => {
    setIds(readLS<string[]>(LS_KEYS.wishlist, []));
    hydrated.current = true;
  }, []);
  useEffect(() => {
    if (hydrated.current) writeLS(LS_KEYS.wishlist, ids);
  }, [ids]);

  const toggle = useCallback((id: string) => {
    let added = false;
    setIds((cur) => {
      added = !cur.includes(id);
      return added ? [...cur, id] : cur.filter((x) => x !== id);
    });
    return added;
  }, []);
  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return <WishlistCtx.Provider value={{ ids, toggle, has }}>{children}</WishlistCtx.Provider>;
}

const RecentCtx = createContext<{ slugs: string[]; push: (slug: string) => void } | null>(null);
export function useRecent() {
  const ctx = useContext(RecentCtx);
  if (!ctx) throw new Error("useRecent must be used inside Providers");
  return ctx;
}

function RecentProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const hydrated = useRef(false);

  useEffect(() => {
    setSlugs(readLS<string[]>(LS_KEYS.recent, []));
    hydrated.current = true;
  }, []);
  useEffect(() => {
    if (hydrated.current) writeLS(LS_KEYS.recent, slugs);
  }, [slugs]);

  const push = useCallback((slug: string) => {
    setSlugs((cur) => [slug, ...cur.filter((s) => s !== slug)].slice(0, 8));
  }, []);

  return <RecentCtx.Provider value={{ slugs, push }}>{children}</RecentCtx.Provider>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <UIProvider>
        <CartProvider>
          <WishlistProvider>
            <RecentProvider>{children}</RecentProvider>
          </WishlistProvider>
        </CartProvider>
      </UIProvider>
    </ToastProvider>
  );
}

export { cn };
