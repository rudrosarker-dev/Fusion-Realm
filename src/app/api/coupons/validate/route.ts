import { NextRequest, NextResponse } from "next/server";
import { evaluateCoupon } from "@/lib/coupons-server";
import { checkRateLimit, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // কুপন-কোড অনুমান (brute-force) ঠেকাতে রেট লিমিট
    if (!(await checkRateLimit(`coupon-${getClientIp(req)}`, 15, 60))) {
      return NextResponse.json({ ok: false, reason: "Too many attempts. Please wait a minute." }, { status: 429 });
    }
    const body = await req.json().catch(() => ({}));
    const subtotal = Math.max(0, Math.floor(Number(body.subtotalBDT) || 0));
    const r = await evaluateCoupon(body.code, subtotal);
    if (!r.ok) return NextResponse.json({ ok: false, reason: r.reason });
    return NextResponse.json({
      ok: true,
      coupon: { code: r.code, type: r.type, value: r.value },
      discountBDT: r.discountBDT,
    });
  } catch {
    return NextResponse.json({ ok: false, reason: "Error validating coupon." }, { status: 500 });
  }
}
