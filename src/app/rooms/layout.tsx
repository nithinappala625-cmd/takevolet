import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rooms for Rent in Hyderabad — Bachelor & Family Rooms | Zero Brokerage | Takevolet",
  description:
    "Browse bachelor rooms, family rooms, 1BHK, 2BHK, 3BHK flats, PGs, and shared accommodations for rent in Hyderabad. Filter by area, budget, members, furnishing. Zero brokerage. Direct owner contact. 90+ areas including Madhapur, Gachibowli, Kukatpally, Kondapur, Ameerpet.",
  keywords: [
    "rooms for rent hyderabad",
    "room for rent in hyderabad",
    "bachelor rooms hyderabad",
    "bachelor room for rent hyderabad",
    "family rooms hyderabad",
    "family room for rent hyderabad",
    "1bhk for rent hyderabad",
    "2bhk for rent hyderabad",
    "3bhk for rent hyderabad",
    "flat for rent hyderabad",
    "house for rent hyderabad",
    "pg rooms hyderabad",
    "single room rent hyderabad",
    "1rk rent hyderabad",
    "shared room hyderabad",
    "room rent madhapur",
    "room rent gachibowli",
    "room rent kukatpally",
    "room rent kondapur",
    "room rent ameerpet",
    "room rent sr nagar",
    "room rent hitech city",
    "zero brokerage rooms hyderabad",
    "no broker rooms hyderabad",
    "direct owner rooms hyderabad",
    "search bachelor rooms hyderabad",
    "2bhk handovers hyderabad",
    "find pg rooms hyderabad",
    "cheap rooms hyderabad",
    "affordable rooms hyderabad",
    "budget rooms hyderabad",
    "takevolet rooms",
  ],
  openGraph: {
    title: "Rooms for Rent in Hyderabad | Bachelor & Family | Takevolet",
    description: "Browse rooms for rent across 90+ locations in Hyderabad. Bachelor rooms, family rooms, PGs. Zero brokerage, direct contact.",
    url: "https://takevolet.online/rooms",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rooms for Rent in Hyderabad | Takevolet",
    description: "Browse bachelor & family rooms for rent. Zero brokerage.",
  },
  alternates: {
    canonical: "/rooms",
  },
};

export default function RoomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
