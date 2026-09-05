import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Flatmates in Hyderabad — Roommate Matching | Zero Brokerage | Takevolet",
  description:
    "Find compatible flatmates and roommates in Hyderabad. Browse verified bachelor profiles filtered by budget, profession, lifestyle, and area. Direct contact, zero brokerage. Serving Madhapur, Gachibowli, Kondapur, Kukatpally, Ameerpet, SR Nagar, and 90+ areas.",
  keywords: [
    "flatmates hyderabad",
    "find flatmate hyderabad",
    "flatmate search hyderabad",
    "roommate hyderabad",
    "shared accommodation hyderabad",
    "flatmate madhapur",
    "flatmate gachibowli",
    "flatmate kondapur",
    "flatmate kukatpally",
    "shared room hyderabad",
    "shared flat hyderabad",
    "bachelor flatmate hyderabad",
    "looking for flatmate hyderabad",
    "room sharing hyderabad",
    "co-living hyderabad",
    "takevolet flatmates",
    "zero brokerage flatmate hyderabad",
  ],
  openGraph: {
    title: "Find Flatmates in Hyderabad | Takevolet",
    description: "Browse verified flatmate profiles. Filter by budget, profession, lifestyle. Direct contact, zero brokerage.",
    url: "https://takevolet.online/flatmates",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Flatmates in Hyderabad | Takevolet",
    description: "Browse verified flatmate profiles. Zero brokerage, direct contact.",
  },
  alternates: {
    canonical: "/flatmates",
  },
};

export default function FlatmatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
