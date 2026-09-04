import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const PUBLIC_PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] =
  [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/pricing", priority: 0.9, changeFrequency: "weekly" },
    { path: "/register", priority: 0.8, changeFrequency: "monthly" },
    { path: "/login", priority: 0.5, changeFrequency: "monthly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  ];

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();
  const lastModified = new Date();

  return PUBLIC_PATHS.map(({ path, priority, changeFrequency }) => ({
    url: path === "/" ? origin : `${origin}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
