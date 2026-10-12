// START OF FILE src/components/ui/language-switcher.tsx
"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: any;
  }
}

export function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState<"en" | "bn">("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // পূর্বের সেভ করা ভাষা চেক করা
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
      return match ? match[2] : null;
    };

    const saved = getCookie("googtrans");
    if (saved?.includes("/bn")) {
      setCurrentLang("bn");
    } else {
      setCurrentLang("en");
    }

    // Google Translation ইঞ্জিন নিঃশব্দে লোড করা
    if (!document.getElementById("google-translate-script")) {
      window.googleTranslateElementInit = () => {
        if (window.google?.translate) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: "en,bn",
              autoDisplay: false,
            },
            "google_translate_element"
          );
        }
      };

      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const changeLanguage = (lang: "en" | "bn") => {
    if (lang === currentLang) return;

    setCurrentLang(lang);
    const domain = window.location.hostname;

    // কুকিতে ভাষা সেট করা
    const cookieVal = lang === "bn" ? "/en/bn" : "/en/en";
    document.cookie = `googtrans=${cookieVal}; path=/; domain=${domain};`;
    document.cookie = `googtrans=${cookieVal}; path=/;`;

    // তাৎক্ষণিক পেজ রিফ্রেশ করে পুরো সাইটকে নতুন ভাষায় রূপান্তর
    window.location.reload();
  };

  if (!mounted) return null;

  return (
    <>
      {/* হিডেন ট্রান্সলেটর কনটেইনার */}
      <div id="google_translate_element" className="hidden" aria-hidden="true" />

      {/* প্রিমিয়াম লাক্সারি সুইচ বাটন */}
      <div className="inline-flex items-center gap-1.5 border border-line bg-paper/60 px-2 py-1 text-[10px] font-mono uppercase tracking-wider backdrop-blur-sm">
        <Globe className="size-3 text-fog" />
        <button
          type="button"
          onClick={() => changeLanguage("en")}
          className={cn(
            "transition-colors cursor-pointer px-1 py-0.5",
            currentLang === "en" ? "font-bold text-ink bg-cream" : "text-fog hover:text-ink"
          )}
        >
          EN
        </button>
        <span className="text-line">|</span>
        <button
          type="button"
          onClick={() => changeLanguage("bn")}
          className={cn(
            "transition-colors cursor-pointer px-1 py-0.5",
            currentLang === "bn" ? "font-bold text-ink bg-cream" : "text-fog hover:text-ink"
          )}
        >
          বাংলা
        </button>
      </div>

      {/* গুগলের অনাকাঙ্ক্ষিত ব্যানার এবং টপ-বার পুরোপুরি বন্ধ রাখার স্টাইল */}
      <style jsx global>{`
        .goog-te-banner-frame.skiptranslate,
        .goog-te-banner-frame,
        #goog-gt-tt,
        .goog-te-balloon-frame {
          display: none !important;
        }
        body {
          top: 0px !important;
          position: static !important;
        }
        .skiptranslate {
          display: none !important;
        }
        .goog-text-highlight {
          background-color: transparent !important;
          box-shadow: none !important;
        }
      `}</style>
    </>
  );
}
// END OF FILE src/components/ui/language-switcher.tsx
