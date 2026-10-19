// src/lib/safe.ts — ক্লায়েন্ট ও সার্ভার দুই জায়গায় নিরাপদে ব্যবহারযোগ্য হেল্পার (Node-only import নেই)

/** HTML Injection/XSS প্রতিরোধে স্ট্রিং এস্কেপ */
export function escapeHtml(str: unknown): string {
  const s = typeof str === "string" ? str : String(str ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** শুধু http(s) বা সাইট-রিলেটিভ লিংক গ্রহণ — javascript:/data: URL বাতিল */
export function safeHref(url: unknown, fallback = "#"): string {
  if (typeof url !== "string") return fallback;
  const u = url.trim();
  if (u.startsWith("/") && !u.startsWith("//")) return u;
  try {
    const parsed = new URL(u);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : fallback;
  } catch {
    return fallback;
  }
}

/** ছবির সোর্স: https URL, সাইটের নিজস্ব পাথ, বা ছোট data:image/(jpeg|png|webp) */
export function safeImageSrc(src: unknown, maxDataBytes = 2_500_000): string | null {
  if (typeof src !== "string") return null;
  const s = src.trim();
  if (!s) return null;
  if (s.startsWith("/") && !s.startsWith("//")) return s.length <= 500 ? s : null;
  if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s)) return s.length <= maxDataBytes ? s : null;
  try {
    const u = new URL(s);
    return u.protocol === "https:" && s.length <= 1000 ? u.toString() : null;
  } catch {
    return null;
  }
}

export function clampStr(v: unknown, max: number, fallback = ""): string {
  if (typeof v !== "string") return fallback;
  return v.trim().slice(0, max);
}

