import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const dynamic = "force-dynamic";

async function verifySuperAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("nf_admin_session");
  if (!session?.value) return false;
  try {
    const decoded = JSON.parse(Buffer.from(session.value, "base64").toString("utf-8"));
    return decoded.role === "SUPER_ADMIN";
  } catch {
    return false;
  }
}

// ১. স্টাফদের তালিকা দেখা
export async function GET() {
  try {
    const isSuper = await verifySuperAdmin();
    if (!isSuper) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const staffMembers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        roleTitle: users.roleTitle,
        permissions: users.permissions,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, "STAFF"))
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ success: true, staff: staffMembers });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

// ২. নতুন স্টাফ মেম্বার তৈরি করা
export async function POST(req: NextRequest) {
  try {
    const isSuper = await verifySuperAdmin();
    if (!isSuper) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { name, email, password, roleTitle, permissions } = await req.json();

    if (!name || !email || !password || password.length < 6) {
      return NextResponse.json({ error: "Name, email and password (min 6 chars) are required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // চেক করা এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট আগে থেকেই আছে কি না
    const existing = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }

    const newStaff = {
      id: `staff-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      passwordHash: password.trim(),
      role: "STAFF",
      roleTitle: roleTitle?.trim() || "Operations Staff",
      permissions: Array.isArray(permissions) ? permissions : ["orders"],
    };

    await db.insert(users).values(newStaff);
    return NextResponse.json({ success: true, staff: newStaff, message: `Staff account created for ${newStaff.name}!` });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create staff" }, { status: 500 });
  }
}

// ৩. স্টাফ মুছে ফেলা / অ্যাক্সেস বাতিল করা
export async function DELETE(req: NextRequest) {
  try {
    const isSuper = await verifySuperAdmin();
    if (!isSuper) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Staff ID required" }, { status: 400 });

    await db.delete(users).where(eq(users.id, id));
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 });
  }
}
