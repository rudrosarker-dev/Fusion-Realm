// START OF FILE src/app/shipping-policy/page.tsx
import { LegalPage, legalMetadata } from "@/components/legal-page";

export const dynamic = "force-dynamic";
export const metadata = legalMetadata("shipping-policy");

export default function Page() {
  return <LegalPage slug="shipping-policy" />;
}
// END OF FILE src/app/shipping-policy/page.tsx
