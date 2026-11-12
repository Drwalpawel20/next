import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const baseUrl = "https://paweldrwal.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date("2026-10-14"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/demos`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/demos/brain-tumor`,
      lastModified: new Date("2026-11-12"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/demos/fire-smoke`,
      lastModified: new Date("2026-10-24"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
