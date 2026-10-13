// START OF FILE src/app/checkout/page.tsx
"use client";

import { ArrowLeft, Check, ChevronDown, Lock, ShoppingBag, Truck, ShieldAlert } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button, EmptyState, Input, Price, Select } from "@/components/ui/primitives";
import { useCart, useToast } from "@/lib/store";
import { cn, LS_KEYS, orderId, readLS, writeLS } from "@/lib/utils";
import { BRAND_CONFIG } from "@/lib/brand.config";
import { fbEvents } from "@/lib/analytics";

// বাংলাদেশের ৮টি বিভাগ ও সংশ্লিষ্ট ৬৪টি জেলার ডাটাবেজ
const BD_DIVISIONS_DATA: Record<string, string[]> = {
  Dhaka: [
    "Dhaka", "Gazipur", "Narayanganj", "Tangail", "Narsingdi", 
    "Faridpur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", 
    "Munshiganj", "Rajbari", "Shariatpur"
  ],
  Chattogram: [
    "Chattogram", "Cox's Bazar", "Cumilla", "Feni", "Brahmanbaria", 
    "Noakhali", "Chandpur", "Lakshmipur", "Rangamati", "Khagrachhari", "Bandarban"
  ],
  Rajshahi: [
    "Rajshahi", "Bogura", "Pabna", "Sirajganj", "Naogaon", 
    "Natore", "Chapainawabganj", "Joypurhat"
  ],
  Khulna: [
    "Khulna", "Jashore", "Kushtia", "Satkhira", "Bagerhat", 
    "Jhenaidah", "Chuadanga", "Meherpur", "Magura", "Narail"
  ],
  Sylhet: [
    "Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"
  ],
  Barishal: [
    "Barishal", "Patuakhali", "Bhola", "Pirojpur", "Barguna", "Jhalokathi"
  ],
  Rangpur: [
    "Rangpur", "Dinajpur", "Kurigram", "Gaibandha", "Nilphamari", 
    "Panchagarh", "Thakurgaon", "Lalmonirhat"
  ],
  Mymensingh: [
    "Mymensingh", "Jamalpur", "Netrokona", "Sherpur"
  ]
};

const DIVISIONS = Object.keys(BD_DIVISIONS_DATA);
const STEPS = ["Contact", "Shipping", "Payment", "Review"];

interface Form {
  email: string;
  fullName: string;
  phone: string;
  address: string;
  city: string; // District
  division: string;
  postalCode: string;
  country: string;
  shippingMethod: "standard" | "express";
  paymentMethod: "cod" | "full-payment";
  senderPhone: string;
  transactionId: string;
}

