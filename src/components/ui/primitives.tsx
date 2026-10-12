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
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useUI } from "@/lib/store";
import { cn, formatPrice } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/* ————————————————— 3D TACTILE LUXURY BUTTONS (UPGRADED) ————————————————— */

type BtnVariant = "primary" | "outline" | "ghost" | "inverse" | "gold";
type BtnSize = "sm" | "md" | "lg";

const btnBase =
  "relative inline-flex items-center justify-center gap-2 font-medium uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-40 select-none cursor-pointer rounded-xs overflow-hidden group";

const btnSizes: Record<BtnSize, string> = {
  sm: "px-5 py-2.5 text-[10px]",
  md: "px-8 py-4 text-[11px]",
  lg: "px-10 py-4.5 text-[12px]",
};

const btnVariants: Record<BtnVariant, string> = {
  primary: "btn-tactile-primary text-paper",
  inverse: "btn-tactile-inverse text-ink",
  outline:
    "border border-line/60 bg-paper/30 backdrop-blur-md text-ink hover:border-gold hover:text-ink shadow-sm hover:shadow-gold/20 transition-all duration-500",
  ghost: "text-ink underline-offset-8 hover:underline decoration-gold/50 hover:decoration-gold hover:text-gold-dark transition-all duration-300",
  gold:
    "bg-gradient-to-b from-[#dfcaa8] to-[#c5a880] text-[#1a1814] font-semibold border border-[#b8976c] shadow-[0_4px_14px_-2px_rgba(197,168,128,0.4)] hover:shadow-[0_8px_25px_-4px_rgba(197,168,128,0.6)] transition-all duration-500 hover:brightness-110",
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
  // Framer Motion Springs for smooth magnetic physics
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xSpring = useSpring(x, { stiffness: 150, damping: 15, mass: 0.5 });
  const ySpring = useSpring(y, { stiffness: 150, damping: 15, mass: 0.5 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled || typeof window === "undefined" || window.matchMedia("(pointer: coarse)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate magnetic pull (20% of distance from center)
    const pullX = (e.clientX - centerX) * 0.2;
    const pullY = (e.clientY - centerY) * 0.2;
    
    x.set(pullX);
    y.set(pullY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const cls = cn(btnBase, btnSizes[size], btnVariants[variant], full && "w-full", className);

  // The shiny sweep effect element (except for ghost variant)
  const Shimmer = variant !== "ghost" ? (
    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer pointer-events-none" />
  ) : null;

  const content = (
    <>
      <span className="relative z-10 flex items-center gap-2">
        {loading && <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />}
        {children}
      </span>
      {Shimmer}
    </>
  );

  if (href) {
    return (
      <motion.div
        style={{ x: xSpring, y: ySpring }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileTap={disabled ? {} : { scale: 0.96 }}
        className={full ? "w-full" : "inline-block"}
      >
        <Link
          href={href}
          className={cls}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : undefined}
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
      </motion.div>
    );
  }

  return (
    <motion.button
      style={{ x: xSpring, y: ySpring }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={disabled || loading ? {} : { scale: 0.96 }}
      className={cls}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {content}
    </motion.button>
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
      <label htmlFor={inputId} className="text-[11px] font-medium uppercase tracking-[0.18em] text-ash transition-colors group-focus-within:text-gold-dark">
        {label}
        {rest.required && <span className="text-error"> *</span>}
      </label>
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          "h-12 border bg-paper/40 px-4 text-sm text-ink placeholder:text-fog/60 transition-all duration-300 focus:bg-paper focus:border-gold focus:ring-4 focus:ring-gold/10 outline-none rounded-xs shadow-2xs hover:border-gold/50",
          error ? "border-error focus:border-error focus:ring-error/10" : "border-line",
          className,
        )}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-error animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
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
        <label htmlFor={selectId} className="text-[11px] font-medium uppercase tracking-[0.18em] text-ash transition-colors group-focus-within:text-gold-dark">
          {label}
          {rest.required && <span className="text-error"> *</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={!!error}
          className={cn(
            "h-12 w-full appearance-none border bg-paper/40 px-4 pr-10 text-sm text-ink transition-all duration-300 focus:bg-paper focus:border-gold focus:ring-4 focus:ring-gold/10 outline-none cursor-pointer rounded-xs shadow-2xs hover:border-gold/50",
            error ? "border-error" : "border-line",
            className,
          )}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-fog transition-transform group-focus-within:text-gold-dark group-focus-within:rotate-180 duration-500" strokeWidth={1.5} />
      </div>
      {error && (
        <p role="alert" className="text-xs text-error animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
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
    "flex items-center justify-center text-ash transition-all hover:text-gold-dark hover:bg-gold/5 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer active:scale-90",
    small ? "size-8" : "size-12",
  );
  return (
    <div className={cn("inline-flex items-center border border-line bg-paper shadow-xs rounded-xs overflow-hidden", small ? "h-8" : "h-12")}>
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
              className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-medium uppercase tracking-[0.16em] cursor-pointer hover:text-gold-dark transition-colors"
            >
              {item.title}
              <span className={cn("transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] bg-paper/50 p-1.5 rounded-full group-hover:bg-gold/10", expanded && "rotate-180 bg-gold/10 text-gold-dark")}>
                <ChevronDown className="size-4 text-fog group-hover:text-gold-dark" strokeWidth={1.5} />
              </span>
            </button>
            <div
              className={cn(
                "grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                expanded ? "grid-rows-[1fr] pb-6 opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden text-sm leading-relaxed text-ash/90 pr-4">{item.content}</div>
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
          {i > 0 && <ChevronRight className="size-3 text-line/80" strokeWidth={2} />}
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-gold-dark hover:underline underline-offset-4 decoration-gold/30">
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
        "inline-flex items-center px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] rounded-xs shadow-xs transition-transform hover:scale-105 duration-300",
        tone === "neutral" && "bg-paper/90 text-ink border border-line backdrop-blur-md",
        tone === "dark" && "bg-ink text-paper border border-white/10",
        tone === "sale" && "bg-[#8b2b1c] text-paper border border-[#7a2518]",
        tone === "new" && "bg-gradient-to-r from-[#1c1a17] to-[#12110e] text-gold-light border border-gold/30 shadow-gold/10",
        tone === "low" && "bg-bronze text-paper",
        tone === "gold" && "bg-gold/10 text-gold-dark border border-gold/30 backdrop-blur-sm",
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
    <div className="flex flex-col items-center justify-center gap-5 py-24 text-center border border-line/50 bg-gradient-to-b from-transparent to-cream/20 p-8 rounded-sm">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="size-16 rounded-full bg-paper border border-line flex items-center justify-center text-fog shadow-md relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gold/5 animate-pulse" />
        <Icon className="size-7 text-gold-dark relative z-10" strokeWidth={1.2} />
      </motion.div>
      <div className="space-y-2">
        <h2 className="font-display text-2xl lg:text-3xl text-ink tracking-tight">{title}</h2>
        {copy && <p className="max-w-md text-sm leading-relaxed text-ash/80 mx-auto">{copy}</p>}
      </div>
      {(actionLabel && actionHref) && (
        <Button href={actionHref} className="mt-4" variant="outline">
          {actionLabel}
        </Button>
      )}
      {(actionLabel && onAction) && (
        <Button onClick={onAction} className="mt-4" variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
// END OF FILE src/components/ui/primitives.tsx
