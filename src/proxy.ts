// src/proxy.ts — (Next.js 16-এ middleware.ts-এর নতুন নাম)
// CSRF প্রতিরোধ: ব্রাউজার থেকে আসা state-changing API রিকোয়েস্টের Origin অবশ্যই নিজের সাইট হতে হবে।
import { NextRequest, NextResponse } from "next/server";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/") && MUTATING.has(req.method)) {
    // সার্ভার-টু-সার্ভার ওয়েবহুক নিজস্ব সিক্রেট দিয়ে সুরক্ষিত
    if (pathname.startsWith("/api/webhooks/")) return NextResponse.next();

    const origin = req.headers.get("origin");
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const secFetchSite = req.headers.get("sec-fetch-site");

    if (origin) {
      let originHost = "";
      try {
        originHost = new URL(origin).host;
      } catch {}
      if (!host || originHost !== host) {
        return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
      }
    } else if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
      return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
