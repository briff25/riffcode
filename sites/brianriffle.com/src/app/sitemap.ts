import type { MetadataRoute } from "next";
import { SITE_URL } from "@/content/profile";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/`, lastModified: "2026-09-28", changeFrequency: "monthly", priority: 1 }];
}
