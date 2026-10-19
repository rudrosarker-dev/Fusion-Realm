import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { eq, desc, and } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, isValidPasswordInput, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { clampStr } from "@/lib/security";
import { isDeny, requireSuperAdmin, STAFF_PERMISSIONS } from "@/lib/auth";

export const dynamic = "force-dynamic";
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (isDeny(auth)) return auth.response;

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
  } catch {
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (isDeny(auth)) return auth.response;

    const body = await req.json().catch(() => ({}));
    const name = clampStr(body.name, 100);
    const email = clampStr(body.email, 200).toLowerCase();

    if (!name || !EMAIL_RE.test(email) || !isValidPasswordInput(body.password)) {
      return NextResponse.json(
        { error: `Name, valid email and password (min ${MIN_PASSWORD_LENGTH} chars) are required.` },
        { status: 400 }
      );
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }

    // শুধু অনুমোদিত permission নাম গ্রহণ
    const perms = Array.isArray(body.permissions)
      ? Array.from(new Set(body.permissions.filter((p: unknown) => (STAFF_PERMISSIONS as readonly string[]).includes(p as string))))
      : ["orders"];

    const newStaff = {
      id: `staff-${crypto.randomUUID()}`,
      name,
      email,
      passwordHash: await hashPassword(body.password), // আগে প্লেইনটেক্সটে যেত
      role: "STAFF" as const, // কখনো SUPER_ADMIN বানানো যাবে না
      roleTitle: clampStr(body.roleTitle, 60) || "Operations Staff",
      permissions: perms as string[],
    };

    await db.insert(users).values(newStaff);
    // পাসওয়ার্ড/হ্যাশ রেসপন্সে ফেরত দেওয়া হয় না
    const { passwordHash: _omit, ...safe } = newStaff;
    return NextResponse.json({ success: true, staff: safe, message: `Staff account created for ${newStaff.name}!` });
  } catch {
    return NextResponse.json({ error: "Failed to create staff" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (isDeny(auth)) return auth.response;

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Staff ID required" }, { status: 400 });

    // শুধু STAFF মুছতে পারবে — অ্যাডমিন/কাস্টমার অ্যাকাউন্ট নয়
    await db.delete(users).where(and(eq(users.id, id), eq(users.role, "STAFF")));
    return NextResponse.json({ success: true, deletedId: id });
  } catch {
    return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 });
  }
}
