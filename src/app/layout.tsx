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

export const metadata: Metadata = {
  title: {
    default: "Takevolet | Bachelor Room Handovers in Hyderabad — Zero Brokerage",
    template: "%s | Takevolet",
  },
  description: "Takevolet is Hyderabad's #1 zero brokerage platform for bachelor room handovers. Leaving your room? Post it here. Searching? Find 2BHKs, 3BHKs, PGs without brokers. Direct contact, earn commission.",
  keywords: [
    "bachelor rooms hyderabad",
    "room handover hyderabad",
    "zero brokerage rooms hyderabad",
    "pg rooms hyderabad",
    "flat handover hyderabad",
    "bachelor flat rent hyderabad",
    "no broker rooms hyderabad",
    "takevolet",
    "buy sell furniture hyderabad",
    "used furniture for bachelors"
  ],
  authors: [{ name: "Takevolet Technologies" }],
  creator: "Takevolet Technologies",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://takevolet.online"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://takevolet.online",
    siteName: "Takevolet",
    title: "Takevolet | Zero Brokerage Bachelor Room Handovers in Hyderabad",
    description: "The fastest way to find or handover bachelor rooms in Hyderabad without brokers. Direct contact. Zero brokerage. Sell your old furniture.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Takevolet - Hyderabad Room Handovers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Takevolet | Bachelor Room Handovers",
    description: "Zero brokerage room handovers in Hyderabad. Find rooms without brokers, contact directly, and earn commission.",
    images: ["/logo.png"],
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


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
