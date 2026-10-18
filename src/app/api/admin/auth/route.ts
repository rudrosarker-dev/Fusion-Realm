// START OF FILE src/app/api/admin/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { comparePassword } from "@/lib/password";
import { signSession, verifySession } from "@/lib/auth-token";
import { checkRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // ১. ব্রুট-ফোর্স আক্রমণ প্রতিরোধে রেট লিমিটিং (১ মিনিটে সর্বোচ্চ ৫ বার লগইন চেষ্টা)
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(`admin-auth-${ip}`, 5, 60)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait 1 minute before trying again." },
        { status: 429 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // ২. ডাটাবেজ থেকে অ্যাডমিন ইউজার খোঁজা
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);

    const adminUser = foundUsers[0];

    if (!adminUser) {
      return NextResponse.json({ error: "Access denied. Invalid credentials." }, { status: 401 });
    }

    // ৩. রোল যাচাই (সুপার অ্যাডমিন বা অর্ডার মডারেটর কিনা)
    if (!["SUPER_ADMIN", "ORDER_MODERATOR"].includes(adminUser.role)) {
      return NextResponse.json({ error: "Access denied. Staff privileges required." }, { status: 403 });
    }

    // ৪. সুরক্ষিত পাসওয়ার্ড তুলনা (হ্যাশ এবং পুরনো প্লেইনটেক্সট উভয়েই কাজ করবে)
    const passwordMatch = await comparePassword(password, adminUser.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Access denied. Invalid password." }, { status: 401 });
    }

    // ৫. ক্রিপ্টোগ্রাফিকালি সাইন করা নিরাপদ সেশন টোকেন তৈরি (HMAC SHA-256)
    const sessionToken = signSession({
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      loggedInAt: Date.now(),
    });

    // ৬. ব্রাউজার সেশনে কুকি সেট করা
    const cookieStore = await cookies();
    cookieStore.set("nf_admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
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

// সেশন ভ্যালিডেশন
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("nf_admin_session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // টোকেন সিগনেচার যাচাই
    const decoded = verifySession(sessionCookie.value);
    if (!decoded || !["SUPER_ADMIN", "ORDER_MODERATOR"].includes(decoded.role)) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, user: decoded });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

// লগআউট
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("nf_admin_session");
  return NextResponse.json({ success: true });
}
// END OF FILE src/app/api/admin/auth/route.ts
