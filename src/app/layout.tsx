import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
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
  description: "Bachelors leaving rooms post here. Bachelors searching find rooms here. Browse by area, budget, members. Sell furniture & earn commission. Zero brokerage platform for Hyderabad.",
  keywords: ["bachelor rooms hyderabad", "room handover", "zero brokerage rooms", "pg rooms hyderabad", "flat handover hyderabad", "takevolet"],
  authors: [{ name: "Takevolet Technologies" }],
  creator: "Takevolet Technologies",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://takevolet.online"),
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://takevolet.online",
    siteName: "Takevolet",
    title: "Takevolet | Bachelor Room Handovers in Hyderabad",
    description: "Zero brokerage bachelor room handover platform. Post your room, find a room, sell furniture & earn commission.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Takevolet Logo" }],
  },
  twitter: {
    card: "summary",
    title: "Takevolet | Bachelor Room Handovers",
    description: "Zero brokerage room handovers in Hyderabad. Direct contact. Earn commission.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
