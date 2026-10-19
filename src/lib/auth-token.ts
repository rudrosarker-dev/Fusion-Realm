// src/lib/auth-token.ts
// HMAC-SHA256 দিয়ে সাইন করা সেশন টোকেন (মেয়াদসহ)।
import crypto from "crypto";

let cachedSecret: string | null = null;

function getSecret(): string {
  if (cachedSecret) return cachedSecret;
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) {
    cachedSecret = s;
    return s;
  }
  if (process.env.NODE_ENV === "production") {
    // হার্ডকোড করা ডিফল্ট সিক্রেট আর নেই — সেট না থাকলে অ্যাপ সেশন তৈরিই করবে না।
    throw new Error("SESSION_SECRET (কমপক্ষে ৩২ অক্ষর) এনভায়রনমেন্টে সেট করা আবশ্যক।");
  }
  // ডেভেলপমেন্টে প্রতি প্রসেসে র‍্যান্ডম সিক্রেট (রিস্টার্টে সেশন বাতিল হবে)
  cachedSecret = crypto.randomBytes(48).toString("hex");
  return cachedSecret;
}

function hmac(data: string): string {
  return crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export interface SessionPayload {
  id: string;
  role: string;
  /** passwordHash-এর ফিঙ্গারপ্রিন্ট: পাসওয়ার্ড বদলালে পুরনো সেশন অচল হয় */
  pv?: string;
  iat: number;
  exp: number;
  [k: string]: any;
}

export function signSession(payload: Record<string, any>, ttlSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const full = { ...payload, iat: now, exp: now + ttlSeconds };
  const data = Buffer.from(JSON.stringify(full)).toString("base64url");
  return `${data}.${hmac(data)}`;
}

export function verifySession<T = SessionPayload>(token?: string | null): T | null {
  if (!token || typeof token !== "string" || token.length > 4096) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, signature] = parts;

  let expected: string;
  try {
    expected = hmac(data);
  } catch {
    return null;
  }
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (!parsed || typeof parsed.exp !== "number" || parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed as T;
  } catch {
    return null;
  }
}

/** পাসওয়ার্ড হ্যাশের ছোট ফিঙ্গারপ্রিন্ট (সেশনে বসানোর জন্য) */
export function passwordFingerprint(passwordHash: string): string {
  return crypto.createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);
}

/** সিক্রেট থেকে উদ্দেশ্য-ভিত্তিক আলাদা কী বানায় (যেমন TOTP সিক্রেট এনক্রিপশন) */
export function deriveKey(purpose: string): Buffer {
  return crypto.createHash("sha256").update(`${purpose}:${getSecret()}`).digest();
}
