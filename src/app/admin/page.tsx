// START OF FILE src/app/admin/page.tsx
"use client";

import {
  BadgeDollarSign,
  Boxes,
  Database,
  LayoutDashboard,
  Pencil,
  Plus,
  Printer,
  ShoppingCart,
  Trash2,
  Users,
  UploadCloud,
  X,
  Truck,
  CheckCircle,
  Tag,
  TrendingUp,
  Search,
  Sparkles,
  AlertTriangle,
  SlidersHorizontal,
  KeyRound,
  RotateCcw,
  Copy,
  Check,
  UserPlus,
  ImageIcon,
  FileText,
  Share2,
  HelpCircle,
  BookOpen,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/overlays";
import { Button, EmptyState, Input, Price, Select } from "@/components/ui/primitives";
import { useToast } from "@/lib/store";
import { cn, formatPrice, isLowStock, isSoldOut, totalStock } from "@/lib/utils";
import { BRAND_CONFIG } from "@/lib/brand.config";
import type { OrderStatus, Product } from "@/lib/types";

type Tab =
  | "dashboard"
  | "orders"
  | "products"
  | "discounts"
  | "customers"
  | "inventory"
  | "banners"
  | "content"
  | "settings";

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  confirmed: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  processing: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20",
  shipped: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  delivered: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-700 border-red-500/20",
  refunded: "bg-slate-500/10 text-slate-700 border-slate-500/20",
};

/* ————————————————— HELPER COMPONENTS ————————————————— */

