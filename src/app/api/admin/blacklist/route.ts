// START OF FILE src/app/api/admin/blacklist/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { blacklists } from "@/db/schema";

export const dynamic = "force-dynamic";

async function verifyAuth() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("nf_admin_session");
  const staffSession = cookieStore.get("nf_staff_session");

  if (adminSession?.value) return true;
  if (staffSession?.value) return true;
  return false;
}

// ১. চেক করা নম্বর ব্ল্যাকলিস্টে আছে কি না
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone")?.trim();

    if (!phone) {
      const all = await db.select().from(blacklists);
      return NextResponse.json({ blacklists: all });
    }

    const found = await db.select().from(blacklists).where(eq(blacklists.phone, phone)).limit(1);
    return NextResponse.json({
      isBlacklisted: found.length > 0,
      details: found[0] || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ২. ব্ল্যাকলিস্টে যোগ করা (বা রিমুভ করা)
export async function POST(req: NextRequest) {
  try {
    const isAuth = await verifyAuth();
    if (!isAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { phone, reason, action } = await req.json();
    const cleanPhone = phone?.trim();

    if (!cleanPhone) return NextResponse.json({ error: "Phone number required" }, { status: 400 });

    if (action === "remove") {
      await db.delete(blacklists).where(eq(blacklists.phone, cleanPhone));
      return NextResponse.json({ success: true, message: "নম্বরটি ব্ল্যাকলিস্ট থেকে মুক্ত করা হয়েছে।" });
    }

    // অ্যাড করা
    await db
      .insert(blacklists)
      .values({
        id: `BL-${Date.now()}`,
        phone: cleanPhone,
        reason: reason || "Parcel refused or suspicious order",
        blacklistedBy: "STAFF_OR_ADMIN",
      })
      .onConflictDoNothing();

    return NextResponse.json({ success: true, message: "নম্বরটি সফলভাবে ব্ল্যাকলিস্ট করা হয়েছে!" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
// END OF FILE src/app/api/admin/blacklist/route.ts
