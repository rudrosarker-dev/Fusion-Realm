import { NextRequest, NextResponse } from "next/server";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, isValidPasswordInput, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { checkRateLimit, getClientIp, sha256Hex } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!(await checkRateLimit(`reset-ip-${ip}`, 10, 900))) {
      return NextResponse.json({ error: "অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।" }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token : "";
    const newPassword = body.newPassword;

    if (!/^[0-9a-f]{64}$/.test(token) || !isValidPasswordInput(newPassword)) {
      return NextResponse.json(
        { error: `কমপক্ষে ${MIN_PASSWORD_LENGTH} অক্ষরের নতুন পাসওয়ার্ড দিন, এবং সঠিক লিংক ব্যবহার করুন।` },
        { status: 400 }
      );
    }

    const found = await db
      .select()
      .from(users)
      .where(and(eq(users.resetToken, sha256Hex(token)), gt(users.resetTokenExpiry, new Date())))
      .limit(1);
    const user = found[0];

    if (!user || user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "এই লিংকের মেয়াদ শেষ হয়ে গেছে অথবা লিংকটি ভুল।" }, { status: 400 });
    }

    // নতুন পাসওয়ার্ড হ্যাশ করে সেভ, টোকেন মুছে ফেলা (এতে পুরনো সব সেশনও অচল হয়)
    await db
      .update(users)
      .set({ passwordHash: await hashPassword(newPassword), resetToken: null, resetTokenExpiry: null })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      message: "পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! এখন লগইন করুন।",
    });
  } catch {
    return NextResponse.json({ error: "পাসওয়ার্ড সেভ করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
