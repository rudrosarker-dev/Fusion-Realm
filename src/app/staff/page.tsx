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
} from "lucide-react";
import { Modal } from "@/components/ui/overlays";
import { Button, EmptyState, Input, Price, Select } from "@/components/ui/primitives";
import { useToast } from "@/lib/store";
import { cn, formatPrice, isLowStock, isSoldOut, totalStock } from "@/lib/utils";
import { BRAND_CONFIG } from "@/lib/brand.config";
import type { OrderStatus, Product } from "@/lib/types";

const ORDER_STATUSES: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

const STATUS_STYLE: Record<string, string> = {
  pending: "text-[#8a6d2f]",
  confirmed: "text-ink",
  processing: "text-ink",
  shipped: "text-[#2f4d6a]",
  delivered: "text-success",
  cancelled: "text-error",
  refunded: "text-error",
};

export default function StaffPage() {
  const { push } = useToast();
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("security");

  const [orders, setOrders] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [couponsList, setCouponsList] = useState<any[]>([]);
  
  const [viewOrder, setViewOrder] = useState<any>(null);
  const [offlineOrderOpen, setOfflineOrderOpen] = useState(false);

  // পাসওয়ার্ড পরিবর্তন স্টেট
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
      const res = await fetch("/api/orders", { cache: "no-store" });
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
              dueAmountBDT: o.shippingAddress?.dueAmountBDT ?? Math.max(0, o.totalBDT - (o.shippingAddress?.advancePaidBDT ?? o.shippingBDT ?? 0)),
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
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setProductsList(data.products || []);
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
    <div className="container-x pb-24 pt-12 lg:pt-16">
      <div className="border-b border-line pb-6">
        <p className="eyebrow">Staff Assigned Workspace</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl text-ink">
          Welcome, {staffInfo?.name || "Staff Member"}
        </h1>
        <p className="text-xs text-ash mt-1">
          Role: <strong className="text-ink">{staffInfo?.roleTitle || "Assigned Operations"}</strong> • You have access to ({permissions.length}) modules.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[200px_1fr]">
        <nav className="flex gap-1 overflow-x-auto no-scrollbar lg:flex-col" aria-label="Staff modules">
          {navItems.map((n) => (
            <button
              key={n.id}
              onClick={() => setActiveTab(n.id)}
              className={cn(
                "flex items-center gap-2.5 whitespace-nowrap px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors cursor-pointer",
                activeTab === n.id ? "bg-ink text-paper" : "text-ash hover:bg-cream hover:text-ink"
              )}
            >
              <n.icon className="size-4" strokeWidth={1.5} /> {n.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          {/* ১. ORDERS MODULE */}
          {activeTab === "orders" && permissions.includes("orders") && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <p className="text-xs text-fog">{orders.length} orders pending/dispatched</p>
                <Button size="sm" onClick={() => setOfflineOrderOpen(true)} className="gap-1.5">
                  <Plus className="size-3.5" strokeWidth={2} /> Quick Offline Order
                </Button>
              </div>

              {orders.length === 0 ? (
                <EmptyState title="No orders to display." copy="Incoming orders will show up here for packing and dispatch." />
              ) : (
                <div className="overflow-x-auto border border-line">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-cream/60">
                      <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-fog">
                        <th className="px-4 py-3 font-medium">Order ID</th>
                        <th className="px-4 py-3 font-medium">Customer</th>
                        <th className="px-4 py-3 font-medium">Phone & City</th>
                        <th className="px-4 py-3 font-medium">Due (Courier)</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.id} className="border-t border-line hover:bg-cream/50 transition-colors">
                          <td className="px-4 py-3 font-mono font-medium text-ink">{o.id}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-ink">{o.address.fullName}</p>
                            <p className="text-xs text-fog">{o.email}</p>
                          </td>
                          <td className="px-4 py-3 text-ash">
                            <span className="font-mono">{o.address.phone}</span> • {o.address.city}
                          </td>
                          <td className="px-4 py-3 font-semibold text-ink">
                            <Price amountBDT={o.dueAmountBDT} />
                            {o.advancePaidBDT > 0 && (
                              <span className="block text-[10px] font-normal text-success">
                                Adv: ৳{o.advancePaidBDT} (Paid)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={o.status}
                              onChange={(e) => setOrderStatus(o.id, e.target.value as OrderStatus)}
                              className={cn(
                                "border border-line bg-transparent px-2.5 py-1 text-xs uppercase font-medium cursor-pointer",
                                STATUS_STYLE[o.status]
                              )}
                            >
                              {ORDER_STATUSES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setViewOrder(o)}
                              className="text-xs font-semibold uppercase tracking-wider text-ink border border-line px-3 py-1.5 hover:bg-ink hover:text-paper transition-colors cursor-pointer"
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

          {/* ২. PRODUCTS MODULE (Read Only) */}
          {activeTab === "products" && permissions.includes("products") && (
            <div className="overflow-x-auto border border-line">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-cream/60">
                  <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-fog">
                    <th className="px-4 py-3 font-medium">Garment</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {productsList.map((p) => (
                    <tr key={p.id} className="border-t border-line hover:bg-cream/40">
                      <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                      <td className="px-4 py-3 text-ash">{p.category}</td>
                      <td className="px-4 py-3"><Price amountBDT={p.priceBDT} /></td>
                      <td className="px-4 py-3 font-mono">{totalStock(p)} in stock</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ৩. INVENTORY MODULE (স্টক এডিট করার সুবিধা) */}
          {activeTab === "inventory" && permissions.includes("inventory") && (
            <InventoryMatrix products={productsList} onEdit={(product) => saveEdit(product.id, product)} />
          )}

          {/* ৪. DISCOUNTS MODULE */}
          {activeTab === "discounts" && permissions.includes("discounts") && (
            <div className="overflow-x-auto border border-line">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-cream/60">
                  <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-fog">
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Discount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {couponsList.map((c) => (
                    <tr key={c.id} className="border-t border-line hover:bg-cream/40">
                      <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                      <td className="px-4 py-3">{c.discountType === "percent" ? `${c.discountValue}%` : `৳${c.discountValue}`}</td>
                      <td className="px-4 py-3 text-emerald-700 font-semibold text-xs">Active</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ৫. CUSTOMERS MODULE */}
          {activeTab === "customers" && permissions.includes("customers") && (
            <CustomersCRM orders={orders} />
          )}

          {/* ৬. MY SECURITY (স্টাফ পাসওয়ার্ড পরিবর্তন) */}
          {activeTab === "security" && (
            <div className="border border-line bg-paper p-6 sm:p-8 max-w-md space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink">Update Staff Passcode</h2>
              <p className="text-xs text-ash">You can change your staff login passcode here at any time.</p>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.16em] text-fog block">New Passcode (min 6 chars) *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-10 border border-line bg-paper px-3 text-xs outline-none focus:border-ink font-mono"
                  />
                </div>

                <Button type="submit" loading={updatingPass}>Update Passcode</Button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* OFFLINE ORDER MODAL */}
      <OfflineOrderModal
        open={offlineOrderOpen}
        onClose={() => setOfflineOrderOpen(false)}
        products={productsList}
        onSuccess={() => { setOfflineOrderOpen(false); fetchOrders(); }}
      />

      {viewOrder && (
        <StaffCourierSlipModal
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onStatusChange={setOrderStatus}
          onOrderUpdated={fetchOrders}
        />
      )}
    </div>
  );
}

/* ——— QUICK OFFLINE ORDER MODAL (15-Second Checkout) ——— */
function OfflineOrderModal({ open, onClose, products, onSuccess }: { open: boolean; onClose: () => void; products: Product[]; onSuccess: () => void; }) {
  const { push } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Customer State
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cAddress, setCAddress] = useState("");
  const [cCity, setCCity] = useState("Dhaka");
  
  // Cart Items State
  const [items, setItems] = useState<{ pId: string; pName: string; size: string; color: string; qty: number; price: number; image: string; }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [itemQty, setItemQty] = useState(1);

  // Payment State
  const [advancePaid, setAdvancePaid] = useState<number | "">("");
  const [trxId, setTrxId] = useState("");
  const [senderPhone, setSenderPhone] = useState("");

  const activeProduct = products.find((p) => p.id === selectedProductId);

  // Calculations
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const isInsideDhaka = cCity.trim().toLowerCase() === "dhaka";
  const shipping = items.length === 0 ? 0 : subtotal >= BRAND_CONFIG.shipping.freeShippingThreshold ? 0 : isInsideDhaka ? BRAND_CONFIG.shipping.insideDhakaFee : BRAND_CONFIG.shipping.outsideDhakaFee;
  const total = subtotal + shipping;
  const adv = Number(advancePaid) || 0;
  const due = Math.max(0, total - adv);

  const handleAddItem = () => {
    if (!activeProduct || !selectedSize) { push("error", "Select a product and size."); return; }
    setItems([...items, { pId: activeProduct.id, pName: activeProduct.name, size: selectedSize, color: activeProduct.colors[0]?.name || "Default", qty: itemQty, price: activeProduct.priceBDT, image: activeProduct.images[0]?.src || "" }]);
    setSelectedProductId(""); setSelectedSize(""); setItemQty(1);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { push("error", "Add at least one item."); return; }
    if (!cName || !cPhone || !cAddress) { push("error", "Customer name, phone and address required."); return; }

    setSubmitting(true);
    try {
      const payload = {
        id: `NF-${Math.floor(100000 + Math.random() * 900000)}`,
        customerName: cName, customerPhone: cPhone, customerEmail: `${cPhone}@offline.com`,
        items: items.map((i) => ({ productId: i.pId, name: i.pName, size: i.size, color: i.color, quantity: i.qty, priceBDT: i.price, image: i.image })),
        shippingAddress: { division: cCity, district: cCity, address: cAddress, advancePaidBDT: adv, dueAmountBDT: due, senderNumber: senderPhone || "N/A", transactionId: trxId || "N/A" },
        subtotalBDT: subtotal, shippingBDT: shipping, discountBDT: 0, totalBDT: total,
        paymentMethod: `Manual / Messenger [Adv: ৳${adv} | Trx: ${trxId || "N/A"}]`,
        paymentStatus: "CONFIRMED", orderStatus: "CONFIRMED",
      };

      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { push("success", "Offline order placed successfully!"); setCName(""); setCPhone(""); setCAddress(""); setItems([]); setAdvancePaid(""); setTrxId(""); setSenderPhone(""); onSuccess(); } 
      else { push("error", "Failed to place offline order."); }
    } catch { push("error", "Server error."); } finally { setSubmitting(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Offline / Messenger Order" wide>
      <form onSubmit={handlePlaceOrder} className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink border-b border-line pb-2">Customer Details</h3>
            <Input label="Name *" required value={cName} onChange={(e) => setCName(e.target.value)} placeholder="e.g. Tanvir Ahmed" />
            <Input label="Phone *" required value={cPhone} onChange={(e) => setCPhone(e.target.value)} placeholder="017XXXXXXXX" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Address *" required value={cAddress} onChange={(e) => setCAddress(e.target.value)} placeholder="House, Road, Area" />
              <Select label="City *" value={cCity} onChange={(e) => setCCity(e.target.value)} options={["Dhaka", "Chattogram", "Sylhet", "Khulna", "Rajshahi", "Barishal", "Rangpur", "Mymensingh"].map(c => ({label: c, value: c}))} />
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink border-b border-line pb-2">Advance Payment</h3>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Advance Paid (৳)" type="number" min={0} value={advancePaid} onChange={(e) => setAdvancePaid(Number(e.target.value))} placeholder="e.g. 150" />
              <Input label="Sender No." value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} placeholder="017..." />
              <Input label="TrxID" value={trxId} onChange={(e) => setTrxId(e.target.value.toUpperCase())} placeholder="TRX..." />
            </div>
          </div>
        </div>

        <div className="space-y-6 flex flex-col h-full">
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink border-b border-line pb-2">Add Garments</h3>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Select label="Product" value={selectedProductId} onChange={(e) => { setSelectedProductId(e.target.value); setSelectedSize(""); }} options={[{label: "Select Product...", value: ""}, ...products.map(p => ({label: `${p.name} - ${formatPrice(p.priceBDT)}`, value: p.id}))]} />
              </div>
              <div className="w-20">
                <Select label="Size" disabled={!activeProduct} value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} options={[{label: "-", value: ""}, ...(activeProduct?.sizes.map(s => ({label: `${s.size} (${s.stock})`, value: s.size})) || [])]} />
              </div>
              <div className="w-16">
                <Input label="Qty" type="number" min={1} value={itemQty} onChange={(e) => setItemQty(Number(e.target.value))} />
              </div>
              <Button type="button" onClick={handleAddItem} className="h-11 px-3 bg-emerald-700 text-white hover:bg-emerald-800 border-none">+</Button>
            </div>
          </div>

          <div className="flex-1 border border-line bg-cream/40 p-4 space-y-4">
            {items.length === 0 ? ( <p className="text-xs text-fog text-center py-4">No items added to this order yet.</p> ) : (
              <ul className="space-y-2 text-xs divide-y divide-line/60">
                {items.map((i, idx) => (
                  <li key={idx} className="flex justify-between pt-2 first:pt-0">
                    <span>{i.pName} <span className="text-fog">({i.size}) x {i.qty}</span></span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono">{formatPrice(i.price * i.qty)}</span>
                      <button type="button" onClick={() => setItems(items.filter((_, index) => index !== idx))} className="text-error hover:underline text-[10px]">Remove</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2 border-t border-line pt-3 text-sm">
            <div className="flex justify-between text-ash"><p>Subtotal</p><p>{formatPrice(subtotal)}</p></div>
            <div className="flex justify-between text-ash"><p>Delivery ({isInsideDhaka ? "Inside" : "Outside"} Dhaka)</p><p>{formatPrice(shipping)}</p></div>
            <div className="flex justify-between font-bold text-ink"><p>Total</p><p>{formatPrice(total)}</p></div>
            <div className="flex justify-between text-xs pt-1 border-t border-line/60"><p className="text-success">Advance Paid</p><p className="text-success">-{formatPrice(adv)}</p></div>
            <div className="flex justify-between text-base font-bold text-error pt-1"><p>Due on Delivery</p><p>{formatPrice(due)}</p></div>
          </div>

          <Button type="submit" loading={submitting} className="w-full h-12 text-sm mt-auto">Create Offline Order</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ——— প্রফেশনাল ইনভেন্টরি ম্যাট্রিক্স ——— */
function InventoryMatrix({ products, onEdit }: { products: Product[]; onEdit: (p: Product) => void; }) {
  const [filterType, setFilterType] = useState<"all" | "low" | "out">("all");
  const filteredProducts = useMemo(() => { if (filterType === "out") return products.filter((p) => isSoldOut(p)); if (filterType === "low") return products.filter((p) => isLowStock(p)); return products; }, [products, filterType]);
  const totalPiecesInStore = useMemo(() => products.reduce((acc, p) => acc + totalStock(p), 0), [products]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div><h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink">Live Atelier Stock Inventory</h2><p className="text-xs text-fog mt-1">Total Available Stock: <strong className="text-ink font-mono">{totalPiecesInStore} pieces</strong> across {products.length} garments</p></div>
        <div className="flex items-center gap-2">{( [ ["all", "All Stock"], ["low", "Low Stock"], ["out", "Sold Out"] ] as const ).map(([key, label]) => ( <button key={key} type="button" onClick={() => setFilterType(key)} className={cn("px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors border cursor-pointer", filterType === key ? "bg-ink text-paper border-ink" : "border-line text-ash hover:border-ink")}>{label}</button> ))}</div>
      </div>
      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-cream/60"><tr className="text-left text-[10px] uppercase tracking-[0.16em] text-fog"><th className="px-4 py-3 font-medium">Garment</th><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Size Breakdown (Units)</th><th className="px-4 py-3 font-medium">Total In Stock</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Action</th></tr></thead>
          <tbody>
            {filteredProducts.map((p) => {
              const stock = totalStock(p); const soldOut = isSoldOut(p); const low = isLowStock(p);
              return (
                <tr key={p.id} className="border-t border-line hover:bg-cream/40 transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="relative size-12 shrink-0 bg-cream border border-line overflow-hidden"><Image src={p.images?.[0]?.src || "/images/product-tee.jpg"} alt={p.name} fill sizes="48px" className="object-cover" /></div><div><p className="font-medium text-ink">{p.name}</p><p className="text-xs text-fog font-mono">{p.sku || p.slug}</p></div></div></td>
                  <td className="px-4 py-3 text-ash">{p.category} <span className="text-fog">/ {p.gender}</span></td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-1.5 max-w-xs">{(p.sizes || []).map((s) => ( <span key={s.size} className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono border", s.stock === 0 ? "bg-red-50 text-error border-error/30 line-through" : s.stock <= 2 ? "bg-amber-50 text-amber-900 border-amber-300 font-bold" : "bg-paper text-ink border-line")}><span>{s.size}:</span><span>{s.stock}</span></span> ))}</div></td>
                  <td className="px-4 py-3 font-mono font-bold text-ink">{stock} pcs</td>
                  <td className="px-4 py-3">{soldOut ? ( <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 bg-red-500/10 text-error border border-red-500/20"><AlertTriangle className="size-3" /> Sold Out</span> ) : low ? ( <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 bg-amber-500/10 text-amber-800 border border-amber-500/30">Low Stock</span> ) : ( <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">Healthy</span> )}</td>
                  <td className="px-4 py-3 text-right">
                    {/* এডিট অপশন শুধু তাদের জন্যই থাকবে যারা ইনভেন্টরি পারমিশন পেয়েছে */}
                    <button onClick={() => onEdit(p)} className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-ink font-semibold border border-line px-2.5 py-1 hover:bg-ink hover:text-paper transition-colors cursor-pointer"><Pencil className="size-3" /> Edit Stock</button>
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

/* ——— প্রফেশনাল কাস্টমার সিআরএম ——— */
function CustomersCRM({ orders }: { orders: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const customers = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; orders: number; spent: number; last: string }>();
    orders.forEach((o) => {
      const emailKey = o.email || o.address?.phone || "guest";
      const cur = map.get(emailKey) ?? { name: o.address?.fullName || "Valued Client", phone: o.address?.phone || "", orders: 0, spent: 0, last: o.placedAt };
      cur.orders += 1; cur.spent += o.totalBDT || 0; if (o.placedAt > cur.last) cur.last = o.placedAt;
      map.set(emailKey, cur);
    });
    return [...map.entries()];
  }, [orders]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim(); if (!q) return customers;
    return customers.filter(([email, c]) => c.name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q));
  }, [customers, searchQuery]);

  if (!customers.length) return <EmptyState title="No customers yet." copy="Customer profiles are automatically generated from live orders placed on your store." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div><h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink">Client Relations Management (CRM)</h2><p className="text-xs text-fog mt-1">{customers.length} total registered clients in database</p></div>
        <div className="relative w-full max-w-xs"><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by client name, phone or email..." className="w-full h-9 border border-line bg-paper px-3 pr-8 text-xs text-ink outline-none focus:border-ink placeholder:text-fog font-mono" /><Search className="size-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-fog" /></div>
      </div>
      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-cream/60"><tr className="text-left text-[10px] uppercase tracking-[0.16em] text-fog"><th className="px-4 py-3 font-medium">Client Profile</th><th className="px-4 py-3 font-medium">Contact Phone</th><th className="px-4 py-3 font-medium">Orders Placed</th><th className="px-4 py-3 font-medium">Total Spend</th><th className="px-4 py-3 font-medium">Client Status</th><th className="px-4 py-3 font-medium">Last Purchase</th></tr></thead>
          <tbody>
            {filtered.map(([email, c]) => {
              const isVIP = c.spent >= 10000 || c.orders >= 3; const isRepeat = c.orders > 1;
              return (
                <tr key={email} className="border-t border-line hover:bg-cream/40 transition-colors">
                  <td className="px-4 py-3"><p className="font-medium text-ink">{c.name}</p><p className="text-xs text-fog font-mono">{email}</p></td>
                  <td className="px-4 py-3 text-ash font-mono select-all">{c.phone || "—"}</td>
                  <td className="px-4 py-3 font-semibold text-ink font-mono">{c.orders} orders</td>
                  <td className="px-4 py-3 font-semibold text-ink font-mono"><Price amountBDT={c.spent} /></td>
                  <td className="px-4 py-3">{isVIP ? ( <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 bg-amber-500/10 text-amber-800 border border-amber-500/30">VIP Client</span> ) : isRepeat ? ( <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 bg-blue-500/10 text-blue-800 border border-blue-500/30">Repeat Buyer</span> ) : ( <span className="text-[10px] font-medium uppercase px-2 py-0.5 bg-cream text-ash border border-line">New Client</span> )}</td>
                  <td className="px-4 py-3 text-ash font-mono text-xs">{new Date(c.last).toLocaleDateString("en-GB")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* স্টাফদের জন্য কুরিয়ার স্লিপ মোডাল */
function StaffCourierSlipModal({ order, onClose, onStatusChange, onOrderUpdated }: { order: any; onClose: () => void; onStatusChange: (id: string, s: OrderStatus) => void; onOrderUpdated: () => void; }) {
  const { push } = useToast(); const [booking, setBooking] = useState(false); const [localTracking, setLocalTracking] = useState(order.trackingCode || "");
  const handleBookCourier = async () => {
    setBooking(true);
    try {
      const res = await fetch("/api/admin/courier", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.id }) });
      const data = await res.json();
      if (res.ok) { setLocalTracking(data.trackingCode); onStatusChange(order.id, "shipped"); onOrderUpdated(); push("success", data.message || "Steadfast Courier Booking successful!"); } else { push("error", data.error || "Courier booking failed."); }
    } catch { push("error", "Server communication error."); } finally { setBooking(false); }
  };
  return (
    <Modal open={true} onClose={onClose} title={`Order Slip — ${order.id}`} wide>
      <div className="space-y-5">
        {localTracking ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><CheckCircle className="size-5 text-emerald-600" /><div><p className="text-[10px] uppercase font-mono tracking-wider text-emerald-700">Steadfast Courier</p><p className="font-mono text-sm font-bold text-ink select-all">Tracking Code: {localTracking}</p></div></div>
            <span className="text-[10px] font-semibold uppercase bg-emerald-600 text-white px-2 py-1">Booked</span>
          </div>
        ) : (
          <div className="border border-line bg-cream/70 p-4 flex items-center justify-between">
            <div><p className="text-xs font-semibold text-ink">Steadfast 1-Click Booking</p><p className="text-[10px] text-fog">Automatically books consignment with Steadfast courier.</p></div>
            <button onClick={handleBookCourier} disabled={booking} className="inline-flex items-center gap-2 bg-ink text-paper px-4 py-2 text-xs uppercase tracking-wider font-semibold cursor-pointer"><Truck className="size-3.5" /><span>{booking ? "Booking..." : "Book Steadfast"}</span></button>
          </div>
        )}
        <div className="border border-line p-4 space-y-2 text-xs">
          <p>Customer: <strong>{order.address.fullName}</strong> ({order.address.phone})</p>
          <p>Address: {order.address.address}, {order.address.city}</p>
          <p className="font-bold text-sm">Cash to Collect: ৳{(order.dueAmountBDT || 0).toLocaleString()}</p>
        </div>
        <div className="flex justify-between border-t border-line pt-3"><Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2"><Printer className="size-3.5" /> Print Slip</Button><Button onClick={onClose} size="sm">Close</Button></div>
      </div>
    </Modal>
  );
}
