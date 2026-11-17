import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.NODE_ENV === "production"
      ? "https://lanchonete-shirley-frontend.vercel.app"
      : "http://localhost:3000")
  ).replace(/\/$/, "");

  return [{ url: `${base}/`, changeFrequency: "daily", priority: 1 }];
}
