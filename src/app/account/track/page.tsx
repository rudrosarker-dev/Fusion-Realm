"use client";

import { useState } from "react";
import { Search, Package, CheckCircle2, Truck, Loader2 } from "lucide-react";
import { Button, Input, Price } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export default function TrackOrderPage() {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const trackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/track?id=${query}&phone=${query}`);
      const data = await res.json();
      if (res.ok && data.orders.length > 0) {
        setOrder(data.orders[0]);
      } else {
        setError("Order not found. Please check your Order ID or Phone.");
      }
    } catch {
      setError("Database connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-x pb-24 pt-32 lg:pt-36 max-w-2xl">
      <h1 className="font-display text-4xl sm:text-5xl mb-8">Track Your Order</h1>
      
      {!order ? (
        <form onSubmit={trackOrder} className="border border-line bg-cream p-8 space-y-5">
          <Input 
            label="Order ID or Phone Number" 
            placeholder="e.g. NF-849201 or 017XXXXXXXX" 
            required 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
          {error && <p className="text-xs text-error">{error}</p>}
          <Button type="submit" loading={loading}>Track Order</Button>
        </form>
      ) : (
        <div className="space-y-8">
          <div className="border border-line p-6 bg-paper">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="eyebrow">Order {order.id}</p>
                <p className="text-sm text-ash mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setOrder(null)}>Search New</Button>
            </div>

            {/* Simple Progress Tracker */}
            <div className="flex items-center justify-between mb-10 mt-8">
              {[
                { s: "pending", label: "Received", icon: Package },
                { s: "confirmed", label: "Verified", icon: CheckCircle2 },
                { s: "shipped", label: "Dispatched", icon: Truck },
              ].map((step, i) => (
                <div key={step.s} className="flex flex-col items-center gap-2">
                  <div className={cn("size-8 rounded-full border flex items-center justify-center", 
                    order.orderStatus === step.s ? "bg-ink text-paper" : "border-line text-fog")}>
                    <step.icon className="size-4" />
                  </div>
                  <p className="text-[10px] uppercase tracking-wider">{step.label}</p>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 text-sm space-y-2">
              <p>Status: <strong className="uppercase">{order.orderStatus}</strong></p>
              <p>Total: <Price amountBDT={order.totalBDT} /></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
