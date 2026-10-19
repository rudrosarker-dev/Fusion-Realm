import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { BRAND_CONFIG } from "@/lib/brand.config";
import { checkRateLimit, clampStr, escapeHtml, getClientIp, sha256Hex, siteUrl } from "@/lib/security";

export const dynamic = "force-dynamic";

// সবসময় একই উত্তর — অ্যাকাউন্ট আছে কি না তা বোঝা যাবে না (এনুমারেশন প্রতিরোধ)
const GENERIC = {
  success: true,
  message: "যদি এই ইমেইলে কোনো অ্যাকাউন্ট থাকে, তবে পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। ইনবক্স চেক করুন।",
};

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!(await checkRateLimit(`forgot-ip-${ip}`, 5, 900))) {
      return NextResponse.json({ error: "অনেকবার অনুরোধ করা হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।" }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const email = clampStr(body.email, 200).toLowerCase();
    if (!email) return NextResponse.json({ error: "ইমেইল প্রদান করুন।" }, { status: 400 });

    if (!(await checkRateLimit(`forgot-acct-${email}`, 3, 3600))) return NextResponse.json(GENERIC);

    const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = found[0];
    // অ্যাডমিন/স্টাফের পাসওয়ার্ড ইমেইল-রিসেটে বদলানো যাবে না
    if (!user || user.role !== "CUSTOMER") return NextResponse.json(GENERIC);

    const rawToken = crypto.randomBytes(32).toString("hex");
    await db
      .update(users)
      .set({ resetToken: sha256Hex(rawToken), resetTokenExpiry: new Date(Date.now() + 30 * 60 * 1000) })
      .where(eq(users.id, user.id));

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      return NextResponse.json(GENERIC);
    }

    // হোস্ট হেডার নয় — কনফিগার করা সাইট URL (Host header poisoning প্রতিরোধ)
    const resetUrl = `${siteUrl(req)}/reset-password?token=${rawToken}`;
    const from = process.env.RESEND_FROM || `${BRAND_CONFIG.brandName} <onboarding@resend.dev>`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `Password Reset Instructions — ${BRAND_CONFIG.brandName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #ddd; background: #fafafa;">
            <p style="letter-spacing: 3px; font-size: 11px; text-transform: uppercase; color: #888;">${escapeHtml(BRAND_CONFIG.brandName)} ATELIER</p>
            <h2 style="font-size: 20px; color: #161513; margin-top: 8px;">পাসওয়ার্ড রিসেট নির্দেশিকা</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #555;">
              প্রিয় ${escapeHtml(user.name)},<br/>
              আপনার অ্যাকাউন্টের পাসওয়ার্ড রিসেট করার জন্য একটি অনুরোধ পেয়েছি। নিচের বাটনে ক্লিক করে নতুন পাসওয়ার্ড দিন:
            </p>
            <div style="margin: 26px 0;">
              <a href="${escapeHtml(resetUrl)}" style="background-color: #161513; color: #ffffff; padding: 12px 24px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; display: inline-block;">পাসওয়ার্ড পরিবর্তন করুন</a>
            </div>
            <p style="font-size: 12px; color: #888; line-height: 1.5;">
              এই লিংকটি আগামী ৩০ মিনিটের জন্য সক্রিয় থাকবে। আপনি এই অনুরোধ না করে থাকলে মেইলটি এড়িয়ে চলুন।
            </p>
          </div>`,
      }),
    });
    if (!emailResponse.ok) console.error("Resend responded with status", emailResponse.status);

    return NextResponse.json(GENERIC);
  } catch {
    return NextResponse.json({ error: "সার্ভারে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
