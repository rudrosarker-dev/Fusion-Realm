// নতুন SUPER_ADMIN তৈরি/পাসওয়ার্ড রিসেট।
// ব্যবহার:  node scripts/create-admin.mjs "you@example.com" "Your Name" "StrongPassword123!"
import "dotenv/config";
import crypto from "crypto";
import pg from "pg";

const [email, name, password] = process.argv.slice(2);
if (!email || !name || !password || password.length < 12) {
  console.error('ব্যবহার: node scripts/create-admin.mjs "email" "Name" "Password (কমপক্ষে ১২ অক্ষর)"');
  process.exit(1);
}
const salt = crypto.randomBytes(16).toString("hex");
const key = await new Promise((res, rej) => crypto.scrypt(password, salt, 64, (e, k) => (e ? rej(e) : res(k.toString("hex")))));
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(
  `INSERT INTO users (id, name, email, password_hash, role) VALUES ($1,$2,$3,$4,'SUPER_ADMIN')
   ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, name=EXCLUDED.name, role='SUPER_ADMIN'`,
  [`admin-${crypto.randomUUID()}`, name, email.toLowerCase(), `${salt}:${key}`]
);
console.log(`SUPER_ADMIN ready: ${email.toLowerCase()}  (লগইনের পর অবশ্যই 2FA চালু করুন)`);
await client.end();
