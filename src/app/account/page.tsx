// START OF FILE src/app/account/page.tsx
"use client";

import { CheckCircle2, Eye, EyeOff, LogOut, Package, Trash2, Truck, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Price } from "@/components/ui/primitives";
import { useToast } from "@/lib/store";
import { cn, LS_KEYS, readLS, writeLS } from "@/lib/utils";
import { BRAND_CONFIG } from "@/lib/brand.config";
import type { Order } from "@/lib/types";

interface CustomerUser {
  name: string;
  email: string;
  phone?: string;
  password?: string;
}

interface SavedAddress {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

const CUSTOMER_SESSION_KEY = "nf-customer-session";

export default function AccountPage() {
  const { push } = useToast();
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(null);

  const [authView, setAuthView] = useState<"signin" | "create" | "forgot">("signin");
  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [tab, setTab] = useState<"orders" | "track" | "addresses" | "profile">("orders");
  const [orders, setOrders] = useState<Order[]>([]);

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({ fullName: "", phone: "", address: "", city: "", postalCode: "" });

  const [trackQuery, setTrackQuery] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sessionParam = params.get("session");
      const errorParam = params.get("error");

      if (sessionParam) {
        try {
          const userObj = JSON.parse(decodeURIComponent(sessionParam));
          setCurrentUser(userObj);
          writeLS(CUSTOMER_SESSION_KEY, userObj);
          push("success", `স্বাগতম, ${userObj.name}!`);
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
          console.error("Google session parse error", e);
        }
      } else if (errorParam) {
        push("error", "গুগল সাইন-ইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    const session = readLS<CustomerUser | null>(CUSTOMER_SESSION_KEY, null);
    if (session) setCurrentUser(session);

    // ১. লোকাল স্টোরেজ অর্ডার লোড
    const local = readLS<Order[]>(LS_KEYS.orders, []);
    setOrders(local);

    // ২. সার্ভার থেকে অর্ডার লোড
    fetch(`/api/orders?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.orders && Array.isArray(data.orders)) {
          const formatted: Order[] = data.orders.map((o: any) => ({
            id: o.id,
            items: o.items || [],
            subtotalBDT: o.subtotalBDT,
            shippingBDT: o.shippingBDT,
            discountBDT: o.discountBDT,
            totalBDT: o.totalBDT,
            address: {
              fullName: o.customerName,
              phone: o.customerPhone,
              address: o.shippingAddress?.address || "",
              city: o.shippingAddress?.division || "Dhaka",
              area: o.shippingAddress?.district || "",
              postalCode: "",
              country: "Bangladesh",
            },
            paymentMethod: o.paymentMethod,
            paymentStatus: (o.paymentStatus || "pending").toLowerCase(),
            shippingMethod: o.shippingBDT === 100 ? "Inside Dhaka (৳100)" : "Outside Dhaka (৳150)",
            status: (o.orderStatus || "pending").toLowerCase() as any,
            placedAt: o.createdAt || new Date().toISOString(),
            email: (o.customerEmail || o.email || "").toLowerCase().trim(),
          }));

          setOrders(formatted);
        }
      })
      .catch(() => {});

    const saved = readLS<SavedAddress[]>("nf-saved-addresses", []);
    if (saved && saved.length > 0) setAddresses(saved);
  }, [push]);

  const isValidEmail = (emailStr: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailStr.trim());

  const handleGoogleSignIn = () => {
    window.location.href = "/api/auth/google";
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = loginInput.trim().toLowerCase();
    if (!input || !password.trim()) {
      push("error", "দয়া করে ইমেইল এবং পাসওয়ার্ড দিন।");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: input, password: password.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        push("error", data.error || "লগইন ব্যর্থ হয়েছে।");
      } else {
        setCurrentUser(data.user);
        writeLS(CUSTOMER_SESSION_KEY, data.user);
        push("success", `স্বাগতম, ${data.user.name}!`);
      }
    } catch {
      push("error", "সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailClean = regEmail.trim().toLowerCase();

    if (!name.trim() || !isValidEmail(emailClean) || !regPassword.trim() || regPassword.trim().length < 6) {
      push("error", "সব তথ্য সঠিকভাবে পূরণ করুন (পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে)।");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: emailClean,
          password: regPassword.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        push("error", data.error || "অ্যাকাউন্ট তৈরি করা যায়নি।");
      } else {
        setCurrentUser(data.user);
        writeLS(CUSTOMER_SESSION_KEY, data.user);
        push("success", `অ্যাকাউন্ট তৈরি সফল হয়েছে! স্বাগতম, ${data.user.name}।`);
      }
    } catch {
      push("error", "সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailClean = forgotEmail.trim().toLowerCase();
    if (!isValidEmail(emailClean)) {
      push("error", "দয়া করে সঠিক ইমেইল দিন।");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailClean }),
      });

      const data = await res.json();

      if (!res.ok) {
        push("error", data.error || "এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি।");
      } else {
        push("success", data.message || "পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।");
        setAuthView("signin");
        setForgotEmail("");
      }
    } catch {
      push("error", "সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    writeLS(CUSTOMER_SESSION_KEY, null);
    setCurrentUser(null);
    setLoginInput("");
    setPassword("");
    setName("");
    push("info", "সাইন আউট করা হয়েছে।");
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.fullName || !newAddr.phone || !newAddr.address || !newAddr.city || !currentUser) {
      push("error", "সব ঘর পূরণ করুন।");
      return;
    }
    const created: SavedAddress = {
      id: `addr-${Date.now()}`,
      email: currentUser.email.toLowerCase(),
      ...newAddr,
      country: "Bangladesh",
    };
    const updated = [...addresses, created];
    setAddresses(updated);
    writeLS("nf-saved-addresses", updated);
    setIsAddingAddress(false);
    setNewAddr({ fullName: "", phone: "", address: "", city: "", postalCode: "" });
    push("success", "ঠিকানা সেভ হয়েছে।");
  };

  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    writeLS("nf-saved-addresses", updated);
    push("info", "ঠিকানা মুছে ফেলা হয়েছে।");
  };

  const handleTrackSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;
    setTrackLoading(true);
    setTrackError("");
    setTrackedOrder(null);

    try {
      const res = await fetch(`/api/orders/track?id=${encodeURIComponent(trackQuery.trim())}&phone=${encodeURIComponent(trackQuery.trim())}`);
      const data = await res.json();
      if (res.ok && data.orders && data.orders.length > 0) {
        setTrackedOrder(data.orders[0]);
      } else {
        const found = orders.find(
          (o) => o.id.toLowerCase() === trackQuery.trim().toLowerCase() || o.address?.phone === trackQuery.trim()
        );
        if (found) {
          setTrackedOrder(found);
        } else {
          setTrackError("কোনো পার্সেল পাওয়া যায়নি।");
        }
      }
    } catch {
      setTrackError("সার্চ করতে সমস্যা হয়েছে।");
    } finally {
      setTrackLoading(false);
    }
  };

  const handleDirectTrack = (orderItem: any) => {
    setTrackQuery(orderItem.id);
    setTrackedOrder(orderItem);
    setTab("track");
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  // ইমেইল বা ফোন নম্বরের যেকোনো একটি মিললেই কাস্টমারের অর্ডার দেখাবে
  const userOrders = orders.filter((o) => {
    const userEmail = (currentUser?.email || "").toLowerCase().trim();
    const orderEmail = (o.email || "").toLowerCase().trim();
    const userPhone = (currentUser?.phone || "").replace(/[^0-9]/g, "");
    const orderPhone = (o.address?.phone || "").replace(/[^0-9]/g, "");

    return (
      (userEmail && orderEmail && userEmail === orderEmail) ||
      (userPhone && orderPhone && userPhone === orderPhone)
    );
  });

  const userAddresses = addresses.filter(
    (a) => currentUser?.email && a.email?.toLowerCase() === currentUser.email.toLowerCase()
  );

  if (!currentUser) {
    return (
      <div className="container-x pb-24 pt-32 lg:pt-40">
        <div className="mx-auto w-full max-w-[380px] rounded-2xl border border-line bg-paper p-7 sm:p-8 shadow-[0_10px_35px_-4px_rgba(0,0,0,0.06)] animate-in fade-in">
          {authView === "signin" && (
            <div className="space-y-6">
              <div className="text-center space-y-1.5">
                <h1 className="font-display text-2xl sm:text-[26px] tracking-tight text-ink">
                  {BRAND_CONFIG.brandName}
                </h1>
                <p className="text-xs text-ash leading-relaxed">
                  Log in to track your orders and check out faster.
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-ink block">Email</label>
                  <input
                    type="email"
                    required
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full h-11 rounded-xl border border-line bg-transparent px-3.5 text-xs text-ink outline-none transition-colors focus:border-ink placeholder:text-fog"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-ink block">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full h-11 rounded-xl border border-line bg-transparent px-3.5 pr-10 text-xs text-ink outline-none transition-colors focus:border-ink placeholder:text-fog font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-fog hover:text-ink cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-ink text-paper text-xs font-semibold uppercase tracking-wider hover:bg-ash transition-colors cursor-pointer mt-2 disabled:opacity-50"
                >
                  {loading ? "Logging in..." : "Log in"}
                </button>
              </form>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-line" />
                </div>
                <span className="relative bg-paper px-3 text-[11px] text-fog lowercase">or</span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full h-11 rounded-xl border border-line bg-transparent flex items-center justify-center gap-2.5 text-xs font-medium text-ink hover:bg-cream/50 transition-colors cursor-pointer"
              >
                <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="space-y-3 pt-2 text-center text-xs">
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView("forgot");
                      setForgotEmail("");
                    }}
                    className="text-ash hover:text-ink transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="text-ash">
                  New here?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView("create");
                      setName("");
                      setRegEmail("");
                      setRegPhone("");
                      setRegPassword("");
                    }}
                    className="font-semibold text-ink underline underline-offset-2 hover:text-ash transition-colors cursor-pointer"
                  >
                    Create an account
                  </button>
                </div>
              </div>
            </div>
          )}

          {authView === "create" && (
            <div className="space-y-6">
              <div className="text-center space-y-1.5">
                <h1 className="font-display text-2xl sm:text-[26px] tracking-tight text-ink">
                  Create an account
                </h1>
                <p className="text-xs text-ash leading-relaxed">
                  Join {BRAND_CONFIG.brandName} for seamless orders & fittings.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-ink block">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full h-10 rounded-xl border border-line bg-transparent px-3.5 text-xs text-ink outline-none transition-colors focus:border-ink placeholder:text-fog"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-ink block">Email *</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full h-10 rounded-xl border border-line bg-transparent px-3.5 text-xs text-ink outline-none transition-colors focus:border-ink placeholder:text-fog"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-ink block">Password (Min 6 chars) *</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-10 rounded-xl border border-line bg-transparent px-3.5 text-xs text-ink outline-none transition-colors focus:border-ink placeholder:text-fog font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-ink text-paper text-xs font-semibold uppercase tracking-wider hover:bg-ash transition-colors cursor-pointer mt-2 disabled:opacity-50"
                >
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>

              <div className="text-center text-xs text-ash pt-2 border-t border-line">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setAuthView("signin")}
                  className="font-semibold text-ink underline underline-offset-2 hover:text-ash transition-colors cursor-pointer"
                >
                  Log in
                </button>
              </div>
            </div>
          )}

          {authView === "forgot" && (
            <div className="space-y-6">
              <div className="text-center space-y-1.5">
                <h1 className="font-display text-2xl sm:text-[26px] tracking-tight text-ink">
                  Reset Password
                </h1>
                <p className="text-xs text-ash leading-relaxed">
                  Enter your registered email and we&apos;ll send you instructions.
                </p>
              </div>

              <form onSubmit={handleForgot} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-ink block">Registered Email *</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full h-11 rounded-xl border border-line bg-transparent px-3.5 text-xs text-ink outline-none transition-colors focus:border-ink placeholder:text-fog"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-ink text-paper text-xs font-semibold uppercase tracking-wider hover:bg-ash transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Reset Instructions"}
                </button>
              </form>

              <div className="text-center pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setAuthView("signin")}
                  className="text-xs font-medium text-ash hover:text-ink transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  ← Back to log in
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container-x pb-24 pt-32 lg:pt-36 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">MY ACCOUNT</p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">{currentUser.name}</h1>
          <p className="mt-1 text-sm text-ash font-mono">{currentUser.email} — Atelier Member</p>
        </div>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 border border-line px-4 py-2 text-xs uppercase tracking-wider text-ink transition-colors hover:border-ink cursor-pointer"
        >
          <LogOut className="size-3.5" />
          <span>SIGN OUT</span>
        </button>
      </div>

      <div className="mt-10 flex gap-8 border-b border-line">
        {[
          ["orders", "ORDERS"],
          ["track", "TRACK"],
          ["addresses", "ADDRESSES"],
          ["profile", "PROFILE"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setTab(key as any);
              setIsAddingAddress(false);
            }}
            className={cn(
              "pb-3 text-xs uppercase tracking-[0.2em] transition-colors relative cursor-pointer",
              tab === key
                ? "font-semibold text-ink after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-ink"
                : "text-fog hover:text-ink"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-10 min-h-[350px]">
        {tab === "orders" && (
          <div>
            {userOrders.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto flex size-12 items-center justify-center text-fog mb-4">
                  <Package className="size-8" strokeWidth={1} />
                </div>
                <h2 className="font-display text-2xl text-ink">No orders yet.</h2>
                <p className="mt-2 text-sm text-ash">Orders placed with {currentUser.email} will show here.</p>
                <div className="mt-6">
                  <Button href="/shop">START SHOPPING</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl">
                {userOrders.map((o) => (
                  <div key={o.id} className="border border-line p-5 flex flex-wrap items-center justify-between gap-4 bg-paper hover:border-ink transition-colors">
                    <div>
                      <p className="font-medium text-sm text-ink font-mono">{o.id}</p>
                      <p className="text-xs text-fog mt-0.5">
                        {new Date(o.placedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} • {o.items?.length || 1} items
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                      <span className="text-xs uppercase tracking-wider px-2.5 py-1 bg-cream border border-line font-medium text-ash">
                        {o.status}
                      </span>
                      <Price amountBDT={o.totalBDT} className="font-medium text-sm text-ink" />
                      
                      {/* ১-ক্লিক অফিসিয়াল ইনভয়েস দেখার লিংক */}
                      <Link
                        href={`/invoice/${o.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-ink font-semibold border border-line px-3 py-1.5 hover:bg-cream transition-colors cursor-pointer"
                      >
                        <FileText className="size-3.5" /> Invoice
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDirectTrack(o)}
                        className="text-xs uppercase tracking-wider text-paper bg-ink font-semibold px-3 py-1.5 hover:bg-ash transition-colors cursor-pointer"
                      >
                        Track
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "track" && (
          <div className="max-w-2xl space-y-8">
            <form onSubmit={handleTrackSearch} className="border border-line bg-cream/40 p-6 sm:p-8 space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink">Track Parcel by Order ID or Phone</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="Enter Order ID (e.g. NF-831930) or Phone number"
                  className="flex-1 border border-line bg-paper px-4 py-2.5 text-xs text-ink outline-none focus:border-ink font-mono placeholder:text-fog"
                />
                <Button type="submit" disabled={trackLoading} size="sm">
                  {trackLoading ? "Searching..." : "Track"}
                </Button>
              </div>
              {trackError && <p className="text-xs text-error">{trackError}</p>}
            </form>

            {trackedOrder && (
              <div className="border border-line bg-paper p-6 space-y-6 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-fog">Order Reference</p>
                    <p className="text-lg font-bold text-ink font-mono">{trackedOrder.id}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <Link
                      href={`/invoice/${trackedOrder.id}`}
                      target="_blank"
                      className="text-xs uppercase tracking-wider text-ink border border-line px-2.5 py-1 hover:bg-cream inline-flex items-center gap-1 font-semibold"
                    >
                      <FileText className="size-3" /> View Memo
                    </Link>
                    <span className="text-xs font-bold uppercase tracking-wider bg-cream px-3 py-1 border border-line text-ink">
                      {trackedOrder.orderStatus || trackedOrder.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  {[
                    { label: "Received", icon: Package, active: true },
                    {
                      label: "Verified",
                      icon: CheckCircle2,
                      active: ["confirmed", "processing", "shipped", "delivered"].includes(
                        (trackedOrder.orderStatus || trackedOrder.status || "").toLowerCase()
                      ),
                    },
                    {
                      label: "Dispatched",
                      icon: Truck,
                      active: ["shipped", "delivered"].includes(
                        (trackedOrder.orderStatus || trackedOrder.status || "").toLowerCase()
                      ),
                    },
                  ].map((step) => (
                    <div key={step.label} className="flex flex-col items-center gap-2">
                      <div
                        className={cn(
                          "size-9 rounded-full border flex items-center justify-center transition-colors",
                          step.active ? "bg-ink text-paper border-ink" : "border-line text-fog bg-cream/30"
                        )}
                      >
                        <step.icon className="size-4" />
                      </div>
                      <span className={cn("text-[10px] uppercase tracking-wider", step.active ? "font-semibold text-ink" : "text-fog")}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-line pt-4 text-xs space-y-1.5 text-ash">
                  <p>Customer: <strong className="text-ink">{trackedOrder.customerName || trackedOrder.address?.fullName}</strong></p>
                  <p>Contact: <strong className="text-ink font-mono">{trackedOrder.customerPhone || trackedOrder.address?.phone}</strong></p>
                  <p>Total: <strong className="text-ink">৳{(trackedOrder.totalBDT || 0).toLocaleString()}</strong></p>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "addresses" && (
          <div className="space-y-6 max-w-xl">
            {userAddresses.length === 0 && !isAddingAddress && (
              <p className="text-xs text-fog">No saved addresses yet.</p>
            )}

            {userAddresses.map((addr) => (
              <div key={addr.id} className="border border-line p-6 bg-paper relative group">
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-sm text-ink">{addr.fullName}</p>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-fog hover:text-error transition-colors p-1 cursor-pointer"
                    aria-label="Delete address"
                  >
                    <Trash2 className="size-4" strokeWidth={1.5} />
                  </button>
                </div>
                <p className="mt-2 text-xs text-ash leading-relaxed">
                  {addr.address}<br />
                  {addr.city}, {addr.country}<br />
                  <span className="font-mono mt-1 block">{addr.phone}</span>
                </p>
              </div>
            ))}

            {!isAddingAddress ? (
              <button
                type="button"
                onClick={() => setIsAddingAddress(true)}
                className="border border-line px-5 py-2.5 text-xs uppercase tracking-wider text-ink font-medium hover:border-ink transition-colors block cursor-pointer"
              >
                + ADD ADDRESS
              </button>
            ) : (
              <form onSubmit={handleSaveAddress} className="border border-line p-6 bg-paper space-y-4 animate-in fade-in">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink border-b border-line pb-2">
                  New Shipping Address
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-fog block">FULL NAME *</label>
                    <input
                      type="text"
                      required
                      value={newAddr.fullName}
                      onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                      className="w-full border border-line bg-transparent p-2 text-xs outline-none focus:border-ink"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-fog block">PHONE *</label>
                    <input
                      type="tel"
                      required
                      value={newAddr.phone}
                      onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                      className="w-full border border-line bg-transparent p-2 text-xs outline-none focus:border-ink"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-fog block">STREET ADDRESS *</label>
                  <input
                    type="text"
                    required
                    value={newAddr.address}
                    onChange={(e) => setNewAddr({ ...newAddr, address: e.target.value })}
                    className="w-full border border-line bg-transparent p-2 text-xs outline-none focus:border-ink"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-fog block">CITY *</label>
                    <input
                      type="text"
                      required
                      value={newAddr.city}
                      onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                      className="w-full border border-line bg-transparent p-2 text-xs outline-none focus:border-ink"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-fog block">POSTAL CODE</label>
                    <input
                      type="text"
                      value={newAddr.postalCode}
                      onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                      className="w-full border border-line bg-transparent p-2 text-xs outline-none focus:border-ink"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="bg-ink text-paper px-5 py-2.5 text-xs uppercase tracking-wider font-medium hover:bg-ink/90 transition-colors cursor-pointer"
                  >
                    SAVE ADDRESS
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(false)}
                    className="border border-line px-5 py-2.5 text-xs uppercase tracking-wider text-ink font-medium hover:border-ink transition-colors cursor-pointer"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {tab === "profile" && (
          <div className="max-w-md space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] text-fog font-medium block">NAME</label>
              <input
                type="text"
                readOnly
                value={currentUser.name}
                className="w-full border border-line bg-paper px-3.5 py-2.5 text-xs text-ink outline-none font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] text-fog font-medium block">EMAIL</label>
              <input
                type="email"
                readOnly
                value={currentUser.email}
                className="w-full border border-line bg-paper px-3.5 py-2.5 text-xs text-ink outline-none font-mono"
              />
            </div>

            <div className="border border-line p-5 bg-paper space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">WISHLIST</p>
              <p className="text-xs text-ash">
                Your wishlist lives on the{" "}
                <Link href="/wishlist" className="underline underline-offset-2 text-ink hover:text-ash">
                  wishlist page
                </Link>{" "}
                and is saved on this device.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// END OF FILE src/app/account/page.tsx
