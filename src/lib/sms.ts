// START OF FILE src/lib/sms.ts
import { BRAND_CONFIG } from "./brand.config";

export interface SendSmsParams {
  to: string;
  message: string;
}

function sanitizeBdPhone(phone: string): string {
  const clean = phone.replace(/[^0-9]/g, "");
  if (clean.startsWith("880")) return clean;
  if (clean.startsWith("0")) return `88${clean}`;
  return `880${clean}`;
}

export async function sendSMS({ to, message }: SendSmsParams): Promise<boolean> {
  const recipient = sanitizeBdPhone(to);
  const token = process.env.SMS_API_TOKEN || process.env.GREENWEB_TOKEN;
  const apiUrl = process.env.SMS_API_URL || "https://api.greenweb.com.bd/api.php";

  if (token) {
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token, to: recipient, message }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // ফোন নম্বরের মাঝের অংশ মাস্ক করে সুরক্ষিত লগিং (PII Protection)
  if (process.env.NODE_ENV !== "production") {
    const maskedPhone = recipient.slice(0, 5) + "XXXX" + recipient.slice(-2);
    console.log(`[SMS SIMULATOR] Dispatching to: ${maskedPhone}`);
  }
  return true;
}

export const smsTemplates = {
  orderPlaced: (orderId: string, dueAmount: number) =>
    `Dear Client, your order ${orderId} has been received at ${BRAND_CONFIG.brandName}. Due on delivery: BDT ${dueAmount.toLocaleString()}. Track: https://tholvexstudio.vercel.app/account`,
  courierDispatched: (orderId: string, trackingCode: string, dueAmount: number) =>
    `Your parcel ${orderId} is dispatched via Steadfast Courier! Tracking: ${trackingCode}. Cash to pay: BDT ${dueAmount.toLocaleString()}. - ${BRAND_CONFIG.brandName}`,
  delivered: (orderId: string) =>
    `Your order ${orderId} has been successfully delivered. Thank you for choosing ${BRAND_CONFIG.brandName}!`,
};
// END OF FILE src/lib/sms.ts
