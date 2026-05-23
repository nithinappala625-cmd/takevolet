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
    "Takevolet is Hyderabad's #1 zero-brokerage platform for bachelors. Find & handover bachelor rooms, discover flatmates, buy/sell used furniture — all in one place. No brokers. Direct contact. Earn commission. Serving 90+ areas in Hyderabad.",
  keywords: [
    // Brand keywords
    "takevolet",
    "takevolet hyderabad",
    "takevolet rooms",
    "takevolet online",
    "take volet",

    // Bachelor rooms — generic
    "bachelor rooms hyderabad",
    "bachelor room for rent in hyderabad",
    "bachelor room rent hyderabad",
    "bachelor flat for rent hyderabad",
    "bachelor accommodation hyderabad",
    "single room rent hyderabad",
    "1rk rent hyderabad",
    "1 room kitchen hyderabad rent",

    // Zero brokerage
    "zero brokerage rooms hyderabad",
    "no broker rooms hyderabad",
    "direct owner rooms hyderabad",
    "broker free rooms hyderabad",

    // Area-specific rooms
    "room rent madhapur",
    "room rent gachibowli",
    "room rent kukatpally",
    "room rent ameerpet",
    "room rent sr nagar",
    "room rent kondapur",
    "room rent hitech city hyderabad",
    "room rent kphb",
    "room rent dilsukhnagar",
    "room rent uppal hyderabad",
    "bachelor room ameerpet",
    "bachelor room madhapur",
    "bachelor room gachibowli",
    "bachelor room kondapur",
    "bachelor room hitec city",
    "bachelor room kukatpally",
    "bachelor room sr nagar",

    // Room handovers
    "room handover hyderabad",
    "flat handover hyderabad",
    "bachelor room handover",
    "room takeover hyderabad",

    // PG & general accommodation
    "pg rooms hyderabad",
    "pg for bachelors hyderabad",
    "bachelor pg hyderabad",
    "bachelor accommodation telangana",
    "shared room hyderabad",
    "shared flat hyderabad bachelors",

    // Flatmates
    "flatmates hyderabad",
    "find flatmate hyderabad",
    "flatmate search hyderabad",
    "roommate hyderabad",
    "flatmate madhapur",
    "flatmate gachibowli",
    "flatmate kondapur",
    "shared accommodation hyderabad",

    // Furniture marketplace
    "used furniture hyderabad bachelors",
    "buy sell furniture hyderabad",
    "bachelor marketplace hyderabad",
    "second hand furniture hyderabad",
    "used appliances hyderabad",

    // Earn commission
    "earn commission room hyderabad",
    "earn money handing over room",
    "room handover commission hyderabad",
  ],
  authors: [{ name: "Takevolet" }],
  creator: "Takevolet",
  publisher: "Takevolet",
  category: "Real Estate",
  classification: "Bachelor Accommodation, Room Rentals, Hyderabad",
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
      "Find or handover bachelor rooms in Hyderabad with zero brokerage. Discover flatmates, buy/sell furniture — the complete platform for Hyderabad's bachelor community. 90+ areas covered.",
    images: [
      {
        url: `${APP_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Takevolet — Bachelor Rooms Hyderabad",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Takevolet — Rooms, Flatmates & Marketplace for Bachelors in Hyderabad",
    description:
      "Zero brokerage room handovers, flatmate search, and used furniture marketplace. Built for Hyderabad bachelors.",
    images: [`${APP_URL}/logo.png`],
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
  icons: {
    icon: [
      { url: "/icon", type: "image/png", sizes: "512x512" },
      { url: "/icon", type: "image/png", sizes: "32x32" },
      { url: "/icon", type: "image/png", sizes: "16x16" },
    ],
    shortcut: "/icon",
    apple: "/apple-icon",
  },
};

// ── JSON-LD Structured Data ─────────────────────────────────────────────────

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${APP_URL}/#organization`,
  name: "Takevolet",
  legalName: "Takevolet Technologies",
  url: APP_URL,
  logo: {
    "@type": "ImageObject",
    url: `${APP_URL}/logo.png`,
    width: "1024",
    height: "1024",
  },
  description:
    "Takevolet is Hyderabad's #1 zero-brokerage platform for bachelor room handovers, flatmate discovery, and used furniture marketplace. An independent startup serving Hyderabad's bachelor community across 90+ areas.",
  foundingDate: "2024",
  areaServed: [
    { "@type": "City", name: "Hyderabad", addressCountry: "IN" },
    { "@type": "State", name: "Telangana", addressCountry: "IN" },
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Hyderabad",
    addressRegion: "Telangana",
    addressCountry: "IN",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+917981994870",
      contactType: "customer support",
      email: "hello@takevolet.online",
      areaServed: "IN",
      availableLanguage: ["English", "Telugu", "Hindi"],
    },
  ],
  sameAs: [
    "https://www.instagram.com/take_volet?igsh=MTBxdG1qMWd3MnBrZg==",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${APP_URL}/#website`,
  name: "Takevolet",
  url: APP_URL,
  description:
    "Zero-brokerage bachelor room handovers, flatmates, and marketplace in Hyderabad.",
  publisher: { "@id": `${APP_URL}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${APP_URL}/rooms?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": `${APP_URL}/#localbusiness`,
  name: "Takevolet",
  alternateName: "Takevolet Technologies",
  image: `${APP_URL}/logo.png`,
  url: APP_URL,
  telephone: "+917981994870",
  email: "hello@takevolet.online",
  description:
    "Zero-brokerage bachelor room handovers, flatmate matching, and used furniture marketplace in Hyderabad. Serving bachelors across 90+ areas in Hyderabad, Telangana.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Hyderabad",
    addressRegion: "Telangana",
    postalCode: "500081",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "17.4401",
    longitude: "78.3489",
  },
  areaServed: [
    "Madhapur", "Gachibowli", "Kondapur", "Kukatpally", "KPHB", "Ameerpet",
    "SR Nagar", "Dilsukhnagar", "Uppal", "Malkajgiri", "Secunderabad",
    "Begumpet", "Hitech City", "Jubilee Hills", "Banjara Hills", "Manikonda",
    "Nanakramguda", "Miyapur", "LB Nagar", "Nagole"
  ],
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "00:00",
    closes: "23:59",
  },
  priceRange: "₹10 - ₹500",
  currenciesAccepted: "INR",
  paymentAccepted: "UPI, Credit Card, Debit Card, Net Banking",
  parentOrganization: { "@id": `${APP_URL}/#organization` },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Favicons — using /icon route (dark bg + gold house, looks great at 16px) */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icon" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon" />
        <link rel="shortcut icon" href="/icon" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon" />

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
        {/* Organization JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* Website JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {/* LocalBusiness JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body
        className={`${outfit.variable} ${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <NavbarWrapper />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
