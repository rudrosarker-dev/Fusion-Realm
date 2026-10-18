// START OF FILE src/lib/password.ts
import crypto from "crypto";

/**
 * কোনো থার্ড-পার্টি প্যাকেজ ছাড়াই Node.js বিল্ট-ইন Scrypt দিয়ে শক্তিশালী পাসওয়ার্ড হ্যাশ
 */
export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

/**
 * লগইনের সময় পাসওয়ার্ড যাচাইকরণ (Timing Attack প্রটেকশন সহ)
 */
export function comparePassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!storedHash || !storedHash.includes(":")) {
      // যদি ডাটাবেজে আগে থেকে পুরনো প্লেইনটেক্সট পাসওয়ার্ড থাকে তবে সেটার ব্যাকওয়ার্ড কম্প্যাটিবিলিটি
      return resolve(password === storedHash);
    }

    const [salt, key] = storedHash.split(":");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      const keyBuffer = Buffer.from(key, "hex");
      if (keyBuffer.length !== derivedKey.length) return resolve(false);
      resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
    });
  });
}
// END OF FILE src/lib/password.ts
