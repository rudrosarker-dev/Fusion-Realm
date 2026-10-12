// START OF FILE src/components/layout/footer.tsx
"use client";

import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { BRAND_CONFIG } from "@/lib/brand.config";

// --- Custom SVGs to prevent lucide-react build errors ---
const InstagramIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth || 1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth || 1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
// --------------------------------------------------------

export function NewsletterForm({ inverse }: { inverse?: boolean }) {
  const [state, setState] = useState<"idle" | "error" | "done">("idle");
  const [email, setEmail] = useState("");

  if (state === "done") {
    return (
      <p
        className={cn(
          "flex items-center gap-2.5 text-sm font-medium",
          inverse ? "text-gold-light" : "text-success"
        )}
        role="status"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-gold/20">
          <Check className="size-3.5 text-gold" strokeWidth={2} />
        </span>
        Thank you — you are on the list.
      </p>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setState(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? "done" : "error");
      }}
      className="w-full"
    >
      <div
        className={cn(
          "flex items-center border-b transition-all duration-300",
          inverse
            ? "border-paper/25 focus-within:border-gold"
            : "border-ink/25 focus-within:border-gold-dark"
        )}
      >
        <label htmlFor={inverse ? "nl-footer" : "nl-home"} className="sr-only">
          Email address
        </label>
        <input
          id={inverse ? "nl-footer" : "nl-home"}
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setState("idle");
          }}
          placeholder="Enter your email address..."
          className={cn(
            "h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-current placeholder:opacity-40 transition-colors",
            inverse && "text-paper"
          )}
        />
        <button
          type="submit"
          aria-label="Subscribe"
          className={cn(
            "group flex items-center gap-2 pl-4 pr-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer",
            inverse
              ? "text-gold-light hover:text-paper"
              : "text-ink hover:text-gold-dark"
          )}
        >
          Subscribe
          <ArrowRight
            className="size-4 transition-transform duration-300 group-hover:translate-x-1.5"
            strokeWidth={1.5}
          />
        </button>
      </div>
      {state === "error" && (
        <p
          role="alert"
          className={cn("mt-2.5 text-xs animate-in fade-in slide-in-from-top-1", inverse ? "text-[#e08a78]" : "text-error")}
        >
          Please enter a valid email address.
        </p>
      )}
    </form>
  );
}

export function Footer() {
  const pathname = usePathname();

  const [socials, setSocials] = useState({
    instagram: BRAND_CONFIG.socials.instagram,
    facebook: BRAND_CONFIG.socials.facebook,
    tiktok: BRAND_CONFIG.socials.tiktok,
    pinterest: BRAND_CONFIG.socials.pinterest,
  });

  useEffect(() => {
    fetch("/api/content")
      .then((res) => res.json())
      .then((data) => {
        if (data.content?.socials) {
          setSocials({
            instagram: data.content.socials.instagram || "https://instagram.com",
            facebook: data.content.socials.facebook || "https://facebook.com",
            tiktok: data.content.socials.tiktok || "https://tiktok.com",
            pinterest: data.content.socials.pinterest || "https://pinterest.com",
          });
        }
      })
      .catch(() => {});
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  const COLUMNS = [
    {
      heading: "About & Social",
      links: [
        { label: "Contact Us", href: "/contact", isExternal: false },
        { label: "Instagram", href: socials.instagram, isExternal: true },
        { label: "Facebook", href: socials.facebook, isExternal: true },
        { label: "TikTok", href: socials.tiktok, isExternal: true },
        { label: "Pinterest", href: socials.pinterest, isExternal: true },
      ],
    },
    {
      heading: "Client Help",
      links: [
        { label: "Shipping Policy", href: "/shipping-policy", isExternal: false },
        { label: "14-Day Returns", href: "/return-policy", isExternal: false },
        { label: "Size Guide", href: "/size-guide", isExternal: false },
        { label: "Client FAQ", href: "/faq", isExternal: false },
      ],
    },
    {
      heading: "The House",
      links: [
        { label: "About The House", href: "/about", isExternal: false },
        { label: "Atelier Journal", href: "/journal", isExternal: false },
      ],
    },
    {
      heading: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy", isExternal: false },
        { label: "Terms of Service", href: "/terms", isExternal: false },
        { label: "Cookie Policy", href: "/cookies", isExternal: false },
      ],
    },
  ];

  return (
    <footer className="relative bg-ink text-paper border-t border-white/10 overflow-hidden">
      {/* Subtle top gold hairline */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" aria-hidden />

      <div className="container-x py-20 lg:py-28">
        {/* Brand mark + short line */}
        <div className="mb-16 text-center max-w-lg mx-auto">
          <p className="font-display text-2xl sm:text-3xl tracking-[0.2em] text-paper mb-4">
            {BRAND_CONFIG.brandName}
          </p>
          <p className="text-[13px] leading-relaxed text-paper/50 font-light">
            Quiet garments. Precise construction. Hand-finished in Dhaka.
          </p>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 max-w-4xl mx-auto">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="mb-5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-gold-light font-mono">
                <span className="size-1 rounded-full bg-gold/70" aria-hidden />
                {col.heading}
              </p>
              <ul className="flex flex-col gap-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.isExternal ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center text-[11px] uppercase tracking-[0.14em] text-paper/60 transition-all duration-300 ease-out hover:translate-x-1.5 hover:text-gold-light"
                      >
                        <span className="relative">
                          {l.label}
                          <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gold/50 transition-all duration-300 group-hover:w-full" />
                        </span>
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="group inline-flex items-center text-[11px] uppercase tracking-[0.14em] text-paper/60 transition-all duration-300 ease-out hover:translate-x-1.5 hover:text-gold-light"
                      >
                        <span className="relative">
                          {l.label}
                          <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gold/50 transition-all duration-300 group-hover:w-full" />
                        </span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter strip */}
        <div className="mt-20 max-w-md mx-auto text-center">
          <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.3em] text-gold/80">
            Atelier Dispatch
          </p>
          <p className="mb-6 text-sm text-paper/50 font-light">
            Occasional notes. Never noise.
          </p>
          <NewsletterForm inverse />
        </div>

        {/* Bottom bar */}
        <div className="mt-20 pt-8 border-t border-paper/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-paper/40 font-mono">
            © {new Date().getFullYear()} {BRAND_CONFIG.brandName}. Handcrafted in Dhaka Atelier.
          </p>
          <div className="flex items-center gap-5">
            <a
              href={socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-paper/40 hover:text-gold-light transition-all duration-300 hover:scale-110"
            >
              <InstagramIcon className="size-4" strokeWidth={1.5} />
            </a>
            <a
              href={socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-paper/40 hover:text-gold-light transition-all duration-300 hover:scale-110"
            >
              <FacebookIcon className="size-4" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
// END OF FILE src/components/layout/footer.tsx
