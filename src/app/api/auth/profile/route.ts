import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCustomerUser } from "@/lib/auth";
import { checkRateLimit, clampStr, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

// গ্রাহক শুধু নিজের নাম বদলাতে পারে। (ইমেইল বদলানো হয় না: যাচাই ছাড়া ইমেইল বদলালে অ্যাকাউন্ট-দখল ঝুঁকি।)
export async function PATCH(req: NextRequest) {
  try {
    const me = await getCustomerUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await checkRateLimit(`profile-${me.id}-${getClientIp(req)}`, 20, 600))) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const body = await req.json().catch(() => ({}));
    const name = clampStr(body.name, 100);
    if (name.length < 2) return NextResponse.json({ error: "নাম অন্তত ২ অক্ষরের হতে হবে।" }, { status: 400 });
    await db.update(users).set({ name }).where(eq(users.id, me.id));
    return NextResponse.json({ success: true, user: { name, email: me.email } });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
