import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tholvexstudio.vercel.app";
    const redirectUri = `${siteUrl}/api/auth/google/callback`;

    if (!code) {
      return NextResponse.redirect(`${siteUrl}/account?error=google_auth_failed`);
    }

    // ১. গুগল থেকে অ্যাক্সেস টোকেন আনা
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.redirect(`${siteUrl}/account?error=token_failed`);
    }

    // ২. গুগলের ইউজার প্রোফাইল (নাম ও ইমেইল) রিড করা
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();

    if (!googleUser.email) {
      return NextResponse.redirect(`${siteUrl}/account?error=no_email`);
    }

    const cleanEmail = googleUser.email.toLowerCase().trim();
    const cleanName = googleUser.name || "Valued Customer";

    // ৩. নিয়ন ডাটাবেজে ইউজার আছে কি না চেক করা
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    let currentUser = existing[0];

    // না থাকলে ডাটাবেজে অটোমেটিক নতুন ইউজার সেভ করা
    if (!currentUser) {
      const newUser = {
        id: `usr-g-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        passwordHash: "GOOGLE_OAUTH_ACCOUNT",
        role: "CUSTOMER",
      };
      await db.insert(users).values(newUser);
      currentUser = newUser as any;
    }

    // ৪. ব্রাউজারে ইউজার সেশন সেট করে অ্যাকাউন্ট পেজে ফেরত পাঠানো
    const sessionUserData = encodeURIComponent(
      JSON.stringify({
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
      })
    );

    return NextResponse.redirect(`${siteUrl}/account?google_login=success&session=${sessionUserData}`);
  } catch (error) {
    console.error("Google Callback Error:", error);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tholvexstudio.vercel.app";
    return NextResponse.redirect(`${siteUrl}/account?error=server_error`);
  }
}
