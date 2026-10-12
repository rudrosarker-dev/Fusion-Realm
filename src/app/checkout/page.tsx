"use client";

import { ArrowLeft, Check, ChevronDown, Lock, ShoppingBag } from "lucide-react";
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

  // কুরিয়ার রুলস: বিভাগ ঢাকা এবং জেলা ঢাকা হলেই ১০০ টাকা, বাকি সব জেলা ও বিভাগে ১৫০ টাকা!
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

  // বিভাগ পরিবর্তন হওয়ামাত্র জেলা স্বয়ংক্রিয়ভাবে ওই বিভাগের ১ম জেলাতে সেট হবে
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

    // সাইলেন্ট ব্যাকগ্রাউন্ড সিঙ্ক: কাস্টমার স্টেপ পার করলেই ড্রাফট কার্ট সেভ হবে
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

      // ১. অর্ডার ডাটাবেজে সংরক্ষণ
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

      // ২. সফল অর্ডার হওয়ায় ড্রাফট কার্ট মুছে ফেলা
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

  if (step === 4 && order) {
    return (
      <div className="container-x max-w-2xl pb-24 pt-32 text-center lg:pt-36">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full border border-ink">
          <Check className="size-7" strokeWidth={1.25} />
        </span>
        <p className="eyebrow mt-8">Order Confirmed</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">Thank you, {order.address.fullName.split(" ")[0]}.</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ash">
          Your order <span className="font-medium text-ink">{order.id}</span> is confirmed.
        </p>

        <div className="mt-6">
          <Link
            href={`/invoice/${order.id}`}
            target="_blank"
            className="inline-flex items-center gap-2 border border-ink bg-cream px-5 py-2.5 text-xs uppercase tracking-wider font-semibold hover:bg-ink hover:text-paper transition-colors"
          >
            <span>View & Download Official Invoice (PDF)</span>
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button href="/shop">Continue Shopping</Button>
          <Button href="/account" variant="outline">View My Account</Button>
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

  const summary = (
    <div className="bg-cream p-6 sm:p-8 border border-line">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.24em]">Order Summary</h2>
      <ul className="mt-5 space-y-4">
        {items.map((i) => (
          <li key={`${i.productId}-${i.size}-${i.color}`} className="flex items-center gap-3">
            <span className="relative h-16 w-12 shrink-0 overflow-hidden bg-paper">
              <Image src={i.image} alt={i.name} fill sizes="48px" className="object-cover" />
              <span className="absolute right-0 top-0 flex size-4 items-center justify-center bg-ink text-[9px] text-paper">{i.qty}</span>
            </span>
            <span className="flex-1 text-xs leading-snug">
              {i.name}
              <span className="block text-fog">{i.color} / {i.size}</span>
            </span>
            <Price amountBDT={i.priceBDT * i.qty} className="text-xs" />
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-line pt-4">
        {couponCode && discountBDT > 0 ? (
          <div className="flex items-center justify-between bg-paper px-3 py-2.5 text-xs text-success">
            <span>{couponCode} applied</span>
            <button type="button" onClick={removeCoupon} className="text-fog underline-offset-2 hover:text-error hover:underline cursor-pointer">
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              id="co-coupon"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Promo code"
              className="h-10 flex-1 border border-line bg-paper px-3 text-xs placeholder:text-fog focus:border-ink outline-none"
            />
            <button
              type="button"
              onClick={() => {
                const r = applyCoupon(code);
                push(r.ok ? "success" : "error", r.ok ? "Code applied." : (r.reason ?? "Invalid code."));
                if (r.ok) setCode("");
              }}
              className="border border-ink px-3.5 text-[10px] font-medium uppercase tracking-[0.14em] transition-colors hover:bg-ink hover:text-paper cursor-pointer"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-ash">Subtotal</dt>
          <dd><Price amountBDT={subtotalBDT} /></dd>
        </div>
        {discountBDT > 0 && (
          <div className="flex justify-between text-success">
            <dt>Discount</dt>
            <dd>−<Price amountBDT={discountBDT} /></dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-ash">Delivery Charge ({isInsideDhakaCity ? "Inside Dhaka" : "Outside Dhaka"})</dt>
          <dd>{shippingFee === 0 ? <span className="text-success">Free</span> : <Price amountBDT={shippingFee} />}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
          <dt>Total Order Amount</dt>
          <dd><Price amountBDT={totalBDT} /></dd>
        </div>

        {form.paymentMethod === "cod" && (
          <div className="border-t border-line/60 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-[#8a6d2f] font-medium">
              <dt>Advance Delivery Charge (Pay Now)</dt>
              <dd><Price amountBDT={advancePayable} /></dd>
            </div>
            <div className="flex justify-between text-ink font-semibold">
              <dt>Due on Delivery (Cash to Courier)</dt>
              <dd><Price amountBDT={dueOnDelivery} /></dd>
            </div>
          </div>
        )}
      </dl>
    </div>
  );

  // নির্বাচিত বিভাগের আওতাধীন জেলাগুলোর তালিকা
  const availableDistricts = BD_DIVISIONS_DATA[form.division] || [];

  return (
    <div className="container-x pb-24 pt-32 lg:pt-36">
      <div className="flex items-center justify-between">
        <button onClick={() => (step === 0 ? router.push("/cart") : setStep((s) => s - 1))} className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-ash hover:text-ink cursor-pointer">
          <ArrowLeft className="size-3.5" strokeWidth={1.5} /> {step === 0 ? "Bag" : "Back"}
        </button>
        <h1 className="font-display text-2xl sm:text-3xl">Checkout</h1>
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-fog">
          <Lock className="size-3.5" strokeWidth={1.5} /> Secure
        </span>
      </div>

      <ol className="mt-8 flex items-center" aria-label="Checkout progress">
        {STEPS.map((label, i) => (
          <li key={label} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className="flex items-center gap-2 cursor-pointer"
              aria-current={step === i ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border text-[10px] transition-colors",
                  i < step ? "border-ink bg-ink text-paper" : i === step ? "border-ink" : "border-line text-fog",
                )}
              >
                {i < step ? <Check className="size-3.5" strokeWidth={2} /> : i + 1}
              </span>
              <span className={cn("hidden text-[11px] font-medium uppercase tracking-[0.14em] sm:block", i <= step ? "text-ink" : "text-fog")}>
                {label}
              </span>
            </button>
            {i < STEPS.length - 1 && <span className={cn("mx-3 h-px flex-1", i < step ? "bg-ink" : "bg-line")} aria-hidden />}
          </li>
        ))}
      </ol>

      <button
        type="button"
        className="mt-8 flex w-full items-center justify-between border border-line px-4 py-3 text-[11px] font-medium uppercase tracking-[0.16em] lg:hidden cursor-pointer"
        aria-expanded={summaryOpen}
        onClick={() => setSummaryOpen((o) => !o)}
      >
        Order summary — <Price amountBDT={totalBDT} />
        <ChevronDown className={cn("size-4 transition-transform", summaryOpen && "rotate-180")} strokeWidth={1.5} />
      </button>
      {summaryOpen && <div className="mt-3 lg:hidden">{summary}</div>}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          {/* STEP 1: CONTACT */}
          {step === 0 && (
            <section aria-label="Contact details" className="flex flex-col gap-5">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.24em]">Contact</h2>
              <Input label="Email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} error={errors.email} placeholder="you@example.com" autoComplete="email" />
              <div className="grid gap-5 sm:grid-cols-2">
                <Input label="Full Name" required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} error={errors.fullName} placeholder="Your full name" autoComplete="name" />
                <Input label="Phone" type="tel" required value={form.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} placeholder="01XXXXXXXXX" autoComplete="tel" />
              </div>
              <Button onClick={next} className="mt-2 w-fit">Continue to Shipping</Button>
            </section>
          )}

          {/* STEP 2: SHIPPING (আগে Division, পরে District/City) */}
          {step === 1 && (
            <section aria-label="Shipping address" className="flex flex-col gap-5">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.24em]">Shipping Address</h2>
              
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
                {/* ১. আগে কাস্টমার সিলেক্ট করবে বিভাগ (Division) */}
                <Select
                  label="Division *"
                  value={form.division}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  options={DIVISIONS.map((d) => ({ value: d, label: `${d} Division` }))}
                />

                {/* ২. এরপর সংশ্লিষ্ট বিভাগের জেলা সিলেক্ট করবে (City / District) */}
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

              {/* ডেলিভারি রেট ডিসপ্লে বক্স */}
              <div className="border border-line bg-cream/70 p-4 mt-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-fog">Calculated Delivery Rate</p>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">
                    {isInsideDhakaCity ? "Inside Dhaka Metro Standard Delivery" : `Outside Dhaka (${form.city}, ${form.division}) Delivery`}
                  </span>
                  <span className="font-semibold text-ink"><Price amountBDT={shippingFee} /></span>
                </div>
                <p className="text-xs text-fog mt-1">
                  {isInsideDhakaCity 
                    ? "Estimated 24–48 hours delivery within Dhaka Metro city." 
                    : `Estimated 2–4 days nationwide delivery to ${form.city}.`}
                </p>
              </div>

              <Button onClick={next} className="mt-2 w-fit">Continue to Payment</Button>
            </section>
          )}

          {/* STEP 3: PAYMENT */}
          {step === 2 && (
            <section aria-label="Payment method" className="flex flex-col gap-6">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.24em]">Payment Method</h2>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => set("paymentMethod", "cod")}
                  className={cn("border p-4 text-left transition-colors cursor-pointer", form.paymentMethod === "cod" ? "border-ink bg-cream/40" : "border-line")}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink">Cash on Delivery</p>
                  <p className="text-xs text-fog mt-1">Pay product price to courier after parcel check. (Delivery fee paid in advance).</p>
                </button>

                <button
                  type="button"
                  onClick={() => set("paymentMethod", "full-payment")}
                  className={cn("border p-4 text-left transition-colors cursor-pointer", form.paymentMethod === "full-payment" ? "border-ink bg-cream/40" : "border-line")}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink">Full Payment (bKash/Nagad)</p>
                  <p className="text-xs text-fog mt-1">Pay complete order amount upfront via bKash or Nagad.</p>
                </button>
              </div>

              <div className="border border-line bg-cream p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-fog">Payment Instructions</p>
                    <p className="text-sm font-semibold text-ink mt-0.5">
                      {form.paymentMethod === "cod" ? "Advance Delivery Fee Payment" : "Full Order Payment"}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-ink">
                    Pay Now: <Price amountBDT={advancePayable} />
                  </span>
                </div>

                <div className="space-y-2 text-xs leading-relaxed text-ash">
                  <p>১. আপনার বিকাশ বা নগদ অ্যাপ থেকে <strong>&quot;Send Money&quot;</strong> অপশন সিলেক্ট করুন।</p>
                  <p className="flex items-center gap-2 bg-paper border border-line px-3 py-2 text-ink font-mono text-sm font-semibold select-all">
                    <span>{BRAND_CONFIG.payment.bkashNagadNumber}</span>
                    <span className="text-xs text-fog font-sans font-normal">({BRAND_CONFIG.payment.accountType})</span>
                  </p>
                  <p>২. টাকার পরিমাণ দিন: <strong>৳{advancePayable.toLocaleString()}</strong></p>
                  <p>৩. টাকা পাঠানো সম্পন্ন হলে নিচে ট্রানজেকশন আইডি (TrxID) দিন।</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <Input
                    label="bKash / Nagad Number *"
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
                    placeholder="Enter 8-10 character TrxID"
                  />
                </div>
              </div>

              <Button onClick={next} className="mt-2 w-fit">Review & Confirm</Button>
            </section>
          )}

          {/* STEP 4: REVIEW */}
          {step === 3 && (
            <section aria-label="Review order" className="flex flex-col gap-6">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.24em]">Review & Place Order</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {[
                  ["Contact", `${form.email} — ${form.phone}`, 0],
                  ["Delivery Address", `${form.fullName}, ${form.address}, ${form.city}, ${form.division}`, 1],
                  [
                    "Shipping Rate", 
                    isInsideDhakaCity 
                      ? `Inside Dhaka Metro (৳${BRAND_CONFIG.shipping.insideDhakaFee})` 
                      : `Outside Dhaka — ${form.city} (৳${BRAND_CONFIG.shipping.outsideDhakaFee})`, 
                    1
                  ],
                  [
                    "Payment Details",
                    form.paymentMethod === "cod"
                      ? `COD (Advance ৳${advancePayable} Paid · Trx: ${form.transactionId})`
                      : `Full Paid (৳${totalBDT} · Trx: ${form.transactionId})`,
                    2,
                  ],
                ].map(([title, value, editStep]) => (
                  <div key={title} className="border border-line p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-fog">{title}</p>
                      <button type="button" onClick={() => setStep(editStep as number)} className="text-[11px] underline underline-offset-2 hover:text-ash cursor-pointer">
                        Edit
                      </button>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed">{value}</p>
                  </div>
                ))}
              </div>

              <Button onClick={placeOrder} loading={placing} size="lg" className="w-fit">
                Confirm & Place Order — <Price amountBDT={totalBDT} />
              </Button>
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
