// START OF FILE src/app/cookies/page.tsx
import { LegalPage, legalMetadata } from "@/components/legal-page";

export const dynamic = "force-dynamic";
export const metadata = legalMetadata("cookies");

export default function Page() {
  return <LegalPage slug="cookies" />;
}
// END OF FILE src/app/cookies/page.tsx
