import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";
import AppBanner from "@/components/AppBanner";
import { Suspense } from "react";
import { MetaPixel } from "@/components/MetaPixel";

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
    default: "Takevolet — Zero Brokerage Rentals, Properties, Top Projects & Construction Across India",
    template: "%s | Takevolet",
  },
  description:
    "India's premier zero-brokerage real estate & housing ecosystem. Find rooms for rent, PGs, day-wise stays, verified flatmates, buy properties & flats, explore top RERA builder projects, and hire trusted construction contractors in Hyderabad, Bangalore, Pune, Mumbai, Delhi-NCR, Chennai & nationwide.",
  keywords: [
    // Brand keywords
    "takevolet",
    "take volet",
    "takevolet app",
    "takevolet online",
    "takevolet real estate",
    "takevolet properties",
    "takevolet rentals",

    // Zero Brokerage & Pan-India
    "zero brokerage real estate",
    "no broker property india",
    "direct owner rooms and flats",
    "broker free rental platform",
    "zero brokerage flats for rent",
    "zero brokerage property for sale",

    // Room Rentals & PGs
    "rooms for rent",
    "room for rent near me",
    "bachelor rooms for rent",
    "family flats for rent",
    "1bhk for rent",
    "2bhk for rent",
    "3bhk for rent",
    "pg near me",
    "coliving spaces",
    "bachelor pg",
    "luxury pg for gents and ladies",
    "room handover",
    "single room rent",
    "day wise room rental",
    "short stay accommodation",

    // Flatmates
    "find flatmates",
    "roommate finder",
    "flatmate matching",
    "shared accommodation",
    "find roommate near me",

    // Properties for Sale
    "properties for sale",
    "flats for sale",
    "buy apartment",
    "buy 2bhk flat",
    "buy 3bhk luxury flat",
    "villas for sale",
    "independent house for sale",
    "plots for sale",
    "resale properties direct owner",
    "commercial properties for sale",

    // Top Projects & Builders
    "top builder projects",
    "new launch projects",
    "gated community apartments",
    "rera approved projects",
    "pre launch builder projects",
    "luxury gated communities",
    "under construction flats",

    // Construction & Architecture
    "house construction contractors",
    "building construction services",
    "interior designers",
    "architects near me",
    "turnkey home construction",
    "home renovation services",
    "civil contractors",

    // Major Cities & Localities
    "rooms for rent in hyderabad",
    "flats for rent in bangalore",
    "rooms for rent in bengaluru",
    "flats for rent in pune",
    "apartments for rent in mumbai",
    "flats for rent in delhi ncr",
    "rooms for rent in chennai",
    "properties in hyderabad",
    "properties in bangalore",
    "properties in pune",
    "madhapur", "gachibowli", "kondapur", "hitec city", "kukatpally", "kphb",
    "koramangala", "indiranagar", "whitefield", "electronic city", "hsr layout",
    "hinjewadi", "wakad", "baner", "kharadi", "viman nagar",
    "andheri", "powai", "thane", "navi mumbai",
    "gurgaon cyber city", "noida sector 62", "omr chennai", "velachery"
  ],
  authors: [{ name: "Takevolet" }],
  creator: "Takevolet",
  publisher: "Takevolet",
  category: "Real Estate",
  classification: "Real Estate, Room Rentals, Properties For Sale, Construction Services, Flatmates, India",
  metadataBase: new URL(APP_URL),
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: APP_URL,
    siteName: "Takevolet",
    title: "Takevolet — Zero Brokerage Rentals, Properties, Projects & Construction",
    description:
      "India's complete housing ecosystem. Zero brokerage room handovers, PGs, property sales, top RERA builder projects, and construction services across Hyderabad, Bangalore, Pune, Mumbai & major cities.",
    images: [
      {
        url: `${APP_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Takevolet — Zero Brokerage Real Estate Ecosystem",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Takevolet — Zero Brokerage Rentals, Properties, Projects & Construction",
    description:
      "Zero brokerage rooms, flatmate search, properties for sale, top builder projects, and verified construction contractors across India.",
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
    "Takevolet is India's premier zero-brokerage real estate platform offering verified room handovers, PG stays, flatmate discovery, property sales, top builder projects, and turnkey construction services.",
  foundingDate: "2024",
  areaServed: [
    { "@type": "City", name: "Hyderabad", addressCountry: "IN" },
    { "@type": "City", name: "Bengaluru", addressCountry: "IN" },
    { "@type": "City", name: "Pune", addressCountry: "IN" },
    { "@type": "City", name: "Mumbai", addressCountry: "IN" },
    { "@type": "City", name: "Delhi NCR", addressCountry: "IN" },
    { "@type": "City", name: "Chennai", addressCountry: "IN" },
    { "@type": "Country", name: "India" },
  ],
  knowsAbout: [
    "Zero Brokerage Rentals",
    "Bachelor Accommodations",
    "Family Flats & Apartments",
    "Properties For Sale",
    "Top Builder Projects & New Launches",
    "Civil Construction & Interior Design",
    "Flatmate Matching",
    "Coliving & PGs",
    "Day-Wise Stays"
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
      availableLanguage: ["English", "Telugu", "Hindi", "Kannada"],
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
    "Zero-brokerage room rentals, properties for sale, top builder projects, construction services and flatmates across India.",
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
    "Pan-India zero-brokerage real estate platform for rentals, properties for sale, top builder projects, and construction services.",
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
    "Hyderabad", "Bengaluru", "Pune", "Mumbai", "Delhi NCR", "Chennai", "Kolkata", "Ahmedabad",
    "Madhapur", "Gachibowli", "Kondapur", "Kukatpally", "KPHB", "Ameerpet",
    "Koramangala", "Indiranagar", "Whitefield", "Electronic City", "HSR Layout",
    "Hinjewadi", "Wakad", "Baner", "Kharadi", "Andheri", "Powai"
  ],
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "00:00",
    closes: "23:59",
  },
  priceRange: "₹50 - ₹500",
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
        {/* Microsoft Clarity */}
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "ww5bfnedlw");
            `,
          }}
        />
        {/* Google Tag Manager */}
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-N8N3HZST');
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
        className={`${outfit.variable} ${inter.variable} font-sans antialiased bg-background text-foreground flex flex-col min-h-screen`}
      >
        <Suspense fallback={null}>
          <MetaPixel />
        </Suspense>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-N8N3HZST"
            height="0" 
            width="0" 
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <AppBanner />
        <NavbarWrapper />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}

