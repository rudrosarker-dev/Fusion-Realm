import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const dynamic = "force-dynamic";

// ১. স্টাফ লগইন
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and passcode required" }, { status: 400 });
    }

    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);

    const staffUser = foundUsers[0];

    // ইউজার স্টাফ কিনা যাচাই করা
    if (!staffUser || staffUser.role !== "STAFF") {
      return NextResponse.json({ error: "Access denied. Valid staff credentials required." }, { status: 403 });
    }

    if (staffUser.passwordHash !== password.trim()) {
      return NextResponse.json({ error: "Invalid staff passcode." }, { status: 401 });
    }

    // আলাদা এনক্রিপ্টেড কুকিতে স্টাফ সেশন সেভ করা
    const sessionData = JSON.stringify({
      id: staffUser.id,
      name: staffUser.name,
      email: staffUser.email,
      role: staffUser.role,
      roleTitle: staffUser.roleTitle || "Staff",
      permissions: staffUser.permissions || [],
      loggedInAt: Date.now(),
    });

    const cookieStore = await cookies();
    cookieStore.set("nf_staff_session", Buffer.from(sessionData).toString("base64"), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // ৭ দিন লগইন সেশন সক্রিয় থাকবে
    });

    return NextResponse.json({
      success: true,
      user: {
        id: staffUser.id,
        name: staffUser.name,
        email: staffUser.email,
        roleTitle: staffUser.roleTitle,
        permissions: staffUser.permissions,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Server authentication error" }, { status: 500 });
  }
}

// ২. অ্যাক্টিভ স্টাফ সেশন চেক
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("nf_staff_session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const decoded = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf-8"));
    return NextResponse.json({ authenticated: true, user: decoded });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

// ৩. স্টাফ লগআউট
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("nf_staff_session");
  return NextResponse.json({ success: true });
}
