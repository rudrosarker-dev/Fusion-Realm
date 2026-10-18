// START OF FILE src/lib/security.ts

/**
 * HTML Injection ও XSS প্রতিরোধে স্ট্রিং এস্কেপ হেল্পার
 */
export function escapeHtml(str: any): string {
  if (typeof str !== "string") return String(str ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * মেমোরি ভিত্তিক লাইটওয়েট রেট লিমিটার
 */
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export function checkRateLimit(key: string, maxRequests: number, windowSeconds: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.expiresAt) {
    rateLimitMap.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false; // Rate limit exceeded
  }

  entry.count += 1;
  return true;
}
// END OF FILE src/lib/security.ts
