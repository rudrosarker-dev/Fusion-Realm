"use client";

import { CheckCircle2, Eye, EyeOff, LogOut, Package, Trash2, Truck, FileText, Plus, MapPin, User, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Input, Price, Select } from "@/components/ui/primitives";
import { useToast } from "@/lib/store";
import { cn, LS_KEYS, readLS, writeLS } from "@/lib/utils";
import { BRAND_CONFIG } from "@/lib/brand.config";
import type { Order } from "@/lib/types";

// বাংলাদেশের ৮টি বিভাগ ও ৬৪টি জেলার লিস্ট
const BD_DIVISIONS_DATA: Record<string, string[]> = {
  Dhaka: ["Dhaka", "Gazipur", "Narayanganj", "Tangail", "Narsingdi", "Faridpur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Rajbari", "Shariatpur"],
  Chattogram: ["Chattogram", "Cox's Bazar", "Cumilla", "Feni", "Brahmanbaria", "Noakhali", "Chandpur", "Lakshmipur", "Rangamati", "Khagrachhari", "Bandarban"],
  Rajshahi: ["Rajshahi", "Bogura", "Pabna", "Sirajganj", "Naogaon", "Natore", "Chapainawabganj", "Joypurhat"],
  Khulna: ["Khulna", "Jashore", "Kushtia", "Satkhira", "Bagerhat", "Jhenaidah", "Chuadanga", "Meherpur", "Magura", "Narail"],
  Sylhet: ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"],
  Barishal: ["Barishal", "Patuakhali", "Bhola", "Pirojpur", "Barguna", "Jhalokathi"],
  Rangpur: ["Rangpur", "Dinajpur", "Kurigram", "Gaibandha", "Nilphamari", "Panchagarh", "Thakurgaon", "Lalmonirhat"],
  Mymensingh: ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"]
};

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
  division: string;
  city: string;
  postalCode: string;
  country: string;
}


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

  // অ্যাড্রেস স্টেট
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({ fullName: "", phone: "", address: "", division: "Dhaka", city: "Dhaka", postalCode: "" });

  // প্রোফাইল এডিট স্টেট
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // ট্র্যাক স্টেট
  const [trackQuery, setTrackQuery] = useState("");
  const [trackPhone, setTrackPhone] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get("error");
      const googleOk = params.get("google_login") === "success";
      if (errorParam) {
        push("error", "গুগল সাইন-ইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
      }
      if (errorParam || googleOk || params.get("session")) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      if (googleOk) push("success", "গুগল দিয়ে সফলভাবে লগইন হয়েছে!");
    }

    // লগইন অবস্থা সার্ভারের httpOnly কুকি থেকে আসে — URL বা localStorage থেকে নয়
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          setCurrentUser(data.user);
          setEditName(data.user.name || "");
          setEditEmail(data.user.email || "");
        }
      })
      .catch(() => {});

    const local = readLS<Order[]>(LS_KEYS.orders, []);
    setOrders(local);

    fetch("/api/orders/mine", { cache: "no-store" })
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
        body: JSON.stringify({ email: input, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        push("error", data.error || "লগইন ব্যর্থ হয়েছে।");
      } else {
        setCurrentUser(data.user);
        setEditName(data.user.name || "");
        setEditEmail(data.user.email || "");
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

    if (!name.trim() || !isValidEmail(emailClean) || !regPassword.trim() || regPassword.length < 8) {
      push("error", "সব তথ্য পূরণ করুন (পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে)।");
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
          password: regPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        push("error", data.error || "অ্যাকাউন্ট তৈরি করা যায়নি।");
      } else {
        setCurrentUser(data.user);
        setEditName(data.user.name || "");
        setEditEmail(data.user.email || "");
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
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setCurrentUser(null);
    setLoginInput("");
    setPassword("");
    setName("");
    push("info", "সাইন আউট করা হয়েছে।");
  };

  // অ্যাড্রেস সেভ করার হ্যান্ডলার
  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.fullName || !newAddr.phone || !newAddr.address || !currentUser) {
      push("error", "সব তথ্য সঠিকভাবে পূরণ করুন।");
      return;
    }

    const created: SavedAddress = {
      id: `addr-${Date.now()}`,
      email: currentUser.email.toLowerCase(),
      fullName: newAddr.fullName,
      phone: newAddr.phone,
      address: newAddr.address,
      division: newAddr.division,
      city: newAddr.city,
      postalCode: newAddr.postalCode,
      country: "Bangladesh",
    };

    const updated = [...addresses, created];
    setAddresses(updated);
    writeLS("nf-saved-addresses", updated);
    setIsAddingAddress(false);
    setNewAddr({ fullName: "", phone: "", address: "", division: "Dhaka", city: "Dhaka", postalCode: "" });
    push("success", "নতুন ডেলিভারি ঠিকানা সেভ হয়েছে!");
  };

  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    writeLS("nf-saved-addresses", updated);
    push("info", "ঠিকানা মুছে ফেলা হয়েছে।");
  };

  // প্রোফাইল (নাম ও ইমেইল) আপডেট হ্যান্ডলার
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !currentUser) {
      push("error", "নাম খালি রাখা যাবে না।");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        push("error", data.error || "প্রোফাইল সেভ করা যায়নি।");
      } else {
        setCurrentUser({ ...currentUser, name: data.user.name });
        push("success", "আপনার প্রোফাইল তথ্য সফলভাবে সেভ হয়েছে!");
      }
    } catch {
      push("error", "সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।");
    } finally {
      setSavingProfile(false);
    }
  };

  // পার্সেল ট্র্যাকিং হ্যান্ডলার
  const handleTrackSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim() || !trackPhone.trim()) return;
    setTrackLoading(true);
    setTrackError("");
    setTrackedOrder(null);

    try {
      // অর্ডার আইডি এবং ফোন নম্বর — দুটোই মিলতে হবে
      const res = await fetch(
        `/api/orders/track?id=${encodeURIComponent(trackQuery.trim())}&phone=${encodeURIComponent(trackPhone.trim())}`
      );
      const data = await res.json();
      if (res.ok && data.orders && data.orders.length > 0) {
        setTrackedOrder(data.orders[0]);
      } else if (res.status === 429) {
        setTrackError("অনেকবার চেষ্টা হয়েছে। এক মিনিট পর আবার চেষ্টা করুন।");
      } else {
        setTrackError("কোনো অর্ডার পাওয়া যায়নি। সঠিক Order ID ও অর্ডারের সময় দেওয়া ফোন নম্বর দিন।");
      }
    } catch {
      setTrackError("সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।");
    } finally {
      setTrackLoading(false);
    }
  };

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

  // ১. লগইন না থাকলে কার্ড (Sign In / Register / Forgot)
  if (!currentUser) {
    return (
      <div className="container-x pb-24 pt-32 lg:pt-40">
        <div className="mx-auto w-full max-w-[400px] border border-line bg-paper p-8 shadow-sm">
          {authView === "signin" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <p className="eyebrow !text-gold-dark font-mono">Member Access</p>
                <h1 className="font-display text-2xl sm:text-3xl tracking-tight text-ink">
                  {BRAND_CONFIG.brandName}
                </h1>
                <p className="text-xs text-ash leading-relaxed">
                  Log in to track orders, save fittings and speed up checkout.
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-ink block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full h-11 border border-line bg-transparent px-3.5 text-xs text-ink outline-none transition-colors focus:border-ink placeholder:text-fog font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-ink block">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthView("forgot");
                        setForgotEmail("");
                      }}
                      className="text-[11px] text-fog hover:text-ink transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-11 border border-line bg-transparent px-3.5 pr-10 text-xs text-ink outline-none transition-colors focus:border-ink placeholder:text-fog font-mono"
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
                  className="w-full h-11 bg-ink text-paper text-xs font-semibold uppercase tracking-[0.2em] hover:bg-ash transition-all cursor-pointer mt-2 shadow-sm disabled:opacity-50"
                >
                  {loading ? "Authenticating..." : "Log In"}
                </button>
              </form>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-line/70" />
                </div>
                <span className="relative bg-paper px-3 text-[10px] uppercase font-mono tracking-widest text-fog">or continue with</span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full h-11 border border-line bg-cream/30 flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-wider text-ink hover:bg-cream/70 hover:border-ink transition-colors cursor-pointer"
              >
                <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google</span>
              </button>

              <div className="pt-2 text-center text-xs text-ash border-t border-line/60">
                New to the atelier?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthView("create");
                    setName("");
                    setRegEmail("");
                    setRegPhone("");
                    setRegPassword("");
                  }}
                  className="font-semibold text-ink underline underline-offset-4 hover:text-ash transition-colors cursor-pointer"
                >
                  Create an account
                </button>
              </div>
            </div>
          )}

          {authView === "create" && (
            <div className="space-y-6">
              <div className="text-center space-y-1.5">
                <p className="eyebrow !text-gold-dark font-mono">Join The House</p>
                <h1 className="font-display text-2xl tracking-tight text-ink">Create Account</h1>
                <p className="text-xs text-ash leading-relaxed">Join {BRAND_CONFIG.brandName} for seamless orders & custom fittings.</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-ink block">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. S. M. Rahman"
                    className="w-full h-10 border border-line bg-transparent px-3.5 text-xs text-ink outline-none transition-colors focus:border-ink placeholder:text-fog"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-ink block">Email *</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full h-10 border border-line bg-transparent px-3.5 text-xs text-ink outline-none transition-colors focus:border-ink placeholder:text-fog font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-ink block">Password (Min 6 chars) *</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-10 border border-line bg-transparent px-3.5 text-xs text-ink outline-none transition-colors focus:border-ink placeholder:text-fog font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-ink text-paper text-xs font-semibold uppercase tracking-[0.2em] hover:bg-ash transition-all cursor-pointer mt-2 shadow-sm disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </form>

              <div className="text-center text-xs text-ash pt-3 border-t border-line/60">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setAuthView("signin")}
                  className="font-semibold text-ink underline underline-offset-4 hover:text-ash transition-colors cursor-pointer"
                >
                  Log In
                </button>
              </div>
            </div>
          )}

          {authView === "forgot" && (
            <div className="space-y-6">
              <div className="text-center space-y-1.5">
                <p className="eyebrow !text-gold-dark font-mono">Password Recovery</p>
                <h1 className="font-display text-2xl tracking-tight text-ink">Reset Password</h1>
                <p className="text-xs text-ash leading-relaxed">Enter your email to receive recovery instructions.</p>
              </div>

              <form onSubmit={handleForgot} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-ink block">Registered Email *</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full h-11 border border-line bg-transparent px-3.5 text-xs text-ink outline-none transition-colors focus:border-ink placeholder:text-fog font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-ink text-paper text-xs font-semibold uppercase tracking-[0.2em] hover:bg-ash transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <div className="text-center pt-2 border-t border-line/60">
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

  // ২. লগইন করা কাস্টমার পোর্টাল (এডমিন স্টাইল প্রিমিয়াম কার্ড)
  const availableDistrictsForNewAddr = BD_DIVISIONS_DATA[newAddr.division] || [];

  return (
    <div className="container-x pb-24 pt-32 lg:pt-36 max-w-5xl mx-auto">
      {/* টপ হেডার */}
      <div className="border border-line bg-paper p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-700 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20">
            Active Atelier Member
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl text-ink">{currentUser.name}</h1>
          <p className="mt-1 text-xs text-fog font-mono">{currentUser.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 border border-line bg-cream/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper cursor-pointer"
        >
          <LogOut className="size-3.5" />
          <span>SIGN OUT</span>
        </button>
      </div>

      {/* মেনু ট্যাব */}
      <div className="mt-8 flex gap-8 border-b border-line text-xs font-semibold uppercase tracking-[0.2em]">
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
              "pb-3.5 transition-colors relative cursor-pointer",
              tab === key
                ? "text-ink after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-ink"
                : "text-fog hover:text-ink"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8 min-h-[350px]">
        
        {/* ১. ORDERS TAB */}
        {tab === "orders" && (
          <div className="space-y-4">
            {userOrders.length === 0 ? (
              <div className="border border-line bg-paper p-12 text-center space-y-3">
                <Package className="size-10 text-fog mx-auto" strokeWidth={1.25} />
                <h2 className="font-display text-2xl text-ink">No orders yet.</h2>
                <p className="text-xs text-ash">Orders placed with {currentUser.email} will show here.</p>
                <div className="pt-3">
                  <Button href="/shop">Start Shopping</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {userOrders.map((o) => (
                  <div key={o.id} className="border border-line bg-paper p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sm text-ink">{o.id}</span>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border font-mono",
                          o.status === "delivered" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" :
                          o.status === "shipped" ? "bg-blue-500/10 text-blue-700 border-blue-500/20" :
                          "bg-amber-500/10 text-amber-800 border-amber-500/30"
                        )}>
                          {o.status}
                        </span>
                      </div>
                      <p className="text-xs text-fog font-mono">
                        {new Date(o.placedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} • {o.items?.length || 1} items
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-mono font-bold text-sm text-ink"><Price amountBDT={o.totalBDT} /></span>
                      <Link
                        href={`/invoice/${o.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink border border-line bg-cream/40 px-3 py-1.5 hover:bg-ink hover:text-paper transition-colors"
                      >
                        <FileText className="size-3.5" />
                        <span>Invoice</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ২. TRACK TAB */}
        {tab === "track" && (
          <div className="max-w-2xl space-y-6">
            <form onSubmit={handleTrackSearch} className="border border-line bg-paper p-6 sm:p-7 shadow-xs space-y-4">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink">Track Parcel (Order ID + Phone)</h2>
                <p className="text-xs text-fog mt-0.5">Real-time delivery progress updated by Steadfast courier.</p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  required
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="Order ID (e.g. NF-1A2B3C4D5E)"
                  className="flex-1 border border-line bg-transparent px-3.5 py-2.5 text-xs text-ink outline-none focus:border-ink font-mono placeholder:text-fog"
                />
                <input
                  type="tel"
                  required
                  value={trackPhone}
                  onChange={(e) => setTrackPhone(e.target.value)}
                  placeholder="Phone used for the order"
                  className="flex-1 border border-line bg-transparent px-3.5 py-2.5 text-xs text-ink outline-none focus:border-ink font-mono placeholder:text-fog"
                />
                <Button type="submit" disabled={trackLoading} className="text-xs uppercase">
                  {trackLoading ? "Searching..." : "Track"}
                </Button>
              </div>
              {trackError && <p className="text-xs text-error font-mono">{trackError}</p>}
            </form>

            {trackedOrder && (
              <div className="border border-line bg-paper p-6 space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-fog">Order Reference</span>
                    <p className="font-mono font-bold text-base text-ink">{trackedOrder.id}</p>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider bg-cream border border-line px-2.5 py-1 text-ink font-mono">
                    {trackedOrder.orderStatus || trackedOrder.status}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 text-ash">
                  <p>Customer: <strong className="text-ink">{trackedOrder.customerName || trackedOrder.address?.fullName}</strong></p>
                  <p>Contact: <strong className="text-ink font-mono">{trackedOrder.customerPhone || trackedOrder.address?.phone}</strong></p>
                  <p>Total Amount: <strong className="text-ink font-mono">৳{(trackedOrder.totalBDT || 0).toLocaleString()}</strong></p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ৩. ADDRESSES TAB (এডমিন স্টাইল কার্ড ও নতুন অ্যাড্রেস যোগ করার ফর্ম) */}
        {tab === "addresses" && (
          <div className="space-y-6 max-w-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink">Saved Shipping Addresses</h2>
                <p className="text-xs text-fog mt-0.5">Manage your delivery destinations for faster 1-click checkout.</p>
              </div>

              {!isAddingAddress && (
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(true)}
                  className="inline-flex items-center gap-1.5 bg-ink text-paper px-3.5 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-ash transition-colors cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Add Address</span>
                </button>
              )}
            </div>

            {/* অ্যাড্রেস ক্রিয়েশন ফর্ম */}
            {isAddingAddress && (
              <form onSubmit={handleSaveAddress} className="border border-line bg-paper p-6 sm:p-7 shadow-xs space-y-4 animate-in fade-in">
                <div className="border-b border-line pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">New Delivery Address</h3>
                  <button type="button" onClick={() => setIsAddingAddress(false)} className="text-xs text-fog hover:text-ink">Cancel</button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Recipient Full Name *" required value={newAddr.fullName} onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })} placeholder="e.g. S. M. Rahman" />
                  <Input label="Contact Phone *" required value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} placeholder="017XXXXXXXX" />
                </div>

                <Input label="Street Address *" required value={newAddr.address} onChange={(e) => setNewAddr({ ...newAddr, address: e.target.value })} placeholder="House, road, flat, area" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Division *"
                    value={newAddr.division}
                    onChange={(e) => {
                      const div = e.target.value;
                      const dists = BD_DIVISIONS_DATA[div] || [];
                      setNewAddr({ ...newAddr, division: div, city: dists[0] || "" });
                    }}
                    options={Object.keys(BD_DIVISIONS_DATA).map((d) => ({ value: d, label: `${d} Division` }))}
                  />

                  <Select
                    label="City / District *"
                    value={newAddr.city}
                    onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                    options={availableDistrictsForNewAddr.map((dst) => ({ value: dst, label: dst }))}
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button type="submit" className="bg-ink text-paper px-5 py-2.5 text-xs uppercase tracking-wider font-semibold hover:bg-ash transition-colors cursor-pointer">
                    Save Address
                  </button>
                  <button type="button" onClick={() => setIsAddingAddress(false)} className="border border-line px-5 py-2.5 text-xs uppercase tracking-wider text-ink hover:border-ink transition-colors cursor-pointer">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* সেভ করা ঠিকানার লিস্ট */}
            {userAddresses.length === 0 && !isAddingAddress ? (
              <div className="border border-line bg-paper p-8 text-center space-y-3">
                <MapPin className="size-8 text-fog mx-auto" strokeWidth={1.5} />
                <p className="text-xs text-ash">No delivery addresses saved yet. Click the button above to add one.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {userAddresses.map((addr) => (
                  <div key={addr.id} className="border border-line bg-paper p-5 space-y-2 relative group hover:border-ink transition-colors">
                    <div className="flex items-start justify-between border-b border-line/60 pb-2">
                      <span className="font-semibold text-xs text-ink">{addr.fullName}</span>
                      <button onClick={() => handleDeleteAddress(addr.id)} className="text-fog hover:text-error transition-colors p-1" title="Delete address">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-ash leading-relaxed">
                      {addr.address}<br />
                      {addr.city}, {addr.division || "Bangladesh"}<br />
                      <span className="font-mono text-ink mt-1 block font-medium">{addr.phone}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ৪. PROFILE TAB (নাম ও ইমেইল এডিট এবং সেভ করার সুবিধা) */}
        {tab === "profile" && (
          <div className="border border-line bg-paper p-6 sm:p-8 max-w-xl shadow-xs space-y-6">
            <div className="border-b border-line pb-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink">Personal Profile Settings</h2>
              <p className="text-xs text-fog mt-0.5">Update your display name and email address across the atelier.</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-fog block">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-10 border border-line bg-transparent px-3 text-xs text-ink outline-none focus:border-ink font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-fog block">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full h-10 border border-line bg-transparent px-3 text-xs text-ink outline-none focus:border-ink font-mono"
                 readOnly title="ইমেইল পরিবর্তন সাপোর্টের মাধ্যমে করতে হয়" />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 bg-ink text-paper px-5 py-2.5 text-xs uppercase tracking-wider font-semibold hover:bg-ash transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="size-3.5" />
                  <span>{savingProfile ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
