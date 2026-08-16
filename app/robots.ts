import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/login", "/signup"],
    },
    sitemap: "https://finora-yykm-five.vercel.app/sitemap.xml",
  };
}
