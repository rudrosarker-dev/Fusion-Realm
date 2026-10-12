// START OF FILE src/app/terms/page.tsx
import { LegalPage, legalMetadata } from "@/components/legal-page";

export const dynamic = "force-dynamic";
export const metadata = legalMetadata("terms");

export default function Page() {
  return <LegalPage slug="terms" />;
}
// END OF FILE src/app/terms/page.tsx
