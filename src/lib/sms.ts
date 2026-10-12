// START OF FILE src/lib/sms.ts
import { BRAND_CONFIG } from "./brand.config";

export interface SendSmsParams {
  to: string; // Customer phone e.g. "017XXXXXXXX"
  message: string;
}

/**
 * Clean phone number to 880 format for BD SMS Gateways
 */
function sanitizeBdPhone(phone: string): string {
  const clean = phone.replace(/[^0-9]/g, "");
  if (clean.startsWith("880")) return clean;
  if (clean.startsWith("0")) return `88${clean}`;
  return `880${clean}`;
}

/**
 * Universal SMS Gateway Dispatcher
 * Works with Greenweb, BulksmsBD or any HTTP GET/POST API
 */
export async function sendSMS({ to, message }: SendSmsParams): Promise<boolean> {
  const recipient = sanitizeBdPhone(to);
  const token = process.env.SMS_API_TOKEN || process.env.GREENWEB_TOKEN;
  const apiUrl = process.env.SMS_API_URL || "https://api.greenweb.com.bd/api.php";

  // Production SMS Dispatch
  if (token) {
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token: token,
          to: recipient,
          message: message,
        }),
      });

      if (res.ok) {
        console.log(`[SMS SUCCESS] Sent to ${recipient}`);
        return true;
      }
    } catch (err) {
      console.error("[SMS ERROR] Failed to send SMS:", err);
      return false;
    }
  }

  // Development / Demo Mode Log
  console.log(`\n================== [SMS SIMULATOR] ==================`);
  console.log(`Recipient: ${recipient}`);
  console.log(`Message:\n${message}`);
  console.log(`=====================================================\n`);
  return true;
}

/**
 * Template Helper Functions
 */
export const smsTemplates = {
  orderPlaced: (orderId: string, dueAmount: number) =>
    `Dear Client, your order ${orderId} has been received at ${BRAND_CONFIG.brandName}. Due on delivery: BDT ${dueAmount.toLocaleString()}. Track: https://tholvexstudio.vercel.app/account`,

  courierDispatched: (orderId: string, trackingCode: string, dueAmount: number) =>
    `Your parcel ${orderId} is dispatched via Steadfast Courier! Tracking: ${trackingCode}. Cash to pay: BDT ${dueAmount.toLocaleString()}. - ${BRAND_CONFIG.brandName}`,

  delivered: (orderId: string) =>
    `Your order ${orderId} has been successfully delivered. Thank you for choosing ${BRAND_CONFIG.brandName}!`,
};
// END OF FILE src/lib/sms.ts
