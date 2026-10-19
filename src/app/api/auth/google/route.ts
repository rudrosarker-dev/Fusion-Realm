import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { siteUrl } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google sign-in is not configured" }, { status: 500 });
  }

  const base = siteUrl(req);
  const redirectUri = `${base}/api/auth/google/callback`;
  // CSRF/Login-CSRF প্রতিরোধ: র‍্যান্ডম state কুকিতে রেখে কলব্যাকে মিলিয়ে দেখা হয়
  const state = crypto.randomBytes(24).toString("base64url");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(url.toString());
  res.cookies.set("nf_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return res;
}
