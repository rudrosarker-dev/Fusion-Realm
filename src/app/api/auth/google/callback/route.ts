import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { randomUnusableHash } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth";
import { siteUrl, timingSafeEqualStr } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const base = siteUrl(req);
  const fail = (code: string) => {
    const r = NextResponse.redirect(`${base}/account?error=${code}`);
    r.cookies.set("nf_oauth_state", "", { path: "/api/auth/google", maxAge: 0 });
    return r;
  };

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const cookieState = req.cookies.get("nf_oauth_state")?.value;

    if (!code) return fail("google_auth_failed");
    if (!state || !cookieState || !timingSafeEqualStr(state, cookieState)) return fail("invalid_state");

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: `${base}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) return fail("token_failed");

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const g = await userRes.json();

    if (!g.email) return fail("no_email");
    // গুগল যে ইমেইল যাচাই করেনি সেটা দিয়ে অ্যাকাউন্ট দখল ঠেকাতে
    if (g.verified_email !== true && g.email_verified !== true) return fail("email_not_verified");

    const email = String(g.email).toLowerCase().trim();
    const name = String(g.name || "Valued Customer").trim().slice(0, 100);

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    let user = existing[0];

    if (user && user.role !== "CUSTOMER") {
      // অ্যাডমিন/স্টাফ অ্যাকাউন্ট কখনো Google দিয়ে খোলা যাবে না
      return fail("not_allowed");
    }

    if (!user) {
      const newUser = {
        id: `usr-g-${crypto.randomUUID()}`,
        name,
        email,
        passwordHash: await randomUnusableHash(), // কেউ অনুমান করতে পারে এমন "GOOGLE_OAUTH_ACCOUNT" নয়
        role: "CUSTOMER" as const,
      };
      await db.insert(users).values(newUser);
      user = (await db.select().from(users).where(eq(users.id, newUser.id)).limit(1))[0];
    }

    await setSessionCookie("customer", user);
    // সেশন আর URL-এ পাঠানো হয় না — শুধু সার্ভার-সেট httpOnly কুকিতে
    const res = NextResponse.redirect(`${base}/account?google_login=success`);
    res.cookies.set("nf_oauth_state", "", { path: "/api/auth/google", maxAge: 0 });
    return res;
  } catch (error) {
    console.error("Google callback error");
    return fail("server_error");
  }
}
