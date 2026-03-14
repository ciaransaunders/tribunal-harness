import { MetadataRoute } from "next";

// ISSUE-19 FIX: Generate sitemap.xml from all known routes.
// Next.js App Router will serve this at /sitemap.xml automatically.
export default function sitemap(): MetadataRoute.Sitemap {
    const base = "https://tribunalharness.co.uk";
    const now = new Date();

    const routes = [
        { url: "/", priority: 1.0, changeFrequency: "weekly" as const },
        { url: "/how-it-works", priority: 0.9, changeFrequency: "monthly" as const },
        { url: "/analysis-engine", priority: 0.9, changeFrequency: "weekly" as const },
        { url: "/pricing", priority: 0.8, changeFrequency: "monthly" as const },
        { url: "/about", priority: 0.7, changeFrequency: "monthly" as const },
        { url: "/era-2025", priority: 0.9, changeFrequency: "weekly" as const },
        { url: "/case-law-db", priority: 0.8, changeFrequency: "weekly" as const },
        { url: "/documentation", priority: 0.8, changeFrequency: "monthly" as const },
        { url: "/methodology", priority: 0.7, changeFrequency: "monthly" as const },
        { url: "/security", priority: 0.6, changeFrequency: "monthly" as const },
        { url: "/ethics", priority: 0.6, changeFrequency: "monthly" as const },
        { url: "/blog", priority: 0.7, changeFrequency: "weekly" as const },
        { url: "/product", priority: 0.7, changeFrequency: "monthly" as const },
        { url: "/contact", priority: 0.5, changeFrequency: "yearly" as const },
        { url: "/privacy", priority: 0.4, changeFrequency: "yearly" as const },
        { url: "/terms", priority: 0.4, changeFrequency: "yearly" as const },
        { url: "/request-access", priority: 0.8, changeFrequency: "monthly" as const },
    ];

    return routes.map(({ url, priority, changeFrequency }) => ({
        url: `${base}${url}`,
        lastModified: now,
        changeFrequency,
        priority,
    }));
}
