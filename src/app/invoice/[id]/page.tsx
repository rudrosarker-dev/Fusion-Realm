// START OF FILE src/app/invoice/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Printer, ArrowLeft, ShieldCheck } from "lucide-react";
import { BRAND_CONFIG } from "@/lib/brand.config";
import { formatPrice } from "@/lib/utils";

// ট্রানজেকশন আইডি সিকিউরিটি মাস্কিং (প্রথম ২ অক্ষর রেখে বাকি সব স্টার করা)
function maskTrxId(trxId?: string): string {
  if (!trxId || trxId === "N/A") return "N/A";
  const clean = trxId.trim();
  if (clean.length <= 2) return `${clean}****`;
  const prefix = clean.slice(0, 2);
  return `${prefix}${"*".repeat(Math.max(6, clean.length - 2))}`;
}

// পেমেন্ট মেথড থেকে ব্যাকএন্ডের ব্র্যাকেট লেখা পরিষ্কার করা
function cleanPaymentMethod(methodStr?: string): string {
  if (!methodStr) return "Cash on Delivery";
  if (methodStr.includes("Full Paid")) return "bKash / Nagad (Full Paid)";
  if (methodStr.includes("COD") || methodStr.includes("Manual")) return "Cash on Delivery (Advance Paid)";
  return methodStr.split("[")[0].trim();
}

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    fetch("/api/orders", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) {
          const match = data.orders.find(
            (o: any) => o.id.toLowerCase() === orderId.toLowerCase()
          );
          if (match) setOrder(match);
        }
      })
      .catch((err) => console.error("Invoice fetch error:", err))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center text-xs font-mono text-fog">
        Generating official atelier invoice...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6 text-center">
        <h1 className="font-display text-2xl text-ink">Invoice Not Found</h1>
        <p className="text-xs text-ash mt-2">No matching order found for reference: {orderId}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 border border-ink px-4 py-2 text-xs uppercase tracking-wider"
        >
          Return to Storefront
        </button>
      </div>
    );
  }

  const items = order.items || [];
  const shippingAddr = order.shippingAddress || {};
  const advancePaid = Number(shippingAddr?.advancePaidBDT || order.shippingBDT || 0);
  const total = Number(order.totalBDT || 0);
  const dueAmount = Number(shippingAddr?.dueAmountBDT ?? Math.max(0, total - advancePaid));
  const maskedTrx = maskTrxId(shippingAddr?.transactionId);
  const displayPaymentMethod = cleanPaymentMethod(order.paymentMethod);

  // ব্র্যান্ড কনফিগ থেকে স্বয়ংক্রিয় ওয়াটারমার্ক নাম নেওয়া
  const watermarkText = (BRAND_CONFIG.brandName || "ATELIER").split(" ")[0].toUpperCase();

  return (
    <div className="min-h-screen bg-paper pt-28 sm:pt-36 pb-20 px-4 font-sans print:p-0 print:bg-white text-ink">
      
      {/* ========================================================
          ১. মেইন লাক্সারি এস্থেটিক A4 ইনভয়েস ভাউচার কার্ড
          ======================================================== */}
      <div className="max-w-3xl mx-auto border border-line bg-white p-8 sm:p-14 shadow-[0_15px_40px_-5px_rgba(0,0,0,0.04)] print:border-none print:shadow-none print:p-0 relative overflow-hidden">
        
        {/* ব্র্যান্ড কনফিগ অনুযায়ী স্বয়ংক্রিয় ওয়াটারমার্ক সিল */}
        <div className="absolute right-8 top-24 pointer-events-none select-none opacity-[0.035] print:opacity-[0.04]">
          <span className="font-display text-7xl sm:text-8xl font-black uppercase tracking-tighter truncate max-w-sm block">
            {watermarkText}
          </span>
        </div>

        {/* Header: ব্র্যান্ড নেম ও রেফারেন্স */}
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl tracking-[0.25em] uppercase text-ink">
              {BRAND_CONFIG.brandName}
            </h1>
            <p className="text-[10px] uppercase font-mono tracking-[0.26em] text-fog mt-1">
              Commercial Sales Invoice & Packing Memo
            </p>
            <p className="text-xs text-ash mt-3 leading-relaxed font-sans">
              Banani, Dhaka, Bangladesh<br />
              Helpline: {BRAND_CONFIG.contact.phone}<br />
              Email: {BRAND_CONFIG.contact.email}
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider bg-cream px-3 py-1 border border-line inline-block font-semibold">
              Invoice #{order.id}
            </span>
            <p className="text-xs text-ash font-mono pt-1">
              Date: <strong className="text-ink">{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</strong>
            </p>
            <p className="text-xs text-ash">
              Status: <span className="uppercase font-semibold text-emerald-800 font-mono">{order.orderStatus || "CONFIRMED"}</span>
            </p>
          </div>
        </div>

        {/* Bill To & Payment Security Details */}
        <div className="grid sm:grid-cols-2 gap-8 py-7 border-b border-line text-xs">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-fog font-medium mb-1.5">Billed & Delivered To:</p>
            <p className="font-bold text-sm text-ink">{order.customerName}</p>
            <p className="font-mono text-ink mt-0.5">{order.customerPhone}</p>
            <p className="text-ash mt-1 leading-relaxed">
              {shippingAddr?.address || ""}<br />
              {shippingAddr?.district || shippingAddr?.division || "Dhaka"}, Bangladesh
            </p>
          </div>

          <div className="sm:text-right space-y-1.5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-fog font-medium mb-1.5">Payment Verification:</p>
            <p className="text-ash">Method: <strong className="text-ink">{displayPaymentMethod}</strong></p>
            
            {/* সিকিউরড ট্রানজেকশন আইডি */}
            <p className="text-ash">
              TrxID: <span className="font-mono font-bold text-ink bg-cream/70 px-2 py-0.5 border border-line/60 inline-block tracking-wider">{maskedTrx}</span>
            </p>
            
            <p className="text-ash">
              Sender Account: <span className="font-mono text-ink">{shippingAddr?.senderNumber || "N/A"}</span>
            </p>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="py-7">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-ink text-[10px] uppercase tracking-[0.16em] text-ink pb-3 text-left">
                <th className="py-3 font-semibold">Garment Silhouette</th>
                <th className="py-3 font-semibold text-center">Size</th>
                <th className="py-3 font-semibold text-center">Qty</th>
                <th className="py-3 font-semibold text-right">Unit Price</th>
                <th className="py-3 font-semibold text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {items.map((item: any, idx: number) => (
                <tr key={idx} className="py-3.5">
                  <td className="py-3.5 font-medium text-ink">
                    {item.name}
                    <span className="block text-[10px] text-fog font-mono font-normal">Color: {item.color || "Default"}</span>
                  </td>
                  <td className="py-3.5 text-center font-mono font-bold text-ink">{item.size}</td>
                  <td className="py-3.5 text-center font-mono">{item.quantity}</td>
                  <td className="py-3.5 text-right font-mono">{formatPrice(item.priceBDT)}</td>
                  <td className="py-3.5 text-right font-mono font-semibold">{formatPrice(item.priceBDT * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculations & Due Collection */}
        <div className="border-t border-line pt-6 flex flex-col sm:flex-row justify-between items-start gap-8">
          <div className="text-[11px] text-ash space-y-1.5 max-w-sm">
            <p className="flex items-center gap-1.5 font-semibold text-ink">
              <ShieldCheck className="size-4 text-emerald-700" /> Verified Atelier Quality Seal
            </p>
            <p className="leading-relaxed">
              Please inspect the garments in the presence of the delivery agent. All unworn pieces bearing intact security seals qualify for our 14-day exchange protocol.
            </p>
          </div>

          <div className="w-full sm:w-64 space-y-2 text-xs border-t sm:border-t-0 pt-4 sm:pt-0 border-line">
            <div className="flex justify-between text-ash">
              <span>Garments Subtotal:</span>
              <span className="font-mono">{formatPrice(order.subtotalBDT || 0)}</span>
            </div>
            <div className="flex justify-between text-ash">
              <span>Nationwide Delivery:</span>
              <span className="font-mono">{formatPrice(order.shippingBDT || 0)}</span>
            </div>
            {order.discountBDT > 0 && (
              <div className="flex justify-between text-success">
                <span>Voucher Discount:</span>
                <span className="font-mono">-{formatPrice(order.discountBDT)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-2 text-sm font-bold text-ink">
              <span>Total Invoice:</span>
              <span className="font-mono">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-xs text-success pt-1">
              <span>Advance Paid (Delivery):</span>
              <span className="font-mono">-{formatPrice(advancePaid)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-ink pt-2 text-base font-bold text-ink">
              <span>Cash to Collect:</span>
              <span className="font-mono">{formatPrice(dueAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="border-t border-line mt-12 pt-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.24em] text-fog font-mono">
            Thank you for shopping with {BRAND_CONFIG.brandName} • Dhaka Atelier
          </p>
        </div>
      </div>

      {/* ========================================================
          ২. অ্যাকশন বাটনসমূহ: ঠিক ইনভয়েস কার্ডের নিচে ডান পাশে (লাল বৃত্তের জায়গায়)
          ======================================================== */}
      <div className="max-w-3xl mx-auto mt-6 flex items-center justify-end gap-3 print:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-paper border border-line px-4 py-2.5 text-xs uppercase tracking-wider text-ink font-semibold hover:border-ink transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" /> <span>Back</span>
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-ink text-paper px-6 py-2.5 text-xs uppercase tracking-wider font-semibold hover:bg-ash transition-all shadow-md cursor-pointer"
        >
          <Printer className="size-4" />
          <span>Download / Print PDF</span>
        </button>
      </div>

    </div>
  );
}
// END OF FILE src/app/invoice/[id]/page.tsx
