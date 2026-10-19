import { NextRequest, NextResponse } from "next/server";
import { eq, and, ne } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { comparePassword, hashPassword, isValidPasswordInput, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { checkRateLimit, clampStr, getClientIp } from "@/lib/security";
import { getAdminUser, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;

export async function PATCH(req: NextRequest) {
  try {
    const me = await getAdminUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await checkRateLimit(`admin-profile-${me.id}-${getClientIp(req)}`, 10, 600))) {
      return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const name = clampStr(body.name, 100);
    const email = clampStr(body.email, 200).toLowerCase();
    const newPassword = typeof body.password === "string" && body.password.length > 0 ? body.password : null;
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";

    if (!name || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Valid name and email are required" }, { status: 400 });
    }

    // ইমেইল বা পাসওয়ার্ড বদলাতে বর্তমান পাসওয়ার্ড লাগবে (সেশন চুরি হলেও অ্যাকাউন্ট দখল ঠেকায়)
    const sensitive = newPassword !== null || email !== me.email;
    if (sensitive && !(await comparePassword(currentPassword, me.passwordHash))) {
      return NextResponse.json({ error: "বর্তমান পাসওয়ার্ড সঠিক নয় (Current password is incorrect)." }, { status: 400 });
    }
    if (newPassword !== null && !isValidPasswordInput(newPassword)) {
      return NextResponse.json({ error: `নতুন পাসওয়ার্ড অন্তত ${MIN_PASSWORD_LENGTH} অক্ষরের হতে হবে।` }, { status: 400 });
    }

    const clash = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, me.id)))
      .limit(1);
    if (clash.length > 0) {
      return NextResponse.json({ error: "এই ইমেইল দিয়ে অন্য একটি অ্যাকাউন্ট রয়েছে।" }, { status: 400 });
    }

    const updates: Partial<typeof users.$inferInsert> = { name, email };
    if (newPassword !== null) updates.passwordHash = await hashPassword(newPassword);
    await db.update(users).set(updates).where(eq(users.id, me.id));

    // পাসওয়ার্ড বদলালে নতুন ফিঙ্গারপ্রিন্টসহ কুকি আবার ইস্যু (নিজে লগআউট হবে না, অন্য সব সেশন বাতিল)
    await setSessionCookie("admin", { id: me.id, role: me.role, passwordHash: updates.passwordHash ?? me.passwordHash });

    return NextResponse.json({
      success: true,
      user: { id: me.id, name, email, role: me.role },
      message: "Owner credentials successfully updated!",
    });
  } catch {
    return NextResponse.json({ error: "Failed to update admin profile" }, { status: 500 });
  }
}
