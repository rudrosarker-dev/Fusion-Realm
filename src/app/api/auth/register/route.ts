import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "সকল তথ্য সঠিকভাবে পূরণ করুন।" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // ১. ডাটাবেজে আগেই অ্যাকাউন্ট আছে কিনা চেক
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা আছে। Sign In করুন।" }, { status: 400 });
    }

    // ২. Neon ডাটাবেজে নতুন ইউজার সেভ করা
    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      passwordHash: password.trim(),
      role: "CUSTOMER",
    };

    await db.insert(users).values(newUser);

    return NextResponse.json({
      success: true,
      user: { name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "ডাটাবেজে অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
