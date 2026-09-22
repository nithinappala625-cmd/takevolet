import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Properties for Sale in Hyderabad — Buy Flats, Villas & Plots | Takevolet",
  description:
    "Browse verified apartments, independent houses, villas, and plots for sale in Hyderabad. Filter by locality, property type, and budget. Direct owner & builder listings with zero brokerage across Hyderabad.",
  keywords: [
    "properties for sale hyderabad",
    "flats for sale in hyderabad",
    "buy flat in hyderabad",
    "2bhk flat for sale hyderabad",
    "3bhk flat for sale hyderabad",
    "villas for sale hyderabad",
    "plots for sale hyderabad",
    "resale flats hyderabad",
    "direct owner properties hyderabad",
    "takevolet properties",
  ],
  openGraph: {
    title: "Properties for Sale in Hyderabad | Takevolet",
    description: "Browse verified flats, villas, houses, and plots for sale with direct owner contact in Hyderabad.",
    url: "https://takevolet.online/properties",
  },
  twitter: {
    card: "summary_large_image",
    title: "Properties for Sale in Hyderabad | Takevolet",
    description: "Explore verified apartments and homes for sale across Hyderabad.",
  },
  alternates: {
    canonical: "/properties",
  },
};

export default function PropertiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
