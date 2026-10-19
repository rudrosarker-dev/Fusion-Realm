"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, LogOut, ShieldCheck, ArrowLeft } from "lucide-react";
import { BRAND_CONFIG } from "@/lib/brand.config";
import { MfaPanel } from "@/components/security/mfa-panel";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string; role: string } | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [needOtp, setNeedOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ট্যাব সেশন যাচাই
  useEffect(() => {
    async function checkAuth() {
      // ট্যাব ক্লোজ হলে sessionStorage স্বয়ংক্রিয়ভাবে মুছে যায়
      const tabActive = sessionStorage.getItem("nf_admin_tab_active");

      if (!tabActive) {
        // যদি নতুন ট্যাবে খোলা হয় তবে পুরনো কুকি ক্লিয়ার করে রি-লগইন চাইবে
        await fetch("/api/admin/auth", { method: "DELETE" });
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/admin/auth");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setAuthenticated(true);
            setAdminUser(data.user);
          }
        }
      } catch (err) {
        console.error("Auth check failed", err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.needOtp) setNeedOtp(true);
        setError(data.error || "Access denied. Invalid credentials.");
      } else {
        // এই ট্যাবের জন্য সেশন সক্রিয় মার্ক করা হলো
        sessionStorage.setItem("nf_admin_tab_active", "true");
        setAuthenticated(true);
        setAdminUser(data.user);
        setPassword("");
        setOtp("");
        setNeedOtp(false);
      }
    } catch {
      setError("Failed to connect to the atelier security service.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    sessionStorage.removeItem("nf_admin_tab_active");
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthenticated(false);
    setAdminUser(null);
    setPassword("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-paper/60 font-mono">
          <div className="size-6 border border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-[10px] uppercase tracking-[0.28em]">Authenticating Atelier...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-ink text-paper flex items-center justify-center p-6 selection:bg-gold selection:text-black">
        <div className="w-full max-w-md border border-white/10 bg-black/85 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl">
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center justify-center size-10 rounded-full bg-white/5 border border-white/10 mb-3 text-gold">
              <Lock className="size-4" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-display tracking-wider text-white font-normal">
              Restricted Access
            </h1>
            <p className="text-[11px] text-white/50 tracking-wide mt-1 font-mono">
              Authorized Super Admin credentials required.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="border border-red-500/20 bg-red-950/30 p-3 text-center text-xs text-red-400 tracking-wide">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 block font-mono">
                Atelier Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@domain.com"
                className="w-full bg-white/5 border border-white/15 px-4 py-3 text-xs tracking-wider text-white placeholder:text-white/20 focus:outline-none focus:border-gold transition-colors font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 block font-mono">
                Secret Passcode
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white/5 border border-white/15 px-4 py-3 text-xs tracking-wider text-white placeholder:text-white/20 focus:outline-none focus:border-gold transition-colors font-mono"
              />
            </div>

            {needOtp && (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 block font-mono">
                  Authenticator Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-white/5 border border-white/15 px-4 py-3 text-xs tracking-[0.4em] text-white placeholder:text-white/20 focus:outline-none focus:border-white/60 transition-colors font-mono"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-b from-[#dfcaa8] to-[#c5a880] text-black py-3.5 text-xs uppercase tracking-[0.25em] font-semibold hover:brightness-105 transition-all mt-6 disabled:opacity-50 cursor-pointer shadow-md"
            >
              {submitting ? "Verifying..." : "Enter Atelier"}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-white/10 pt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors cursor-pointer font-mono"
            >
              <ArrowLeft className="size-3" />
              <span>Return to Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-[100] border-b border-white/10 bg-black/95 text-paper px-6 py-3 flex items-center justify-between text-xs backdrop-blur-md shadow-md">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-4 text-emerald-400" />
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/80">
            {BRAND_CONFIG.brandName.toUpperCase()} ATELIER • {adminUser?.name || "Super Admin"}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <MfaPanel />
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors border border-white/15 px-3 py-1.5 hover:border-gold cursor-pointer"
        >
          <LogOut className="size-3" />
          <span>Lock Atelier</span>
        </button>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
