// src/lib/auth.ts — সার্ভার-সাইড অথেনটিকেশন/অথোরাইজেশনের একমাত্র কেন্দ্র।
// সব ক্ষেত্রে: (১) কুকির সিগনেচার ও মেয়াদ যাচাই, (২) ডাটাবেজ থেকে ইউজারের বর্তমান role/permissions পড়া
// (কুকির কথা বিশ্বাস করা হয় না), (৩) পাসওয়ার্ড বদলালে বা ইউজার মুছলে পুরনো সেশন বাতিল।
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { passwordFingerprint, signSession, verifySession, type SessionPayload } from "./auth-token";

export const COOKIE_ADMIN = "nf_admin_session";
export const COOKIE_STAFF = "nf_staff_session";
export const COOKIE_CUSTOMER = "nf_customer_session";

export const TTL = {
  admin: 60 * 60 * 8, // ৮ ঘণ্টা
  staff: 60 * 60 * 12, // ১২ ঘণ্টা
  customer: 60 * 60 * 24 * 7, // ৭ দিন
};

export const STAFF_PERMISSIONS = ["orders", "products", "inventory", "discounts", "customers"] as const;
export type StaffPermission = (typeof STAFF_PERMISSIONS)[number];

type UserRow = typeof users.$inferSelect;

export async function setSessionCookie(
  kind: "admin" | "staff" | "customer",
  user: Pick<UserRow, "id" | "role" | "passwordHash">
) {
  const name = kind === "admin" ? COOKIE_ADMIN : kind === "staff" ? COOKIE_STAFF : COOKIE_CUSTOMER;
  const ttl = TTL[kind];
  const token = signSession({ id: user.id, role: user.role, pv: passwordFingerprint(user.passwordHash) }, ttl);
  const store = await cookies();
  store.set(name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: kind === "customer" ? "lax" : "strict",
    path: "/",
    maxAge: ttl,
  });
}

export async function clearSessionCookie(name: string) {
  const store = await cookies();
  store.set(name, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}

async function loadUser(cookieName: string): Promise<UserRow | null> {
  const store = await cookies();
  const payload = verifySession<SessionPayload>(store.get(cookieName)?.value);
  if (!payload?.id) return null;
  const rows = await db.select().from(users).where(eq(users.id, payload.id)).limit(1);
  const user = rows[0];
  if (!user) return null; // ইউজার মুছে ফেলা হলে সেশন অচল
  if (payload.pv !== passwordFingerprint(user.passwordHash)) return null; // পাসওয়ার্ড বদলালে সেশন অচল
  return user;
}

export async function getAdminUser(): Promise<UserRow | null> {
  const u = await loadUser(COOKIE_ADMIN);
  return u && (u.role === "SUPER_ADMIN" || u.role === "ORDER_MODERATOR") ? u : null;
}
export async function getStaffUser(): Promise<UserRow | null> {
  const u = await loadUser(COOKIE_STAFF);
  return u && u.role === "STAFF" ? u : null;
}
export async function getCustomerUser(): Promise<UserRow | null> {
  const u = await loadUser(COOKIE_CUSTOMER);
  return u && u.role === "CUSTOMER" ? u : null;
}

export type Actor = { user: UserRow; kind: "admin" | "staff" };

function deny(status: 401 | 403 = 403) {
  return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
}

/** শুধু SUPER_ADMIN */
export async function requireSuperAdmin(): Promise<{ actor: Actor } | { response: NextResponse }> {
  const a = await getAdminUser();
  if (!a || a.role !== "SUPER_ADMIN") return { response: deny(a ? 403 : 401) };
  return { actor: { user: a, kind: "admin" } };
}

/**
 * SUPER_ADMIN সবকিছু পারে। ORDER_MODERATOR শুধু "orders"। STAFF কেবল তার DB-তে থাকা permission অনুযায়ী।
 * perms এর যেকোনো একটি থাকলেই চলবে।
 */
export async function requireAccess(...perms: StaffPermission[]): Promise<{ actor: Actor } | { response: NextResponse }> {
  const admin = await getAdminUser();
  if (admin) {
    if (admin.role === "SUPER_ADMIN") return { actor: { user: admin, kind: "admin" } };
    if (admin.role === "ORDER_MODERATOR" && perms.includes("orders")) return { actor: { user: admin, kind: "admin" } };
  }
  const staff = await getStaffUser();
  if (staff) {
    const have = Array.isArray(staff.permissions) ? staff.permissions : [];
    if (perms.some((p) => have.includes(p))) return { actor: { user: staff, kind: "staff" } };
    return { response: deny(403) };
  }
  return { response: deny(admin ? 403 : 401) };
}

export function isDeny<T extends object>(r: T | { response: NextResponse }): r is { response: NextResponse } {
  return "response" in r;
}
