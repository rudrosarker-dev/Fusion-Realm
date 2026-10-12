import { NextRequest, NextResponse } from "next/server";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড দিন।" }, { status: 400 });
    }

    // ১. টোকেন ও মেয়াদ চেক
    const foundUsers = await db
      .select()
      .from(users)
      .where(and(eq(users.resetToken, token), gt(users.resetTokenExpiry, new Date())))
      .limit(1);

    const user = foundUsers[0];

    if (!user) {
      return NextResponse.json({ error: "এই লিংকের মেয়াদ শেষ হয়ে গেছে অথবা লিংকটি ভুল।" }, { status: 400 });
    }

    // ২. নতুন পাসওয়ার্ড সেভ ও টোকেন মুছে ফেলা
    await db
      .update(users)
      .set({
        passwordHash: newPassword,
        resetToken: null,
        resetTokenExpiry: null,
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      message: "পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!",
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "পাসওয়ার্ড সেভ করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
