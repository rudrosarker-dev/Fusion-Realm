// START OF FILE src/app/privacy/page.tsx
import { LegalPage, legalMetadata } from "@/components/legal-page";

export const dynamic = "force-dynamic";
export const metadata = legalMetadata("privacy");

export default function Page() {
  return <LegalPage slug="privacy" />;
}
// END OF FILE src/app/privacy/page.tsx
