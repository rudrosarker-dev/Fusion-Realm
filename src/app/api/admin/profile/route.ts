import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and, ne } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("nf_admin_session");
    if (!session?.value) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentSession = JSON.parse(Buffer.from(session.value, "base64").toString("utf-8"));
    const { name, email, password } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // চেক করা এই ইমেইলটি অন্য কোনো ইউজারের আছে কি না
    const existing = await db
      .select()
      .from(users)
      .where(and(eq(users.email, cleanEmail), ne(users.id, currentSession.id)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `এই ইমেইলটি (${cleanEmail}) দিয়ে অলরেডি একটি অ্যাকাউন্ট রয়েছে। দয়া করে ভিন্ন কোনো এডমিন ইমেইল দিন।` },
        { status: 400 }
      );
    }

    const updates: any = {
      name: name.trim(),
      email: cleanEmail,
    };

    if (password && password.trim().length >= 6) {
      updates.passwordHash = password.trim();
    }

    // ডাটাবেজে সুপার এডমিন আপডেট করা
    await db.update(users).set(updates).where(eq(users.id, currentSession.id));

    // নতুন সেশন কুকি রি-ইস্যু করা
    const updatedSessionData = JSON.stringify({
      id: currentSession.id,
      name: updates.name,
      email: updates.email,
      role: currentSession.role,
      loggedInAt: Date.now(),
    });

    cookieStore.set("nf_admin_session", Buffer.from(updatedSessionData).toString("base64"), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      success: true,
      user: { id: currentSession.id, name: updates.name, email: updates.email, role: currentSession.role },
      message: "Owner credentials successfully updated!",
    });
  } catch (error: any) {
    console.error("Admin profile update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update admin profile" }, { status: 500 });
  }
}
