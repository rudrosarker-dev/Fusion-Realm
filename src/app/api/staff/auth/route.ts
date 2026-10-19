import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { burnPasswordCheck, comparePassword } from "@/lib/password";
import { checkRateLimit, getClientIp } from "@/lib/security";
import { clearSessionCookie, COOKIE_STAFF, getStaffUser, setSessionCookie } from "@/lib/auth";
import { decryptSecret, verifyTotp } from "@/lib/totp";

export const dynamic = "force-dynamic";

function publicUser(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    roleTitle: u.roleTitle || "Staff",
    permissions: Array.isArray(u.permissions) ? u.permissions : [],
  };
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!(await checkRateLimit(`staff-auth-ip-${ip}`, 8, 60))) {
      return NextResponse.json({ error: "Too many attempts. Please wait 1 minute." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
    const password = typeof body.password === "string" ? body.password : "";
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";
    if (!email || !password) return NextResponse.json({ error: "Email and passcode required" }, { status: 400 });

    if (!(await checkRateLimit(`staff-auth-acct-${email}`, 8, 900))) {
      return NextResponse.json({ error: "Account temporarily locked. Try again later." }, { status: 429 });
    }

    const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = found[0];
    const GENERIC = { error: "Access denied. Invalid credentials." };

    if (!user) {
      await burnPasswordCheck(password);
      return NextResponse.json(GENERIC, { status: 401 });
    }
    const ok = await comparePassword(password, user.passwordHash); // আগে ছিল প্লেইনটেক্সট ===
    if (!ok || user.role !== "STAFF") return NextResponse.json(GENERIC, { status: 401 });

    if (user.totpSecret) {
      const secret = decryptSecret(user.totpSecret);
      if (!secret) return NextResponse.json({ error: "2FA configuration error." }, { status: 500 });
      if (!otp) return NextResponse.json({ error: "Enter your 6-digit authenticator code.", needOtp: true }, { status: 401 });
      if (!verifyTotp(secret, otp)) return NextResponse.json({ error: "Invalid authenticator code.", needOtp: true }, { status: 401 });
    }

    await setSessionCookie("staff", user);
    return NextResponse.json({ success: true, user: publicUser(user), mfaEnabled: Boolean(user.totpSecret) });
  } catch {
    return NextResponse.json({ error: "Server authentication error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const u = await getStaffUser();
    if (!u) return NextResponse.json({ authenticated: false }, { status: 401 });
    // permissions সবসময় ডাটাবেজ থেকে — কুকি থেকে নয়
    return NextResponse.json({ authenticated: true, user: publicUser(u), mfaEnabled: Boolean(u.totpSecret) });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function DELETE() {
  await clearSessionCookie(COOKIE_STAFF);
  return NextResponse.json({ success: true });
}
