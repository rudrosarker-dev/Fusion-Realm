// START OF FILE src/app/return-policy/page.tsx
import { LegalPage, legalMetadata } from "@/components/legal-page";

export const dynamic = "force-dynamic";
export const metadata = legalMetadata("return-policy");

export default function Page() {
  return <LegalPage slug="return-policy" />;
}
// END OF FILE src/app/return-policy/page.tsx
