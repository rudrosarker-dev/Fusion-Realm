// START OF FILE src/app/contact/page.tsx
"use client";

import { Mail, MapPin, MessageCircle, Phone, Send, ArrowUpRight, Clock } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Input } from "@/components/ui/primitives";
import { useToast } from "@/lib/store";
import { BRAND_CONFIG } from "@/lib/brand.config";
import { cn } from "@/lib/utils";

const SUBJECTS = ["General", "Order", "Sizing Advice", "Payment/TrxID", "Wholesale"] as const;

export default function ContactPage() {
  const { push } = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "General",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) errs.email = "Enter a valid email address.";
    if (form.message.trim().length < 10) errs.message = "Please write a little more (10+ characters).";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setSent(true);
      push("success", "Message received. Our studio will respond promptly.");
    }, 700);
  };

  const whatsappUrl = `https://wa.me/${BRAND_CONFIG.contact.whatsappNumber}?text=Hello%20${encodeURIComponent(
    BRAND_CONFIG.brandName
  )}%20Concierge,%20I%20have%20an%20inquiry.`;

  return (
    <div className="container-x pb-28 pt-32 lg:pt-40">
      {/* Header */}
      <div className="max-w-2xl">
        <p className="eyebrow !text-gold-dark">Client Services</p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight text-balance">
          Talk to the Atelier
        </h1>
        <p className="mt-6 max-w-md text-[15px] leading-[1.8] text-ash font-light">
          Sizing consultations, custom fittings, advance delivery verification, or wholesale
          inquiries — connect directly with our concierge.
        </p>
      </div>

      <div className="mt-16 grid gap-16 lg:grid-cols-[0.95fr_1.15fr] lg:gap-20">
        {/* ——— LEFT: Contact channels ——— */}
        <div className="flex flex-col gap-8">
          {/* WhatsApp card */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-sm border border-ink/10 bg-gradient-to-br from-cream/80 to-paper p-5 shadow-[0_8px_30px_-12px_rgba(14,13,11,0.08)] transition-all duration-500 hover:border-emerald-600/30 hover:shadow-[0_16px_40px_-12px_rgba(16,185,129,0.15)] sm:p-6"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 opacity-0 transition-opacity duration-500 group-hover:from-emerald-500/5 group-hover:via-emerald-500/[0.03] group-hover:opacity-100" aria-hidden />
            <div className="relative flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 transition-all duration-500 group-hover:bg-emerald-600 group-hover:text-white group-hover:ring-emerald-600 group-hover:scale-105">
                <MessageCircle className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-fog">
                  Instant Support
                </p>
                <p className="mt-1 text-sm font-semibold tracking-wide text-ink group-hover:text-emerald-900 transition-colors">
                  Chat on WhatsApp
                </p>
              </div>
            </div>
            <div className="relative flex items-center gap-2">
              <span className="hidden font-mono text-xs font-medium text-ink/70 sm:inline">
                {BRAND_CONFIG.contact.phone}
              </span>
              <ArrowUpRight className="size-4 text-fog transition-all duration-300 group-hover:text-emerald-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
            </div>
          </a>

          {/* Info rows */}
          <ul className="space-y-1">
            {[
              {
                icon: Mail,
                label: "Official Email",
                primary: (
                  <a
                    href={`mailto:${BRAND_CONFIG.contact.email}`}
                    className="font-mono text-sm text-ink transition-colors hover:text-gold-dark hover:underline underline-offset-4 decoration-gold/40"
                  >
                    {BRAND_CONFIG.contact.email}
                  </a>
                ),
              },
              {
                icon: Phone,
                label: "Direct Line & Helpline",
                primary: (
                  <a
                    href={`tel:${BRAND_CONFIG.contact.phone}`}
                    className="font-mono text-sm text-ink transition-colors hover:text-gold-dark hover:underline underline-offset-4 decoration-gold/40"
                  >
                    {BRAND_CONFIG.contact.phone}
                  </a>
                ),
                secondary: (
                  <span className="mt-1 flex items-center gap-1.5 text-xs text-fog">
                    <Clock className="size-3" strokeWidth={1.5} />
                    {BRAND_CONFIG.contact.businessHours}
                  </span>
                ),
              },
              {
                icon: MapPin,
                label: "Studio Location",
                primary: <p className="text-sm text-ink">{BRAND_CONFIG.contact.address}</p>,
                secondary: (
                  <p className="mt-1 text-xs text-fog">
                    Nationwide Insured Delivery Across All 64 Districts
                  </p>
                ),
              },
            ].map((row) => (
              <li
                key={row.label}
                className="flex items-start gap-4 rounded-sm border border-transparent px-3 py-4 transition-colors hover:border-line/60 hover:bg-cream/40"
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-line/80 bg-paper text-fog shadow-2xs">
                  <row.icon className="size-4" strokeWidth={1.5} />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-fog">
                    {row.label}
                  </p>
                  <div className="mt-1.5">{row.primary}</div>
                  {row.secondary}
                </div>
              </li>
            ))}
          </ul>

          {/* Helper note */}
          <div className="rounded-sm border border-line/70 bg-cream/50 p-5 text-xs leading-relaxed text-ash">
            For existing order inquiries, please have your Order ID ready. You can also explore our{" "}
            <a href="/faq" className="font-medium text-ink underline underline-offset-2 decoration-gold/40 transition-colors hover:text-gold-dark">
              Client FAQ
            </a>
            ,{" "}
            <a href="/shipping-policy" className="font-medium text-ink underline underline-offset-2 decoration-gold/40 transition-colors hover:text-gold-dark">
              Shipping Policy
            </a>
            , and{" "}
            <a href="/return-policy" className="font-medium text-ink underline underline-offset-2 decoration-gold/40 transition-colors hover:text-gold-dark">
              14-Day Return Policy
            </a>
            .
          </div>
        </div>

        {/* ——— RIGHT: Form ——— */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="flex h-full min-h-[420px] flex-col items-center justify-center gap-5 border border-line/70 bg-gradient-to-b from-paper to-cream/40 p-10 text-center shadow-[0_20px_50px_-20px_rgba(14,13,11,0.08)] sm:p-14"
                role="status"
              >
                <span className="flex size-16 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold-dark shadow-sm">
                  <Send className="size-6" strokeWidth={1.25} />
                </span>
                <h2 className="font-display text-3xl text-ink tracking-tight">Message received.</h2>
                <p className="max-w-sm text-sm leading-relaxed text-ash">
                  Thank you, {form.name.split(" ")[0] || "there"}. Our concierge will review your note
                  and respond to{" "}
                  <span className="font-mono text-ink">{form.email}</span> shortly.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setSent(false);
                    setForm({ name: "", email: "", subject: "General", message: "" });
                  }}
                >
                  Send Another Inquiry
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onSubmit={submit}
                noValidate
                className="flex flex-col gap-6 border border-line/70 bg-paper/80 p-6 shadow-[0_20px_50px_-20px_rgba(14,13,11,0.08)] backdrop-blur-sm sm:p-9"
              >
                <div className="border-b border-line/60 pb-4">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink">
                    Send an Atelier Inquiry
                  </h2>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Your Name"
                    required
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    error={errors.name}
                    placeholder="e.g. S. M. Rahman"
                  />
                  <Input
                    label="Your Email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    error={errors.email}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="flex flex-col gap-2.5">
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-ash">
                    Inquiry Subject
                  </span>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Subject">
                    {SUBJECTS.map((s) => {
                      const active = form.subject === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => set("subject", s)}
                          className={cn(
                            "relative border px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition-all duration-300 cursor-pointer rounded-xs",
                            active
                              ? "border-ink bg-ink text-paper shadow-sm"
                              : "border-line bg-paper/50 text-ash hover:border-gold/50 hover:text-ink hover:bg-gold/5"
                          )}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 group">
                  <label
                    htmlFor="message"
                    className="text-[11px] font-medium uppercase tracking-[0.18em] text-ash transition-colors group-focus-within:text-gold-dark"
                  >
                    Message Details <span className="text-error">*</span>
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    required
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                    aria-invalid={!!errors.message}
                    className={cn(
                      "border bg-paper/40 p-3.5 text-sm text-ink placeholder:text-fog/60 outline-none transition-all duration-300 rounded-xs shadow-2xs resize-y min-h-[120px]",
                      "focus:bg-paper focus:border-gold focus:ring-4 focus:ring-gold/10 hover:border-gold/40",
                      errors.message ? "border-error focus:border-error focus:ring-error/10" : "border-line"
                    )}
                    placeholder="How can our concierge assist you today?"
                  />
                  {errors.message && (
                    <p role="alert" className="text-xs text-error animate-in fade-in slide-in-from-top-1">
                      {errors.message}
                    </p>
                  )}
                </div>

                <div className="pt-1">
                  <Button type="submit" loading={sending} size="lg" className="w-full sm:w-auto">
                    Submit Inquiry
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
// END OF FILE src/app/contact/page.tsx
