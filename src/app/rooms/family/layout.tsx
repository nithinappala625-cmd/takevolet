import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Family Rooms for Rent in Hyderabad — Zero Brokerage | Takevolet",
  description:
    "Find family rooms, 2BHK, 3BHK flats, and family-friendly houses for rent in Hyderabad with zero brokerage. Direct owner contact. No brokers. Serving Madhapur, Gachibowli, Manikonda, Miyapur, LB Nagar, Kondapur, Secunderabad, and 90+ areas across Hyderabad.",
  keywords: [
    "family rooms hyderabad",
    "family room for rent hyderabad",
    "family flat for rent hyderabad",
    "2bhk for rent hyderabad",
    "3bhk for rent hyderabad",
    "house for rent hyderabad",
    "apartment for rent hyderabad",
    "family accommodation hyderabad",
    "family house rent hyderabad",
    "family flat hyderabad zero brokerage",
    "no broker family rooms hyderabad",
    "direct owner flat hyderabad",
    "2bhk rent madhapur",
    "2bhk rent gachibowli",
    "3bhk rent kondapur",
    "family flat manikonda",
    "family flat miyapur",
    "family house lb nagar",
    "family room secunderabad",
    "takevolet family rooms",
    "zero brokerage family flat hyderabad",
  ],
  openGraph: {
    title: "Family Rooms for Rent in Hyderabad | Zero Brokerage | Takevolet",
    description: "Find family-friendly rooms, 2BHK, 3BHK flats for rent in Hyderabad. Zero brokerage, direct owner contact.",
    url: "https://takevolet.online/rooms/family",
  },
  twitter: {
    card: "summary_large_image",
    title: "Family Rooms for Rent in Hyderabad | Takevolet",
    description: "Find family-friendly rooms and flats in Hyderabad. Zero brokerage.",
  },
  alternates: {
    canonical: "/rooms/family",
  },
};

export default function FamilyRoomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
