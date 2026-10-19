import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { comparePassword, hashPassword, isValidPasswordInput, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { checkRateLimit, getClientIp } from "@/lib/security";
import { getStaffUser, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const me = await getStaffUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await checkRateLimit(`staff-profile-${me.id}-${getClientIp(req)}`, 10, 600))) {
      return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const password = body.password;
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";

    if (!isValidPasswordInput(password)) {
      return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }, { status: 400 });
    }
    if (!(await comparePassword(currentPassword, me.passwordHash))) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    await db.update(users).set({ passwordHash }).where(eq(users.id, me.id));
    await setSessionCookie("staff", { id: me.id, role: me.role, passwordHash });

    return NextResponse.json({ success: true, message: "Your staff password has been updated." });
  } catch {
    return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
  }
}
