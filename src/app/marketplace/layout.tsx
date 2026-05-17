import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketplace | Buy & Sell Used Furniture in Hyderabad",
  description: "Buy, sell, or rent used furniture, electronics, and appliances directly from other bachelors in Hyderabad. Zero Brokerage.",
  keywords: ["used furniture hyderabad", "buy sell furniture bachelors", "rent appliances hyderabad", "second hand furniture hyderabad"],
  openGraph: {
    title: "Takevolet Marketplace | Buy & Sell Used Furniture",
    description: "Buy, sell, or rent used furniture, electronics, and appliances directly from other bachelors in Hyderabad. Zero Brokerage.",
    url: "https://takevolet.online/marketplace",
  },
  alternates: {
    canonical: "/marketplace",
  },
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
