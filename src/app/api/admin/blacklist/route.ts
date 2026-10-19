import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { blacklists } from "@/db/schema";
import { clampStr, checkRateLimit, getClientIp } from "@/lib/security";
import { getAdminUser, getStaffUser, isDeny, requireAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PHONE_RE = /^\+?[0-9]{10,15}$/;

// GET:
//  • ?phone=… → চেকআউট পাবলিকভাবে শুধু true/false জানতে পারে (কারণ/তালিকা নয়), রেট-লিমিটসহ
//  • কোনো phone ছাড়া → পুরো তালিকা, শুধু অথেন্টিকেটেড অ্যাডমিন/স্টাফ
export async function GET(req: NextRequest) {
  try {
    const phone = new URL(req.url).searchParams.get("phone")?.trim();

    if (!phone) {
      const auth = await requireAccess("orders", "customers");
      if (isDeny(auth)) return auth.response;
      const all = await db.select().from(blacklists);
      return NextResponse.json({ blacklists: all });
    }

    if (!PHONE_RE.test(phone)) return NextResponse.json({ isBlacklisted: false });

    const privileged = (await getAdminUser()) || (await getStaffUser());
    if (!privileged && !(await checkRateLimit(`bl-check-${getClientIp(req)}`, 30, 60))) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const found = await db.select().from(blacklists).where(eq(blacklists.phone, phone)).limit(1);
    return NextResponse.json({
      isBlacklisted: found.length > 0,
      details: privileged ? found[0] || null : null,
    });
  } catch {
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAccess("orders");
    if (isDeny(auth)) return auth.response;

    const body = await req.json().catch(() => ({}));
    const cleanPhone = clampStr(body.phone, 20);
    if (!PHONE_RE.test(cleanPhone)) return NextResponse.json({ error: "Valid phone number required" }, { status: 400 });

    if (body.action === "remove") {
      await db.delete(blacklists).where(eq(blacklists.phone, cleanPhone));
      return NextResponse.json({ success: true, message: "নম্বরটি ব্ল্যাকলিস্ট থেকে মুক্ত করা হয়েছে।" });
    }

    await db
      .insert(blacklists)
      .values({
        id: `BL-${crypto.randomUUID()}`,
        phone: cleanPhone,
        reason: clampStr(body.reason, 300) || "Parcel refused or suspicious order",
        blacklistedBy: `${auth.actor.kind.toUpperCase()}:${auth.actor.user.email}`, // কে করেছে তা রেকর্ড হয়
      })
      .onConflictDoNothing();

    return NextResponse.json({ success: true, message: "নম্বরটি সফলভাবে ব্ল্যাকলিস্ট করা হয়েছে!" });
  } catch {
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
