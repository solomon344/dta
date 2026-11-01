import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Staff portal, auth flows and APIs aren't for search engines.
      disallow: ["/dashboard", "/login", "/setup", "/invite", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
