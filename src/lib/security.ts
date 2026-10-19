// src/lib/security.ts
import crypto from "crypto";
import type { NextRequest } from "next/server";
import { escapeHtml, safeHref, safeImageSrc, clampStr } from "./safe";

export { escapeHtml, safeHref, safeImageSrc, clampStr };





export function timingSafeEqualStr(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function sha256Hex(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

/** ক্লায়েন্ট IP: প্ল্যাটফর্ম-সেট হেডার আগে (Vercel), তারপর x-forwarded-for-এর শেষ নয় বরং প্রথম মান */
export function getClientIp(req: NextRequest | Request): string {
  const h = req.headers;
  const real = h.get("x-real-ip") || h.get("x-vercel-forwarded-for");
  if (real) return real.split(",")[0].trim().slice(0, 64);
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim().slice(0, 64);
  return "unknown";
}

/**
 * রেট লিমিটার। UPSTASH_REDIS_REST_URL/TOKEN সেট থাকলে Redis (সার্ভারলেসে সঠিক),
 * না থাকলে ইন-মেমোরি (শুধু একক সার্ভারে কার্যকর)।
 * true = অনুমোদিত, false = সীমা অতিক্রম।
 */
const mem = new Map<string, { count: number; expiresAt: number }>();

export async function checkRateLimit(key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      const k = `rl:${key}`;
      const res = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify([
          ["INCR", k],
          ["EXPIRE", k, String(windowSeconds), "NX"],
        ]),
        cache: "no-store",
      });
      const data = await res.json();
      const count = Number(data?.[0]?.result ?? 0);
      return count <= maxRequests;
    } catch {
      /* Redis ব্যর্থ হলে মেমোরি লিমিটারে ফলব্যাক */
    }
  }

  const now = Date.now();
  if (mem.size > 5000) {
    for (const [k, v] of mem) if (now > v.expiresAt) mem.delete(k);
  }
  const entry = mem.get(key);
  if (!entry || now > entry.expiresAt) {
    mem.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count += 1;
  return true;
}

export function siteUrl(req?: NextRequest | Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL সেট করা আবশ্যক।");
  }
  return req ? new URL(req.url).origin : "http://localhost:3000";
}
