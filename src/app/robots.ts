import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/admin/",
          "/post/",
          "/auth/",
          "/checkout/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/admin/",
          "/auth/",
          "/checkout/",
        ],
      },
    ],
    sitemap: [
      "https://takevolet.online/sitemap.xml",
    ],
    host: "https://takevolet.online",
  };
}
