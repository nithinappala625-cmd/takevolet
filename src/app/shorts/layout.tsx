import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Property Video Tours & Shorts — Real Estate Reels | Takevolet",
  description:
    "Explore immersive video walkthroughs of rooms, flats, PGs, and properties for rent and sale across India. Direct videos uploaded by owners and flatmates.",
  keywords: [
    "property shorts",
    "room video tours",
    "flat tour videos hyderabad",
    "real estate shorts",
    "takevolet shorts",
  ],
  openGraph: {
    title: "Property Video Tours & Shorts | Takevolet",
    description: "Watch real property walkthroughs and video tours with zero brokerage.",
    url: "https://takevolet.online/shorts",
  },
  twitter: {
    card: "summary_large_image",
    title: "Property Video Tours & Shorts | Takevolet",
    description: "Watch real property video tours on Takevolet.",
  },
  alternates: {
    canonical: "/shorts",
  },
};

export default function ShortsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
