import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
const baseUrl =
process.env.NEXT_PUBLIC_SITE_URL ?? "https://paweldrwal.vercel.app";

return [
{
url: baseUrl,
lastModified: new Date("2026-10-14"),
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
lastModified: new Date("2026-10-24"),
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
