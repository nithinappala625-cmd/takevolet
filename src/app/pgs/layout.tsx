import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PGs & Hostels in Hyderabad — Mens, Womens & Coliving | Zero Brokerage | Takevolet",
  description:
    "Browse verified PGs, hostels, and coliving spaces for mens, womens, and students in Hyderabad. Filter by area, budget, food, and amenities with zero brokerage and direct owner contact across Madhapur, Gachibowli, Ameerpet, KPHB & 90+ locations.",
  keywords: [
    "pg in hyderabad",
    "hostels in hyderabad",
    "mens pg hyderabad",
    "womens pg hyderabad",
    "coliving spaces hyderabad",
    "luxury pg hyderabad",
    "pg near madhapur",
    "pg near gachibowli",
    "pg near hitec city",
    "zero brokerage pg hyderabad",
    "takevolet pgs",
  ],
  openGraph: {
    title: "PGs & Hostels in Hyderabad | Mens, Womens & Coliving | Takevolet",
    description: "Browse verified PGs and coliving spaces with zero brokerage and direct owner contacts across Hyderabad.",
    url: "https://takevolet.online/pgs",
  },
  twitter: {
    card: "summary_large_image",
    title: "PGs & Hostels in Hyderabad | Takevolet",
    description: "Find mens, womens, and coliving PGs with zero brokerage across Hyderabad.",
  },
  alternates: {
    canonical: "/pgs",
  },
};

export default function PgsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
