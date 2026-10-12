import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("nf_staff_session");
    if (!session?.value) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentSession = JSON.parse(Buffer.from(session.value, "base64").toString("utf-8"));
    const { password } = await req.json();

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    await db.update(users).set({ passwordHash: password.trim() }).where(eq(users.id, currentSession.id));

    return NextResponse.json({ success: true, message: "Your staff password has been updated." });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
  }
}
