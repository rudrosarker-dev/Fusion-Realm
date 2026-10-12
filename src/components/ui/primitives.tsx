// START OF FILE src/components/ui/primitives.tsx
"use client";

import { ChevronDown, ChevronRight, Loader2, Minus, Plus, SearchX } from "lucide-react";
import Link from "next/link";
import {
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { useUI } from "@/lib/store";
import { cn, formatPrice } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type BtnVariant = "primary" | "outline" | "ghost" | "inverse" | "gold";
type BtnSize = "sm" | "md" | "lg";

const btnBase =
  "relative inline-flex items-center justify-center gap-2 uppercase tracking-[0.2em] transition-all duration-300 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer rounded-xs overflow-hidden";

const btnSizes: Record<BtnSize, string> = {
  sm: "h-9 px-5 text-[10px]",
  md: "h-11 px-7 text-[11px]",
  lg: "h-12 px-9 text-[12px]",
};

// গ্লোবাল বাটন স্টাইল আপডেট করা হয়েছে - সব জায়গায় প্রিমিয়াম লুক পাওয়ার জন্য
const btnVariants: Record<BtnVariant, string> = {
  primary:
    "bg-ink text-paper font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_14px_rgba(0,0,0,0.14)] hover:bg-gold-dark hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] border border-ink",
  inverse:
    "bg-paper text-ink font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.08)] hover:bg-gold-light hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] border border-transparent",
  outline:
    "bg-transparent text-ink font-semibold border border-ink hover:bg-ink hover:text-paper hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
  ghost:
    "bg-transparent text-ink font-medium hover:text-gold-dark border-b border-ink/35 hover:border-gold-dark rounded-none px-0 pb-1 tracking-[0.22em] shadow-none",
  gold:
    "bg-gradient-to-b from-[#dfcaa8] to-[#c5a880] text-ink font-semibold border border-[#b8976c] hover:brightness-105 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
  href?: string;
  full?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  href,
  full,
  className,
  children,
  disabled,
  onClick,
  ...rest
}: ButtonProps) {
  const cls = cn(btnBase, btnSizes[size], btnVariants[variant], full && "w-full", className);

  const content = (
    <>
      {loading && <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />}
      <span>{children}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cls}
        aria-disabled={disabled}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            return;
          }
          if (onClick) onClick(e as any);
        }}
      >
        {content}
      </Link>
    );
  }

  return (
    <button className={cls} disabled={disabled || loading} onClick={onClick} {...rest}>
      {content}
    </button>
  );
}

