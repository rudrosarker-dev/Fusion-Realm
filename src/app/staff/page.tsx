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

  const [viewOrder, setViewOrder] = useState<any>(null);
  const [offlineOrderOpen, setOfflineOrderOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addCouponOpen, setAddCouponOpen] = useState(false);

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
      });

    fetchOrders();
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
    setOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));
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
      {/* Header Area */}
      <div className="flex flex-wrap items-start justify-between gap-6 mb-10 border-b border-line pb-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-dark mb-2">
            {BRAND_CONFIG.brandName} Atelier Workspace
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-ink tracking-tight">
            Welcome, {staffInfo?.name || "Staff Member"}
          </h1>
          <p className="mt-2 text-xs text-ash">
            Role: <strong className="text-ink">{staffInfo?.roleTitle || "Assigned Operations"}</strong> • You have access to ({permissions.length}) module(s).
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
                <p className="text-xs font-semibold uppercase tracking-wider text-ash">
                  Active Orders ({orders.length})
                </p>
                <Button onClick={() => setOfflineOrderOpen(true)} className="gap-2 shadow-sm">
                  <Plus className="size-4" strokeWidth={2} /> Quick Offline Order
                </Button>
              </div>

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
                        <tr key={o.id} className="hover:bg-cream/40 transition-colors duration-200">
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
                          <td className="px-5 py-4">
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
                          <td className="px-5 py-4 text-right">
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
            </div>
          )}

          {/* 2. PRODUCTS MODULE (Full Add + Edit Permission) */}
          {activeTab === "products" && permissions.includes("products") && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-ash">
                  {productsList.length} garments in database
                </p>
                <Button onClick={() => setAddOpen(true)} className="gap-2 shadow-sm">
                  <Plus className="size-4" strokeWidth={2} /> Add Product
                </Button>
              </div>

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
                        <td className="px-5 py-4 font-semibold text-ink">{p.name}</td>
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

          {/* 3. INVENTORY MODULE */}
          {activeTab === "inventory" && permissions.includes("inventory") && (
            <div className="space-y-6">
              <div className="overflow-x-auto bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60">
                <table className="w-full min-w-[800px] text-sm text-left">
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
                              <span key={s.size} className="text-[10px] font-mono px-2 py-0.5 border border-line bg-paper">
                                {s.size}: <strong>{s.stock}</strong>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-gold-dark">{totalStock(p)} pcs</td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setEditProduct(p)}
                            className="text-[10px] uppercase font-bold text-ink border border-line rounded-xs px-2.5 py-1 hover:bg-ink hover:text-paper transition-colors"
                          >
                            Edit Stock
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
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-ash">
                  Active Coupons ({couponsList.length})
                </p>
                <Button onClick={() => setAddCouponOpen(true)} className="gap-2 shadow-sm">
                  <Plus className="size-4" strokeWidth={2} /> Create Coupon
                </Button>
              </div>

              <div className="overflow-x-auto bg-paper/60 backdrop-blur-md rounded-sm shadow-sm border border-line/60">
                <table className="w-full min-w-[650px] text-sm text-left">
                  <thead className="bg-paper border-b border-line">
                    <tr className="text-[10px] font-bold uppercase tracking-[0.15em] text-ash">
                      <th className="px-5 py-4">Code</th>
                      <th className="px-5 py-4">Discount</th>
                      <th className="px-5 py-4">Min Order</th>
                      <th className="px-5 py-4">Status</th>
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
                        <td className="px-5 py-4">
                          <span className="text-[9px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700">
                            Active
                          </span>
                        </td>
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

      {/* MODALS */}
      {viewOrder && (
        <Modal open={true} onClose={() => setViewOrder(null)} title={`Packing Slip — ${viewOrder.id}`} wide>
          <div className="space-y-4 text-xs">
            <div className="border border-line p-4 space-y-1.5">
              <p>Customer: <strong>{viewOrder.address.fullName}</strong> ({viewOrder.address.phone})</p>
              <p>Address: {viewOrder.address.address}, {viewOrder.address.city}</p>
              <p className="font-bold text-sm">Due to Collect: ৳{(viewOrder.dueAmountBDT || 0).toLocaleString()}</p>
            </div>
            <div className="flex justify-between border-t border-line pt-4">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="size-3.5" /> Print Memo
              </Button>
              <Button onClick={() => setViewOrder(null)} size="sm">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
// END OF FILE src/app/staff/page.tsx
