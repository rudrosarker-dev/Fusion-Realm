// START OF FILE src/db/schema.ts
import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

// ——— 1. SITE SETTINGS TABLE ———
export const siteSettings = pgTable("site_settings", {
  id: text("id").primaryKey(),
  brandName: text("brand_name").notNull().default("NOIR FORM"),
  tagline: text("tagline").default("Considered garments for everyday movement."),
  description: text("description").default("An independent fashion house designing quiet, precise garments in heavyweight natural cloth."),
  contactPhone: text("contact_phone").default("+880 1798-994365"),
  contactWhatsapp: text("contact_whatsapp"),
  contactEmail: text("contact_email"),
  contactAddress: text("contact_address").default("Banani, Dhaka, Bangladesh"),
  contactHours: text("contact_hours").default("Saturday – Thursday, 10:00 – 20:00 BST"),
  paymentNumber: text("payment_number"),
  paymentType: text("payment_type").default("bKash & Nagad Personal"),
  shippingInside: integer("shipping_inside").default(100),
  shippingOutside: integer("shipping_outside").default(150),
  freeShippingMin: integer("free_shipping_min").default(15000),
  socialInstagram: text("social_instagram").default("https://instagram.com"),
  socialFacebook: text("social_facebook").default("https://facebook.com"),
  socialTiktok: text("social_tiktok").default("https://tiktok.com"),
  socialPinterest: text("social_pinterest").default("https://pinterest.com"),
  studioName: text("studio_name").default("Tholvex Studio"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ——— 2. USERS TABLE (Role & Granular Permissions সহ) ———
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("CUSTOMER"), // "SUPER_ADMIN" | "STAFF" | "CUSTOMER"
  roleTitle: text("role_title"), // e.g. "Order Moderator", "Delivery Staff"
  permissions: jsonb("permissions").$type<string[]>().default([]), // ["orders", "products", ...]
  resetToken: text("reset_token"), // এখানে টোকেনের SHA-256 হ্যাশ রাখা হয়, আসল টোকেন নয়
  resetTokenExpiry: timestamp("reset_token_expiry"),
  totpSecret: text("totp_secret"), // সক্রিয় 2FA সিক্রেট (null = 2FA বন্ধ)
  totpPending: text("totp_pending"), // সেটআপ চলাকালীন অস্থায়ী সিক্রেট
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ——— 3. PRODUCTS TABLE ———
export const products = pgTable("products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  gender: text("gender").notNull(),
  collection: text("collection"),
  priceBDT: integer("price_bdt").notNull(),
  compareAtBDT: integer("compare_at_bdt"),
  shortDescription: text("short_description"),
  description: text("description"),
  material: text("material"),
  fit: text("fit"),
  care: jsonb("care").$type<string[]>(),
  images: jsonb("images").$type<{ src: string; alt: string }[]>().notNull(),
  colors: jsonb("colors").$type<{ name: string; hex: string }[]>().notNull(),
  sizes: jsonb("sizes").$type<{ size: string; stock: number }[]>().notNull(),
  sku: text("sku"),
  featured: boolean("featured").default(false),
  bestSeller: boolean("best_seller").default(false),
  newArrival: boolean("new_arrival").default(false),
  rating: text("rating").default("5.0"),
  reviewsCount: integer("reviews_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ——— 4. ORDERS TABLE ———
export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  shippingAddress: jsonb("shipping_address").$type<{
    division: string;
    district: string;
    address: string;
    notes?: string;
    courier?: string;
    trackingCode?: string;
    consignmentId?: string;
    dispatchedAt?: string;
  }>().notNull(),
  items: jsonb("items").$type<{
    productId: string;
    name: string;
    size: string;
    color: string;
    quantity: number;
    priceBDT: number;
    image: string;
  }[]>().notNull(),
  subtotalBDT: integer("subtotal_bdt").notNull(),
  shippingBDT: integer("shipping_bdt").notNull(),
  discountBDT: integer("discount_bdt").default(0),
  totalBDT: integer("total_bdt").notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull().default("PENDING"),
  orderStatus: text("order_status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ——— 5. COUPONS TABLE ———
export const coupons = pgTable("coupons", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull(),
  discountValue: integer("discount_value").notNull(),
  minSpendBDT: integer("min_spend_bdt").default(0),
  maxUsage: integer("max_usage"),
  usedCount: integer("used_count").default(0),
  active: boolean("active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ——— 6. BLACKLISTS TABLE (ফ্রড ও সন্দেহজনক নম্বর ম্যানেজমেন্ট) ———
export const blacklists = pgTable("blacklists", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  reason: text("reason").default("Repeated delivery refusal or fake order"),
  blacklistedBy: text("blacklisted_by").default("ADMIN"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
// END OF FILE src/db/schema.ts
