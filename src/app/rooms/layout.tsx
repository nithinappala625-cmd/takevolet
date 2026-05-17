import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Bachelor Rooms",
  description: "Browse 2BHK, 3BHK, PGs and bachelor rooms for handover across 90+ locations in Hyderabad. Filter by budget, members, and furnishing.",
  keywords: ["search bachelor rooms hyderabad", "2bhk handovers hyderabad", "find pg rooms hyderabad"],
  openGraph: {
    title: "Takevolet | Search Bachelor Rooms in Hyderabad",
    description: "Browse bachelor rooms for handover across 90+ locations in Hyderabad. Zero Brokerage.",
    url: "https://takevolet.online/rooms",
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
