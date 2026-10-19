import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { eq, inArray, desc } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { BRAND_CONFIG } from "@/lib/brand.config";
import { clampStr, safeImageSrc } from "@/lib/security";
import { isDeny, requireAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FALLBACK_IMG = "/images/product-tee.jpg";

function cleanSizes(v: unknown): { size: string; stock: number }[] | null {
  if (!Array.isArray(v) || v.length > 30) return null;
  return v.map((s: any) => ({
    size: clampStr(s?.size, 10) || "M",
    stock: Math.max(0, Math.min(100000, Math.floor(Number(s?.stock) || 0))),
  }));
}
function cleanCare(v: unknown): string[] {
  const arr = Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : ["Machine wash cold", "Line dry"];
  return arr.map((x) => clampStr(x, 100)).filter(Boolean).slice(0, 12);
}
function cleanPrice(v: unknown): number | null {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 1 && n <= 10_000_000 ? n : null;
}

// অ্যাডমিন প্যানেল ও স্টাফ — products/inventory/discounts/orders/customers যেকোনো permission থাকলেই তালিকা দেখা যাবে
export async function GET() {
  try {
    const auth = await requireAccess("products", "inventory", "orders", "customers", "discounts");
    if (isDeny(auth)) return auth.response;
    const all = await db.select().from(products).orderBy(desc(products.createdAt));
    return NextResponse.json({ success: true, products: all });
  } catch {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAccess("products");
    if (isDeny(auth)) return auth.response;

    const body = await req.json().catch(() => ({}));
    const name = clampStr(body.name, 150);
    const price = cleanPrice(body.priceBDT);
    if (!name || price === null) return NextResponse.json({ error: "Valid name and price are required" }, { status: 400 });

    const id = `prod-${crypto.randomUUID()}`;
    const slug =
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") + `-${Date.now().toString().slice(-4)}`;
    const imageUrl = safeImageSrc(body.image || body.images?.[0]?.src) || FALLBACK_IMG;

    const brandPrefix =
      (BRAND_CONFIG.brandName || "NF").split(/[\s_-]+/).map((w) => w[0]).join("").toUpperCase().slice(0, 3) || "SKU";
    const autoSku = clampStr(body.sku, 40) || `${brandPrefix}-${crypto.randomInt(1000, 10000)}`;

    const newProduct = {
      id,
      slug,
      name,
      category: clampStr(body.category, 60) || "T-Shirts",
      gender: clampStr(body.gender, 20) || "unisex",
      collection: clampStr(body.collection, 60) || "core",
      priceBDT: price,
      compareAtBDT: body.compareAtBDT ? cleanPrice(body.compareAtBDT) : null,
      shortDescription: clampStr(body.shortDescription, 300) || `${name} crafted in luxury cloth.`,
      description: clampStr(body.description, 5000) || `${name} by ${BRAND_CONFIG.brandName}.`,
      material: clampStr(body.material, 200) || "100% Combed Cotton.",
      fit: clampStr(body.fit, 200) || "Relaxed fit.",
      care: cleanCare(body.care),
      images: [{ src: imageUrl, alt: name }],
      colors: [{ name: "Black", hex: "#171614" }],
      sizes: cleanSizes(body.sizes) || [
        { size: "XS", stock: 2 },
        { size: "S", stock: 5 },
        { size: "M", stock: Math.max(0, Math.floor(Number(body.stock)) || 10) },
        { size: "L", stock: 5 },
        { size: "XL", stock: 2 },
        { size: "XXL", stock: 1 },
      ],
      sku: autoSku,
      featured: Boolean(body.featured),
      bestSeller: Boolean(body.bestSeller),
      newArrival: Boolean(body.newArrival ?? true),
      rating: "5.0",
      reviewsCount: 0,
    };

    await db.insert(products).values(newProduct);
    return NextResponse.json({ success: true, product: newProduct });
  } catch {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAccess("products", "inventory");
    if (isDeny(auth)) return auth.response;

    const body = await req.json().catch(() => ({}));
    if (typeof body.id !== "string" || !body.id) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

    const updates: Partial<typeof products.$inferInsert> = {};
    if (body.name !== undefined) updates.name = clampStr(body.name, 150);
    if (body.priceBDT !== undefined) {
      const p = cleanPrice(body.priceBDT);
      if (p === null) return NextResponse.json({ error: "Invalid price" }, { status: 400 });
      updates.priceBDT = p;
    }
    if (body.description !== undefined) updates.description = clampStr(body.description, 5000);
    if (body.material !== undefined) updates.material = clampStr(body.material, 200);
    if (body.fit !== undefined) updates.fit = clampStr(body.fit, 200);
    if (body.care !== undefined) updates.care = cleanCare(body.care);
    if (body.sizes !== undefined) {
      const sz = cleanSizes(body.sizes);
      if (!sz) return NextResponse.json({ error: "Invalid sizes" }, { status: 400 });
      updates.sizes = sz;
    }
    if (body.image) {
      const img = safeImageSrc(body.image);
      if (!img) return NextResponse.json({ error: "Invalid image (use https URL or an uploaded JPG/PNG/WebP)" }, { status: 400 });
      updates.images = [{ src: img, alt: clampStr(body.name, 150) || "Product image" }];
    }
    if (body.featured !== undefined) updates.featured = Boolean(body.featured);
    if (body.newArrival !== undefined) updates.newArrival = Boolean(body.newArrival);
    if (body.bestSeller !== undefined) updates.bestSeller = Boolean(body.bestSeller);

    if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    await db.update(products).set(updates).where(eq(products.id, body.id));
    return NextResponse.json({ success: true, updated: updates });
  } catch {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAccess("products");
    if (isDeny(auth)) return auth.response;

    const singleId = new URL(req.url).searchParams.get("id");
    if (singleId) {
      await db.delete(products).where(eq(products.id, singleId));
      return NextResponse.json({ success: true, deletedId: singleId });
    }
    const body = await req.json().catch(() => ({}));
    if (Array.isArray(body.ids) && body.ids.length > 0 && body.ids.length <= 500 && body.ids.every((x: unknown) => typeof x === "string")) {
      await db.delete(products).where(inArray(products.id, body.ids));
      return NextResponse.json({ success: true, count: body.ids.length });
    }
    return NextResponse.json({ error: "No ID provided" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
