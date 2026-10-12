// START OF FILE src/components/ui/overlays.tsx
"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ————————————————— STABLE JITTER-FREE SCROLL REVEAL ————————————————— */

export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        // একবার স্ক্রিনে প্রবেশ করলে স্মুথলি দৃশ্যমান হবে এবং unobserve হবে যাতে কোনো কাঁপাকাঁপি না হয়
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add("is-visible");
          io.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -20px 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={cn(direction === "left" ? "reveal-left" : "reveal", className)}
    >
      {children}
    </div>
  );
}

/* ————————————————— Drawer ————————————————— */

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  labelledBy?: string;
}

function useOverlayEffects(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
}

export function Drawer({
  open,
  onClose,
  children,
  title,
  side = "right",
  wide,
}: OverlayProps & { side?: "right" | "left"; wide?: boolean }) {
  useOverlayEffects(open, onClose);
  const titleId = useRef(`drawer-title-${Math.random().toString(36).slice(2)}`).current;
  return (
    <div className={cn("fixed inset-0 z-[110]", !open && "pointer-events-none")} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-hidden={!open}>
      <div
        className={cn(
          "absolute inset-0 bg-ink/40 backdrop-blur-xs transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute top-0 flex h-full w-full flex-col bg-paper transition-transform duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-2xl",
          wide ? "sm:max-w-xl" : "sm:max-w-md",
          side === "right" ? "right-0" : "left-0",
          side === "right"
            ? open
              ? "translate-x-0"
              : "translate-x-full"
            : open
              ? "-translate-x-0"
              : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5 sm:px-7">
          <h2 id={titleId} className="text-xs font-semibold uppercase tracking-[0.24em] text-ink">
            {title}
          </h2>
          <button aria-label="Close panel" onClick={onClose} className="flex size-9 items-center justify-center transition-colors hover:bg-cream cursor-pointer">
            <X className="size-5" strokeWidth={1.25} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ————————————————— Modal ————————————————— */

export function Modal({ open, onClose, children, title, wide }: OverlayProps & { wide?: boolean }) {
  useOverlayEffects(open, onClose);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2)}`).current;
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-xs transition-opacity duration-300" onClick={onClose} />
      <div
        className={cn(
          "relative max-h-[88vh] w-full overflow-auto bg-paper border border-line shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          wide ? "max-w-3xl" : "max-w-lg",
        )}
      >
        <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-paper/95 backdrop-blur-md px-6">
          <h2 id={titleId} className="text-xs font-semibold uppercase tracking-[0.24em] text-ink">
            {title}
          </h2>
          <button aria-label="Close dialog" onClick={onClose} className="flex size-9 items-center justify-center transition-colors hover:bg-cream cursor-pointer">
            <X className="size-5" strokeWidth={1.25} />
          </button>
        </div>
        <div className="p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
// END OF FILE src/components/ui/overlays.tsx
