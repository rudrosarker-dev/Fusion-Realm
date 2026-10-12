import type { Metadata, Viewport } from "next";
import { Suspense, type ReactNode } from "react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CookieConsent } from "@/components/layout/cookie-consent";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { QuickViewHost } from "@/components/product/quick-view";
import { SearchOverlay } from "@/components/search/search-overlay";
import { CustomCursor } from "@/components/ui/custom-cursor";
import { WhatsAppWidget } from "@/components/ui/whatsapp-widget";
import { FacebookPixel } from "@/components/analytics/facebook-pixel";
import { ScrollToTopOnRefresh } from "@/components/layout/scroll-to-top-on-refresh";
import { PwaInstallPrompt } from "@/components/ui/pwa-install-prompt";
import { BRAND_CONFIG } from "@/lib/brand.config";
import { Providers } from "@/lib/store";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tholvexstudio.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${BRAND_CONFIG.brandName} — Considered Garments`,
    template: `%s — ${BRAND_CONFIG.brandName}`,
  },
  description: BRAND_CONFIG.description,
  applicationName: BRAND_CONFIG.brandName,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: BRAND_CONFIG.brandName,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    siteName: BRAND_CONFIG.brandName,
    type: "website",
    url: siteUrl,
    title: `${BRAND_CONFIG.brandName} — Considered Garments`,
    description: BRAND_CONFIG.description,
    images: [{ url: "/images/hero.jpg", width: 1600, height: 1200, alt: `${BRAND_CONFIG.brandName} Atelier Editorial` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_CONFIG.brandName} — Considered Garments`,
    description: BRAND_CONFIG.description,
    images: ["/images/hero.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0e0d0b", // Updated to Espresso
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" style={{ "--font-inter": "'Inter', sans-serif", "--font-fraunces": "'Fraunces', serif" } as import("react").CSSProperties}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
      </head>
      {/* 
        Aesthetic Update: 
        bg-[#f6f3eb] = Cashmere Alabaster 
        text-[#0e0d0b] = Espresso Obsidian
        selection:bg-[#c5a880]/30 = Champagne Gold highlighting
      */}
      <body className="bg-[#f6f3eb] text-[#0e0d0b] font-sans antialiased selection:bg-[#c5a880]/30 selection:text-[#0e0d0b]">
        <Providers>
          <Suspense fallback={null}>
            <FacebookPixel />
          </Suspense>
          <ScrollToTopOnRefresh />
          <CustomCursor />
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-[#0e0d0b] focus:px-4 focus:py-2 focus:text-[#f6f3eb]"
          >
            Skip to content
          </a>

          {/* হেডার */}
          <Header />

          {/* মেইন কন্টেন্ট */}
          <main id="main" className="min-h-screen">
            {children}
          </main>

          {/* ফুটার ও ফ্লোটিং উইজেটসমূহ */}
          <Footer />
          <WhatsAppWidget />
          <PwaInstallPrompt />
          <SearchOverlay />
          <CartDrawer />
          <QuickViewHost />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}