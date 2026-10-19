"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { writeLS } from "@/lib/utils";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("টোকেন পাওয়া যায়নি। লিংকটি আবার চেক করুন।");
      return;
    }

    if (password.length < 8) {
      setError("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।");
      return;
    }

    if (password !== confirmPassword) {
      setError("উভয় পাসওয়ার্ড এক নয়!");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/account");
        }, 2000);
      }
    } catch {
      setError("সার্ভারের সাথে সংযোগ করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container-x pb-24 pt-36 max-w-[420px] mx-auto text-center">
        <div className="border border-line bg-paper p-8 space-y-4">
          <CheckCircle2 className="size-12 text-success mx-auto" />
          <h1 className="font-display text-2xl text-ink">পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!</h1>
          <p className="text-xs text-ash">আপনাকে অ্যাকাউন্টে প্রবেশ করানো হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x pb-24 pt-36 max-w-[420px] mx-auto">
      <div className="border border-line bg-paper p-8 space-y-6">
        <div className="text-center space-y-2">
          <p className="eyebrow">SECURITY</p>
          <h1 className="font-display text-3xl">Set New Password</h1>
          <p className="text-xs text-ash">আপনার অ্যাকাউন্টের জন্য নতুন পাসওয়ার্ড দিন।</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-error/30 text-error text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 relative">
            <label className="text-[10px] font-medium uppercase tracking-[0.16em] text-ash block">New Password *</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 border border-line bg-transparent px-3 pr-10 text-xs text-ink outline-none focus:border-ink font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-fog hover:text-ink"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium uppercase tracking-[0.16em] text-ash block">Confirm Password *</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-11 border border-line bg-transparent px-3 text-xs text-ink outline-none focus:border-ink font-mono"
            />
          </div>

          <Button type="submit" loading={loading} className="w-full mt-4 h-11">
            Save & Login
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center pt-40">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
