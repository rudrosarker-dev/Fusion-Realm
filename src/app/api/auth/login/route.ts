import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { comparePassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`login-${ip}`, 8, 60)) {
      return NextResponse.json({ error: "অনেকবার ভুল চেষ্টা হয়েছে। ১ মিনিট অপেক্ষা করুন।" }, { status: 429 });
    }

    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "ইমেইল এবং পাসওয়ার্ড দিন।" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const found = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    const user = found[0];
    if (!user) {
      return NextResponse.json({ error: "ভুল ইমেইল অথবা পাসওয়ার্ড।" }, { status: 401 });
    }

    // পাসওয়ার্ড যাচাই
    const isValid = await comparePassword(password.trim(), user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "ভুল ইমেইল অথবা পাসওয়ার্ড।" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return NextResponse.json({ error: "লগইন ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