function ImageUploadField({
  value,
  onChange,
  label = "Garment Photo",
}: {
  value: string;
  onChange: (val: string) => void;
  label?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (JPG, PNG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        onChange(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] uppercase tracking-[0.18em] font-medium text-ash">{label}</label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[10px] text-fog hover:text-gold-dark underline underline-offset-2 uppercase tracking-wider cursor-pointer font-medium transition-colors"
        >
          {showUrlInput ? "Hide URL Box" : "Or Paste Image Link"}
        </button>
      </div>
      {showUrlInput && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... or /images/hero.jpg"
          className="w-full rounded-xs border border-line bg-paper/50 p-3.5 text-sm text-ink outline-none focus:border-gold font-mono transition-all"
        />
      )}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-sm flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300",
          isDragging ? "border-gold bg-gold/5 scale-[0.99]" : "border-line/80 hover:border-gold/50 bg-paper/30 hover:bg-gold/5",
          value ? "py-5" : "py-10"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
          }}
        />
        {value ? (
          <div className="flex items-center gap-5 w-full px-5">
            <div className="relative size-16 shrink-0 rounded-xs shadow-sm border border-line overflow-hidden">
              <Image src={value} alt="Preview" fill sizes="64px" className="object-cover" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-ink truncate">Photo Attached</p>
              <p className="text-[11px] text-fog mt-1">Click or drop new photo to replace</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-2.5 text-fog hover:text-error hover:bg-error/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="size-12 rounded-full bg-paper shadow-sm border border-line flex items-center justify-center text-gold-dark">
              <UploadCloud className="size-5" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-ink">Drag & drop photo here</p>
              <p className="text-[11px] text-fog mt-1">JPG, PNG, WebP (Auto-optimized)</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SalesAnalyticsChart({ orders }: { orders: any[] }) {
  const [daysRange, setDaysRange] = useState<7 | 30>(7);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    const days: { dateStr: string; label: string; revenue: number; count: number }[] = [];
    const now = new Date();
    for (let i = daysRange - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push({
        dateStr: d.toISOString().split("T")[0],
        label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        revenue: 0,
        count: 0,
      });
    }
    orders.forEach((o) => {
      if (["cancelled", "refunded"].includes((o.status || "").toLowerCase())) return;
      const orderDate = new Date(o.placedAt).toISOString().split("T")[0];
      const match = days.find((d) => d.dateStr === orderDate);
      if (match) {
        match.revenue += Number(o.totalBDT || 0);
        match.count += 1;
      }
    });
    return days;
  }, [orders, daysRange]);

  const maxRevenue = useMemo(() => Math.max(...chartData.map((d) => d.revenue), 1000), [chartData]);
  const totalRangeRevenue = chartData.reduce((acc, d) => acc + d.revenue, 0);
  const totalRangeOrders = chartData.reduce((acc, d) => acc + d.count, 0);

  return (
    <div className="bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60 p-6 sm:p-8 space-y-8 transition-all relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gold/10 rounded-md border border-gold/20">
              <TrendingUp className="size-4 text-gold-dark" />
            </div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink">Revenue Analytics</h2>
          </div>
          <p className="text-xs text-ash mt-2">
            Total {daysRange} days sales:{" "}
            <strong className="text-ink font-mono font-semibold tracking-tight">{formatPrice(totalRangeRevenue)}</strong>{" "}
            ({totalRangeOrders} orders)
          </p>
        </div>
        <div className="flex items-center bg-line/20 p-1 rounded-sm border border-line/50">
          <button
            type="button"
            onClick={() => setDaysRange(7)}
            className={cn(
              "px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] rounded-xs transition-all duration-300 cursor-pointer",
              daysRange === 7 ? "bg-paper text-ink shadow-xs" : "text-fog hover:text-ink"
            )}
          >
            7 Days
          </button>
          <button
            type="button"
            onClick={() => setDaysRange(30)}
            className={cn(
              "px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] rounded-xs transition-all duration-300 cursor-pointer",
              daysRange === 30 ? "bg-paper text-ink shadow-xs" : "text-fog hover:text-ink"
            )}
          >
            30 Days
          </button>
        </div>
      </div>
      <div className="pt-4">
        <div className="h-56 flex items-end gap-2 sm:gap-4 border-b border-line pb-3">
          {chartData.map((d, idx) => (
            <div
              key={d.dateStr}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
            >
              <AnimatePresence>
                {hoveredIndex === idx && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute -top-14 z-20 bg-ink text-paper px-3.5 py-2 text-[10px] font-mono rounded-xs shadow-[0_10px_30px_rgba(14,13,11,0.2)] pointer-events-none whitespace-nowrap"
                  >
                    <p className="font-semibold text-sm tracking-tight">{formatPrice(d.revenue)}</p>
                    <p className="text-[9px] text-paper/70 mt-0.5">
                      {d.count} orders • {d.label}
                    </p>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-ink" />
                  </motion.div>
                )}
              </AnimatePresence>
              <div
                style={{ height: `${Math.max(4, Math.round((d.revenue / maxRevenue) * 100))}%` }}
                className={cn(
                  "w-full max-w-[40px] rounded-t-sm transition-all duration-500 ease-out",
                  hoveredIndex === idx
                    ? "bg-gradient-to-t from-gold-dark to-gold-light"
                    : d.revenue > 0
                    ? "bg-ink/80 group-hover:bg-ink"
                    : "bg-line/50"
                )}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-fog pt-4 px-1 uppercase tracking-wider">
          <span>{chartData[0]?.label}</span>
          <span>{chartData[Math.floor(chartData.length / 2)]?.label}</span>
          <span>{chartData[chartData.length - 1]?.label}</span>
        </div>
      </div>
    </div>
  );
}

/* ————————————————— MAIN ADMIN COMPONENT ————————————————— */

export default function AdminPage() {
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [orders, setOrders] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [blacklistedPhones, setBlacklistedPhones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addCouponOpen, setAddCouponOpen] = useState(false);
  const [offlineOrderOpen, setOfflineOrderOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<any>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);
  const [orderSubTab, setOrderSubTab] = useState<"active" | "abandoned">("active");

  const [banners, setBanners] = useState({
    hero: "/images/hero.jpg",
    collection: "/images/collection.jpg",
    men: "/images/category-men.jpg",
    women: "/images/category-women.jpg",
    story: "/images/story.jpg",
    journal1: "/images/story.jpg",
    journal2: "/images/collection.jpg",
    journal3: "/images/category-men.jpg",
  });
  const [savingBanners, setSavingBanners] = useState(false);

  // Content CMS State
  const [content, setContent] = useState<any>({
    homepageMode: "editorial" as "editorial" | "direct-shop",
    marqueeItems: BRAND_CONFIG.marqueeItems.join(" | "),
    homeContent: {
      heroEyebrow: "New Season — SS26",
      heroHeading: "Quiet warmth.\nLasting form.",
      heroBody: "Heavyweight jersey, tailored wool and considered outerwear. Quiet garments, engineered to be worn for years — not seasons.",
      featuredEyebrow: "Featured Collection",
      featuredHeading: "The New\nCollection",
      featuredBody: "Carefully developed pieces crafted in luxury cloth.",
      storyEyebrow: "Design Philosophy",
      storyHeading: "Designed for movement.\nBuilt with intention.",
      storyBody: "Tholvex Studio operates from an uncompromising perspective.",
      coreEyebrow: "Permanent Line",
      coreHeading: "Core 01",
      coreBody: "The permanent uniform. Seasonless garments in heavyweight earth tones.",
      newsletterEyebrow: "Atelier Dispatch",
      newsletterHeading: "Stay in Form",
      newsletterBody: "New pieces, private restocks and studio notes.",
    },
    shopContent: {
      eyebrow: `${BRAND_CONFIG.brandName} — SS26`,
      heading: "All Products",
      description: "Quiet garments in heavyweight natural cloth.",
      badgeLabel: "garments in atelier",
    },
    about: {
      heading: "Quiet clothes,\nmade loudly well.",
      story: "Tholvex Studio is an independent fashion house founded in Dhaka.",
      point1Title: "Cloth First",
      point1Body: "Every season starts in the fabric archive.",
      point2Title: "Eleven Fittings",
      point2Body: "A silhouette is developed on a stand.",
      point3Title: "Small, Permanent Lines",
      point3Body: "The Core Collection never goes on seasonal sale.",
    },
    legal: { shipping: "", returns: "", privacy: "", terms: "", cookies: "" },
    socials: {
      instagram: "https://instagram.com",
      facebook: "https://facebook.com",
      tiktok: "https://tiktok.com",
      pinterest: "https://pinterest.com",
    },
    faqs: [
      { q: "How do I track my order?", a: "Once your order is confirmed, tracking info will be sent via SMS." },
      { q: "Where do you deliver?", a: "We deliver nationwide across all 64 districts in Bangladesh." },
    ],
  });
  const [savingContent, setSavingContent] = useState(false);

  const [articles, setArticles] = useState<any[]>([]);
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [articleForm, setArticleForm] = useState({
    title: "",
    eyebrow: "Design Notes",
    excerpt: "",
    body: "",
    image: "",
  });
  const [savingArticle, setSavingArticle] = useState(false);

  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [staffList, setStaffList] = useState<any[]>([]);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [newStaffRoleTitle, setNewStaffRoleTitle] = useState("Order Moderator");
  const [newStaffPerms, setNewStaffPerms] = useState<string[]>(["orders"]);
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/admin/products?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setProductsList(data.products || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.orders) {
          setOrders(
            data.orders.map((o: any) => ({
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
                city: o.shippingAddress?.district || "",
                area: o.shippingAddress?.division || "",
                postalCode: "",
                country: "Bangladesh",
              },
              paymentMethod: o.paymentMethod,
              paymentStatus: (o.paymentStatus || "pending").toLowerCase(),
              shippingMethod: o.shippingBDT === 100 ? "Inside Dhaka (৳100)" : "Outside Dhaka (৳150)",
              status: (o.orderStatus || "pending").toLowerCase() as OrderStatus,
              placedAt: o.createdAt || new Date().toISOString(),
              email: o.customerEmail,
              advancePaidBDT: o.shippingAddress?.advancePaidBDT ?? o.shippingBDT ?? 0,
              dueAmountBDT:
                o.shippingAddress?.dueAmountBDT ??
                Math.max(0, o.totalBDT - (o.shippingAddress?.advancePaidBDT ?? o.shippingBDT ?? 0)),
              senderNumber: o.shippingAddress?.senderNumber ?? "N/A",
              transactionId: o.shippingAddress?.transactionId ?? "N/A",
              courier: o.shippingAddress?.courier,
              trackingCode: o.shippingAddress?.trackingCode,
            }))
          );
        }
      }
    } catch {}
  };

  const fetchBlacklist = async () => {
    try {
      const res = await fetch("/api/admin/blacklist", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.blacklists) {
          setBlacklistedPhones(data.blacklists.map((b: any) => b.phone));
        }
      }
    } catch {}
  };

  const fetchAbandonedCarts = async () => {
    try {
      const res = await fetch(`/api/abandoned-cart?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.carts) setAbandonedCarts(data.carts);
      }
    } catch {}
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCouponsList(data.coupons || []);
      }
    } catch {}
  };

  const fetchAdminSession = async () => {
    try {
      const res = await fetch("/api/admin/auth");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setAdminName(data.user.name || "");
          setAdminEmail(data.user.email || "");
        }
      }
    } catch {}
  };

  const fetchStaffList = async () => {
    try {
      const res = await fetch("/api/admin/staff", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff || []);
      }
    } catch {}
  };

  const fetchBanners = async () => {
    try {
      const res = await fetch("/api/banners", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.banners) setBanners((prev) => ({ ...prev, ...data.banners }));
      }
    } catch {}
  };

  const fetchContent = async () => {
    try {
      const res = await fetch("/api/content", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          setContent((prev: any) => ({
            ...prev,
            ...data.content,
            homepageMode: data.content.homepageMode || "editorial",
            marqueeItems: data.content.marqueeItems || prev.marqueeItems,
            homeContent: { ...prev.homeContent, ...(data.content.homeContent || {}) },
            shopContent: { ...prev.shopContent, ...(data.content.shopContent || {}) },
          }));
        }
      }
    } catch {}
  };

  const fetchArticles = async () => {
    try {
      const res = await fetch("/api/journal", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.articles) setArticles(data.articles);
      }
    } catch {}
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchBlacklist();
    fetchAbandonedCarts();
    fetchCoupons();
    fetchAdminSession();
    fetchStaffList();
    fetchBanners();
    fetchContent();
    fetchArticles();
  }, []);

  const revenue = orders
    .filter((o) => !["cancelled", "refunded"].includes((o.status || "").toLowerCase()))
    .reduce((s, o) => s + (o.totalBDT || 0), 0);
  const lowStock = productsList.filter((p) => isLowStock(p));

  const setOrderStatus = async (id: string, status: OrderStatus) => {
    setOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));
    if (viewOrder && viewOrder.id === id) setViewOrder({ ...viewOrder, status });
    push("success", `Order ${id} marked ${status}.`);
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, orderStatus: status }),
    });
  };

  const handleToggleBlacklist = async (phone: string, currentlyBlocked: boolean) => {
    const action = currentlyBlocked ? "remove" : "add";
    try {
      const res = await fetch("/api/admin/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, action }),
      });
      const data = await res.json();
      if (res.ok) {
        push("success", data.message || (currentlyBlocked ? "Unblocked successfully" : "Customer Blacklisted"));
        await fetchBlacklist();
      } else {
        push("error", data.error || "Failed to update blacklist status.");
      }
    } catch {
      push("error", "Error connecting to server.");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm(`Delete order ${orderId} permanently from database?`)) return;
    try {
      const res = await fetch(`/api/orders?id=${encodeURIComponent(orderId)}`, { method: "DELETE" });
      if (res.ok) {
        push("success", `Order ${orderId} deleted successfully.`);
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setSelectedOrderIds((prev) => prev.filter((id) => id !== orderId));
      } else {
        push("error", "Failed to delete order.");
      }
    } catch {
      push("error", "Server communication error.");
    }
  };

  const handleDeleteAbandoned = async (id: string) => {
    try {
      await fetch(`/api/abandoned-cart?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setAbandonedCarts((prev) => prev.filter((c) => c.id !== id));
      push("info", "Draft cart removed.");
    } catch {}
  };

  const handleBulkDeleteOrders = async () => {
    if (!selectedOrderIds.length) return;
    if (!window.confirm(`Permanently delete ${selectedOrderIds.length} selected orders from database?`)) return;
    try {
      const res = await fetch("/api/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedOrderIds }),
      });
      if (res.ok) {
        push("success", `${selectedOrderIds.length} orders deleted.`);
        setOrders((prev) => prev.filter((o) => !selectedOrderIds.includes(o.id)));
        setSelectedOrderIds([]);
      } else {
        push("error", "Failed to bulk delete orders.");
      }
    } catch {
      push("error", "Bulk delete error.");
    }
  };

  const handleExecuteReset = async (target: "orders" | "products" | "coupons" | "all") => {
    const targetLabel = target === "all" ? "MASTER SYSTEM DATABASE" : target.toUpperCase();
    const confirmPrompt = window.prompt(`Type 'RESET' to confirm resetting ${targetLabel}:`);
    if (confirmPrompt !== "RESET") return;
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (res.ok) {
        push("success", data.message || "Reset completed successfully.");
        if (target === "orders" || target === "all") {
          setOrders([]);
          setSelectedOrderIds([]);
        }
        if (target === "products" || target === "all") {
          setProductsList([]);
          setSelectedProductIds([]);
        }
        if (target === "coupons" || target === "all") setCouponsList([]);
      } else {
        push("error", data.error || "Reset failed.");
      }
    } catch {
      push("error", "Server communication error.");
    }
  };

  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: adminName, email: adminEmail, password: adminPassword || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        push("success", data.message || "Admin credentials updated successfully!");
        setAdminPassword("");
        setTimeout(() => window.location.reload(), 1200);
      } else {
        push("error", data.error || "Failed to update profile.");
      }
    } catch {
      push("error", "Error connecting to security service.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveBanners = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBanners(true);
    try {
      const res = await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(banners),
      });
      const data = await res.json();
      if (res.ok) {
        push("success", "All storefront & journal banners updated live!");
      } else {
        push("error", data.error || "Failed to update banners.");
      }
    } catch {
      push("error", "Error connecting to database.");
    } finally {
      setSavingBanners(false);
    }
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContent(true);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const data = await res.json();
      if (res.ok) {
        push("success", "Website content, marquee & shop texts updated live!");
      } else {
        push("error", data.error || "Failed to update content.");
      }
    } catch {
      push("error", "Error connecting to database.");
    } finally {
      setSavingContent(false);
    }
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingArticle(true);
    try {
      const payload = {
        id: editingArticle?.id || `art-${Date.now()}`,
        slug:
          editingArticle?.slug ||
          articleForm.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, ""),
        title: articleForm.title,
        eyebrow: articleForm.eyebrow,
        excerpt: articleForm.excerpt,
        body: articleForm.body.split("\n\n").filter(Boolean),
        image: articleForm.image || "/images/story.jpg",
      };
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        push("success", `Article "${articleForm.title}" published live!`);
        fetchArticles();
        setArticleModalOpen(false);
        setEditingArticle(null);
        setArticleForm({ title: "", eyebrow: "Design Notes", excerpt: "", body: "", image: "" });
      } else {
        push("error", "Failed to save article.");
      }
    } catch {
      push("error", "Error connecting to server.");
    } finally {
      setSavingArticle(false);
    }
  };

  const handleDeleteArticle = async (id: string, title: string) => {
    if (!window.confirm(`Delete article "${title}" permanently?`)) return;
    try {
      const res = await fetch(`/api/journal?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        push("success", "Article deleted.");
        setArticles((prev) => prev.filter((a) => a.id !== id && a.slug !== id));
      } else {
        push("error", "Failed to delete article.");
      }
    } catch {
      push("error", "Error deleting article.");
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingStaff(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStaffName,
          email: newStaffEmail,
          password: newStaffPassword,
          roleTitle: newStaffRoleTitle,
          permissions: newStaffPerms,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        push("success", data.message || "Staff member created successfully!");
        setNewStaffName("");
        setNewStaffEmail("");
        setNewStaffPassword("");
        setNewStaffRoleTitle("Order Moderator");
        setNewStaffPerms(["orders"]);
        fetchStaffList();
      } else {
        push("error", data.error || "Failed to create staff");
      }
    } catch {
      push("error", "Server connection error");
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!window.confirm(`Revoke staff access for ${name}?`)) return;
    try {
      const res = await fetch(`/api/admin/staff?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        push("success", "Staff access revoked.");
        setStaffList(staffList.filter((s) => s.id !== id));
      } else {
        push("error", "Failed to revoke staff access");
      }
    } catch {
      push("error", "Server connection error");
    }
  };

  const copyStaffPortalUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://tholvexstudio.vercel.app";
    navigator.clipboard.writeText(`${origin}/staff`);
    setCopiedLink(true);
    push("success", "Staff Portal Link copied!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const saveEdit = async (id: string, edit: any) => {
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...edit }),
      });
      if (res.ok) {
        push("success", "Garment details updated live in database.");
        fetchProducts();
      } else {
        push("error", "Failed to update product.");
      }
    } catch {
      push("error", "Error saving product.");
    }
    setEditProduct(null);
  };

  const handleAddProduct = async (productData: any) => {
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      if (res.ok) {
        push("success", `${productData.name} added live to database!`);
        fetchProducts();
        setAddOpen(false);
      } else {
        push("error", "Failed to add product to database.");
      }
    } catch {
      push("error", "Error adding product.");
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Permanently delete "${name}" from the database?`)) return;
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        push("success", `${name} deleted from database.`);
        setProductsList(productsList.filter((p) => !p.id.includes(id)));
        setSelectedProductIds(selectedProductIds.filter((x) => x !== id));
      } else {
        push("error", "Failed to delete.");
      }
    } catch {
      push("error", "Error deleting.");
    }
  };

  const handleCreateCoupon = async (couponData: any) => {
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(couponData),
      });
      const data = await res.json();
      if (res.ok) {
        push("success", `Coupon "${couponData.code}" created successfully!`);
        fetchCoupons();
        setAddCouponOpen(false);
      } else {
        push("error", data.error || "Failed to create coupon.");
      }
    } catch {
      push("error", "Error connecting to server.");
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      const res = await fetch(`/api/admin/coupons?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        push("success", `Coupon "${code}" deleted.`);
        setCouponsList(couponsList.filter((c) => c.id !== id));
      } else {
        push("error", "Failed to delete coupon.");
      }
    } catch {
      push("error", "Error deleting coupon.");
    }
  };

  const handleBulkDeleteProducts = async () => {
    if (!selectedProductIds.length) return;
    if (!window.confirm(`Permanently delete ${selectedProductIds.length} selected garments from the database?`)) return;
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedProductIds }),
      });
      if (res.ok) {
        push("success", `${selectedProductIds.length} garments deleted from database.`);
        setProductsList(productsList.filter((p) => !selectedProductIds.includes(p.id)));
        setSelectedProductIds([]);
      } else {
        push("error", "Bulk delete error.");
      }
    } catch {
      push("error", "Bulk delete error.");
    }
  };

  const nav: { id: Tab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: BadgeDollarSign },
    { id: "products", label: "Products", icon: ShoppingCart },
    { id: "discounts", label: "Discounts", icon: Tag },
    { id: "customers", label: "Customers", icon: Users },
    { id: "inventory", label: "Inventory", icon: Boxes },
    { id: "banners", label: "Banners CMS", icon: ImageIcon },
    { id: "content", label: "Content CMS", icon: FileText },
    { id: "settings", label: "Settings", icon: SlidersHorizontal },
  ];

  return (
    <div className="container-x pb-24 pt-24 lg:pt-28 min-h-screen">
      {/* Header Area */}
      <div className="flex flex-wrap items-start justify-between gap-6 mb-12 border-b border-line pb-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-dark mb-2">
            {BRAND_CONFIG.brandName} Atelier Command
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-ink tracking-tight">Back Office</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ash">
            Live database synchronized with your Singapore cluster. Manage products, edit storefront policies, FAQs,
            marquee text, shop texts & socials, customize banners, and control inventory.
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 shadow-sm backdrop-blur-md">
          <Database className="size-4 text-emerald-600 animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-700">Live Production DB</span>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-[250px_1fr]">
        {/* Sidebar Navigation */}
        <nav className="flex gap-2 overflow-x-auto no-scrollbar lg:flex-col" aria-label="Admin sections">
          {nav.map((n) => {
            const active = tab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-4 whitespace-nowrap px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] rounded-sm transition-all duration-300 cursor-pointer overflow-hidden",
                  active
                    ? "bg-ink text-paper shadow-[0_8px_20px_-8px_rgba(14,13,11,0.5)]"
                    : "text-fog hover:bg-paper hover:text-ink hover:shadow-xs border border-transparent hover:border-line/60"
                )}
              >
                {active && <span className="absolute inset-y-0 left-0 w-1 bg-gold-dark" />}
                <n.icon
                  className={cn("size-4.5 transition-colors duration-300", active ? "text-gold-light" : "text-fog group-hover:text-gold-dark")}
                  strokeWidth={1.8}
                />
                {n.label}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          {/* 1. DASHBOARD TAB */}
          {tab === "dashboard" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {[
                  {
                    label: "Total Sales",
                    value: formatPrice(revenue),
                    sub: `${orders.length} orders total`,
                    icon: TrendingUp,
                    color: "text-gold-dark",
                    bg: "bg-gold/10 border-gold/20",
                  },
                  {
                    label: "Orders",
                    value: orders.length,
                    sub: "Live in DB",
                    icon: BadgeDollarSign,
                    color: "text-blue-700",
                    bg: "bg-blue-500/10 border-blue-500/20",
                  },
                  {
                    label: "Products",
                    value: productsList.length,
                    sub: `${lowStock.length} low stock`,
                    icon: ShoppingCart,
                    color: "text-purple-700",
                    bg: "bg-purple-500/10 border-purple-500/20",
                  },
                  {
                    label: "Database",
                    value: "Online",
                    sub: "Neon PostgreSQL",
                    icon: Database,
                    color: "text-emerald-700",
                    bg: "bg-emerald-500/10 border-emerald-500/20",
                  },
                ].map((kpi, idx) => (
                  <div key={idx} className="bg-paper/60 backdrop-blur-md rounded-sm p-6 shadow-sm border border-line/60 flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fog">{kpi.label}</p>
                      <div className={cn("p-2 rounded-xs border", kpi.bg, kpi.color)}>
                        <kpi.icon className="size-4" strokeWidth={2} />
                      </div>
                    </div>
                    <div>
                      <p className={cn("mt-5 font-display text-3xl tabular-nums tracking-tight", kpi.value === "Online" ? "text-emerald-600" : "text-ink")}>
                        {kpi.value}
                      </p>
                      <p className="mt-1.5 text-xs text-ash font-medium">{kpi.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <SalesAnalyticsChart orders={orders} />
            </motion.div>
          )}

          {/* 2. ORDERS TAB */}
          {tab === "orders" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 bg-line/20 p-1.5 rounded-sm border border-line/50">
                  <button
                    type="button"
                    onClick={() => setOrderSubTab("active")}
                    className={cn(
                      "px-5 py-2 text-[11px] font-bold uppercase tracking-[0.15em] rounded-xs transition-all duration-200 cursor-pointer",
                      orderSubTab === "active" ? "bg-paper text-ink shadow-xs" : "text-fog hover:text-ink"
                    )}
                  >
                    Active Orders ({orders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderSubTab("abandoned")}
                    className={cn(
                      "px-5 py-2 text-[11px] font-bold uppercase tracking-[0.15em] rounded-xs transition-all duration-200 cursor-pointer flex items-center gap-2",
                      orderSubTab === "abandoned" ? "bg-paper text-ink shadow-xs" : "text-fog hover:text-ink"
                    )}
                  >
                    <span>Abandoned Carts</span>
                    {abandonedCarts.length > 0 && (
                      <span className="px-2 py-0.5 bg-error text-paper text-[9px] font-bold rounded-full shadow-sm">{abandonedCarts.length}</span>
                    )}
                  </button>
                </div>

                <Button onClick={() => setOfflineOrderOpen(true)} className="gap-2 shadow-sm">
                  <Plus className="size-4" strokeWidth={2} /> Quick Offline Order
                </Button>
              </div>

              {orderSubTab === "active" && (
                <>
                  {selectedOrderIds.length > 0 && (
                    <div className="mb-4 flex items-center justify-between bg-paper rounded-sm shadow-sm border border-gold/40 p-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-ink">{selectedOrderIds.length} orders selected</span>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedOrderIds([])} className="text-xs text-fog hover:text-ink font-medium cursor-pointer">
                          Deselect All
                        </button>
                        <Button variant="outline" onClick={handleBulkDeleteOrders} className="gap-2 border-error/40 text-error hover:bg-error hover:text-paper hover:border-error h-8 text-[10px]">
                          <Trash2 className="size-3.5" />
                          <span>Delete Selected</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {orders.length === 0 ? (
                    <EmptyState title="No orders yet." copy="Live customer orders placed through checkout will appear here automatically." />
                  ) : (
                    <div className="overflow-x-auto bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60">
                      <table className="w-full min-w-[950px] text-sm text-left">
                        <thead className="bg-paper border-b border-line">
                          <tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-ash">
                            <th className="px-5 py-4 w-12">
                              <input
                                type="checkbox"
                                checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                                onChange={() => {
                                  if (selectedOrderIds.length === orders.length) setSelectedOrderIds([]);
                                  else setSelectedOrderIds(orders.map((o) => o.id));
                                }}
                                className="size-4 rounded-xs border-line text-ink focus:ring-ink cursor-pointer accent-ink"
                              />
                            </th>
                            <th className="px-5 py-4">Order ID</th>
                            <th className="px-5 py-4">Customer</th>
                            <th className="px-5 py-4">Phone & City</th>
                            <th className="px-5 py-4">Due (Courier)</th>
                            <th className="px-5 py-4">Status</th>
                            <th className="px-5 py-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line/60">
                          {orders.map((o) => {
                            const isSelected = selectedOrderIds.includes(o.id);
                            const isBlacklisted = blacklistedPhones.includes(o.address.phone);
                            return (
                              <tr key={o.id} onClick={() => setViewOrder(o)} className={cn("hover:bg-cream/40 cursor-pointer transition-colors duration-200", isSelected ? "bg-gold/5" : "")}>
                                <td className="px-5 py-4 w-12" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() =>
                                      setSelectedOrderIds((prev) =>
                                        prev.includes(o.id) ? prev.filter((x) => x !== o.id) : [...prev, o.id]
                                      )
                                    }
                                    className="size-4 rounded-xs border-line text-ink focus:ring-ink cursor-pointer accent-ink"
                                  />
                                </td>
                                <td className="px-5 py-4 font-bold text-ink font-mono">{o.id}</td>
                                <td className="px-5 py-4">
                                  <p className="font-semibold text-ink">{o.address.fullName}</p>
                                  <p className="text-[11px] text-fog mt-0.5">{o.email}</p>
                                </td>
                                <td className="px-5 py-4 text-ash text-xs">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono font-medium">{o.address.phone}</span>
                                    {isBlacklisted ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-red-500/10 text-red-600 border border-red-500/20 text-[9px] font-bold uppercase tracking-wider">
                                        <ShieldAlert className="size-2.5" /> Blocked
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider">
                                        <ShieldCheck className="size-2.5" /> Safe
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-fog mt-0.5 block">{o.address.city}</span>
                                </td>
                                <td className="px-5 py-4 font-semibold text-ink">
                                  <Price amountBDT={o.dueAmountBDT} />
                                  {o.advancePaidBDT > 0 && (
                                    <span className="block text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-widest">
                                      Adv: ৳{o.advancePaidBDT}
                                    </span>
                                  )}
                                </td>
                                <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                                  <select
                                    value={o.status}
                                    onChange={(e) => setOrderStatus(o.id, e.target.value as OrderStatus)}
                                    className={cn(
                                      "border-0 rounded-xs px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer outline-none ring-1 ring-inset shadow-xs appearance-none transition-all",
                                      STATUS_STYLE[o.status] || "bg-gray-100 text-gray-800 ring-gray-200"
                                    )}
                                  >
                                    {ORDER_STATUSES.map((s) => (
                                      <option key={s} value={s}>
                                        {s}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-3">
                                    <button
                                      onClick={() => setViewOrder(o)}
                                      className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink border border-line rounded-xs px-3 py-1.5 hover:bg-ink hover:text-paper hover:border-ink transition-colors shadow-2xs cursor-pointer"
                                    >
                                      Invoice
                                    </button>
                                    <button
                                      onClick={() => handleDeleteOrder(o.id)}
                                      className="p-1.5 text-fog hover:text-error hover:bg-error/10 rounded-xs transition-colors cursor-pointer"
                                      title="Delete order"
                                    >
                                      <Trash2 className="size-4" strokeWidth={1.5} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {orderSubTab === "abandoned" && (
                <div>
                  {abandonedCarts.length === 0 ? (
                    <EmptyState
                      title="No abandoned carts found."
                      copy="When a shopper fills contact info at checkout but doesn't finish, it will appear here for 1-click recovery."
                    />
                  ) : (
                    <div className="overflow-x-auto bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60">
                      <table className="w-full min-w-[850px] text-sm text-left">
                        <thead className="bg-paper border-b border-line">
                          <tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-ash">
                            <th className="px-5 py-4">Shopper Contact</th>
                            <th className="px-5 py-4">Phone Number</th>
                            <th className="px-5 py-4">Garments in Cart</th>
                            <th className="px-5 py-4">Cart Value</th>
                            <th className="px-5 py-4 text-right">1-Click Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line/60">
                          {abandonedCarts.map((c) => {
                            const itemsList = c.items || [];
                            const itemsText = itemsList.map((i: any) => `${i.name} (${i.size})`).join(", ");
                            const cleanPhone = (c.customer_phone || "").replace(/[^0-9]/g, "");
                            const bdPhone = cleanPhone.startsWith("88") ? cleanPhone : `88${cleanPhone}`;
                            const waText = encodeURIComponent(
                              `Hello ${c.customer_name}, we noticed you left items (${itemsText}) in your cart at ${BRAND_CONFIG.brandName}. Would you like assistance to complete your order?`
                            );
                            const waUrl = `https://wa.me/${bdPhone}?text=${waText}`;

                            return (
                              <tr key={c.id} className="hover:bg-cream/40 transition-colors duration-200">
                                <td className="px-5 py-4">
                                  <p className="font-semibold text-ink">{c.customer_name}</p>
                                  <p className="text-[11px] text-fog mt-0.5">{c.customer_email || "No email"}</p>
                                </td>
                                <td className="px-5 py-4 font-mono font-medium text-ink select-all">{c.customer_phone}</td>
                                <td className="px-5 py-4 text-xs text-ash max-w-xs truncate" title={itemsText}>
                                  {itemsText || "Garments"}
                                </td>
                                <td className="px-5 py-4 font-mono font-bold text-gold-dark">{formatPrice(c.total_bdt || 0)}</td>
                                <td className="px-5 py-4 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    <a
                                      href={waUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-xs text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 hover:bg-emerald-600 hover:text-white transition-colors shadow-2xs"
                                    >
                                      <MessageCircle className="size-3.5" /> Recover
                                    </a>
                                    <button
                                      onClick={() => handleDeleteAbandoned(c.id)}
                                      className="p-1.5 text-fog hover:text-error hover:bg-error/10 rounded-xs transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="size-4" strokeWidth={1.5} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* 3. PRODUCTS TAB */}
          {tab === "products" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-ash">{productsList.length} garments in database</p>
                <Button onClick={() => setAddOpen(true)} className="gap-2 shadow-sm">
                  <Plus className="size-4" strokeWidth={2} /> Add Product
                </Button>
              </div>

              {selectedProductIds.length > 0 && (
                <div className="mb-4 flex items-center justify-between bg-paper rounded-sm shadow-sm border border-gold/40 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink">{selectedProductIds.length} garments selected</span>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedProductIds([])} className="text-xs text-fog hover:text-ink font-medium cursor-pointer">
                      Deselect All
                    </button>
                    <Button variant="outline" onClick={handleBulkDeleteProducts} className="gap-2 border-error/40 text-error hover:bg-error hover:text-paper hover:border-error h-8 text-[10px]">
                      <Trash2 className="size-3.5" />
                      <span>Delete Selected</span>
                    </Button>
                  </div>
                </div>
              )}

              {productsList.length === 0 && !loading ? (
                <EmptyState title="No garments in database." copy="Click 'Add Product' above to create garments in your cloud database." />
              ) : (
                <div className="overflow-x-auto bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60">
                  <table className="w-full min-w-[900px] text-sm text-left">
                    <thead className="bg-paper border-b border-line">
                      <tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-ash">
                        <th className="px-5 py-4 w-12">
                          <input
                            type="checkbox"
                            checked={productsList.length > 0 && selectedProductIds.length === productsList.length}
                            onChange={() => {
                              if (selectedProductIds.length === productsList.length) setSelectedProductIds([]);
                              else setSelectedProductIds(productsList.map((p) => p.id));
                            }}
                            className="size-4 rounded-xs border-line text-ink focus:ring-ink cursor-pointer accent-ink"
                          />
                        </th>
                        <th className="px-5 py-4">Product</th>
                        <th className="px-5 py-4">Category</th>
                        <th className="px-5 py-4">Price</th>
                        <th className="px-5 py-4">Stock</th>
                        <th className="px-5 py-4">Flags</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {productsList.map((p) => {
                        const isSelected = selectedProductIds.includes(p.id);
                        return (
                          <tr key={p.id} className={cn("transition-colors duration-200 hover:bg-cream/40", isSelected ? "bg-gold/5" : "")}>
                            <td className="px-5 py-4 w-12">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  setSelectedProductIds((prev) =>
                                    prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                                  )
                                }
                                className="size-4 rounded-xs border-line text-ink focus:ring-ink cursor-pointer accent-ink"
                              />
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-4">
                                <span className="relative h-14 w-11 overflow-hidden rounded-xs shadow-sm border border-line/50">
                                  <Image src={p.images?.[0]?.src || "/images/product-tee.jpg"} alt={p.name} fill sizes="44px" className="object-cover" />
                                </span>
                                <div>
                                  <p className="font-semibold text-ink">{p.name}</p>
                                  <p className="text-[10px] text-fog font-mono mt-0.5">{p.sku || p.slug}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-ash text-xs">
                              {p.category} <span className="text-fog">/ {p.gender}</span>
                            </td>
                            <td className="px-5 py-4 font-semibold text-ink">
                              <Price amountBDT={p.priceBDT} />
                            </td>
                            <td className="px-5 py-4">
                              {isSoldOut(p) ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-error/10 text-error border border-error/20 text-[9px] font-bold uppercase tracking-wider">
                                  Out
                                </span>
                              ) : (
                                <span className="font-mono font-medium text-ink bg-line/30 px-2 py-1 rounded-sm">{totalStock(p)}</span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-1.5">
                                {p.featured && (
                                  <span className="px-2 py-0.5 rounded-xs border border-ink bg-ink text-paper text-[9px] font-bold uppercase tracking-widest shadow-2xs">
                                    F
                                  </span>
                                )}
                                {p.newArrival && (
                                  <span className="px-2 py-0.5 rounded-xs border border-gold-dark text-gold-dark bg-gold/10 text-[9px] font-bold uppercase tracking-widest shadow-2xs">
                                    New
                                  </span>
                                )}
                                {p.bestSeller && (
                                  <span className="px-2 py-0.5 rounded-xs border border-blue-700/50 text-blue-700 bg-blue-500/10 text-[9px] font-bold uppercase tracking-widest shadow-2xs">
                                    Best
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const origin = typeof window !== "undefined" ? window.location.origin : "https://tholvexstudio.vercel.app";
                                    navigator.clipboard.writeText(`${origin}/buy?product=${p.id}`);
                                    push("success", `Magic Buy Link copied!`);
                                  }}
                                  className="p-2 text-fog hover:text-gold-dark hover:bg-gold/10 rounded-xs transition-colors cursor-pointer"
                                  title="Copy 1-Click Magic Buy Link"
                                >
                                  <Sparkles className="size-4" strokeWidth={1.5} />
                                </button>
                                <button
                                  onClick={() => setEditProduct(p)}
                                  className="p-2 text-fog hover:text-blue-600 hover:bg-blue-500/10 rounded-xs transition-colors cursor-pointer"
                                  title="Edit"
                                >
                                  <Pencil className="size-4" strokeWidth={1.5} />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id, p.name)}
                                  className="p-2 text-fog hover:text-error hover:bg-error/10 rounded-xs transition-colors cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="size-4" strokeWidth={1.5} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* 4. DISCOUNTS TAB */}
          {tab === "discounts" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-ash">
                  {couponsList.length} promotional coupons active in database
                </p>
                <Button onClick={() => setAddCouponOpen(true)} className="gap-2 shadow-sm">
                  <Plus className="size-4" strokeWidth={2} /> Create Coupon
                </Button>
              </div>

              {couponsList.length === 0 ? (
                <EmptyState
                  icon={Tag}
                  title="No coupons created yet."
                  copy="Create promotional codes like EID2026 or FLAT500 with percentage or flat discounts."
                  actionLabel="Create First Coupon"
                  onAction={() => setAddCouponOpen(true)}
                />
              ) : (
                <div className="overflow-x-auto bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60">
                  <table className="w-full min-w-[700px] text-sm text-left">
                    <thead className="bg-paper border-b border-line">
                      <tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-ash">
                        <th className="px-5 py-4">Code</th>
                        <th className="px-5 py-4">Discount Value</th>
                        <th className="px-5 py-4">Min Order</th>
                        <th className="px-5 py-4">Usage Limit</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {couponsList.map((c) => (
                        <tr key={c.id} className="hover:bg-cream/40 transition-colors duration-200">
                          <td className="px-5 py-4 font-mono font-bold text-ink tracking-widest text-base">{c.code}</td>
                          <td className="px-5 py-4 font-semibold text-gold-dark">
                            {c.discountType === "percent" ? `${c.discountValue}% OFF` : `৳${c.discountValue} OFF`}
                          </td>
                          <td className="px-5 py-4 font-mono text-ash">{c.minSpendBDT ? `৳${c.minSpendBDT.toLocaleString()}` : "No min"}</td>
                          <td className="px-5 py-4 text-ash font-mono">{c.maxUsage ? `${c.usedCount || 0} / ${c.maxUsage}` : "Unlimited"}</td>
                          <td className="px-5 py-4">
                            <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 shadow-2xs">
                              Active
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleDeleteCoupon(c.id, c.code)}
                              className="p-2 text-fog hover:text-error hover:bg-error/10 rounded-xs transition-colors cursor-pointer"
                              title="Delete coupon"
                            >
                              <Trash2 className="size-4" strokeWidth={1.5} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* 5. CUSTOMERS TAB */}
          {tab === "customers" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <CustomersCRM orders={orders} />
            </motion.div>
          )}

          {/* 6. INVENTORY TAB */}
          {tab === "inventory" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <InventoryMatrix products={productsList} onEdit={(product) => setEditProduct(product)} />
            </motion.div>
          )}

          {/* 7. BANNERS CMS TAB */}
          {tab === "banners" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl">
              <div className="bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60 p-8 sm:p-10 space-y-8">
                <div className="border-b border-line pb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink flex items-center gap-3">
                      <div className="p-1.5 bg-gold/10 rounded-sm border border-gold/20">
                        <ImageIcon className="size-4 text-gold-dark" />
                      </div>
                      Storefront & Journal Banners CMS
                    </h2>
                    <p className="text-xs text-ash mt-2">
                      Upload and customize banners across your storefront homepage, categories & journal stories.
                    </p>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 shadow-2xs">
                    Live Sync
                  </span>
                </div>

                <form onSubmit={handleSaveBanners} className="space-y-8">
                  <ImageUploadField label="1. Hero Main Banner (Home Top)" value={banners.hero} onChange={(val) => setBanners({ ...banners, hero: val })} />
                  <ImageUploadField label="2. Featured Collection Banner (Collections)" value={banners.collection} onChange={(val) => setBanners({ ...banners, collection: val })} />
                  <div className="grid gap-8 sm:grid-cols-2">
                    <ImageUploadField label="3. Men Category & Dropdown Banner" value={banners.men} onChange={(val) => setBanners({ ...banners, men: val })} />
                    <ImageUploadField label="4. Women Category & Dropdown Banner" value={banners.women} onChange={(val) => setBanners({ ...banners, women: val })} />
                  </div>
                  <ImageUploadField label="5. Brand Story Macro Detail & Main Journal Hero" value={banners.story} onChange={(val) => setBanners({ ...banners, story: val })} />

                  <div className="border-t border-line/60 pt-8 space-y-6">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-ink bg-line/30 inline-block px-3 py-1 rounded-xs">
                      Journal Sub-Article Images (/journal)
                    </p>
                    <div className="grid gap-6 sm:grid-cols-3">
                      <ImageUploadField label="Article 1 (Material Study)" value={banners.journal1 || banners.story} onChange={(val) => setBanners({ ...banners, journal1: val })} />
                      <ImageUploadField label="Article 2 (Inside Studio)" value={banners.journal2 || banners.collection} onChange={(val) => setBanners({ ...banners, journal2: val })} />
                      <ImageUploadField label="Article 3 (Design Notes)" value={banners.journal3 || banners.men} onChange={(val) => setBanners({ ...banners, journal3: val })} />
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button type="submit" loading={savingBanners} size="lg" className="w-full sm:w-auto shadow-md">
                      Save All Banners to Live Website
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* 8. CONTENT CMS TAB */}
          {tab === "content" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-4xl">
              <form onSubmit={handleSaveContent} className="space-y-8">
                <div className="bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60 p-8 space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gold-dark"></div>
                  <div className="border-b border-line pb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink flex items-center gap-3">
                        <div className="p-1.5 bg-gold/10 rounded-sm border border-gold/20">
                          <SlidersHorizontal className="size-4 text-gold-dark" />
                        </div>
                        Storefront Homepage Mode Switcher
                      </h2>
                      <p className="text-xs text-ash mt-2">
                        Choose whether visitors see the luxury editorial lookbook or directly see the instant product catalog.
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-ink text-paper shadow-2xs">
                      Live Selector
                    </span>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label
                      className={cn(
                        "flex items-start gap-4 p-5 rounded-xs border-2 cursor-pointer transition-all duration-300",
                        content.homepageMode === "editorial"
                          ? "border-gold-dark bg-gold/5 shadow-sm"
                          : "border-line/60 hover:border-gold/50 bg-paper/50"
                      )}
                    >
                      <input
                        type="radio"
                        name="homepageMode"
                        checked={content.homepageMode === "editorial"}
                        onChange={() => setContent({ ...content, homepageMode: "editorial" })}
                        className="mt-1 accent-gold-dark size-4.5 cursor-pointer"
                      />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-ink">Option A: Luxury Lookbook</p>
                        <p className="text-xs text-ash mt-1.5 leading-relaxed">
                          Hero banner, Brand Philosophy, Featured Stories, and Curated collections.
                        </p>
                      </div>
                    </label>

                    <label
                      className={cn(
                        "flex items-start gap-4 p-5 rounded-xs border-2 cursor-pointer transition-all duration-300",
                        content.homepageMode === "direct-shop"
                          ? "border-gold-dark bg-gold/5 shadow-sm"
                          : "border-line/60 hover:border-gold/50 bg-paper/50"
                      )}
                    >
                      <input
                        type="radio"
                        name="homepageMode"
                        checked={content.homepageMode === "direct-shop"}
                        onChange={() => setContent({ ...content, homepageMode: "direct-shop" })}
                        className="mt-1 accent-gold-dark size-4.5 cursor-pointer"
                      />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-ink">Option B: Direct Shop (Root /)</p>
                        <p className="text-xs text-ash mt-1.5 leading-relaxed">
                          Directly renders all products, category filters & sorting right on your root domain!
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60 p-8 space-y-5">
                  <div className="border-b border-line pb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink flex items-center gap-2">
                        <Tag className="size-4 text-gold-dark" /> Value Marquee Texts (Under Hero)
                      </h2>
                      <p className="text-xs text-ash mt-1">
                        Separate each text item using a vertical pipe (<strong className="font-mono text-ink">|</strong>).
                      </p>
                    </div>
                  </div>
                  <Input
                    label="Marquee Items (Pipe | Separated) *"
                    value={content.marqueeItems || ""}
                    onChange={(e) => setContent({ ...content, marqueeItems: e.target.value })}
                    placeholder="Dhaka Atelier Hand-Finished | Numbered Micro Runs | Complimentary Delivery Over ৳15,000"
                  />
                </div>

                <div className="bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60 p-8 space-y-6">
                  <div className="border-b border-line pb-5">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink flex items-center gap-3">
                      <div className="p-1.5 bg-gold/10 rounded-sm border border-gold/20">
                        <FileText className="size-4 text-gold-dark" />
                      </div>
                      Shop Page Header & Badge Texts (/shop)
                    </h2>
                  </div>
                  <div className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Input
                        label="Shop Top Eyebrow"
                        value={content.shopContent?.eyebrow || ""}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            shopContent: { ...content.shopContent, eyebrow: e.target.value },
                          })
                        }
                        placeholder="THOLVEX STUDIO — SS26"
                      />
                      <Input
                        label="Shop Main Heading"
                        value={content.shopContent?.heading || ""}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            shopContent: { ...content.shopContent, heading: e.target.value },
                          })
                        }
                        placeholder="All Products"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-[0.18em] font-medium text-ash">
                        Shop Description Subtitle
                      </label>
                      <textarea
                        rows={2}
                        value={content.shopContent?.description || ""}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            shopContent: { ...content.shopContent, description: e.target.value },
                          })
                        }
                        className="w-full rounded-xs border border-line bg-paper/40 p-4 text-sm text-ink outline-none focus:border-gold transition-all shadow-2xs"
                      />
                    </div>
                    <Input
                      label="Counter Badge Label"
                      value={content.shopContent?.badgeLabel || ""}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          shopContent: { ...content.shopContent, badgeLabel: e.target.value },
                        })
                      }
                      placeholder="garments in atelier"
                    />
                  </div>
                </div>

                <div className="bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60 p-8 space-y-8">
                  <div className="border-b border-line pb-5">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink flex items-center gap-3">
                      <div className="p-1.5 bg-gold/10 rounded-sm border border-gold/20">
                        <FileText className="size-4 text-gold-dark" />
                      </div>
                      Homepage Sections Text CMS
                    </h2>
                  </div>

                  <div className="space-y-10">
                    {[
                      { id: "hero", title: "1. Hero Top Section", prefix: "hero" },
                      { id: "featured", title: "2. Featured Collection Section", prefix: "featured" },
                      { id: "story", title: "3. The Philosophy (Dark Section)", prefix: "story" },
                      { id: "core", title: "4. Core 01 Section", prefix: "core" },
                      { id: "newsletter", title: "5. Newsletter (Stay in Form)", prefix: "newsletter" },
                    ].map((section) => (
                      <div key={section.id} className="space-y-5 border-b border-line/50 pb-8 last:border-0 last:pb-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink bg-line/30 inline-block px-3 py-1.5 rounded-xs shadow-2xs">
                          {section.title}
                        </p>
                        <div className="grid gap-5 sm:grid-cols-2">
                          <Input
                            label="Eyebrow"
                            value={content.homeContent?.[`${section.prefix}Eyebrow`] || ""}
                            onChange={(e) =>
                              setContent({
                                ...content,
                                homeContent: {
                                  ...content.homeContent,
                                  [`${section.prefix}Eyebrow`]: e.target.value,
                                },
                              })
                            }
                          />
                          <Input
                            label="Heading"
                            value={content.homeContent?.[`${section.prefix}Heading`] || ""}
                            onChange={(e) =>
                              setContent({
                                ...content,
                                homeContent: {
                                  ...content.homeContent,
                                  [`${section.prefix}Heading`]: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] uppercase tracking-[0.18em] font-medium text-ash">
                            Paragraph Description
                          </label>
                          <textarea
                            rows={2}
                            value={content.homeContent?.[`${section.prefix}Body`] || ""}
                            onChange={(e) =>
                              setContent({
                                ...content,
                                homeContent: {
                                  ...content.homeContent,
                                  [`${section.prefix}Body`]: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xs border border-line bg-paper/40 p-4 text-sm text-ink outline-none focus:border-gold transition-all shadow-2xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60 p-8 space-y-6">
                  <div className="border-b border-line pb-5">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink flex items-center gap-3">
                      <div className="p-1.5 bg-gold/10 rounded-sm border border-gold/20">
                        <Share2 className="size-4 text-gold-dark" />
                      </div>
                      Social Media Links (Footer)
                    </h2>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {["instagram", "facebook", "tiktok", "pinterest"].map((social) => (
                      <Input
                        key={social}
                        label={`${social.charAt(0).toUpperCase() + social.slice(1)} URL`}
                        placeholder={`https://${social}.com/...`}
                        value={content.socials?.[social] || ""}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            socials: { ...content.socials, [social]: e.target.value },
                          })
                        }
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60 p-8 space-y-6">
                  <div className="border-b border-line pb-5 flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink flex items-center gap-3">
                      <div className="p-1.5 bg-gold/10 rounded-sm border border-gold/20">
                        <HelpCircle className="size-4 text-gold-dark" />
                      </div>
                      FAQ Questions & Answers
                    </h2>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setContent({
                          ...content,
                          faqs: [...(content.faqs || []), { q: "New Question Title", a: "Answer text goes here..." }],
                        })
                      }
                    >
                      + Add FAQ
                    </Button>
                  </div>
                  <div className="space-y-5">
                    {(content.faqs || []).map((faq: any, idx: number) => (
                      <div
                        key={idx}
                        className="border border-line/60 rounded-sm p-6 bg-paper/30 space-y-4 relative group hover:border-gold/50 transition-colors shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold tracking-[0.2em] text-gold-dark uppercase bg-gold/10 px-3 py-1 rounded-xs shadow-2xs">
                            Question {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setContent({
                                ...content,
                                faqs: content.faqs.filter((_: any, i: number) => i !== idx),
                              })
                            }
                            className="text-fog hover:text-error transition-colors cursor-pointer"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={faq.q}
                          onChange={(e) => {
                            const updated = [...content.faqs];
                            updated[idx].q = e.target.value;
                            setContent({ ...content, faqs: updated });
                          }}
                          className="w-full rounded-xs border border-line bg-paper/60 p-3.5 text-sm font-semibold text-ink outline-none focus:border-gold transition-all shadow-2xs"
                          placeholder="Question..."
                        />
                        <textarea
                          rows={2}
                          value={faq.a}
                          onChange={(e) => {
                            const updated = [...content.faqs];
                            updated[idx].a = e.target.value;
                            setContent({ ...content, faqs: updated });
                          }}
                          className="w-full rounded-xs border border-line bg-paper/60 p-3.5 text-sm text-ink outline-none focus:border-gold transition-all shadow-2xs"
                          placeholder="Answer..."
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60 p-8 space-y-6">
                  <div className="border-b border-line pb-5">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink flex items-center gap-3">
                      <div className="p-1.5 bg-gold/10 rounded-sm border border-gold/20">
                        <FileText className="size-4 text-gold-dark" />
                      </div>
                      About Page Texts (/about)
                    </h2>
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-[0.18em] font-medium text-ash">
                        Main Big Heading *
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={content.about?.heading || ""}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            about: { ...content.about, heading: e.target.value },
                          })
                        }
                        className="w-full rounded-xs border border-line bg-paper/40 p-4 font-display text-lg text-ink outline-none focus:border-gold transition-all shadow-2xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-[0.18em] font-medium text-ash">
                        Brand Story Description Paragraph *
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={content.about?.story || ""}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            about: { ...content.about, story: e.target.value },
                          })
                        }
                        className="w-full rounded-xs border border-line bg-paper/40 p-4 text-sm text-ink outline-none focus:border-gold transition-all leading-relaxed shadow-2xs"
                      />
                    </div>

                    <div className="pt-6 border-t border-line/60 space-y-6">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink bg-line/30 inline-block px-3 py-1.5 rounded-xs shadow-2xs">
                        Three Philosophy Pillars
                      </p>
                      {[1, 2, 3].map((num) => (
                        <div key={num} className="grid gap-5 sm:grid-cols-2">
                          <Input
                            label={`Pillar ${num} Title`}
                            value={content.about?.[`point${num}Title`] || ""}
                            onChange={(e) =>
                              setContent({
                                ...content,
                                about: { ...content.about, [`point${num}Title`]: e.target.value },
                              })
                            }
                          />
                          <div className="space-y-2">
                            <label className="text-[11px] uppercase tracking-[0.18em] font-medium text-ash">
                              Pillar {num} Description
                            </label>
                            <textarea
                              rows={2}
                              value={content.about?.[`point${num}Body`] || ""}
                              onChange={(e) =>
                                setContent({
                                  ...content,
                                  about: { ...content.about, [`point${num}Body`]: e.target.value },
                                })
                              }
                              className="w-full rounded-xs border border-line bg-paper/40 p-3.5 text-sm text-ink outline-none focus:border-gold transition-all shadow-2xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60 p-8 space-y-6">
                  <div className="border-b border-line pb-5">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink flex items-center gap-3">
                      <div className="p-1.5 bg-gold/10 rounded-sm border border-gold/20">
                        <FileText className="size-4 text-gold-dark" />
                      </div>
                      Store Policies & Legal Copy
                    </h2>
                  </div>
                  <div className="space-y-6">
                    {[
                      { key: "shipping", label: "1. Shipping & Delivery Policy (/shipping-policy)" },
                      { key: "returns", label: "2. 14-Day Return & Exchange Policy (/return-policy)" },
                      { key: "privacy", label: "3. Privacy Policy (/privacy)" },
                      { key: "terms", label: "4. Terms of Service (/terms)" },
                      { key: "cookies", label: "5. Cookie Consent Policy (/cookies)", rows: 3 },
                    ].map((policy) => (
                      <div key={policy.key} className="space-y-2">
                        <label className="text-[11px] uppercase tracking-[0.18em] font-medium text-ash">
                          {policy.label}
                        </label>
                        <textarea
                          rows={policy.rows || 4}
                          value={content.legal?.[policy.key] || ""}
                          onChange={(e) =>
                            setContent({
                              ...content,
                              legal: { ...content.legal, [policy.key]: e.target.value },
                            })
                          }
                          placeholder="Enter policy details..."
                          className="w-full rounded-xs border border-line bg-paper/40 p-4 text-sm text-ink outline-none focus:border-gold transition-all leading-relaxed shadow-2xs"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="pt-6 border-t border-line/60">
                    <Button type="submit" loading={savingContent} size="lg" className="w-full sm:w-auto shadow-md">
                      Save All Content to Live Database
                    </Button>
                  </div>
                </div>
              </form>

              <div className="bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60 p-8 space-y-6">
                <div className="border-b border-line pb-5 flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink flex items-center gap-3">
                    <div className="p-1.5 bg-gold/10 rounded-sm border border-gold/20">
                      <BookOpen className="size-4 text-gold-dark" />
                    </div>
                    Journal Stories Publisher (/journal)
                  </h2>
                  <Button
                    onClick={() => {
                      setEditingArticle(null);
                      setArticleForm({ title: "", eyebrow: "Design Notes", excerpt: "", body: "", image: "" });
                      setArticleModalOpen(true);
                    }}
                    className="gap-2 shadow-sm"
                  >
                    <Plus className="size-4" strokeWidth={2} /> Add New Story
                  </Button>
                </div>

                <div>
                  {articles.length === 0 ? (
                    <EmptyState
                      icon={BookOpen}
                      title="No stories published."
                      copy="Click 'Add New Story' above to start your editorial journal."
                    />
                  ) : (
                    <div className="overflow-x-auto rounded-sm border border-line/60 bg-paper/40">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-paper border-b border-line">
                          <tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-ash">
                            <th className="px-5 py-4">Story Title</th>
                            <th className="px-5 py-4">Category</th>
                            <th className="px-5 py-4">Slug (URL)</th>
                            <th className="px-5 py-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line/60">
                          {articles.map((art) => (
                            <tr key={art.slug} className="hover:bg-cream/40 transition-colors duration-200">
                              <td className="px-5 py-4 font-semibold text-ink">{art.title}</td>
                              <td className="px-5 py-4 text-gold-dark font-mono text-xs">{art.eyebrow}</td>
                              <td className="px-5 py-4 text-fog font-mono text-xs select-all">/journal/{art.slug}</td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingArticle(art);
                                      setArticleForm({
                                        title: art.title,
                                        eyebrow: art.eyebrow,
                                        excerpt: art.excerpt,
                                        body: Array.isArray(art.body) ? art.body.join("\n\n") : art.body || "",
                                        image: art.image || "",
                                      });
                                      setArticleModalOpen(true);
                                    }}
                                    className="p-2 text-fog hover:text-blue-600 hover:bg-blue-500/10 rounded-xs transition-colors cursor-pointer"
                                  >
                                    <Pencil className="size-4" strokeWidth={1.5} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteArticle(art.id || art.slug, art.title)}
                                    className="p-2 text-fog hover:text-error hover:bg-error/10 rounded-xs transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="size-4" strokeWidth={1.5} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* 9. SETTINGS TAB */}
          {tab === "settings" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-3xl">
              <div className="bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60 p-8 space-y-6">
                <div className="border-b border-line pb-5 flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink flex items-center gap-3">
                    <div className="p-1.5 bg-gold/10 rounded-sm border border-gold/20">
                      <KeyRound className="size-4 text-gold-dark" />
                    </div>
                    Master Administrator Credentials
                  </h2>
                  <span className="text-[9px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full bg-ink text-paper shadow-2xs">
                    Super Admin
                  </span>
                </div>
                <form onSubmit={handleUpdateAdminProfile} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Administrator Name *"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Full Name"
                    />
                    <Input
                      label="Login Email *"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@domain.com"
                    />
                  </div>
                  <Input
                    label="Update Security Passcode (Leave blank to keep current)"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter new passcode (min 6 characters)"
                  />
                  <div className="pt-2">
                    <Button type="submit" loading={savingProfile}>
                      Save Master Credentials
                    </Button>
                  </div>
                </form>
              </div>

              <div className="bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60 p-8 space-y-6">
                <div className="border-b border-line pb-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink flex items-center gap-3">
                      <div className="p-1.5 bg-gold/10 rounded-sm border border-gold/20">
                        <UserPlus className="size-4 text-gold-dark" />
                      </div>
                      Team & Staff Role Delegation
                    </h2>
                    <p className="text-xs text-ash mt-2">
                      Staff members log in through{" "}
                      <strong className="text-ink bg-line/40 px-1.5 py-0.5 rounded-sm font-mono">/staff</strong> with restricted
                      access.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={copyStaffPortalUrl} className="gap-2">
                    {copiedLink ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                    <span>{copiedLink ? "Link Copied!" : "Copy /staff Link"}</span>
                  </Button>
                </div>

                <form onSubmit={handleCreateStaff} className="space-y-5 bg-paper/40 rounded-sm border border-line/60 p-6 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink">Add New Team Member</p>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Staff Name *"
                      required
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="e.g. Tanvir Rahman"
                    />
                    <Input
                      label="Staff Email *"
                      required
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      placeholder="tanvir@domain.com"
                    />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Designation / Role Title *"
                      required
                      value={newStaffRoleTitle}
                      onChange={(e) => setNewStaffRoleTitle(e.target.value)}
                      placeholder="e.g. Operations Coordinator"
                    />
                    <Input
                      label="Assigned Passcode (min 6 chars) *"
                      type="password"
                      required
                      value={newStaffPassword}
                      onChange={(e) => setNewStaffPassword(e.target.value)}
                      placeholder="••••••••••••"
                    />
                  </div>
                  <div className="space-y-3 pt-4 border-t border-line">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fog">Assigned Modules:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { id: "orders", label: "Orders & Courier" },
                        { id: "products", label: "Products Catalog" },
                        { id: "inventory", label: "Stock Inventory" },
                        { id: "discounts", label: "Discounts" },
                        { id: "customers", label: "Customers (CRM)" },
                      ].map((perm) => (
                        <label
                          key={perm.id}
                          className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xs border border-line bg-paper/60 hover:border-gold/50 transition-colors shadow-2xs group"
                        >
                          <input
                            type="checkbox"
                            checked={newStaffPerms.includes(perm.id)}
                            onChange={(e) => {
                              if (e.target.checked) setNewStaffPerms([...newStaffPerms, perm.id]);
                              else setNewStaffPerms(newStaffPerms.filter((x) => x !== perm.id));
                            }}
                            className="accent-gold-dark size-4 cursor-pointer"
                          />
                          <span className="text-[11px] font-semibold text-ink group-hover:text-gold-dark transition-colors">
                            {perm.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button type="submit" loading={creatingStaff}>
                      + Add Staff Member
                    </Button>
                  </div>
                </form>

                <div className="space-y-4 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink">
                    Active Team Members ({staffList.length})
                  </p>
                  {staffList.length === 0 ? (
                    <p className="text-sm text-ash">No staff members assigned yet.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-sm border border-line/60 bg-paper/40">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-paper border-b border-line">
                          <tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-ash">
                            <th className="px-5 py-4">Staff Name</th>
                            <th className="px-5 py-4">Email</th>
                            <th className="px-5 py-4">Designation</th>
                            <th className="px-5 py-4">Allowed Modules</th>
                            <th className="px-5 py-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line/60">
                          {staffList.map((s) => (
                            <tr key={s.id} className="hover:bg-cream/40 transition-colors duration-200">
                              <td className="px-5 py-4 font-semibold text-ink">{s.name}</td>
                              <td className="px-5 py-4 text-ash font-mono text-xs">{s.email}</td>
                              <td className="px-5 py-4 font-semibold text-gold-dark text-xs">{s.roleTitle || "Staff"}</td>
                              <td className="px-5 py-4">
                                <div className="flex flex-wrap gap-1.5">
                                  {(s.permissions || []).map((p: string) => (
                                    <span
                                      key={p}
                                      className="px-2.5 py-1 rounded-xs bg-line/30 text-ink text-[9px] uppercase font-bold tracking-widest shadow-2xs"
                                    >
                                      {p}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <button
                                  onClick={() => handleDeleteStaff(s.id, s.name)}
                                  className="text-error hover:text-paper hover:bg-error px-3 py-1.5 rounded-xs text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border border-transparent hover:border-error shadow-2xs"
                                >
                                  Revoke
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-error/5 rounded-sm shadow-sm border border-error/20 p-8 space-y-6">
                <div className="border-b border-error/20 pb-5">
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-error flex items-center gap-3">
                    <div className="p-1.5 bg-error/10 rounded-sm">
                      <RotateCcw className="size-4 text-error" />
                    </div>
                    Database Maintenance & Archive Reset
                  </h2>
                  <p className="text-xs text-error/70 mt-2">
                    Purge operational records for seasonal turnover. Caution: This action cannot be undone.
                  </p>
                </div>
                <div className="grid gap-5 sm:grid-cols-3">
                  <div className="bg-paper rounded-xs border border-error/20 p-5 space-y-3 shadow-2xs hover:border-error/50 transition-colors">
                    <p className="text-xs font-bold text-ink">Reset Orders Archive</p>
                    <p className="text-[11px] text-ash leading-relaxed">Permanently clears historical orders.</p>
                    <button
                      onClick={() => handleExecuteReset("orders")}
                      className="w-full mt-2 bg-error/10 text-error border border-error/30 rounded-xs text-[10px] font-bold uppercase tracking-widest py-2 hover:bg-error hover:text-paper transition-colors cursor-pointer shadow-2xs"
                    >
                      Reset Orders ({orders.length})
                    </button>
                  </div>
                  <div className="bg-paper rounded-xs border border-error/20 p-5 space-y-3 shadow-2xs hover:border-error/50 transition-colors">
                    <p className="text-xs font-bold text-ink">Reset Products Catalog</p>
                    <p className="text-[11px] text-ash leading-relaxed">Permanently clears garment entries.</p>
                    <button
                      onClick={() => handleExecuteReset("products")}
                      className="w-full mt-2 bg-error/10 text-error border border-error/30 rounded-xs text-[10px] font-bold uppercase tracking-widest py-2 hover:bg-error hover:text-paper transition-colors cursor-pointer shadow-2xs"
                    >
                      Reset Products ({productsList.length})
                    </button>
                  </div>
                  <div className="bg-paper rounded-xs border border-error/20 p-5 space-y-3 shadow-2xs hover:border-error/50 transition-colors">
                    <p className="text-xs font-bold text-ink">Reset Discount Codes</p>
                    <p className="text-[11px] text-ash leading-relaxed">Permanently clears vouchers.</p>
                    <button
                      onClick={() => handleExecuteReset("coupons")}
                      className="w-full mt-2 bg-error/10 text-error border border-error/30 rounded-xs text-[10px] font-bold uppercase tracking-widest py-2 hover:bg-error hover:text-paper transition-colors cursor-pointer shadow-2xs"
                    >
                      Reset Coupons ({couponsList.length})
                    </button>
                  </div>
                </div>
                <div className="border-t border-error/20 pt-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-error">Master System Data Reset</p>
                    <p className="text-[11px] text-error/70 mt-1.5">Purge all orders, products, and coupon tables simultaneously.</p>
                  </div>
                  <button
                    onClick={() => handleExecuteReset("all")}
                    className="bg-error text-paper px-6 py-3.5 rounded-xs text-[11px] font-bold uppercase tracking-widest hover:bg-error/90 transition-colors shadow-md border border-error cursor-pointer"
                  >
                    Master System Reset
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <Modal
        open={articleModalOpen}
        onClose={() => setArticleModalOpen(false)}
        title={editingArticle ? `Edit — ${editingArticle.title}` : "Publish New Journal Story"}
        wide
      >
        <form onSubmit={handleSaveArticle} className="space-y-6">
          <Input
            label="Story Title *"
            required
            value={articleForm.title}
            onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
            placeholder="e.g. The New Uniform / Material Study"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Story Eyebrow Category *"
              required
              value={articleForm.eyebrow}
              onChange={(e) => setArticleForm({ ...articleForm, eyebrow: e.target.value })}
              placeholder="e.g. Design Notes / Process"
            />
            <Input
              label="Excerpt (Short Summary) *"
              required
              value={articleForm.excerpt}
              onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
              placeholder="A brief summary for previews..."
            />
          </div>
          <ImageUploadField
            label="Story Cover Photo (Drag & Drop / Link)"
            value={articleForm.image}
            onChange={(val) => setArticleForm({ ...articleForm, image: val })}
          />
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-[0.18em] font-medium text-ash block">
              Story Body Paragraphs * (Separate paragraphs with double Enter)
            </label>
            <textarea
              rows={8}
              required
              value={articleForm.body}
              onChange={(e) => setArticleForm({ ...articleForm, body: e.target.value })}
              placeholder="Write the full story here..."
              className="w-full rounded-xs border border-line bg-paper/40 p-4 text-sm leading-relaxed outline-none focus:border-gold font-sans text-ink transition-all shadow-2xs hover:border-gold/50"
            />
          </div>
          <div className="flex gap-4 pt-5 border-t border-line">
            <Button type="submit" loading={savingArticle}>
              {editingArticle ? "Save Changes" : "Publish Story to Journal"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setArticleModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <OfflineOrderModal
        open={offlineOrderOpen}
        onClose={() => setOfflineOrderOpen(false)}
        products={productsList}
        onSuccess={() => {
          setOfflineOrderOpen(false);
          fetchOrders();
          fetchProducts();
        }}
      />

      {viewOrder && (
        <CourierPackingSlipModal
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onStatusChange={setOrderStatus}
          onOrderUpdated={fetchOrders}
          isBlacklisted={blacklistedPhones.includes(viewOrder.address.phone)}
          onToggleBlacklist={handleToggleBlacklist}
        />
      )}
      <ProductEditModal product={editProduct} onClose={() => setEditProduct(null)} onSave={saveEdit} />
      <AddProductModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAddProduct} />
      <AddCouponModal open={addCouponOpen} onClose={() => setAddCouponOpen(false)} onAdd={handleCreateCoupon} />
    </div>
  );
}

/* ————————————————— SUB-COMPONENTS (MODALS & TABS) ————————————————— */

function OfflineOrderModal({
  open,
  onClose,
  products,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  products: Product[];
  onSuccess: () => void;
}) {
  const { push } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cAddress, setCAddress] = useState("");
  const [cCity, setCCity] = useState("Dhaka");
  const [items, setItems] = useState<
    { pId: string; pName: string; size: string; color: string; qty: number; price: number; image: string }[]
  >([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [advancePaid, setAdvancePaid] = useState<number | "">("");
  const [trxId, setTrxId] = useState("");
  const [senderPhone, setSenderPhone] = useState("");

  const activeProduct = products.find((p) => p.id === selectedProductId);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const isInsideDhaka = cCity.trim().toLowerCase() === "dhaka";
  const shipping =
    items.length === 0
      ? 0
      : subtotal >= BRAND_CONFIG.shipping.freeShippingThreshold
      ? 0
      : isInsideDhaka
      ? BRAND_CONFIG.shipping.insideDhakaFee
      : BRAND_CONFIG.shipping.outsideDhakaFee;
  const total = subtotal + shipping;
  const adv = Number(advancePaid) || 0;
  const due = Math.max(0, total - adv);

  const handleAddItem = () => {
    if (!activeProduct || !selectedSize) {
      push("error", "Select a product and size.");
      return;
    }
    setItems([
      ...items,
      {
        pId: activeProduct.id,
        pName: activeProduct.name,
        size: selectedSize,
        color: activeProduct.colors?.[0]?.name || "Default",
        qty: itemQty,
        price: activeProduct.priceBDT,
        image: activeProduct.images?.[0]?.src || "",
      },
    ]);
    setSelectedProductId("");
    setSelectedSize("");
    setItemQty(1);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      push("error", "Add at least one item.");
      return;
    }
    if (!cName || !cPhone || !cAddress) {
      push("error", "Customer name, phone and address required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id: `NF-${Math.floor(100000 + Math.random() * 900000)}`,
        customerName: cName,
        customerPhone: cPhone,
        customerEmail: `${cPhone}@offline.com`,
        items: items.map((i) => ({
          productId: i.pId,
          name: i.pName,
          size: i.size,
          color: i.color,
          quantity: i.qty,
          priceBDT: i.price,
          image: i.image,
        })),
        shippingAddress: {
          division: cCity,
          district: cCity,
          address: cAddress,
          advancePaidBDT: adv,
          dueAmountBDT: due,
          senderNumber: senderPhone || "N/A",
          transactionId: trxId || "N/A",
        },
        subtotalBDT: subtotal,
        shippingBDT: shipping,
        discountBDT: 0,
        totalBDT: total,
        paymentMethod: `Manual / Messenger [Adv: ৳${adv} | Trx: ${trxId || "N/A"}]`,
        paymentStatus: "CONFIRMED",
        orderStatus: "CONFIRMED",
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        push("success", "Offline order placed successfully!");
        setCName("");
        setCPhone("");
        setCAddress("");
        setItems([]);
        setAdvancePaid("");
        setTrxId("");
        setSenderPhone("");
        onSuccess();
      } else {
        push("error", "Failed to place offline order.");
      }
    } catch {
      push("error", "Server error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Offline / Messenger Order" wide>
      <form onSubmit={handlePlaceOrder} className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink border-b border-line pb-2.5">
              Customer Details
            </h3>
            <Input label="Name *" required value={cName} onChange={(e) => setCName(e.target.value)} placeholder="e.g. Tanvir Ahmed" />
            <Input label="Phone *" required value={cPhone} onChange={(e) => setCPhone(e.target.value)} placeholder="017XXXXXXXX" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Address *" required value={cAddress} onChange={(e) => setCAddress(e.target.value)} placeholder="House, Road, Area" />
              <Select
                label="City *"
                value={cCity}
                onChange={(e) => setCCity(e.target.value)}
                options={["Dhaka", "Chattogram", "Sylhet", "Khulna", "Rajshahi", "Barishal", "Rangpur", "Mymensingh"].map((c) => ({
                  label: c,
                  value: c,
                }))}
              />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink border-b border-line pb-2.5">
              Advance Payment
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Advance Paid (৳)"
                type="number"
                min={0}
                value={advancePaid}
                onChange={(e) => setAdvancePaid(Number(e.target.value))}
                placeholder="e.g. 150"
              />
              <Input label="Sender No." value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} placeholder="017..." />
              <Input label="TrxID" value={trxId} onChange={(e) => setTrxId(e.target.value.toUpperCase())} placeholder="TRX..." />
            </div>
          </div>
        </div>

        <div className="space-y-6 flex flex-col h-full bg-paper/50 rounded-sm border border-line/60 p-6 shadow-sm">
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink border-b border-line pb-2.5">
              Add Garments
            </h3>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Select
                  label="Product"
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    setSelectedSize("");
                  }}
                  options={[
                    { label: "Select Product...", value: "" },
                    ...products.map((p) => ({ label: `${p.name} - ${formatPrice(p.priceBDT)}`, value: p.id })),
                  ]}
                />
              </div>
              <div className="w-20">
                <Select
                  label="Size"
                  disabled={!activeProduct}
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  options={[
                    { label: "-", value: "" },
                    ...(activeProduct?.sizes.map((s) => ({ label: `${s.size} (${s.stock})`, value: s.size })) || []),
                  ]}
                />
              </div>
              <div className="w-16">
                <Input label="Qty" type="number" min={1} value={itemQty} onChange={(e) => setItemQty(Number(e.target.value))} />
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="h-12 w-12 flex items-center justify-center rounded-xs bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer active:scale-95"
              >
                <Plus className="size-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="flex-1 bg-paper border border-line rounded-xs p-5 space-y-4 shadow-2xs overflow-y-auto max-h-[200px] thin-scroll">
            {items.length === 0 ? (
              <p className="text-xs text-ash text-center py-6 font-medium">No items added to this order yet.</p>
            ) : (
              <ul className="space-y-3.5 text-sm divide-y divide-line/60">
                {items.map((i, idx) => (
                  <li key={idx} className="flex justify-between pt-3.5 first:pt-0">
                    <span className="font-semibold text-ink">
                      {i.pName} <span className="text-fog font-normal">({i.size}) x {i.qty}</span>
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-bold text-gold-dark">{formatPrice(i.price * i.qty)}</span>
                      <button
                        type="button"
                        onClick={() => setItems(items.filter((_, index) => index !== idx))}
                        className="text-error hover:text-error/80 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3 border-t border-line pt-5 text-sm font-medium">
            <div className="flex justify-between text-ash">
              <p>Subtotal</p>
              <p>{formatPrice(subtotal)}</p>
            </div>
            <div className="flex justify-between text-ash">
              <p>Delivery ({isInsideDhaka ? "Inside" : "Outside"} Dhaka)</p>
              <p>{formatPrice(shipping)}</p>
            </div>
            <div className="flex justify-between font-bold text-lg text-ink pt-1.5">
              <p>Total</p>
              <p>{formatPrice(total)}</p>
            </div>
            <div className="flex justify-between text-xs pt-2.5 border-t border-line/60">
              <p className="text-emerald-700 font-bold uppercase tracking-wider">Advance Paid</p>
              <p className="text-emerald-700 font-bold font-mono">-{formatPrice(adv)}</p>
            </div>
            <div className="flex justify-between text-base font-bold text-error pt-1.5">
              <p>Due on Delivery</p>
              <p>{formatPrice(due)}</p>
            </div>
          </div>

          <Button type="submit" loading={submitting} className="w-full h-14 mt-auto">
            Create Offline Order
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function InventoryMatrix({ products, onEdit }: { products: Product[]; onEdit: (p: Product) => void }) {
  const [filterType, setFilterType] = useState<"all" | "low" | "out">("all");
  const filteredProducts = useMemo(() => {
    if (filterType === "out") return products.filter((p) => isSoldOut(p));
    if (filterType === "low") return products.filter((p) => isLowStock(p));
    return products;
  }, [products, filterType]);
  const totalPiecesInStore = useMemo(() => products.reduce((acc, p) => acc + totalStock(p), 0), [products]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink">Live Atelier Stock Inventory</h2>
          <p className="text-xs text-ash mt-1.5">
            Total Available Stock:{" "}
            <strong className="text-gold-dark font-mono font-bold tracking-tight">{totalPiecesInStore} pieces</strong> across{" "}
            {products.length} garments
          </p>
        </div>
        <div className="flex items-center gap-2 bg-line/20 p-1.5 rounded-sm border border-line/50">
          {(
            [
              ["all", "All Stock"],
              ["low", "Low Stock"],
              ["out", "Sold Out"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilterType(key)}
              className={cn(
                "px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] rounded-xs transition-all duration-200 cursor-pointer",
                filterType === key ? "bg-paper text-ink shadow-xs" : "text-fog hover:text-ink"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60">
        <table className="w-full min-w-[850px] text-sm text-left">
          <thead className="bg-paper border-b border-line">
            <tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-ash">
              <th className="px-5 py-4">Garment</th>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4">Size Breakdown (Units)</th>
              <th className="px-5 py-4">Total In Stock</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {filteredProducts.map((p) => {
              const stock = totalStock(p);
              const soldOut = isSoldOut(p);
              const low = isLowStock(p);
              return (
                <tr key={p.id} className="hover:bg-cream/40 transition-colors duration-200">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative size-14 shrink-0 rounded-xs shadow-sm border border-line overflow-hidden">
                        <Image src={p.images?.[0]?.src || "/images/product-tee.jpg"} alt={p.name} fill sizes="56px" className="object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold text-ink">{p.name}</p>
                        <p className="text-[11px] text-fog font-mono mt-0.5">{p.sku || p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-ash text-xs">
                    {p.category} <span className="text-fog/50">/ {p.gender}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2 max-w-xs">
                      {(p.sizes || []).map((s) => (
                        <span
                          key={s.size}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-[10px] font-mono font-bold shadow-2xs border",
                            s.stock === 0
                              ? "bg-error/10 text-error border-error/20 line-through"
                              : s.stock <= 2
                              ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                              : "bg-paper text-ink border-line/60"
                          )}
                        >
                          <span className="opacity-60">{s.size}:</span>
                          <span>{s.stock}</span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-gold-dark text-base">
                    {stock} <span className="text-xs text-fog">pcs</span>
                  </td>
                  <td className="px-5 py-4">
                    {soldOut ? (
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-error/10 text-error border border-error/20">
                        <AlertTriangle className="size-3" /> Sold Out
                      </span>
                    ) : low ? (
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                        Healthy
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => onEdit(p)}
                      className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-ink font-bold border border-line rounded-xs shadow-2xs px-3 py-2 hover:bg-ink hover:text-paper hover:border-ink transition-colors cursor-pointer"
                    >
                      <Pencil className="size-3.5" /> Edit Stock
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CustomersCRM({ orders }: { orders: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const customers = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; orders: number; spent: number; last: string }>();
    orders.forEach((o) => {
      const emailKey = o.email || o.address?.phone || "guest";
      const cur = map.get(emailKey) ?? {
        name: o.address?.fullName || "Valued Client",
        phone: o.address?.phone || "",
        orders: 0,
        spent: 0,
        last: o.placedAt,
      };
      cur.orders += 1;
      cur.spent += o.totalBDT || 0;
      if (o.placedAt > cur.last) cur.last = o.placedAt;
      map.set(emailKey, cur);
    });
    return [...map.entries()];
  }, [orders]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      ([email, c]) =>
        c.name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  if (!customers.length)
    return (
      <EmptyState
        icon={Users}
        title="No customers yet."
        copy="Customer profiles are automatically generated from live orders placed on your store."
      />
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink">Client Relations Management (CRM)</h2>
          <p className="text-xs text-ash mt-1.5">{customers.length} total registered clients in database</p>
        </div>
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, phone or email..."
            className="w-full h-12 rounded-xs border border-line bg-paper/50 shadow-2xs px-4 pl-11 text-sm text-ink outline-none focus:bg-paper focus:border-gold font-sans transition-all duration-200"
          />
          <Search className="size-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-fog" strokeWidth={1.5} />
        </div>
      </div>
      <div className="overflow-x-auto bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60">
        <table className="w-full min-w-[850px] text-sm text-left">
          <thead className="bg-paper border-b border-line">
            <tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-ash">
              <th className="px-5 py-4">Client Profile</th>
              <th className="px-5 py-4">Contact Phone</th>
              <th className="px-5 py-4">Orders Placed</th>
              <th className="px-5 py-4">Total Spend</th>
              <th className="px-5 py-4">Client Status</th>
              <th className="px-5 py-4">Last Purchase</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {filtered.map(([email, c]) => {
              const isVIP = c.spent >= 10000 || c.orders >= 3;
              const isRepeat = c.orders > 1;
              return (
                <tr key={email} className="hover:bg-cream/40 transition-colors duration-200">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-ink">{c.name}</p>
                    <p className="text-[11px] text-fog font-mono mt-0.5">{email}</p>
                  </td>
                  <td className="px-5 py-4 text-ash font-mono select-all text-xs">{c.phone || "—"}</td>
                  <td className="px-5 py-4 font-bold text-ink">{c.orders} orders</td>
                  <td className="px-5 py-4 font-bold text-gold-dark font-mono">
                    <Price amountBDT={c.spent} />
                  </td>
                  <td className="px-5 py-4">
                    {isVIP ? (
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-gold/10 text-gold-dark border border-gold/30 shadow-2xs">
                        <Sparkles className="size-3 text-gold" /> VIP Client
                      </span>
                    ) : isRepeat ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 border border-blue-500/20 shadow-2xs">
                        Repeat Buyer
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-line/40 text-ink border border-line/60 shadow-2xs">
                        New Client
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-fog font-mono text-xs">{new Date(c.last).toLocaleDateString("en-GB")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddCouponModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (coupon: any) => void }) {
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState(10);
  const [minSpendBDT, setMinSpendBDT] = useState(0);
  const [maxUsage, setMaxUsage] = useState<number | string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minSpendBDT: Number(minSpendBDT) || 0,
      maxUsage: maxUsage ? Number(maxUsage) : null,
    });
    setCode("");
    setMinSpendBDT(0);
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Discount Coupon">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Coupon Code (e.g. EID2026, SUMMER500)"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="EID2026"
        />
        <div className="grid grid-cols-2 gap-5">
          <Select
            label="Discount Type"
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
            options={[
              { value: "percent", label: "Percentage (% OFF)" },
              { value: "fixed", label: "Fixed Amount (৳ OFF)" },
            ]}
          />
          <Input
            label={discountType === "percent" ? "Percentage (% e.g. 15)" : "Amount (৳ e.g. 500)"}
            type="number"
            min={1}
            max={discountType === "percent" ? 100 : undefined}
            required
            value={discountValue}
            onChange={(e) => setDiscountValue(Number(e.target.value))}
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <Input
            label="Min Order Amount (BDT)"
            type="number"
            min={0}
            value={minSpendBDT}
            onChange={(e) => setMinSpendBDT(Number(e.target.value))}
            placeholder="0"
          />
          <Input
            label="Total Usage Limit (Optional)"
            type="number"
            min={1}
            value={maxUsage}
            onChange={(e) => setMaxUsage(e.target.value)}
            placeholder="Unlimited"
          />
        </div>
        <div className="flex gap-4 pt-5 border-t border-line">
          <Button type="submit">Create Coupon</Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CourierPackingSlipModal({
  order,
  onClose,
  onStatusChange,
  onOrderUpdated,
  isBlacklisted,
  onToggleBlacklist,
}: {
  order: any;
  onClose: () => void;
  onStatusChange: (id: string, s: OrderStatus) => void;
  onOrderUpdated: () => void;
  isBlacklisted: boolean;
  onToggleBlacklist: (phone: string, currentlyBlocked: boolean) => Promise<void>;
}) {
  const { push } = useToast();
  const [booking, setBooking] = useState(false);
  const [localTracking, setLocalTracking] = useState(order.trackingCode || "");
  const [fraudData, setFraudData] = useState<any>(null);
  const [blacklisting, setBlacklisting] = useState(false);

  useEffect(() => {
    if (order.address?.phone) {
      fetch(`/api/admin/fraud-check?phone=${encodeURIComponent(order.address.phone)}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((d) => setFraudData(d))
        .catch(() => {});
    }
  }, [order.address?.phone]);

  const handleBlacklistClick = async () => {
    if (!order.address?.phone) return;
    setBlacklisting(true);
    await onToggleBlacklist(order.address.phone, isBlacklisted);
    setBlacklisting(false);
    // রিফ্রেশ করা
    fetch(`/api/admin/fraud-check?phone=${encodeURIComponent(order.address.phone)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((d) => setFraudData(d))
      .catch(() => {});
  };

  const handleBookCourier = async () => {
    setBooking(true);
    try {
      const res = await fetch("/api/admin/courier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setLocalTracking(data.trackingCode);
        onStatusChange(order.id, "shipped");
        onOrderUpdated();
        push("success", data.message || "Steadfast Courier Booking successful!");
      } else {
        push("error", data.error || "Courier booking failed.");
      }
    } catch {
      push("error", "Server communication error.");
    } finally {
      setBooking(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title={`Order Slip — ${order.id}`} wide>
      <div className="space-y-6">
        
        {/* কাস্টমার ফ্রড স্কোর ও ব্ল্যাকলিস্ট কার্ড */}
        <div
          className={cn(
            "rounded-sm border p-5 flex flex-wrap items-center justify-between gap-4 shadow-2xs transition-all",
            isBlacklisted || fraudData?.risk === "CRITICAL"
              ? "bg-red-500/10 border-red-500/30 text-red-950"
              : fraudData?.risk === "HIGH"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-950"
              : "bg-emerald-500/10 border-emerald-500/25 text-emerald-950"
          )}
        >
          <div className="flex items-center gap-3.5">
            {isBlacklisted || fraudData?.risk === "CRITICAL" ? (
              <ShieldAlert className="size-6 text-red-600 shrink-0" />
            ) : (
              <ShieldCheck className="size-6 text-emerald-600 shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] font-mono">
                  Customer Fraud & Trust Analysis
                </p>
                {fraudData && (
                  <span
                    className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider",
                      isBlacklisted ? "bg-red-600 text-white" : "bg-emerald-700 text-white"
                    )}
                  >
                    Score: {fraudData.score}% ({fraudData.risk})
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold mt-1">
                {fraudData?.recommendation || (isBlacklisted ? "Blacklisted customer" : "Analyzing history...")}
              </p>
              {fraudData && fraudData.totalOrders > 0 && (
                <p className="text-[11px] text-fog font-mono mt-0.5">
                  Store History: {fraudData.completedOrders} of {fraudData.totalOrders} accepted ({fraudData.cancelledOrders} returns)
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBlacklistClick}
              disabled={blacklisting}
              className={cn(
                "px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer shadow-2xs",
                isBlacklisted
                  ? "bg-paper text-ink border border-line hover:bg-emerald-50 hover:text-emerald-700"
                  : "bg-red-600 text-white hover:bg-red-700"
              )}
            >
              {blacklisting ? "Updating..." : isBlacklisted ? "✓ Unblock / Whitelist" : "🚫 Blacklist Customer"}
            </button>
          </div>
        </div>

        {/* কুরিয়ার বুকিং সেকশন */}
        {localTracking ? (
          <div className="bg-emerald-500/10 rounded-sm border border-emerald-500/20 p-5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-4">
              <CheckCircle className="size-6 text-emerald-600" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800">
                  Steadfast Courier Consignment
                </p>
                <p className="font-mono text-base font-bold text-emerald-950 mt-1 select-all tracking-tight">
                  Tracking Code: {localTracking}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-600 text-white px-4 py-2 rounded-xs shadow-sm">
              Dispatched & Booked
            </span>
          </div>
        ) : (
          <div className="bg-paper rounded-sm shadow-2xs border border-line/80 p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-ink">Steadfast Courier 1-Click Booking</p>
              <p className="text-xs text-ash mt-1">Booking with Steadfast will automatically generate tracking code & SMS customer.</p>
            </div>
            <Button onClick={handleBookCourier} loading={booking} className="gap-2 shadow-md">
              <Truck className="size-4" strokeWidth={2} />
              <span>{booking ? "Booking..." : "Book Courier"}</span>
            </Button>
          </div>
        )}

        <div className="rounded-sm border-2 border-ink p-7 space-y-5 bg-paper/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gold-dark text-paper px-4 py-1.5 rounded-bl-sm text-[10px] font-bold uppercase tracking-widest shadow-sm">
            Official Invoice
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ash">Courier Collection Slip</p>
              <p className="text-3xl font-display font-bold text-ink mt-1.5 tracking-tight">
                Cash to Collect: <Price amountBDT={order.dueAmountBDT} />
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ash block mb-2">Change Status</span>
              <select
                value={order.status}
                onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
                className={cn(
                  "rounded-xs px-4 py-2 text-[11px] uppercase font-bold outline-none ring-1 ring-inset shadow-2xs appearance-none cursor-pointer transition-all",
                  STATUS_STYLE[order.status as OrderStatus] || "bg-gray-100 text-gray-800 ring-gray-200"
                )}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 text-xs pt-2">
            <div className="bg-white/60 p-4 rounded-xs border border-line/60 shadow-2xs">
              <span className="text-ash text-[10px] font-bold uppercase tracking-wider block mb-1.5">Advance Paid</span>
              <span className="font-bold text-emerald-700 font-mono text-base">
                ৳{(order.advancePaidBDT || 0).toLocaleString()}
              </span>
            </div>
            <div className="bg-white/60 p-4 rounded-xs border border-line/60 shadow-2xs">
              <span className="text-ash text-[10px] font-bold uppercase tracking-wider block mb-1.5">bKash/Nagad TrxID</span>
              <span className="font-bold font-mono text-ink text-sm select-all">{order.transactionId || "N/A"}</span>
            </div>
            <div className="bg-white/60 p-4 rounded-xs border border-line/60 shadow-2xs">
              <span className="text-ash text-[10px] font-bold uppercase tracking-wider block mb-1.5">Sender Number</span>
              <span className="font-bold font-mono text-ink text-sm">{order.senderNumber || "N/A"}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 text-sm">
          <div className="bg-paper rounded-sm shadow-2xs border border-line p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ash mb-3.5">Customer & Delivery</p>
            <p className="font-bold text-ink text-base tracking-tight">{order.address.fullName}</p>
            <p className="font-mono text-ink font-medium mt-1.5 text-sm">{order.address.phone}</p>
            <p className="text-ash text-xs mt-2.5 leading-relaxed">
              {order.address.address}, <br />
              {order.address.city}, {order.address.area}
            </p>
          </div>
          <div className="bg-paper rounded-sm shadow-2xs border border-line p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ash mb-3.5">Delivery Type</p>
            <p className="font-bold text-ink tracking-tight">{order.shippingMethod}</p>
            <p className="text-xs text-ash mt-3 font-mono">Placed: {new Date(order.placedAt).toLocaleString("en-GB")}</p>
            <p className="text-xs text-ash mt-1.5 font-mono">Payment: {order.paymentMethod}</p>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink mb-3.5">Items to Pack (Garments)</p>
          <ul className="divide-y divide-line/60 border border-line rounded-sm bg-paper shadow-2xs text-sm overflow-hidden">
            {order.items.map((i: any, idx: number) => (
              <li key={idx} className="flex items-center justify-between p-5 gap-4 hover:bg-cream/30 transition-colors">
                <div>
                  <p className="font-bold text-ink text-base tracking-tight">{i.name}</p>
                  <div className="flex flex-wrap gap-2.5 mt-2">
                    <span className="text-[11px] text-ink font-mono border border-line/60 bg-paper/50 px-2.5 py-0.5 rounded-xs shadow-sm">
                      Size: <strong className="text-gold-dark">{i.size}</strong>
                    </span>
                    <span className="text-[11px] text-ink font-mono border border-line/60 bg-paper/50 px-2.5 py-0.5 rounded-xs shadow-sm">
                      Color: {i.color}
                    </span>
                    <span className="text-[11px] text-ink font-mono border border-line/60 bg-paper/50 px-2.5 py-0.5 rounded-xs shadow-sm">
                      Qty: <strong className="text-gold-dark">{i.quantity}</strong>
                    </span>
                  </div>
                </div>
                <Price amountBDT={i.priceBDT * i.quantity} className="font-bold text-xl text-ink" />
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center justify-between border-t border-line pt-6">
          <Button variant="outline" onClick={() => window.print()} className="gap-2 shadow-sm border-line hover:border-ink hover:bg-ink hover:text-paper">
            <Printer className="size-4" strokeWidth={1.5} /> Print Packing Slip
          </Button>
          <Button onClick={onClose} variant="ghost" className="underline underline-offset-4 hover:text-error hover:decoration-error/50">
            Close View
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ProductEditModal({
  product,
  onClose,
  onSave,
}: {
  product: Product | null;
  onClose: () => void;
  onSave: (id: string, e: any) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [material, setMaterial] = useState("");
  const [fit, setFit] = useState("");
  const [care, setCare] = useState("");
  const [flags, setFlags] = useState({ featured: false, newArrival: false, bestSeller: false });
  const [sizes, setSizes] = useState<{ size: string; stock: number }[]>([]);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(product.priceBDT);
      setImage(product.images?.[0]?.src || "/images/product-tee.jpg");
      setDescription(product.description || "");
      setMaterial(product.material || "");
      setFit(product.fit || "");
      setCare(Array.isArray(product.care) ? product.care.join(", ") : "");
      setFlags({
        featured: Boolean(product.featured),
        newArrival: Boolean(product.newArrival),
        bestSeller: Boolean(product.bestSeller),
      });
      setSizes((product.sizes || []).map((s) => ({ ...s })));
    }
  }, [product]);

  if (!product) return null;

  return (
    <Modal open={!!product} onClose={onClose} title={`Edit Garment — ${product.name}`} wide>
      <div className="grid gap-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Product Name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Price (BDT)" type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ash mb-2.5">SKU Record</p>
          <p className="font-mono text-sm font-bold text-ink bg-paper/50 p-3.5 rounded-xs border border-line shadow-2xs">
            {product.sku || product.slug}
          </p>
        </div>
        <ImageUploadField value={image} onChange={setImage} label="Garment Shoot Photo (Drag & Drop / Browse / Link)" />
        <div className="space-y-5 border-t border-line/80 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink bg-line/30 inline-block px-3 py-1.5 rounded-xs shadow-2xs">
            Garment Accordion Details
          </p>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-ash block">Product Details (Description)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xs border border-line bg-paper/40 p-4 text-sm text-ink outline-none focus:border-gold transition-all shadow-2xs"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Materials (e.g. 100% Combed Cotton, 260gsm)" value={material} onChange={(e) => setMaterial(e.target.value)} />
            <Input label="Fit (e.g. Boxy and slightly cropped)" value={fit} onChange={(e) => setFit(e.target.value)} />
          </div>
          <Input label="Care Instructions (comma-separated)" value={care} onChange={(e) => setCare(e.target.value)} />
        </div>
        <div className="border-t border-line/80 pt-6">
          <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink bg-line/30 inline-block px-3 py-1.5 rounded-xs shadow-2xs">
            Inventory by size
          </p>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {sizes.map((s, i) => (
              <label key={s.size} className="flex flex-col gap-2 text-center text-[11px] font-bold uppercase tracking-widest text-ink">
                {s.size}
                <input
                  type="number"
                  min={0}
                  aria-label={`Stock for size ${s.size}`}
                  value={s.stock}
                  onChange={(e) =>
                    setSizes(
                      sizes.map((x, j) => (j === i ? { ...x, stock: Math.max(0, Number(e.target.value)) } : x))
                    )
                  }
                  className="h-12 rounded-xs border border-line bg-paper/60 px-2 text-center text-sm font-bold text-ink outline-none focus:border-gold shadow-2xs font-mono transition-all hover:border-gold/50"
                />
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-6 border-t border-line/80 pt-6">
          {(
            [
              ["featured", "Featured"],
              ["newArrival", "New Arrival"],
              ["bestSeller", "Best Seller"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-ink group">
              <input
                type="checkbox"
                className="accent-gold-dark size-4.5 cursor-pointer"
                checked={flags[k as keyof typeof flags]}
                onChange={() => setFlags({ ...flags, [k]: !flags[k as keyof typeof flags] })}
              />
              <span className="group-hover:text-gold-dark transition-colors">{label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-4 border-t border-line/80 pt-7">
          <Button
            onClick={() =>
              onSave(product.id, {
                name,
                priceBDT: price,
                image,
                description,
                material,
                fit,
                care,
                sizes,
                ...flags,
              })
            }
          >
            Save Changes to DB
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AddProductModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (p: any) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("T-Shirts");
  const [gender, setGender] = useState("men");
  const [collection, setCollection] = useState("core");
  const [priceBDT, setPriceBDT] = useState(5000);
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [material, setMaterial] = useState("100% Combed Cotton, 260gsm.");
  const [fit, setFit] = useState("Relaxed fit.");
  const [care, setCare] = useState("Machine wash cold, Line dry");
  const [sizes, setSizes] = useState([
    { size: "XS", stock: 2 },
    { size: "S", stock: 5 },
    { size: "M", stock: 10 },
    { size: "L", stock: 5 },
    { size: "XL", stock: 2 },
    { size: "XXL", stock: 1 },
  ]);
  const [flags, setFlags] = useState({ featured: false, newArrival: true, bestSeller: false });

  const resetForm = () => {
    setName("");
    setCategory("T-Shirts");
    setGender("men");
    setCollection("core");
    setPriceBDT(5000);
    setImage("");
    setDescription("");
    setMaterial("100% Combed Cotton, 260gsm.");
    setFit("Relaxed fit.");
    setCare("Machine wash cold, Line dry");
    setSizes([
      { size: "XS", stock: 2 },
      { size: "S", stock: 5 },
      { size: "M", stock: 10 },
      { size: "L", stock: 5 },
      { size: "XL", stock: 2 },
      { size: "XXL", stock: 1 },
    ]);
    setFlags({ featured: false, newArrival: true, bestSeller: false });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name,
      category,
      gender,
      collection,
      priceBDT,
      image: image || "/images/product-tee.jpg",
      description: description || `${name} by ${BRAND_CONFIG.brandName}. Considered luxury garment.`,
      material,
      fit,
      care: care
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      sizes,
      ...flags,
    });
    resetForm();
  };

  const brandInitials =
    (BRAND_CONFIG.brandName || "NF")
      .split(/[\s_-]+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 3) || "SKU";

  return (
    <Modal open={open} onClose={onClose} title="Add New Garment to Database" wide>
      <form className="grid gap-6" onSubmit={handleSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Product Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Atelier Wool Overshirt" />
          <Input label="Price (BDT)" type="number" min={1} required value={priceBDT} onChange={(e) => setPriceBDT(Number(e.target.value))} />
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              "T-Shirts",
              "Shirts",
              "Hoodies",
              "Knitwear",
              "Bottoms",
              "Denim",
              "Outerwear",
              "Dresses",
              "Tops",
              "Tailoring",
              "Footwear",
              "Accessories",
            ].map((c) => ({ value: c, label: c }))}
          />
          <Select
            label="Gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            options={["men", "women", "unisex"].map((g) => ({ value: g, label: g[0].toUpperCase() + g.slice(1) }))}
          />
          <Select
            label="Collection"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            options={["core", "essentials", "studio", "limited"].map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) }))}
          />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ash mb-2.5">Generated SKU Preview</p>
          <p className="font-mono text-sm font-bold text-ink bg-paper/40 p-3.5 rounded-xs border border-line shadow-2xs">
            Auto-generated as: <span className="text-gold-dark">{brandInitials}-XXXX</span>
          </p>
        </div>
        <ImageUploadField value={image} onChange={setImage} label="Product Shoot Image (Drag & Drop / Browse / Link)" />
        <div className="space-y-5 border-t border-line/80 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink bg-line/30 inline-block px-3 py-1.5 rounded-xs shadow-2xs">
            Garment Accordion Details
          </p>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-ash block">Product Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Considered silhouette and tactile finish..."
              className="w-full rounded-xs border border-line bg-paper/40 p-4 text-sm text-ink outline-none focus:border-gold transition-all shadow-2xs"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Materials" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="100% Combed Cotton, 260gsm" />
            <Input label="Fit" value={fit} onChange={(e) => setFit(e.target.value)} placeholder="Relaxed fit" />
          </div>
          <Input label="Care Instructions (comma-separated)" value={care} onChange={(e) => setCare(e.target.value)} />
        </div>
        <div className="border-t border-line/80 pt-6">
          <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink bg-line/30 inline-block px-3 py-1.5 rounded-xs shadow-2xs">
            Opening Stock by Size
          </p>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {sizes.map((s, i) => (
              <label key={s.size} className="flex flex-col gap-2 text-center text-[11px] font-bold uppercase tracking-widest text-ink">
                {s.size}
                <input
                  type="number"
                  min={0}
                  aria-label={`Stock for size ${s.size}`}
                  value={s.stock}
                  onChange={(e) =>
                    setSizes(
                      sizes.map((x, j) => (j === i ? { ...x, stock: Math.max(0, Number(e.target.value)) } : x))
                    )
                  }
                  className="h-12 rounded-xs border border-line bg-paper/60 px-2 text-center text-sm font-bold text-ink outline-none focus:border-gold shadow-2xs font-mono transition-all hover:border-gold/50"
                />
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-6 border-t border-line/80 pt-6">
          {(
            [
              ["newArrival", "New Arrival"],
              ["featured", "Featured"],
              ["bestSeller", "Best Seller"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-ink group">
              <input
                type="checkbox"
                className="accent-gold-dark size-4.5 cursor-pointer"
                checked={flags[k as keyof typeof flags]}
                onChange={() => setFlags({ ...flags, [k]: !flags[k as keyof typeof flags] })}
              />
              <span className="group-hover:text-gold-dark transition-colors">{label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-4 border-t border-line/80 pt-7">
          <Button type="submit">Add Product to Database</Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
// END OF FILE src/app/admin/page.tsx
