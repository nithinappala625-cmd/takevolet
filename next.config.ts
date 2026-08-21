import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Mock / placeholder images
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      // Supabase Storage (public bucket CDN)
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
      { protocol: "https", hostname: "vwcqovrbvhztpkultqjl.supabase.co" },
      // Cloudflare R2 Storage (New Image Host)
      { protocol: "https", hostname: "pub-6e2dfd0939c946adb7029c6cdae04896.r2.dev" },
      // Google profile avatars (Google OAuth)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      // Cloudinary image uploads
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },

  // Ensure environment variables are validated at build time
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Compress responses
  compress: true,

  // Strict mode for React
  reactStrictMode: true,
};

export default nextConfig;
