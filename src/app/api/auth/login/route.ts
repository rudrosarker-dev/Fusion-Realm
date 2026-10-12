import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "ইমেইল এবং পাসওয়ার্ড দিন।" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // ১. Neon ডাটাবেজে ইউজার খোঁজা
    const found = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    const user = found[0];

    if (!user) {
      return NextResponse.json({ error: "এই অ্যাকাউন্টটি পাওয়া যায়নি। দয়া করে Create Account করুন।" }, { status: 404 });
    }

    // ২. পাসওয়ার্ড চেক
    if (user.passwordHash !== password.trim()) {
      return NextResponse.json({ error: "পাসওয়ার্ড ভুল হয়েছে।" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "লগইন করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
