import type { MetadataRoute } from "next";

const BASE_URL = "https://ai-agent-dashboard-nu.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
    return [{ url: BASE_URL, lastModified: new Date() }];
}