// একবারের মাইগ্রেশন: ডাটাবেজে থাকা প্লেইনটেক্সট পাসওয়ার্ড হ্যাশ করে।
// ব্যবহার:  node scripts/migrate-passwords.mjs
// (.env.local-এ DATABASE_URL থাকতে হবে)
import "dotenv/config";
import crypto from "crypto";
import pg from "pg";

const scrypt = (pw, salt) =>
  new Promise((res, rej) => crypto.scrypt(pw, salt, 64, (e, k) => (e ? rej(e) : res(k.toString("hex")))));
const hash = async (pw) => {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${await scrypt(pw, salt)}`;
};
const HASH_RE = /^[0-9a-f]{32}:[0-9a-f]{128}$/;

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const { rows } = await client.query("SELECT id, email, role, password_hash FROM users");
let plain = 0, oauth = 0;
for (const u of rows) {
  if (HASH_RE.test(u.password_hash)) continue;
  if (u.password_hash === "GOOGLE_OAUTH_ACCOUNT") {
    // ব্যবহার-অযোগ্য র‍্যান্ডম হ্যাশ (Google ইউজার শুধু Google দিয়েই ঢুকবে)
    await client.query("UPDATE users SET password_hash=$1 WHERE id=$2", [await hash(crypto.randomBytes(32).toString("hex")), u.id]);
    oauth++;
  } else {
    await client.query("UPDATE users SET password_hash=$1 WHERE id=$2", [await hash(u.password_hash), u.id]);
    plain++;
    console.log(`  hashed: ${u.email} (${u.role})`);
  }
}
console.log(`Done. plaintext→hashed: ${plain}, google placeholders replaced: ${oauth}`);
await client.end();
