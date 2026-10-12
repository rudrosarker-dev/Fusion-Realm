// START OF FILE src/app/staff/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
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
  AlertTriangle,
  Trash2,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { Modal } from "@/components/ui/overlays";
import { Button, EmptyState, Input, Price, Select } from "@/components/ui/primitives";
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

export default function StaffPage() {
  const { push } = useToast();
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("orders");

  const [orders, setOrders] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);
  const [orderSubTab, setOrderSubTab] = useState<"active" | "abandoned">("active");

  const [viewOrder, setViewOrder] = useState<any>(null);
  const [offlineOrderOpen, setOfflineOrderOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [updatingPass, setUpdatingPass] = useState(false);

  useEffect(() => {
    fetch("/api/staff/auth")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setStaffInfo(data.user);
          const perms: string[] = data.user.permissions || [];
          if (perms.length > 0) setActiveTab(perms[0]);
        }
      })
      .catch(() => {});

    fetchOrders();
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

  const handleDeleteAbandoned = async (id: string) => {
    try {
      await fetch(`/api/abandoned-cart?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setAbandonedCarts((prev) => prev.filter((c) => c.id !== id));
      push("info", "Draft cart removed.");
    } catch {}
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

  const permissions: string[] = staffInfo?.permissions || [];

  const navItems = [
    { id: "orders", label: "Orders", icon: BadgeDollarSign, allowed: permissions.includes("orders") },
    { id: "products", label: "Products", icon: ShoppingCart, allowed: permissions.includes("products") },
    { id: "inventory", label: "Inventory", icon: Boxes, allowed: permissions.includes("inventory") },
    { id: "discounts", label: "Discounts", icon: Tag, allowed: permissions.includes("discounts") },
    { id: "customers", label: "Customers", icon: Users, allowed: permissions.includes("customers") },
    { id: "security", label: "My Security", icon: KeyRound, allowed: true },
  ].filter((item) => item.allowed);

  return (
    <div className="container-x pb-24 pt-12 lg:pt-16 min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-6 mb-10 border-b border-line pb-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-dark mb-2">
            {BRAND_CONFIG.brandName} Atelier Workspace
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-ink tracking-tight">
            Welcome, {staffInfo?.name || "Staff Member"}
          </h1>
          <p className="mt-2 text-xs text-ash">
            Role: <strong className="text-ink">{staffInfo?.roleTitle || "Assigned Operations"}</strong> • Access to ({permissions.length}) module(s).
          </p>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        {/* Sidebar Nav */}
        <nav className="flex gap-2 overflow-x-auto no-scrollbar lg:flex-col" aria-label="Staff sections">
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
          {/* 1. ORDERS MODULE */}
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

                <Button onClick={() => setOfflineOrderOpen(true)} className="gap-2 shadow-sm">
                  <Plus className="size-4" strokeWidth={2} /> Quick Offline Order
                </Button>
              </div>

              {orderSubTab === "active" && (
                <>
                  {orders.length === 0 ? (
                    <EmptyState title="No orders yet." copy="Incoming orders will show up here for packing and dispatch." />
                  ) : (
                    <div className="overflow-x-auto bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60">
                      <table className="w-full min-w-[900px] text-sm text-left">
                        <thead className="bg-paper border-b border-line">
                          <tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-ash">
                            <th className="px-5 py-4">Order ID</th>
                            <th className="px-5 py-4">Customer</th>
                            <th className="px-5 py-4">Phone & City</th>
                            <th className="px-5 py-4">Due (Courier)</th>
                            <th className="px-5 py-4">Status</th>
                            <th className="px-5 py-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line/60">
                          {orders.map((o) => (
                            <tr key={o.id} onClick={() => setViewOrder(o)} className="hover:bg-cream/40 transition-colors duration-200 cursor-pointer">
                              <td className="px-5 py-4 font-bold text-ink font-mono">{o.id}</td>
                              <td className="px-5 py-4">
                                <p className="font-semibold text-ink">{o.address.fullName}</p>
                                <p className="text-[11px] text-fog mt-0.5">{o.email}</p>
                              </td>
                              <td className="px-5 py-4 text-ash text-xs">
                                <span className="font-mono font-medium">{o.address.phone}</span>
                                <br />
                                {o.address.city}
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
                                <button
                                  onClick={() => setViewOrder(o)}
                                  className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink border border-line rounded-xs px-3 py-1.5 hover:bg-ink hover:text-paper hover:border-ink transition-colors shadow-2xs cursor-pointer"
                                >
                                  Slip & Courier
                                </button>
                              </td>
                            </tr>
                          ))}
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

          {/* 2. PRODUCTS MODULE */}
          {activeTab === "products" && permissions.includes("products") && (
            <div className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-ash">
                Garments Catalog ({productsList.length})
              </p>
              <div className="overflow-x-auto bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60">
                <table className="w-full min-w-[850px] text-sm text-left">
                  <thead className="bg-paper border-b border-line">
                    <tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-ash">
                      <th className="px-5 py-4">Product</th>
                      <th className="px-5 py-4">Category</th>
                      <th className="px-5 py-4">Price</th>
                      <th className="px-5 py-4">Stock</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {productsList.map((p) => (
                      <tr key={p.id} className="hover:bg-cream/40 transition-colors duration-200">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative size-12 shrink-0 bg-cream border border-line overflow-hidden rounded-xs">
                              <Image src={p.images?.[0]?.src || "/images/product-tee.jpg"} alt={p.name} fill sizes="48px" className="object-cover" />
                            </div>
                            <span className="font-semibold text-ink">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-ash text-xs">{p.category}</td>
                        <td className="px-5 py-4 font-mono font-semibold text-ink"><Price amountBDT={p.priceBDT} /></td>
                        <td className="px-5 py-4 font-mono text-xs">{totalStock(p)} pcs</td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setEditProduct(p)}
                            className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold text-ink border border-line rounded-xs px-2.5 py-1 hover:bg-ink hover:text-paper transition-colors"
                          >
                            <Pencil className="size-3" /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. INVENTORY MODULE (স্টক এডিট সুবিধাসহ) */}
          {activeTab === "inventory" && permissions.includes("inventory") && (
            <div className="space-y-6">
              <div className="overflow-x-auto bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60">
                <table className="w-full min-w-[850px] text-sm text-left">
                  <thead className="bg-paper border-b border-line">
                    <tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-ash">
                      <th className="px-5 py-4">Garment</th>
                      <th className="px-5 py-4">Size Breakdown</th>
                      <th className="px-5 py-4">Total Stock</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {productsList.map((p) => (
                      <tr key={p.id} className="hover:bg-cream/40 transition-colors duration-200">
                        <td className="px-5 py-4 font-semibold text-ink">{p.name}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {(p.sizes || []).map((s) => (
                              <span key={s.size} className="text-[10px] font-mono px-2 py-0.5 border border-line bg-paper rounded-xs">
                                {s.size}: <strong>{s.stock}</strong>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-gold-dark">{totalStock(p)} pcs</td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setEditProduct(p)}
                            className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold text-ink border border-line rounded-xs px-2.5 py-1 hover:bg-ink hover:text-paper transition-colors cursor-pointer"
                          >
                            <Pencil className="size-3" /> Edit Stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. DISCOUNTS MODULE */}
          {activeTab === "discounts" && permissions.includes("discounts") && (
            <div className="space-y-6">
              <div className="overflow-x-auto bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60">
                <table className="w-full min-w-[600px] text-sm text-left">
                  <thead className="bg-paper border-b border-line">
                    <tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-ash">
                      <th className="px-5 py-4">Code</th>
                      <th className="px-5 py-4">Discount</th>
                      <th className="px-5 py-4">Min Spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {couponsList.map((c) => (
                      <tr key={c.id} className="hover:bg-cream/40 transition-colors duration-200">
                        <td className="px-5 py-4 font-mono font-bold text-ink">{c.code}</td>
                        <td className="px-5 py-4 font-semibold text-gold-dark">
                          {c.discountType === "percent" ? `${c.discountValue}% OFF` : `৳${c.discountValue} OFF`}
                        </td>
                        <td className="px-5 py-4 font-mono text-ash">{c.minSpendBDT ? `৳${c.minSpendBDT}` : "No min"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. CUSTOMERS MODULE */}
          {activeTab === "customers" && permissions.includes("customers") && (
            <div className="space-y-6">
              <div className="overflow-x-auto bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60">
                <table className="w-full min-w-[700px] text-sm text-left">
                  <thead className="bg-paper border-b border-line">
                    <tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-ash">
                      <th className="px-5 py-4">Customer</th>
                      <th className="px-5 py-4">Phone</th>
                      <th className="px-5 py-4">City</th>
                      <th className="px-5 py-4">Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {orders.slice(0, 20).map((o) => (
                      <tr key={o.id} className="hover:bg-cream/40 transition-colors duration-200">
                        <td className="px-5 py-4 font-semibold text-ink">{o.address?.fullName}</td>
                        <td className="px-5 py-4 font-mono text-ash text-xs">{o.address?.phone}</td>
                        <td className="px-5 py-4 text-ash text-xs">{o.address?.city}</td>
                        <td className="px-5 py-4 font-mono text-ink text-xs font-semibold">{o.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. SECURITY MODULE */}
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

      {/* কুরিয়ার স্লিপ মোডাল (হুবহু অ্যাডমিন প্যানেলের মতো স্লিপ) */}
      {viewOrder && (
        <CourierPackingSlipModal
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onStatusChange={setOrderStatus}
          onOrderUpdated={fetchOrders}
        />
      )}

      {/* প্রোডাক্ট এডিট মোডাল */}
      <ProductEditModal
        product={editProduct}
        onClose={() => setEditProduct(null)}
        onSave={saveEdit}
      />
    </div>
  );
}

/* ——— অ্যাডমিন প্যানেলের মতো প্রফেশনাল কুরিয়ার স্লিপ ——— */
function CourierPackingSlipModal({
  order,
  onClose,
  onStatusChange,
  onOrderUpdated,
}: {
  order: any;
  onClose: () => void;
  onStatusChange: (id: string, s: OrderStatus) => void;
  onOrderUpdated: () => void;
}) {
  const { push } = useToast();
  const [booking, setBooking] = useState(false);
  const [localTracking, setLocalTracking] = useState(order.trackingCode || "");

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
              <p className="text-xs text-ash mt-1">Booking with Steadfast will automatically generate tracking code.</p>
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

/* ——— স্টক ও পণ্য এডিট মোডাল ——— */
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
  const [sizes, setSizes] = useState<{ size: string; stock: number }[]>([]);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(product.priceBDT);
      setSizes((product.sizes || []).map((s) => ({ ...s })));
    }
  }, [product]);

  if (!product) return null;

  return (
    <Modal open={!!product} onClose={onClose} title={`Edit Stock — ${product.name}`}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Product Name" readOnly value={name} />
          <Input label="Price (BDT)" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink mb-3">Inventory By Size</p>
          <div className="grid grid-cols-3 gap-3">
            {sizes.map((s, i) => (
              <label key={s.size} className="flex flex-col gap-1 text-center text-xs font-mono font-bold">
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
                  className="h-10 border border-line bg-paper px-2 text-center text-sm font-bold text-ink outline-none focus:border-gold"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-line">
          <Button onClick={() => onSave(product.id, { priceBDT: price, sizes })}>Save Changes</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
// END OF FILE src/app/staff/page.tsx
