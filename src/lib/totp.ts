// src/lib/totp.ts — RFC 6238 TOTP (Google Authenticator / Authy সামঞ্জস্যপূর্ণ), কোনো বাইরের প্যাকেজ ছাড়া
import crypto from "crypto";
import { deriveKey } from "./auth-token";

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateTotpSecret(): string {
  const bytes = crypto.randomBytes(20);
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

function base32Decode(s: string): Buffer {
  let bits = "";
  for (const c of s.replace(/=+$/, "").toUpperCase()) {
    const v = B32.indexOf(c);
    if (v < 0) continue;
    bits += v.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function hotp(secret: string, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac("sha1", base32Decode(secret)).update(buf).digest();
  const off = h[h.length - 1] & 0xf;
  const code = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return String(code % 1_000_000).padStart(6, "0");
}

/** ±১ ধাপ (৩০ সেকেন্ড) সময়ের গরমিল সহ্য করে */
export function verifyTotp(secret: string, token: string): boolean {
  if (!secret || !/^\d{6}$/.test(String(token || "").trim())) return false;
  const t = String(token).trim();
  const step = Math.floor(Date.now() / 30000);
  for (const w of [-1, 0, 1]) {
    const expected = hotp(secret, step + w);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(t))) return true;
  }
  return false;
}

export function otpauthUri(secret: string, account: string, issuer: string): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

/** ডাটাবেজে TOTP সিক্রেট AES-256-GCM দিয়ে এনক্রিপ্ট করে রাখা হয় */
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", deriveKey("totp"), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `${iv.toString("base64url")}.${enc.toString("base64url")}.${c.getAuthTag().toString("base64url")}`;
}

export function decryptSecret(stored: string | null | undefined): string | null {
  if (!stored) return null;
  try {
    const [iv, enc, tag] = stored.split(".").map((x) => Buffer.from(x, "base64url"));
    const d = crypto.createDecipheriv("aes-256-gcm", deriveKey("totp"), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}
