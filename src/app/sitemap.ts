import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: new Date("2026-07-16T00:00:00.000Z"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: siteConfig.url + "/pricing",
      lastModified: new Date("2026-07-16T00:00:00.000Z"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: siteConfig.url + "/blog",
      lastModified: new Date("2026-07-20T00:00:00.000Z"),
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: siteConfig.url + "/blog/what-is-an-ai-agent-framework",
      lastModified: new Date("2026-07-20T00:00:00.000Z"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...["grok-4-5", "grok-4-20", "grok-4-3"].map((slug) => ({
      url: siteConfig.url + "/models/" + slug,
      lastModified: new Date("2026-07-21T00:00:00.000Z"),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