const initialForm: Form = {
  email: "",
  fullName: "",
  phone: "",
  address: "",
  city: "Dhaka",
  division: "Dhaka",
  postalCode: "",
  country: "Bangladesh",
  shippingMethod: "standard",
  paymentMethod: "cod",
  senderPhone: "",
  transactionId: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotalBDT, couponCode, discountBDT, applyCoupon, removeCoupon, clear } = useCart();
  const { push } = useToast();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [code, setCode] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isBlacklisted, setIsBlacklisted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const session = readLS<any>("nf-customer-session", null);
    if (session) {
      setForm((prev) => ({
        ...prev,
        email: session.email || prev.email,
        fullName: session.name || prev.fullName,
        phone: session.phone || prev.phone,
      }));
    }

    if (items.length > 0) {
      fbEvents.initiateCheckout({
        subtotalBDT,
        itemsCount: items.reduce((s, i) => s + i.qty, 0),
        itemIds: items.map((i) => i.productId),
      });
    }
  }, [items, subtotalBDT]);

  // ফোন নম্বর পরিবর্তনের সাথে সাথে ব্ল্যাকলিস্ট চেক
  useEffect(() => {
    const cleanPhone = form.phone.trim();
    if (cleanPhone.length >= 11) {
      fetch(`/api/admin/blacklist?phone=${encodeURIComponent(cleanPhone)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.isBlacklisted) {
            setIsBlacklisted(true);
            setForm((f) => ({ ...f, paymentMethod: "full-payment" }));
          } else {
            setIsBlacklisted(false);
          }
        })
        .catch(() => {});
    }
  }, [form.phone]);

  const isInsideDhakaCity = form.division === "Dhaka" && form.city === "Dhaka";

  const shippingFee = useMemo(() => {
    if (subtotalBDT >= BRAND_CONFIG.shipping.freeShippingThreshold) return 0;
    return isInsideDhakaCity ? BRAND_CONFIG.shipping.insideDhakaFee : BRAND_CONFIG.shipping.outsideDhakaFee;
  }, [isInsideDhakaCity, subtotalBDT]);

  const totalBDT = Math.max(0, subtotalBDT - discountBDT) + shippingFee;
  const advancePayable = form.paymentMethod === "cod" ? shippingFee : totalBDT;
  const dueOnDelivery = form.paymentMethod === "cod" ? Math.max(0, totalBDT - shippingFee) : 0;

  const set = (k: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const handleDivisionChange = (newDivision: string) => {
    const districtsForDivision = BD_DIVISIONS_DATA[newDivision] || [];
    setForm((f) => ({
      ...f,
      division: newDivision,
      city: districtsForDivision[0] || "",
    }));
  };

  const validate = (s: number): boolean => {
    const e: Partial<Record<keyof Form, string>> = {};
    if (s === 0) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) e.email = "Enter a valid email address.";
      if (form.fullName.trim().length < 3) e.fullName = "Enter your full name.";
      if (!/^\+?[\d\s-]{10,15}$/.test(form.phone.trim())) e.phone = "Enter a valid phone number.";
    }
    if (s === 1) {
      if (form.address.trim().length < 5) e.address = "Enter your detailed street address.";
      if (!form.city) e.city = "Please select your city / district.";
      if (form.postalCode && !/^\d{4}$/.test(form.postalCode)) e.postalCode = "Postal code must be 4 digits.";
    }
    if (s === 2) {
      const phoneClean = form.senderPhone.trim();
      const bdPhoneRegex = /^01[3-9]\d{8}$/;
      if (!bdPhoneRegex.test(phoneClean)) {
        e.senderPhone = "সঠিক ১১ ডিজিটের বাংলাদেশি নম্বর দিন (যেমন: 017XXXXXXXX)।";
      }

      const trxClean = form.transactionId.trim().toUpperCase();
      const isRepetitive = /^(.)\1+$/.test(trxClean);
      const isAlphanumeric = /^[A-Z0-9]{8,12}$/.test(trxClean);
      const hasNumberAndLetter = /[A-Z]/.test(trxClean) && /[0-9]/.test(trxClean);

      if (!trxClean || trxClean.length < 8 || trxClean.length > 12) {
        e.transactionId = "TrxID অবশ্যই ৮ থেকে ১২ অক্ষরের হতে হবে।";
      } else if (isRepetitive) {
        e.transactionId = "ভুল TrxID! আসল বিকাশ/নগদ ট্রানজেকশন আইডি দিন।";
      } else if (!isAlphanumeric) {
        e.transactionId = "TrxID-তে শুধু ইংরেজি বর্ণ ও সংখ্যা ব্যবহার করুন।";
      } else if (!hasNumberAndLetter) {
        e.transactionId = "সঠিক TrxID দিন (বিকাশ/নগদের আইডিতে ইংরেজি বর্ণ ও সংখ্যা দুটোই থাকে)।";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate(step)) return;

    if (form.phone.trim().length >= 10 && items.length > 0) {
      fetch("/api/abandoned-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.fullName.trim() || "Shopper",
          customerEmail: form.email.trim(),
          customerPhone: form.phone.trim(),
          items: items,
          totalBDT: totalBDT,
        }),
      }).catch(() => {});
    }

    setStep((s) => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const placeOrder = () => {
    setPlacing(true);
    window.setTimeout(() => {
      const generatedOrderId = orderId();
      const cleanEmail = form.email.trim().toLowerCase();

      const formattedPaymentMethod =
        form.paymentMethod === "cod"
          ? `COD [Advance Delivery: ৳${advancePayable} | Trx: ${form.transactionId.trim().toUpperCase()}]`
          : `Full Paid [৳${totalBDT} | Trx: ${form.transactionId.trim().toUpperCase()}]`;

      const newOrder: any = {
        id: generatedOrderId,
        email: cleanEmail,
        customerEmail: cleanEmail,
        customerName: form.fullName.trim(),
        customerPhone: form.phone.trim(),
        items,
        address: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          address: form.address,
          city: form.city,
          area: form.division,
          postalCode: form.postalCode,
          country: form.country,
        },
        shippingMethod: isInsideDhakaCity
          ? `Inside Dhaka (৳${BRAND_CONFIG.shipping.insideDhakaFee})`
          : `Outside Dhaka (৳${BRAND_CONFIG.shipping.outsideDhakaFee})`,
        shippingBDT: shippingFee,
        discountBDT,
        subtotalBDT,
        totalBDT,
        couponCode: couponCode ?? undefined,
        paymentMethod: formattedPaymentMethod,
        paymentStatus: "pending",
        status: "pending",
        placedAt: new Date().toISOString(),
        advancePaidBDT: advancePayable,
        dueAmountBDT: dueOnDelivery,
        senderNumber: form.senderPhone.trim(),
        transactionId: form.transactionId.trim().toUpperCase(),
      };

      fbEvents.purchase({
        id: generatedOrderId,
        totalBDT: totalBDT,
        itemIds: items.map((i) => i.productId),
        itemsCount: items.reduce((s, i) => s + i.qty, 0),
      });

      const existing = readLS<any[]>(LS_KEYS.orders, []);
      writeLS(LS_KEYS.orders, [newOrder, ...existing]);

      fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newOrder,
          advancePaidBDT: advancePayable,
          dueAmountBDT: dueOnDelivery,
          senderPhone: form.senderPhone.trim(),
          transactionId: form.transactionId.trim().toUpperCase(),
          customerName: form.fullName.trim(),
          customerPhone: form.phone.trim(),
          customerEmail: cleanEmail,
          shippingAddress: {
            division: form.division,
            district: form.city,
            address: form.address,
            advancePaidBDT: advancePayable,
            dueAmountBDT: dueOnDelivery,
            senderNumber: form.senderPhone.trim(),
            transactionId: form.transactionId.trim().toUpperCase(),
          },
        }),
      }).catch((err) => console.error("Database order sync error:", err));

      fetch(`/api/abandoned-cart?phone=${encodeURIComponent(form.phone.trim())}`, {
        method: "DELETE",
      }).catch(() => {});

      setOrder(newOrder);
      clear();
      setPlacing(false);
      setStep(4);
      push("success", `Order ${newOrder.id} placed. Thank you.`);
      window.scrollTo({ top: 0 });
    }, 800);
  };

  if (!mounted) {
    return <div className="container-x pb-24 pt-40" aria-busy="true" aria-label="Loading checkout" />;
  }

  // STEP 4: ORDER CONFIRMED SCREEN
  if (step === 4 && order) {
    return (
      <div className="container-x max-w-2xl pb-24 pt-32 text-center lg:pt-36">
        <div className="border border-line bg-paper p-8 sm:p-10 shadow-sm space-y-6">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700">
            <Check className="size-6" strokeWidth={2} />
          </span>
          <div>
            <p className="eyebrow !text-emerald-700 font-mono">Order Successfully Registered</p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl text-ink">Thank you, {order.address.fullName.split(" ")[0]}.</h1>
            <p className="mx-auto mt-2 max-w-md text-xs text-ash leading-relaxed">
              Your order <span className="font-mono font-bold text-ink">{order.id}</span> is confirmed and sent to our atelier for dispatch.
            </p>
          </div>

          <div className="border border-line bg-cream/40 p-5 text-left text-xs space-y-3">
            <div className="flex justify-between items-center border-b border-line pb-2.5">
              <span className="text-fog uppercase tracking-wider">Total Garments Value</span>
              <span className="font-bold text-ink"><Price amountBDT={order.totalBDT} /></span>
            </div>
            <div className="flex justify-between items-center text-emerald-700 font-semibold border-b border-line pb-2.5">
              <span>Advance Delivery Fee Paid</span>
              <span><Price amountBDT={order.advancePaidBDT} /></span>
            </div>
            <div className="flex justify-between items-center pt-1 font-bold text-sm text-ink">
              <span>Due on Delivery (Courier Cash)</span>
              <span className="text-base font-mono"><Price amountBDT={order.dueAmountBDT} /></span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/invoice/${order.id}`}
              target="_blank"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-ink bg-ink text-paper px-6 py-3 text-xs uppercase tracking-wider font-semibold hover:bg-ash transition-colors"
            >
              <span>Download Invoice (PDF)</span>
            </Link>
            <Button href="/shop" variant="outline" className="w-full sm:w-auto">
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-x pb-24 pt-40">
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty."
          copy="Add a few considered pieces before checking out."
          actionLabel="Back to Shop"
          actionHref="/shop"
        />
      </div>
    );
  }

  const availableDistricts = BD_DIVISIONS_DATA[form.division] || [];

  const summary = (
    <div className="bg-paper p-6 sm:p-7 border border-line shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink">Order Summary</h2>
        <span className="text-[10px] font-mono text-fog uppercase">{items.reduce((s, i) => s + i.qty, 0)} Items</span>
      </div>

      <ul className="space-y-3.5 divide-y divide-line/60">
        {items.map((i) => (
          <li key={`${i.productId}-${i.size}-${i.color}`} className="flex items-center gap-3.5 pt-3 first:pt-0">
            <span className="relative h-16 w-12 shrink-0 overflow-hidden bg-cream border border-line">
              <Image src={i.image} alt={i.name} fill sizes="48px" className="object-cover" />
              <span className="absolute right-0 top-0 flex size-4 items-center justify-center bg-ink text-[9px] text-paper font-mono font-bold">{i.qty}</span>
            </span>
            <span className="flex-1 text-xs leading-snug">
              <strong className="font-medium text-ink block">{i.name}</strong>
              <span className="text-fog text-[11px] mt-0.5 block">{i.color} • Size {i.size}</span>
            </span>
            <Price amountBDT={i.priceBDT * i.qty} className="text-xs font-semibold font-mono text-ink" />
          </li>
        ))}
      </ul>

      <div className="border-t border-line pt-4">
        {couponCode && discountBDT > 0 ? (
          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 text-xs text-emerald-800">
            <span className="font-semibold uppercase tracking-wider">{couponCode} Applied</span>
            <button type="button" onClick={removeCoupon} className="text-xs text-fog underline hover:text-error cursor-pointer">
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              id="co-coupon"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter promo code"
              className="h-10 flex-1 border border-line bg-paper px-3 text-xs placeholder:text-fog focus:border-ink outline-none uppercase font-mono"
            />
            <button
              type="button"
              onClick={() => {
                const r = applyCoupon(code);
                push(r.ok ? "success" : "error", r.ok ? "Code applied." : (r.reason ?? "Invalid code."));
                if (r.ok) setCode("");
              }}
              className="border border-ink bg-cream/50 px-4 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-ink hover:text-paper cursor-pointer"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      <dl className="border-t border-line pt-4 space-y-2.5 text-xs">
        <div className="flex justify-between text-ash">
          <dt>Garments Subtotal</dt>
          <dd className="font-mono"><Price amountBDT={subtotalBDT} /></dd>
        </div>
        {discountBDT > 0 && (
          <div className="flex justify-between text-emerald-700 font-semibold">
            <dt>Promotion Discount</dt>
            <dd className="font-mono">−<Price amountBDT={discountBDT} /></dd>
          </div>
        )}
        <div className="flex justify-between text-ash">
          <dt>Delivery ({isInsideDhakaCity ? "Inside Dhaka" : "Outside Dhaka"})</dt>
          <dd className="font-mono">{shippingFee === 0 ? <span className="text-emerald-700 font-bold">Free</span> : <Price amountBDT={shippingFee} />}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-sm font-bold text-ink">
          <dt>Total Order Amount</dt>
          <dd className="font-mono text-base"><Price amountBDT={totalBDT} /></dd>
        </div>

        {form.paymentMethod === "cod" && (
          <div className="border border-amber-500/30 bg-amber-500/5 p-3 mt-2 space-y-1 text-[11px]">
            <div className="flex justify-between text-amber-900 font-medium">
              <dt>Advance Delivery (Pay Now)</dt>
              <dd className="font-mono font-bold"><Price amountBDT={advancePayable} /></dd>
            </div>
            <div className="flex justify-between text-ink font-bold pt-1 border-t border-amber-500/20">
              <dt>Due on Delivery (Cash to Courier)</dt>
              <dd className="font-mono text-xs"><Price amountBDT={dueOnDelivery} /></dd>
            </div>
          </div>
        )}
      </dl>
    </div>
  );

  return (
    <div className="container-x pb-24 pt-32 lg:pt-36 max-w-6xl mx-auto">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <button onClick={() => (step === 0 ? router.push("/cart") : setStep((s) => s - 1))} className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ash hover:text-ink cursor-pointer">
          <ArrowLeft className="size-3.5" strokeWidth={1.5} /> {step === 0 ? "Bag" : "Back"}
        </button>
        <h1 className="font-display text-2xl sm:text-3xl tracking-tight">Checkout</h1>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-fog">
          <Lock className="size-3 text-emerald-600" /> 256-Bit SSL
        </span>
      </div>

      <ol className="mt-8 flex items-center justify-between border border-line bg-paper p-3" aria-label="Checkout progress">
        {STEPS.map((label, i) => (
          <li key={label} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className="flex items-center gap-2.5 cursor-pointer text-left"
              aria-current={step === i ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-xs border text-[10px] font-mono font-bold transition-colors",
                  i < step ? "border-ink bg-ink text-paper" : i === step ? "border-ink bg-ink text-paper" : "border-line text-fog bg-cream/40",
                )}
              >
                {i < step ? <Check className="size-3" strokeWidth={2.5} /> : i + 1}
              </span>
              <span className={cn("hidden text-[10px] font-semibold uppercase tracking-[0.18em] sm:block", i <= step ? "text-ink" : "text-fog")}>
                {label}
              </span>
            </button>
            {i < STEPS.length - 1 && <span className={cn("mx-3 h-px flex-1", i < step ? "bg-ink" : "bg-line")} aria-hidden />}
          </li>
        ))}
      </ol>

      <button
        type="button"
        className="mt-6 flex w-full items-center justify-between border border-line bg-paper px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] lg:hidden cursor-pointer"
        aria-expanded={summaryOpen}
        onClick={() => setSummaryOpen((o) => !o)}
      >
        <span>Order Summary — <Price amountBDT={totalBDT} /></span>
        <ChevronDown className={cn("size-4 transition-transform", summaryOpen && "rotate-180")} strokeWidth={1.5} />
      </button>
      {summaryOpen && <div className="mt-3 lg:hidden">{summary}</div>}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          
          {/* STEP 1: CONTACT */}
          {step === 0 && (
            <section aria-label="Contact details" className="border border-line bg-paper p-6 sm:p-8 shadow-xs space-y-5 animate-in fade-in">
              <div className="border-b border-line pb-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink">1. Contact Information</h2>
                <p className="text-xs text-fog mt-0.5">We will send your order confirmation and dispatch receipt here.</p>
              </div>

              {isBlacklisted && (
                <div className="flex items-center gap-3 border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-900 rounded-xs">
                  <ShieldAlert className="size-5 shrink-0 text-red-600" />
                  <p>
                    <strong>নোটিশ:</strong> আপনার নম্বরে পূর্বে পার্সেল ডেলিভারি ব্যর্থ হওয়ায় ক্যাশ অন ডেলিভারি প্রযোজ্য নয়। অনুগ্রহ করে <strong>Full Payment</strong> সম্পন্ন করুন।
                  </p>
                </div>
              )}

              <Input label="Email Address *" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} error={errors.email} placeholder="you@example.com" autoComplete="email" />
              
              <div className="grid gap-5 sm:grid-cols-2">
                <Input label="Full Name *" required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} error={errors.fullName} placeholder="Your full name" autoComplete="name" />
                <Input label="Phone Number (11 Digits) *" type="tel" required value={form.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} placeholder="017XXXXXXXX" autoComplete="tel" />
              </div>

              <div className="pt-2">
                <Button onClick={next} className="w-full sm:w-auto h-11 text-xs uppercase tracking-wider">
                  Continue to Shipping →
                </Button>
              </div>
            </section>
          )}

          {/* STEP 2: SHIPPING */}
          {step === 1 && (
            <section aria-label="Shipping address" className="border border-line bg-paper p-6 sm:p-8 shadow-xs space-y-5 animate-in fade-in">
              <div className="border-b border-line pb-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink">2. Shipping Destination</h2>
                <p className="text-xs text-fog mt-0.5">Nationwide delivery insured by Steadfast Courier.</p>
              </div>

              <Input 
                label="Street Address *" 
                required 
                value={form.address} 
                onChange={(e) => set("address", e.target.value)} 
                error={errors.address} 
                placeholder="House, road, flat, local area" 
                autoComplete="street-address" 
              />
              
              <div className="grid gap-5 sm:grid-cols-2">
                <Select
                  label="Division *"
                  value={form.division}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  options={DIVISIONS.map((d) => ({ value: d, label: `${d} Division` }))}
                />

                <Select
                  label="City / District *"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  error={errors.city}
                  options={availableDistricts.map((dst) => ({ value: dst, label: dst }))}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Input label="Postal Code" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} error={errors.postalCode} placeholder="e.g. 1213" inputMode="numeric" autoComplete="postal-code" />
                <Select label="Country" value={form.country} disabled options={[{ value: "Bangladesh", label: "Bangladesh" }]} />
              </div>

              <div className="border border-line bg-cream/40 p-4.5 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-ink">
                  <span className="flex items-center gap-2">
                    <Truck className="size-4 text-emerald-700" />
                    {isInsideDhakaCity ? "Inside Dhaka Metro Standard Delivery" : `Outside Dhaka Delivery (${form.city})`}
                  </span>
                  <span className="font-mono text-sm"><Price amountBDT={shippingFee} /></span>
                </div>
                <p className="text-[11px] text-fog pl-6">
                  {isInsideDhakaCity 
                    ? "Estimated 24–48 hours delivery directly within Dhaka Metro city." 
                    : `Estimated 2–4 days nationwide tracked courier delivery to ${form.city}.`}
                </p>
              </div>

              <div className="pt-2">
                <Button onClick={next} className="w-full sm:w-auto h-11 text-xs uppercase tracking-wider">
                  Continue to Payment →
                </Button>
              </div>
            </section>
          )}

          {/* STEP 3: PAYMENT */}
          {step === 2 && (
            <section aria-label="Payment method" className="border border-line bg-paper p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
              <div className="border-b border-line pb-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink">3. Payment Selection</h2>
                <p className="text-xs text-fog mt-0.5">Select your preferred payment method below.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* ক্যাশ অন ডেলিভারি: ব্ল্যাকলিস্ট হলে বন্ধ থাকবে */}
                {!isBlacklisted && (
                  <button
                    type="button"
                    onClick={() => set("paymentMethod", "cod")}
                    className={cn(
                      "border p-4.5 text-left transition-all cursor-pointer relative",
                      form.paymentMethod === "cod" ? "border-ink bg-cream/40 shadow-2xs" : "border-line hover:border-ink/60"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-ink">Cash on Delivery</p>
                      <div className={cn("size-3.5 rounded-full border flex items-center justify-center", form.paymentMethod === "cod" ? "border-ink bg-ink" : "border-line")}>
                        {form.paymentMethod === "cod" && <div className="size-1 rounded-full bg-paper" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-fog mt-1.5 leading-relaxed">
                      Pay product price to courier after parcel check. (Delivery fee paid in advance).
                    </p>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => set("paymentMethod", "full-payment")}
                  className={cn(
                    "border p-4.5 text-left transition-all cursor-pointer relative",
                    form.paymentMethod === "full-payment" || isBlacklisted ? "border-ink bg-cream/40 shadow-2xs" : "border-line hover:border-ink/60",
                    isBlacklisted && "sm:col-span-2"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-ink">Full Payment (bKash/Nagad)</p>
                    <div className={cn("size-3.5 rounded-full border flex items-center justify-center", form.paymentMethod === "full-payment" || isBlacklisted ? "border-ink bg-ink" : "border-line")}>
                      <div className="size-1 rounded-full bg-paper" />
                    </div>
                  </div>
                  <p className="text-[11px] text-fog mt-1.5 leading-relaxed">
                    Pay complete order amount upfront via bKash or Nagad Personal Send Money.
                  </p>
                </button>
              </div>

              {/* পেমেন্ট ইন্সট্রাকশন বক্স */}
              <div className="border border-line bg-cream/50 p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-line pb-3 gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-fog block">Payment Verification</span>
                    <p className="text-xs font-bold uppercase tracking-wider text-ink mt-0.5">
                      {form.paymentMethod === "cod" ? "Advance Delivery Fee Payment" : "Full Order Payment"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-fog block">Amount to Pay</span>
                    <span className="text-base font-bold font-mono text-ink"><Price amountBDT={advancePayable} /></span>
                  </div>
                </div>

                <div className="space-y-2 text-xs leading-relaxed text-ash">
                  <p>১. আপনার বিকাশ বা নগদ অ্যাপ থেকে <strong>&quot;Send Money&quot;</strong> অপশন সিলেক্ট করুন।</p>
                  <p className="flex items-center justify-between bg-paper border border-line px-3.5 py-2.5 text-ink font-mono text-xs font-bold select-all">
                    <span>{BRAND_CONFIG.payment.bkashNagadNumber}</span>
                    <span className="text-[10px] text-fog font-sans font-normal">({BRAND_CONFIG.payment.accountType})</span>
                  </p>
                  <p>২. টাকার পরিমাণ দিন: <strong className="text-ink">৳{advancePayable.toLocaleString()}</strong></p>
                  <p>৩. টাকা পাঠানো সম্পন্ন হলে নিচের ঘরে আপনার প্রেরক নম্বর ও TrxID বসিয়ে দিন।</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-line/70">
                  <Input
                    label="bKash / Nagad Sender Number *"
                    required
                    value={form.senderPhone}
                    onChange={(e) => set("senderPhone", e.target.value)}
                    error={errors.senderPhone}
                    placeholder="01XXXXXXXXX"
                  />
                  <Input
                    label="Transaction ID (TrxID) *"
                    required
                    value={form.transactionId}
                    onChange={(e) => set("transactionId", e.target.value.toUpperCase())}
                    error={errors.transactionId}
                    placeholder="e.g. BDX12BDX"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button onClick={next} className="w-full sm:w-auto h-11 text-xs uppercase tracking-wider">
                  Review & Confirm Order →
                </Button>
              </div>
            </section>
          )}

          {/* STEP 4: REVIEW */}
          {step === 3 && (
            <section aria-label="Review order" className="border border-line bg-paper p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
              <div className="border-b border-line pb-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink">4. Final Verification</h2>
                <p className="text-xs text-fog mt-0.5">Please review your delivery details before placing order.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                {[
                  ["Contact Details", `${form.fullName}\n${form.email}\n${form.phone}`, 0],
                  ["Delivery Address", `${form.address}\n${form.city}, ${form.division}`, 1],
                  [
                    "Delivery Rate", 
                    isInsideDhakaCity 
                      ? `Inside Dhaka Metro (৳${BRAND_CONFIG.shipping.insideDhakaFee})` 
                      : `Outside Dhaka — ${form.city} (৳${BRAND_CONFIG.shipping.outsideDhakaFee})`, 
                    1
                  ],
                  [
                    "Payment Details",
                    form.paymentMethod === "cod"
                      ? `COD (Advance: ৳${advancePayable} Paid)\nTrxID: ${form.transactionId} (${form.senderPhone})`
                      : `Full Paid (৳${totalBDT})\nTrxID: ${form.transactionId} (${form.senderPhone})`,
                    2,
                  ],
                ].map(([title, value, editStep]) => (
                  <div key={title as string} className="border border-line bg-cream/30 p-4 space-y-1.5 relative">
                    <div className="flex items-center justify-between border-b border-line/60 pb-1.5">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-fog">{title as string}</span>
                      <button type="button" onClick={() => setStep(editStep as number)} className="text-[10px] uppercase font-semibold text-ink underline hover:text-ash cursor-pointer">
                        Edit
                      </button>
                    </div>
                    <p className="text-ink font-medium whitespace-pre-line leading-relaxed">{value as string}</p>
                  </div>
                ))}
              </div>

              {form.paymentMethod === "cod" && (
                <div className="border border-amber-500/30 bg-amber-500/5 p-4 text-xs leading-relaxed text-amber-900 space-y-1">
                  <p className="font-bold uppercase tracking-wider text-[11px]">Cash on Delivery Confirmation</p>
                  <p>
                    ডেলিভারি চার্জের ৳{advancePayable.toLocaleString()} টাকা যাচাই করে পার্সেল কুরিয়ারে বুকিং দেওয়া হবে।
                    পার্সেল পেয়ে কুরিয়ারকে বাকি <strong>৳{dueOnDelivery.toLocaleString()}</strong> টাকা পরিশোধ করবেন।
                  </p>
                </div>
              )}

              <div className="pt-2">
                <Button onClick={placeOrder} loading={placing} className="w-full sm:w-auto h-12 text-xs uppercase tracking-widest font-bold">
                  Confirm & Place Order — <Price amountBDT={totalBDT} />
                </Button>
              </div>
            </section>
          )}

        </div>

        <aside className="hidden h-fit lg:sticky lg:top-28 lg:block" aria-label="Order summary">
          {summary}
        </aside>
      </div>
    </div>
  );
}
// END OF FILE src/app/checkout/page.tsx
