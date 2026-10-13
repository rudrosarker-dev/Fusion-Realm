// START OF FILE src/app/staff/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  BadgeDollarSign,
  Boxes,
  KeyRound,
  Printer,
  ShoppingCart,
  Users,
  CheckCircle,
  Truck,
  Pencil,
  Tag,
  Search,
  Plus,
  Trash2,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  UploadCloud,
  X,
  BookOpen,
} from "lucide-react";
import { Modal } from "@/components/ui/overlays";
import { Button, EmptyState, Input, Price, Select } from "@/components/ui/primitives";
import { AtelierGuidebookModal } from "@/components/admin/atelier-guidebook";
import { useToast } from "@/lib/store";
import { cn, formatPrice, isLowStock, isSoldOut, totalStock } from "@/lib/utils";
import { BRAND_CONFIG } from "@/lib/brand.config";
import type { OrderStatus, Product } from "@/lib/types";

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

/* ————————————————— HELPER: IMAGE UPLOAD ————————————————— */
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

/* ————————————————— MAIN STAFF PAGE COMPONENT ————————————————— */

export default function StaffPage() {
  const { push } = useToast();
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("orders");
  const [guidebookOpen, setGuidebookOpen] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [blacklistedPhones, setBlacklistedPhones] = useState<string[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);
  const [orderSubTab, setOrderSubTab] = useState<"active" | "abandoned">("active");

  const [viewOrder, setViewOrder] = useState<any>(null);
  const [offlineOrderOpen, setOfflineOrderOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addCouponOpen, setAddCouponOpen] = useState(false);

  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const [newPassword, setNewPassword] = useState("");
  const [updatingPass, setUpdatingPass] = useState(false);

  useEffect(() => {
    fetch("/api/staff/auth")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setStaffInfo(data.user);
          const perms: string[] = data.user.permissions || [];
          if (perms.length > 0 && !perms.includes(activeTab)) {
            setActiveTab(perms[0]);
          }
        }
      })
      .catch(() => {});

    fetchOrders();
    fetchBlacklist();
    fetchAbandonedCarts();
    fetchProducts();
    fetchCoupons();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders?t=" + Date.now(), { cache: "no-store" });
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

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/products?t=" + Date.now(), { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setProductsList(data.products || []);
      }
    } catch {}
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons?t=" + Date.now(), { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCouponsList(data.coupons || []);
      }
    } catch {}
  };

  const setOrderStatus = async (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    if (viewOrder && viewOrder.id === id) {
      setViewOrder({ ...viewOrder, status });
    }
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
        push("success", data.message || (currentlyBlocked ? "Customer Unblocked" : "Customer Blacklisted"));
        await fetchBlacklist();
      } else {
        push("error", data.error || "Failed to update blacklist status.");
      }
    } catch {
      push("error", "Error connecting to server.");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm(`Delete order ${orderId} permanently?`)) return;
    try {
      const res = await fetch(`/api/orders?id=${encodeURIComponent(orderId)}`, { method: "DELETE" });
      if (res.ok) {
        push("success", `Order ${orderId} deleted.`);
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setSelectedOrderIds((prev) => prev.filter((id) => id !== orderId));
      } else {
        push("error", "Failed to delete order.");
      }
    } catch {
      push("error", "Server communication error.");
    }
  };

  const handleBulkDeleteOrders = async () => {
    if (!selectedOrderIds.length) return;
    if (!window.confirm(`Delete ${selectedOrderIds.length} selected orders?`)) return;
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
        push("error", "Bulk delete error.");
      }
    } catch {
      push("error", "Bulk delete error.");
    }
  };

  const handleDeleteAbandoned = async (id: string) => {
    try {
      await fetch(`/api/abandoned-cart?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setAbandonedCarts((prev) => prev.filter((c) => c.id !== id));
      push("info", "Draft cart removed.");
    } catch {}
  };

  const handleAddProduct = async (productData: any) => {
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      if (res.ok) {
        push("success", `${productData.name} added to catalog.`);
        fetchProducts();
        setAddOpen(false);
      } else {
        push("error", "Failed to add product.");
      }
    } catch {
      push("error", "Error adding product.");
    }
  };

  const saveEdit = async (id: string, edit: any) => {
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...edit }),
      });
      if (res.ok) {
        push("success", "Product updated.");
        fetchProducts();
      } else {
        push("error", "Failed to update product.");
      }
    } catch {
      push("error", "Error saving product.");
    }
    setEditProduct(null);
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        push("success", `${name} deleted.`);
        setProductsList((prev) => prev.filter((p) => p.id !== id));
      } else {
        push("error", "Failed to delete.");
      }
    } catch {
      push("error", "Error deleting.");
    }
  };

  const handleBulkDeleteProducts = async () => {
    if (!selectedProductIds.length) return;
    if (!window.confirm(`Delete ${selectedProductIds.length} garments?`)) return;
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedProductIds }),
      });
      if (res.ok) {
        push("success", `${selectedProductIds.length} garments deleted.`);
        setProductsList((prev) => prev.filter((p) => !selectedProductIds.includes(p.id)));
        setSelectedProductIds([]);
      } else {
        push("error", "Bulk delete error.");
      }
    } catch {
      push("error", "Bulk delete error.");
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
        push("success", `Coupon "${couponData.code}" created.`);
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
        setCouponsList((prev) => prev.filter((c) => c.id !== id));
      } else {
        push("error", "Failed to delete coupon.");
      }
    } catch {
      push("error", "Error deleting coupon.");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingPass(true);
    try {
      const res = await fetch("/api/staff/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        push("success", "Password updated successfully!");
        setNewPassword("");
      } else {
        push("error", data.error || "Failed to update password");
      }
    } catch {
      push("error", "Error connecting to server");
    } finally {
      setUpdatingPass(false);
    }
  };

  const permissions: string[] = staffInfo?.permissions || [];

  const navItems = [
    { id: "orders", label: "Orders", icon: BadgeDollarSign, allowed: permissions.includes("orders") },
    { id: "products", label: "Products", icon: ShoppingCart, allowed: permissions.includes("products") },
    { id: "inventory", label: "Inventory", icon: Boxes, allowed: permissions.includes("inventory") },
    { id: "discounts", label: "Discounts", icon: Tag, allowed: permissions.includes("discounts") },
    { id: "customers", label: "Customers (CRM)", icon: Users, allowed: permissions.includes("customers") },
    { id: "security", label: "My Security", icon: KeyRound, allowed: true },
  ].filter((item) => item.allowed);

  return (
    <div className="container-x pb-24 pt-12 lg:pt-16 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-6 mb-8 lg:mb-10 border-b border-line pb-6 lg:pb-8">
        <div>
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-dark mb-2">
            {BRAND_CONFIG.brandName} Atelier Workspace
          </p>
          <h1 className="font-display text-2xl sm:text-4xl text-ink tracking-tight">
            Welcome, {staffInfo?.name || "Staff Member"}
          </h1>
          <p className="mt-2 text-xs text-ash">
            Role: <strong className="text-ink">{staffInfo?.roleTitle || "Assigned Operations"}</strong> • Access to ({navItems.length}) operational module(s).
          </p>
        </div>

        {/* Master Guidebook Manual Button for Staff */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setGuidebookOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xs bg-gold/15 text-gold-dark border border-gold/40 hover:bg-gold/25 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <BookOpen className="size-3.5" />
            <span>📖 Atelier Master Manual</span>
          </button>
        </div>
      </div>

      {/* ——— MOBILE TABS NAVIGATION (চ্যাপ্টাভাব সম্পূর্ণ ফিক্সড) ——— */}
      <div className="lg:hidden mb-8 space-y-3">
        <div className="relative">
          <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-ash mb-1.5 block">
            Select Module / মডিউল সিলেক্ট করুন:
          </label>
          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full h-12 bg-paper border border-line rounded-xs px-4 pr-10 text-xs font-bold uppercase tracking-wider text-ink shadow-xs appearance-none outline-none focus:border-gold-dark"
            >
              {navItems.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
            <ChevronDown className="size-4 text-fog absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* সোয়াইপযোগ্য প্রিমিয়াম পিল বার */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {navItems.map((n) => {
            const active = activeTab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setActiveTab(n.id)}
                className={cn(
                  "shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xs text-[10px] font-bold uppercase tracking-widest transition-all shadow-2xs cursor-pointer",
                  active
                    ? "bg-ink text-paper border border-ink shadow-sm"
                    : "bg-paper text-ash border border-line hover:text-ink hover:border-ink/60"
                )}
              >
                <n.icon className={cn("size-3.5", active ? "text-gold" : "text-fog")} strokeWidth={1.8} />
                <span>{n.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        {/* ——— DESKTOP SIDEBAR NAVIGATION ——— */}
        <nav className="hidden lg:flex flex-col gap-2" aria-label="Staff sections">
          {navItems.map((n) => {
            const active = activeTab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setActiveTab(n.id)}
                className={cn(
                  "group relative flex items-center gap-3.5 whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-[0.15em] rounded-sm transition-all duration-200 cursor-pointer overflow-hidden",
                  active
                    ? "bg-ink text-paper shadow-sm"
                    : "text-fog hover:bg-paper hover:text-ink border border-transparent hover:border-line/60"
                )}
              >
                {active && <span className="absolute inset-y-0 left-0 w-1 bg-gold-dark" />}
                <n.icon className={cn("size-4 transition-colors", active ? "text-gold-light" : "text-fog group-hover:text-gold-dark")} strokeWidth={1.8} />
                {n.label}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          {/* 1. ORDERS MODULE (FULL POWER) */}
          {activeTab === "orders" && permissions.includes("orders") && (
            <div className="space-y-6">
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
                      <span className="px-2 py-0.5 bg-error text-paper text-[9px] font-bold rounded-full shadow-sm">
                        {abandonedCarts.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* অফলাইন অর্ডার কাটার ক্ষমতা */}
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
                    <EmptyState title="No orders yet." copy="Incoming orders will show up here for packing and dispatch." />
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
                              <tr key={o.id} onClick={() => setViewOrder(o)} className={cn("hover:bg-cream/40 transition-colors duration-200 cursor-pointer", isSelected ? "bg-gold/5" : "")}>
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
                                      <option key={s} value={s}>{s}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-3">
                                    <button
                                      onClick={() => setViewOrder(o)}
                                      className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink border border-line rounded-xs px-3 py-1.5 hover:bg-ink hover:text-paper hover:border-ink transition-colors shadow-2xs cursor-pointer"
                                    >
                                      Slip & Courier
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
            </div>
          )}

          {/* 2. PRODUCTS MODULE (FULL POWER: ADD, EDIT, DELETE) */}
          {activeTab === "products" && permissions.includes("products") && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-ash">
                  Garments Catalog ({productsList.length})
                </p>
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

              <div className="overflow-x-auto bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60">
                <table className="w-full min-w-[850px] text-sm text-left">
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
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {productsList.map((p) => {
                      const isSelected = selectedProductIds.includes(p.id);
                      return (
                        <tr key={p.id} className={cn("hover:bg-cream/40 transition-colors duration-200", isSelected ? "bg-gold/5" : "")}>
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
                          <td className="px-5 py-4 text-ash text-xs">{p.category}</td>
                          <td className="px-5 py-4 font-mono font-semibold text-ink"><Price amountBDT={p.priceBDT} /></td>
                          <td className="px-5 py-4 font-mono text-xs">{totalStock(p)} pcs</td>
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
            </div>
          )}
{/* 3. INVENTORY MODULE (FULL POWER: MATRIX & DIRECT EDIT) */}
          {activeTab === "inventory" && permissions.includes("inventory") && (
            <div className="space-y-6">
              <InventoryMatrix products={productsList} onEdit={(product) => setEditProduct(product)} />
            </div>
          )}

          {/* 4. DISCOUNTS MODULE (FULL POWER: CREATE & DELETE) */}
          {activeTab === "discounts" && permissions.includes("discounts") && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-ash">
                  Active Coupons ({couponsList.length})
                </p>
                <Button onClick={() => setAddCouponOpen(true)} className="gap-2 shadow-sm">
                  <Plus className="size-4" strokeWidth={2} /> Create Coupon
                </Button>
              </div>

              {couponsList.length === 0 ? (
                <EmptyState
                  icon={Tag}
                  title="No coupons created."
                  copy="Create discount vouchers with percentage or flat amounts."
                  actionLabel="Create First Coupon"
                  onAction={() => setAddCouponOpen(true)}
                />
              ) : (
                <div className="overflow-x-auto bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60">
                  <table className="w-full min-w-[700px] text-sm text-left">
                    <thead className="bg-paper border-b border-line">
                      <tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-ash">
                        <th className="px-5 py-4">Code</th>
                        <th className="px-5 py-4">Discount</th>
                        <th className="px-5 py-4">Min Spend</th>
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
            </div>
          )}

          {/* 5. CUSTOMERS CRM MODULE (FULL POWER) */}
          {activeTab === "customers" && permissions.includes("customers") && (
            <div className="space-y-6">
              <CustomersCRM orders={orders} />
            </div>
          )}

          {/* 6. SECURITY */}
          {activeTab === "security" && (
            <div className="bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60 p-8 max-w-md space-y-5">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink">Update Staff Passcode</h2>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <Input
                  label="New Passcode (min 6 chars) *"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                />
                <Button type="submit" loading={updatingPass}>
                  Update Passcode
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ALL OPERATIONAL MODALS FOR STAFF */}
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

      {/* 3D Atelier Master Manual Guidebook Modal */}
      <AtelierGuidebookModal open={guidebookOpen} onClose={() => setGuidebookOpen(false)} />
    </div>
  );
}

/* ————————————————— FULL OPERATIONAL SUB-COMPONENTS ————————————————— */

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
        paymentMethod: `Manual / Staff Desk [Adv: ৳${adv} | Trx: ${trxId || "N/A"}]`,
        paymentStatus: "CONFIRMED",
        orderStatus: "CONFIRMED",
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        push("success", "Offline order recorded successfully!");
        setCName("");
        setCPhone("");
        setCAddress("");
        setItems([]);
        setAdvancePaid("");
        setTrxId("");
        setSenderPhone("");
        onSuccess();
      } else {
        push("error", "Failed to record offline order.");
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
        {/* কাস্টমার ট্রাস্ট ও ফ্রড স্কোর */}
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
                {fraudData?.recommendation || (isBlacklisted ? "Blacklisted customer" : "Analyzing records...")}
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
              {blacklisting ? "Updating..." : isBlacklisted ? "✓ Unblock Customer" : "🚫 Blacklist Customer"}
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
              <p className="text-xs text-ash mt-1">Book consignment and auto-send tracking SMS to customer.</p>
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
                  <option key={s} value={s}>{s}</option>
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
        <ImageUploadField value={image} onChange={setImage} label="Garment Shoot Photo" />
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
              className="w-full rounded-xs border border-line bg-paper/40 p-4 text-sm text-ink outline-none focus:border-gold transition-all shadow-2xs"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Materials" value={material} onChange={(e) => setMaterial(e.target.value)} />
            <Input label="Fit" value={fit} onChange={(e) => setFit(e.target.value)} />
          </div>
          <Input label="Care Instructions" value={care} onChange={(e) => setCare(e.target.value)} />
        </div>
        <div className="border-t border-line/80 pt-6">
          <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink bg-line/30 inline-block px-3 py-1.5 rounded-xs shadow-2xs">
            Inventory by Size
          </p>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {sizes.map((s, i) => (
              <label key={s.size} className="flex flex-col gap-2 text-center text-[11px] font-bold uppercase tracking-widest text-ink">
                {s.size}
                <input
                  type="number"
                  min={0}
                  value={s.stock}
                  onChange={(e) =>
                    setSizes(
                      sizes.map((x, j) => (j === i ? { ...x, stock: Math.max(0, Number(e.target.value)) } : x))
                    )
                  }
                  className="h-12 rounded-xs border border-line bg-paper/60 px-2 text-center text-sm font-bold text-ink outline-none focus:border-gold shadow-2xs font-mono transition-all"
                />
              </label>
            ))}
          </div>
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

  return (
    <Modal open={open} onClose={onClose} title="Add New Garment to Catalog" wide>
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
        <ImageUploadField value={image} onChange={setImage} label="Product Shoot Image" />
        <div className="space-y-5 border-t border-line/80 pt-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-ash block">Product Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Considered silhouette..."
              className="w-full rounded-xs border border-line bg-paper/40 p-4 text-sm text-ink outline-none focus:border-gold transition-all shadow-2xs"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Materials" value={material} onChange={(e) => setMaterial(e.target.value)} />
            <Input label="Fit" value={fit} onChange={(e) => setFit(e.target.value)} />
          </div>
          <Input label="Care Instructions" value={care} onChange={(e) => setCare(e.target.value)} />
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
                  value={s.stock}
                  onChange={(e) =>
                    setSizes(
                      sizes.map((x, j) => (j === i ? { ...x, stock: Math.max(0, Number(e.target.value)) } : x))
                    )
                  }
                  className="h-12 rounded-xs border border-line bg-paper/60 px-2 text-center text-sm font-bold text-ink outline-none focus:border-gold shadow-2xs font-mono transition-all"
                />
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-4 border-t border-line/80 pt-7">
          <Button type="submit">Add Product to Catalog</Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
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
            label={discountType === "percent" ? "Percentage (%)" : "Amount (৳)"}
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
          <p className="text-xs text-ash mt-1.5">{customers.length} total registered clients recorded</p>
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
// END OF FILE src/app/staff/page.tsx
