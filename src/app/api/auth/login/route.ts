import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { burnPasswordCheck, comparePassword } from "@/lib/password";
import { checkRateLimit, getClientIp } from "@/lib/security";
import { setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!(await checkRateLimit(`login-ip-${ip}`, 10, 60))) {
      return NextResponse.json({ error: "অনেকবার চেষ্টা হয়েছে। ১ মিনিট অপেক্ষা করুন।" }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      return NextResponse.json({ error: "ইমেইল এবং পাসওয়ার্ড দিন।" }, { status: 400 });
    }
    // একই অ্যাকাউন্টে বিতরিত ব্রুট-ফোর্স ঠেকাতে ইমেইল-ভিত্তিক লিমিট
    if (!(await checkRateLimit(`login-acct-${email}`, 10, 900))) {
      return NextResponse.json({ error: "অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।" }, { status: 429 });
    }

    const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = found[0];
    const GENERIC = { error: "ভুল ইমেইল অথবা পাসওয়ার্ড।" };

    if (!user) {
      await burnPasswordCheck(password);
      return NextResponse.json(GENERIC, { status: 401 });
    }
    const ok = await comparePassword(password, user.passwordHash);
    // অ্যাডমিন/স্টাফ এই পথে ঢুকতে পারবে না (তাদের আলাদা লগইন + 2FA আছে)
    if (!ok || user.role !== "CUSTOMER") return NextResponse.json(GENERIC, { status: 401 });

    await setSessionCookie("customer", user);
    return NextResponse.json({
      success: true,
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch {
    return NextResponse.json({ error: "লগইন ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
