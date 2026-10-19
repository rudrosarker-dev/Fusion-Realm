// src/lib/password.ts
// Node.js বিল্ট-ইন scrypt (ফরম্যাট: salt:key — আগের হ্যাশগুলোর সাথে সামঞ্জস্যপূর্ণ)
import crypto from "crypto";

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128; // scrypt-DoS ঠেকাতে

const HASH_RE = /^[0-9a-f]{32}:[0-9a-f]{128}$/;

export function isValidPasswordInput(pw: unknown): pw is string {
  return typeof pw === "string" && pw.length >= MIN_PASSWORD_LENGTH && pw.length <= MAX_PASSWORD_LENGTH;
}

export function isHashed(stored: string): boolean {
  return HASH_RE.test(stored || "");
}

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

/** প্লেইনটেক্সট ফলব্যাক সম্পূর্ণ বাদ। হ্যাশ ফরম্যাট না মিললে সবসময় false। */
export function comparePassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof password !== "string" || password.length > MAX_PASSWORD_LENGTH || !isHashed(storedHash)) {
      return resolve(false);
    }
    const [salt, key] = storedHash.split(":");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return resolve(false);
      const keyBuffer = Buffer.from(key, "hex");
      if (keyBuffer.length !== derivedKey.length) return resolve(false);
      resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
    });
  });
}

// ইউজার নেই — এই ক্ষেত্রেও একই সময় খরচ করতে ডামি হ্যাশ (টাইমিং দিয়ে ইমেইল শনাক্ত ঠেকায়)
const DUMMY_HASH = `${"00".repeat(16)}:${"00".repeat(64)}`;
export async function burnPasswordCheck(password: string): Promise<void> {
  await comparePassword(password, DUMMY_HASH);
}

/** ব্যবহার অযোগ্য (র‍্যান্ডম) পাসওয়ার্ড হ্যাশ — Google অ্যাকাউন্টের জন্য */
export function randomUnusableHash(): Promise<string> {
  return hashPassword(crypto.randomBytes(32).toString("hex"));
}
