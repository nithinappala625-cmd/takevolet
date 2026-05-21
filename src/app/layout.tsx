import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://takevolet.online";

export const metadata: Metadata = {
  title: {
    default: "Takevolet — Bachelor Room Handovers, Flatmates & Marketplace in Hyderabad",
    template: "%s | Takevolet",
  },
  description:
    "Takevolet is Hyderabad's #1 zero-brokerage platform built for bachelors. Find & handover bachelor rooms, discover flatmates, and buy/sell used furniture — all in one place. No brokers. Direct contact. Earn commission.",
  keywords: [
    "takevolet",
    "bachelor rooms hyderabad",
    "room handover hyderabad",
    "zero brokerage rooms hyderabad",
    "flatmates hyderabad",
    "find flatmate hyderabad",
    "pg rooms hyderabad",
    "flat handover hyderabad",
    "bachelor flat rent hyderabad",
    "no broker rooms hyderabad",
    "used furniture hyderabad bachelors",
    "buy sell furniture hyderabad",
    "bachelor marketplace hyderabad",
    "room rent ameerpet hyderabad",
    "bachelor accommodation hyderabad",
  ],
  authors: [{ name: "Takevolet" }],
  creator: "Takevolet",
  publisher: "Takevolet",
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: APP_URL,
    siteName: "Takevolet",
    title: "Takevolet — Zero Brokerage Rooms, Flatmates & Marketplace in Hyderabad",
    description:
      "Find or handover bachelor rooms in Hyderabad with zero brokerage. Discover flatmates, buy/sell furniture — a complete platform built for Hyderabad's bachelor community.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Takevolet — Rooms, Flatmates & Marketplace for Bachelors in Hyderabad",
    description:
      "Zero brokerage room handovers, flatmate search, and used furniture marketplace. Built for Hyderabad bachelors.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "RYGrWuGKRpiY8LOpxxyguVGJEoZSZuC2gCn1QGBT5f0",
  },
};

// JSON-LD structured data — tells Google exactly who Takevolet is
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Takevolet",
  legalName: "Takevolet",
  url: APP_URL,
  logo: `${APP_URL}/logo.svg`,
  description:
    "Takevolet is Hyderabad's #1 zero-brokerage platform for bachelor room handovers, flatmate discovery, and used furniture marketplace. An independent startup serving Hyderabad's bachelor community.",
  foundingDate: "2024",
  areaServed: {
    "@type": "City",
    name: "Hyderabad",
    addressCountry: "IN",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    areaServed: "IN",
    availableLanguage: ["English", "Telugu", "Hindi"],
  },
  sameAs: [
    "https://www.instagram.com/takevolet",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Takevolet",
  url: APP_URL,
  description:
    "Zero-brokerage bachelor room handovers, flatmates, and marketplace in Hyderabad.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${APP_URL}/rooms?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Analytics */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=G-ZQS0VKQJJH`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-ZQS0VKQJJH', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
        {/* JSON-LD Structured Data — helps Google correctly identify Takevolet */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
      </head>
      <body
        className={`${outfit.variable} ${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <NavbarWrapper />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
