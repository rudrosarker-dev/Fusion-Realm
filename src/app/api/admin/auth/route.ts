import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { burnPasswordCheck, comparePassword } from "@/lib/password";
import { checkRateLimit, getClientIp } from "@/lib/security";
import { clearSessionCookie, COOKIE_ADMIN, getAdminUser, setSessionCookie } from "@/lib/auth";
import { decryptSecret, verifyTotp } from "@/lib/totp";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!(await checkRateLimit(`admin-auth-ip-${ip}`, 5, 60))) {
      return NextResponse.json({ error: "Too many login attempts. Please wait 1 minute." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
    const password = typeof body.password === "string" ? body.password : "";
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";
    if (!email || !password) return NextResponse.json({ error: "Email and password are required" }, { status: 400 });

    if (!(await checkRateLimit(`admin-auth-acct-${email}`, 8, 900))) {
      return NextResponse.json({ error: "Account temporarily locked. Try again later." }, { status: 429 });
    }

    const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = found[0];
    const GENERIC = { error: "Access denied. Invalid credentials." };

    if (!user) {
      await burnPasswordCheck(password);
      return NextResponse.json(GENERIC, { status: 401 });
    }
    const ok = await comparePassword(password, user.passwordHash);
    // রোল/পাসওয়ার্ড — যেকোনো একটা ভুল হলে একই বার্তা
    if (!ok || !["SUPER_ADMIN", "ORDER_MODERATOR"].includes(user.role)) {
      return NextResponse.json(GENERIC, { status: 401 });
    }

    // ২-ধাপ যাচাই (TOTP) — সক্রিয় থাকলে বাধ্যতামূলক
    const totp = decryptSecret(user.totpSecret);
    if (user.totpSecret) {
      if (!totp) return NextResponse.json({ error: "2FA configuration error. Contact the owner." }, { status: 500 });
      if (!otp) return NextResponse.json({ error: "Enter your 6-digit authenticator code.", needOtp: true }, { status: 401 });
      if (!verifyTotp(totp, otp)) return NextResponse.json({ error: "Invalid authenticator code.", needOtp: true }, { status: 401 });
    }

    await setSessionCookie("admin", user);
    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      mfaEnabled: Boolean(user.totpSecret),
    });
  } catch (err) {
    console.error("Admin auth error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const u = await getAdminUser();
    if (!u) return NextResponse.json({ authenticated: false }, { status: 401 });
    return NextResponse.json({
      authenticated: true,
      user: { id: u.id, name: u.name, email: u.email, role: u.role },
      mfaEnabled: Boolean(u.totpSecret),
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function DELETE() {
  await clearSessionCookie(COOKIE_ADMIN);
  return NextResponse.json({ success: true });
}