/* ————————————————— FORM FIELDS ————————————————— */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className, ...rest }: InputProps) {
  const inputId = id ?? label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="flex flex-col gap-1.5 group">
      <label htmlFor={inputId} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#524f47]">
        {label}
        {rest.required && <span className="text-error"> *</span>}
      </label>
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          "h-11 border border-line bg-paper/60 px-4 text-xs text-ink outline-none transition-colors focus:border-[#c5a880] focus:bg-paper rounded-xs placeholder:text-fog",
          error ? "border-error focus:border-error" : "border-line",
          className
        )}
        {...rest}
      />
      {error && <p id={`${inputId}-error`} role="alert" className="text-xs text-error">{error}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export function Select({ label, options, error, id, className, ...rest }: SelectProps) {
  const selectId = id ?? (label ? label.replace(/\s+/g, "-").toLowerCase() : "select");
  return (
    <div className="flex flex-col gap-1.5 group">
      {label && (
        <label htmlFor={selectId} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#524f47]">
          {label}
          {rest.required && <span className="text-error"> *</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={!!error}
          className={cn(
            "h-11 w-full appearance-none border border-line bg-paper/60 px-4 pr-10 text-xs text-ink outline-none transition-colors focus:border-[#c5a880] cursor-pointer rounded-xs",
            error ? "border-error" : "border-line",
            className
          )}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-fog" strokeWidth={1.5} />
      </div>
      {error && <p role="alert" className="text-xs text-error">{error}</p>}
    </div>
  );
}

/* ————————————————— PRICE ————————————————— */

export function Price({
  amountBDT,
  compareAtBDT,
  className,
  compareClassName,
}: {
  amountBDT: number;
  compareAtBDT?: number;
  className?: string;
  compareClassName?: string;
}) {
  const { currency } = useUI();
  return (
    <span className={cn("inline-flex items-baseline gap-2 tabular-nums font-mono tracking-tight", className)}>
      <span className="font-medium text-ink">{formatPrice(amountBDT, currency)}</span>
      {compareAtBDT && compareAtBDT > amountBDT && (
        <s className={cn("text-fog/70 font-normal text-[0.9em]", compareClassName)}>{formatPrice(compareAtBDT, currency)}</s>
      )}
    </span>
  );
}

/* ————————————————— QTY STEPPER ————————————————— */

export function QtyStepper({
  qty,
  onChange,
  min = 1,
  max = 99,
  small,
}: {
  qty: number;
  onChange: (q: number) => void;
  min?: number;
  max?: number;
  small?: boolean;
}) {
  const btn = cn(
    "flex items-center justify-center text-ash transition-colors hover:text-ink cursor-pointer disabled:opacity-30",
    small ? "size-8" : "size-11"
  );
  return (
    <div className={cn("inline-flex items-center border border-line bg-paper rounded-xs overflow-hidden", small ? "h-8" : "h-11")}>
      <button type="button" aria-label="Decrease quantity" className={btn} disabled={qty <= min} onClick={() => onChange(qty - 1)}>
        <Minus className="size-3.5" strokeWidth={1.5} />
      </button>
      <span aria-live="polite" className={cn("w-10 text-center tabular-nums font-mono font-medium text-ink", small ? "text-xs" : "text-sm")}>
        {qty}
      </span>
      <button type="button" aria-label="Increase quantity" className={btn} disabled={qty >= max} onClick={() => onChange(qty + 1)}>
        <Plus className="size-3.5" strokeWidth={1.5} />
      </button>
    </div>
  );
}

/* ————————————————— ACCORDION ————————————————— */

export function Accordion({ items }: { items: { title: string; content: ReactNode }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, i) => {
        const expanded = open === i;
        return (
          <div key={i} className="group">
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? null : i)}
              className="flex w-full items-center justify-between gap-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] cursor-pointer hover:text-[#9e7f55] transition-colors"
            >
              {item.title}
              <ChevronDown className={cn("size-4 text-fog transition-transform duration-300", expanded && "rotate-180 text-ink")} strokeWidth={1.5} />
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                expanded ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden text-xs leading-relaxed text-ash">{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ————————————————— BREADCRUMB / BADGE / EMPTY STATE ————————————————— */

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-fog font-medium">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <ChevronRight className="size-3 text-line" strokeWidth={2} />}
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-ink">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="text-ink font-semibold">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "dark" | "sale" | "new" | "low" | "gold";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] rounded-2xs",
        tone === "neutral" && "bg-paper text-ink border border-line",
        tone === "dark" && "bg-ink text-paper",
        tone === "sale" && "bg-[#8b2b1c] text-paper",
        tone === "new" && "bg-ink text-[#dfcaa8] border border-[#c5a880]/30",
        tone === "low" && "bg-bronze text-paper",
        tone === "gold" && "bg-gold/15 text-gold-dark border border-gold/30"
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon = SearchX,
  title,
  copy,
  actionLabel,
  actionHref,
  onAction,
}: {
  icon?: LucideIcon;
  title: string;
  copy?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center border border-line bg-cream/20 p-8 rounded-xs">
      <div className="size-14 rounded-full bg-paper border border-line flex items-center justify-center text-fog">
        <Icon className="size-6 text-gold-dark" strokeWidth={1.2} />
      </div>
      <div className="space-y-1.5">
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        {copy && <p className="max-w-md text-xs leading-relaxed text-ash mx-auto">{copy}</p>}
      </div>
      {actionLabel && actionHref && (
        <Button href={actionHref} className="mt-3" variant="outline" size="sm">
          {actionLabel}
        </Button>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-3" variant="outline" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
// END OF FILE src/components/ui/primitives.tsx
