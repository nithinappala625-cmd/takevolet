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
          "/room/",
          "/property/",
          "/feed/",
          "/service/",
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
          "/room/",
          "/property/",
          "/feed/",
          "/service/",
        ],
      },
    ],
    sitemap: [
      "https://takevolet.online/sitemap.xml",
    ],
    host: "https://takevolet.online",
  };
}
