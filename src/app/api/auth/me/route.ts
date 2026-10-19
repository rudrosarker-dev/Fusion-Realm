import { NextResponse } from "next/server";
import { getCustomerUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const u = await getCustomerUser();
    if (!u) return NextResponse.json({ authenticated: false }, { status: 401 });
    return NextResponse.json({ authenticated: true, user: { name: u.name, email: u.email, role: u.role } });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
