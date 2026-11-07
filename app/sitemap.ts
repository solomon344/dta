import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Only public pages. Individual certificate results (/verify?q=…) are deliberately
// left out so graduates' names aren't pushed into search indexes.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/verify`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/testimonials`, changeFrequency: "weekly", priority: 0.6 },
  ];
}
