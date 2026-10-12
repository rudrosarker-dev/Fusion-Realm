import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // 1. Neon Database থেকে ইউজার চেক
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);

    const adminUser = foundUsers[0];

    if (!adminUser) {
      return NextResponse.json({ error: "Access denied. Invalid credentials." }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ORDER_MODERATOR"].includes(adminUser.role)) {
      return NextResponse.json({ error: "Access denied. Staff privileges required." }, { status: 403 });
    }

    if (adminUser.passwordHash !== password) {
      return NextResponse.json({ error: "Access denied. Invalid password." }, { status: 401 });
    }

    // 2. সেশন ডাটা তৈরি
    const sessionData = JSON.stringify({
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      loggedInAt: Date.now(),
    });

    // 3. কোনো maxAge দেওয়া হবে না (যাতে ব্রাউজার/ট্যাব বন্ধ করলে সাথে সাথে সেশন ডিলিট হয়ে লক হয়ে যায়)
    const cookieStore = await cookies();
    cookieStore.set("nf_admin_session", Buffer.from(sessionData).toString("base64"), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // maxAge রিমুভ করা হয়েছে -> এটি এখন একটি খাঁটি "Session Cookie"
    });

    return NextResponse.json({
      success: true,
      user: { id: adminUser.id, name: adminUser.name, email: adminUser.email, role: adminUser.role },
    });
  } catch (err: any) {
    console.error("Admin auth error:", err);
    return NextResponse.json({ error: "Internal server error connecting to database" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("nf_admin_session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const decoded = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf-8"));
    return NextResponse.json({ authenticated: true, user: decoded });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("nf_admin_session");
  return NextResponse.json({ success: true });
}
