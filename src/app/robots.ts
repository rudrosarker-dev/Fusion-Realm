import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/staff", "/api/", "/checkout", "/account", "/invoice", "/reset-password"],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || SITE.url}/sitemap.xml`,
  };
}
