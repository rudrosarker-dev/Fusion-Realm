import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@/db";
import { users } from "@/db/schema";
import { BRAND_CONFIG } from "@/lib/brand.config";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "ইমেইল প্রদান করুন।" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    const user = foundUsers[0];

    if (!user) {
      return NextResponse.json(
        { error: "এই ইমেইলে কোনো অ্যাকাউন্ট খোলা নেই। দয়া করে আগে Create Account করুন।" },
        { status: 404 }
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await db
      .update(users)
      .set({
        resetToken: resetToken,
        resetTokenExpiry: expiry,
      })
      .where(eq(users.id, user.id));

    const host = req.headers.get("host") || "noir-form.vercel.app";
    const protocol = host.includes("localhost") ? "http" : "https";
    const resetUrl = `${protocol}://${host}/reset-password?token=${resetToken}`;

    // Vercel Environment Variable থেকে নিরাপদভাবে Key রিড করা হচ্ছে
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured in Vercel");
      return NextResponse.json({ error: "ইমেইল সার্ভিস কনফিগার করা হয়নি।" }, { status: 500 });
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${BRAND_CONFIG.brandName} <onboarding@resend.dev>`,
        to: [cleanEmail],
        subject: `Password Reset Instructions — ${BRAND_CONFIG.brandName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #ddd; background: #fafafa;">
            <p style="letter-spacing: 3px; font-size: 11px; text-transform: uppercase; color: #888;">${BRAND_CONFIG.brandName} ATELIER</p>
            <h2 style="font-size: 20px; color: #161513; margin-top: 8px;">পাসওয়ার্ড রিসেট নির্দেশিকা</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #555;">
              প্রিয় ${user.name},<br/>
              আপনার অ্যাকাউন্টের পাসওয়ার্ড রিসেট করার জন্য একটি অনুরোধ পেয়েছি। নিচের বাটনে ক্লিক করে নতুন পাসওয়ার্ড দিন:
            </p>
            <div style="margin: 26px 0;">
              <a href="${resetUrl}" style="background-color: #161513; color: #ffffff; padding: 12px 24px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; display: inline-block;">
                পাসওয়ার্ড পরিবর্তন করুন
              </a>
            </div>
            <p style="font-size: 12px; color: #888; line-height: 1.5;">
              এই লিংকটি আগামী ১ ঘণ্টার জন্য সক্রিয় থাকবে। আপনি যদি এই অনুরোধ না করে থাকেন, তবে এই মেইলটি এড়িয়ে চলুন।
            </p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errData = await emailResponse.json();
      console.error("Resend error:", errData);
      return NextResponse.json({ error: "ইমেইল পাঠাতে সমস্যা হয়েছে। পরে চেষ্টা করুন।" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "আপনার ইমেইলে পাসওয়ার্ড রিসেট লিংক সফলভাবে পাঠানো হয়েছে। ইনবক্স চেক করুন!",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "সার্ভারে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
