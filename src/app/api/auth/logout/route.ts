import { NextResponse } from "next/server";
import { clearSessionCookie, COOKIE_CUSTOMER } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearSessionCookie(COOKIE_CUSTOMER);
  return NextResponse.json({ success: true });
}
