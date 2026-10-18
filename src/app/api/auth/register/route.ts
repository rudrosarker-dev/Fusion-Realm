import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`reg-${ip}`, 5, 60)) {
      return NextResponse.json({ error: "অতিরিক্ত চেষ্টা করা হয়েছে। ১ মিনিট পর আবার চেষ্টা করুন।" }, { status: 429 });
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password || password.trim().length < 6) {
      return NextResponse.json({ error: "সকল তথ্য সঠিকভাবে দিন (পাসওয়ার্ড অন্তত ৬ অক্ষরের)।" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা আছে।" }, { status: 400 });
    }

    // পাসওয়ার্ড হ্যাশ করা হচ্ছে
    const secureHash = await hashPassword(password.trim());

    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      passwordHash: secureHash,
      role: "CUSTOMER",
    };

    await db.insert(users).values(newUser);

    return NextResponse.json({
      success: true,
      user: { name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    return NextResponse.json({ error: "ডাটাবেজে অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
