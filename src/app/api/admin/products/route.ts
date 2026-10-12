import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, inArray, desc } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { BRAND_CONFIG } from "@/lib/brand.config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("nf_admin_session");
  if (!session?.value) return false;
  try {
    const decoded = JSON.parse(Buffer.from(session.value, "base64").toString("utf-8"));
    return decoded.role === "SUPER_ADMIN";
  } catch {
    return false;
  }
}

// ১. GET ALL PRODUCTS
export async function GET() {
  try {
    const allProducts = await db.select().from(products).orderBy(desc(products.createdAt));
    return NextResponse.json({ success: true, products: allProducts });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// ২. ADD PRODUCT (ক্লায়েন্টের ব্র্যান্ড ইনিশিয়াল অনুযায়ী ডাইনামিক SKU)
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await req.json();
    if (!body.name || !body.priceBDT) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    const id = body.id || `prod-${Date.now()}`;
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") + `-${Date.now().toString().slice(-4)}`;
    const imageUrl = body.image || body.images?.[0]?.src || "/images/product-tee.jpg";

    const careList = Array.isArray(body.care)
      ? body.care
      : typeof body.care === "string"
      ? body.care.split(",").map((s: string) => s.trim()).filter(Boolean)
      : ["Machine wash cold", "Line dry"];

    // ক্লায়েন্টের ব্র্যান্ড নাম অনুযায়ী স্বয়ংক্রিয় SKU প্রিফিক্স (যেমন: Tholvex Studio -> TS-1234)
    const brandPrefix = (BRAND_CONFIG.brandName || "NF")
      .split(/[\s_-]+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 3) || "SKU";

    const autoSku = body.sku || `${brandPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newProduct = {
      id,
      slug,
      name: body.name,
      category: body.category || "T-Shirts",
      gender: body.gender || "unisex",
      collection: body.collection || "core",
      priceBDT: Number(body.priceBDT),
      compareAtBDT: body.compareAtBDT ? Number(body.compareAtBDT) : null,
      shortDescription: body.shortDescription || `${body.name} crafted in luxury cloth.`,
      description: body.description || `${body.name} by ${BRAND_CONFIG.brandName}. Considered silhouette and tactile finish.`,
      material: body.material || "100% Combed Cotton.",
      fit: body.fit || "Relaxed fit.",
      care: careList,
      images: [{ src: imageUrl, alt: body.name }],
      colors: [{ name: "Black", hex: "#171614" }],
      sizes: body.sizes || [
        { size: "XS", stock: 2 },
        { size: "S", stock: 5 },
        { size: "M", stock: Number(body.stock) || 10 },
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
  } catch (error: any) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

// 3. UPDATE PRODUCT
export async function PATCH(req: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.priceBDT !== undefined) updates.priceBDT = Number(body.priceBDT);
    if (body.description !== undefined) updates.description = body.description;
    if (body.material !== undefined) updates.material = body.material;
    if (body.fit !== undefined) updates.fit = body.fit;
    if (body.care !== undefined) {
      updates.care = Array.isArray(body.care)
        ? body.care
        : typeof body.care === "string"
        ? body.care.split(",").map((s: string) => s.trim()).filter(Boolean)
        : ["Machine wash cold"];
    }
    if (body.sizes !== undefined) updates.sizes = body.sizes;
    if (body.image) updates.images = [{ src: body.image, alt: body.name || "Product image" }];
    if (body.featured !== undefined) updates.featured = Boolean(body.featured);
    if (body.newArrival !== undefined) updates.newArrival = Boolean(body.newArrival);
    if (body.bestSeller !== undefined) updates.bestSeller = Boolean(body.bestSeller);

    await db.update(products).set(updates).where(eq(products.id, body.id));
    return NextResponse.json({ success: true, updated: updates });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// 4. DELETE PRODUCT
export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const singleId = searchParams.get("id");

    if (singleId) {
      await db.delete(products).where(eq(products.id, singleId));
      return NextResponse.json({ success: true, deletedId: singleId });
    }

    const body = await req.json().catch(() => ({}));
    if (body.ids && Array.isArray(body.ids) && body.ids.length > 0) {
      await db.delete(products).where(inArray(products.id, body.ids));
      return NextResponse.json({ success: true, count: body.ids.length });
    }

    return NextResponse.json({ error: "No ID provided" }, { status: 400 });
  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
