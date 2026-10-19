import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, isValidPasswordInput, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { checkRateLimit, clampStr, getClientIp } from "@/lib/security";
import { setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!(await checkRateLimit(`reg-${ip}`, 5, 600))) {
      return NextResponse.json({ error: "অতিরিক্ত চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।" }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const name = clampStr(body.name, 100);
    const email = clampStr(body.email, 200).toLowerCase();
    const password = body.password;

    if (!name || !EMAIL_RE.test(email) || !isValidPasswordInput(password)) {
      return NextResponse.json(
        { error: `সকল তথ্য সঠিকভাবে দিন (পাসওয়ার্ড অন্তত ${MIN_PASSWORD_LENGTH} ও সর্বোচ্চ ১২৮ অক্ষরের)।` },
        { status: 400 }
      );
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা আছে।" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const newUser = {
      id: `usr-${crypto.randomUUID()}`, // অনুমানযোগ্য Date.now() আইডি নয়
      name,
      email,
      passwordHash,
      role: "CUSTOMER" as const, // role কখনো ক্লায়েন্ট থেকে নেওয়া হয় না
    };
    await db.insert(users).values(newUser);
    await setSessionCookie("customer", newUser);

    return NextResponse.json({ success: true, user: { name: newUser.name, email: newUser.email, role: "CUSTOMER" } });
  } catch {
    return NextResponse.json({ error: "অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
