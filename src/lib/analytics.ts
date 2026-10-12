import { BRAND_CONFIG } from "./brand.config";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

export function trackMetaEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window === "undefined" || !BRAND_CONFIG.metaPixel.enabled || !BRAND_CONFIG.metaPixel.pixelId) {
    return;
  }

  if (window.fbq) {
    window.fbq("track", eventName, {
      ...params,
      currency: "BDT",
    });
  }
}

// স্পেসিফিক স্ট্যান্ডার্ড ইভেন্ট ফাংশনসমূহ:
export const fbEvents = {
  viewContent: (product: { id: string; name: string; priceBDT: number; category: string }) => {
    trackMetaEvent("ViewContent", {
      content_ids: [product.id],
      content_name: product.name,
      content_category: product.category,
      content_type: "product",
      value: product.priceBDT,
    });
  },

  addToCart: (item: { productId: string; name: string; priceBDT: number; qty: number; size?: string; color?: string }) => {
    trackMetaEvent("AddToCart", {
      content_ids: [item.productId],
      content_name: item.name,
      content_type: "product",
      value: item.priceBDT * item.qty,
      quantity: item.qty,
      selected_size: item.size,
      selected_color: item.color,
    });
  },

  initiateCheckout: (cart: { subtotalBDT: number; itemsCount: number; itemIds: string[] }) => {
    trackMetaEvent("InitiateCheckout", {
      content_ids: cart.itemIds,
      content_type: "product",
      value: cart.subtotalBDT,
      num_items: cart.itemsCount,
    });
  },

  purchase: (order: { id: string; totalBDT: number; itemIds: string[]; itemsCount: number }) => {
    trackMetaEvent("Purchase", {
      content_ids: order.itemIds,
      content_type: "product",
      value: order.totalBDT,
      currency: "BDT",
      num_items: order.itemsCount,
      order_id: order.id,
    });
  },
};
