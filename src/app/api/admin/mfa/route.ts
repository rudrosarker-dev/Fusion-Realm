import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { BRAND_CONFIG } from "@/lib/brand.config";
import { comparePassword } from "@/lib/password";
import { checkRateLimit, getClientIp } from "@/lib/security";
import { getAdminUser, getStaffUser } from "@/lib/auth";
import { decryptSecret, encryptSecret, generateTotpSecret, otpauthUri, verifyTotp } from "@/lib/totp";

export const dynamic = "force-dynamic";

async function currentActor() {
  return (await getAdminUser()) || (await getStaffUser());
}

export async function GET() {
  const u = await currentActor();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ enabled: Boolean(u.totpSecret) });
}

/** action: "setup" | "enable" (code) | "disable" (code + password) */
export async function POST(req: NextRequest) {
  try {
    const u = await currentActor();
    if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await checkRateLimit(`mfa-${u.id}-${getClientIp(req)}`, 10, 600))) {
      return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === "setup") {
      if (u.totpSecret) return NextResponse.json({ error: "2FA is already enabled." }, { status: 400 });
      const secret = generateTotpSecret();
      await db.update(users).set({ totpPending: encryptSecret(secret) }).where(eq(users.id, u.id));
      return NextResponse.json({
        success: true,
        secret,
        uri: otpauthUri(secret, u.email, BRAND_CONFIG.brandName),
      });
    }

    if (action === "enable") {
      const pending = decryptSecret(u.totpPending);
      if (!pending) return NextResponse.json({ error: "Start setup first." }, { status: 400 });
      if (!verifyTotp(pending, String(body.code || ""))) {
        return NextResponse.json({ error: "Invalid code. Check your authenticator app time and try again." }, { status: 400 });
      }
      await db.update(users).set({ totpSecret: encryptSecret(pending), totpPending: null }).where(eq(users.id, u.id));
      return NextResponse.json({ success: true, message: "Two-factor authentication enabled." });
    }

    if (action === "disable") {
      const secret = decryptSecret(u.totpSecret);
      if (!secret) return NextResponse.json({ error: "2FA is not enabled." }, { status: 400 });
      const passOk = await comparePassword(String(body.password || ""), u.passwordHash);
      if (!passOk || !verifyTotp(secret, String(body.code || ""))) {
        return NextResponse.json({ error: "Password or code is incorrect." }, { status: 400 });
      }
      await db.update(users).set({ totpSecret: null, totpPending: null }).where(eq(users.id, u.id));
      return NextResponse.json({ success: true, message: "Two-factor authentication disabled." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "MFA request failed" }, { status: 500 });
  }
}
