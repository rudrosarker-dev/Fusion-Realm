"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, LogOut, ArrowLeft, Users } from "lucide-react";
import { BRAND_CONFIG } from "@/lib/brand.config";
import { MfaPanel } from "@/components/security/mfa-panel";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [staffUser, setStaffUser] = useState<any>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [needOtp, setNeedOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/staff/auth");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setAuthenticated(true);
            setStaffUser(data.user);
          }
        }
      } catch (err) {
        console.error("Staff auth check failed", err);
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
      const res = await fetch("/api/staff/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.needOtp) setNeedOtp(true);
        setError(data.error || "Access denied. Invalid credentials.");
      } else {
        setAuthenticated(true);
        setStaffUser(data.user);
        setPassword("");
        setOtp("");
        setNeedOtp(false);
      }
    } catch {
      setError("Failed to connect to atelier staff services.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await fetch("/api/staff/auth", { method: "DELETE" });
    setAuthenticated(false);
    setStaffUser(null);
    setPassword("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-paper/60">
          <div className="size-6 border border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-[10px] uppercase tracking-[0.28em]">Authenticating Staff Operations...</p>
        </div>
      </div>
    );
  }

  // স্টাফ লগইন গেট
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-ink text-paper flex items-center justify-center p-6 selection:bg-white selection:text-black">
        <div className="w-full max-w-md border border-white/10 bg-black/85 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl">
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center justify-center size-10 rounded-full bg-white/5 border border-white/10 mb-3 text-white">
              <Users className="size-4" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-serif tracking-wider text-white font-normal">
              Staff Operations Portal
            </h1>
            <p className="text-[11px] text-white/40 tracking-wide mt-1">
              Authorized team credentials required to access assigned modules.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="border border-red-500/20 bg-red-950/30 p-3 text-center text-xs text-red-400 tracking-wide">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 block">
                Staff Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@gmail.com"
                className="w-full bg-white/5 border border-white/15 px-4 py-3 text-xs tracking-wider text-white placeholder:text-white/20 focus:outline-none focus:border-white/60 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 block">
                Assigned Passcode
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white/5 border border-white/15 px-4 py-3 text-xs tracking-wider text-white placeholder:text-white/20 focus:outline-none focus:border-white/60 transition-colors"
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
              className="w-full bg-white text-black py-3.5 text-xs uppercase tracking-[0.25em] font-semibold hover:bg-white/90 transition-all mt-6 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Verifying..." : "Enter Operations"}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-white/10 pt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-3" />
              <span>Return to Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // লগইন সম্পন্ন স্টাফ ড্যাশবোর্ডের টপ বার
  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-[100] border-b border-white/10 bg-black/95 text-paper px-6 py-3 flex items-center justify-between text-xs backdrop-blur-md shadow-md">
        <div className="flex items-center gap-3">
          <Shield className="size-4 text-emerald-400" />
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/80">
            {BRAND_CONFIG.brandName.toUpperCase()} OPERATIONS • {staffUser?.name} ({staffUser?.roleTitle || "Staff"})
          </span>
        </div>

        <div className="flex items-center gap-4">
          <MfaPanel />
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors border border-white/15 px-3 py-1.5 hover:border-white/40 cursor-pointer"
        >
          <LogOut className="size-3" />
          <span>Exit Portal</span>
        </button>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
