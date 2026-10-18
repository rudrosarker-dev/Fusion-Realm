// START OF FILE src/lib/auth-token.ts
import crypto from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "tholvex-super-atelier-secret-key-production-32-chars";

/**
 * ডাটা এনকোড এবং ক্রিপ্টোগ্রাফিক সিগনেচার যুক্ত করে নিরাপদ টোকেন তৈরি করে
 */
export function signSession(payload: Record<string, any>): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

/**
 * টোকেনের সিগনেচার যাচাই করে আসল ডাটা রিটার্ন করে। সিগনেচার না মিললে null দেয়।
 */
export function verifySession<T = any>(token?: string | null): T | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [data, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(data)
    .digest("base64url");

  // Timing-safe buffer comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    return null; // Forged or invalid token
  }

  try {
    return JSON.parse(Buffer.from(data, "base64url").toString("utf-8")) as T;
  } catch {
    return null;
  }
}
// END OF FILE src/lib/auth-token.ts
