import { Metadata } from "next";

export const metadata: Metadata = {
  title: "List Your Space Free — Post Rooms, Flats & PGs | Takevolet",
  description:
    "List your room, apartment flat, PG accommodation, or property for sale on Takevolet. Connect directly with verified tenants and buyers with zero brokerage.",
  keywords: [
    "post room for rent",
    "list property free",
    "zero brokerage listing",
    "post flat hyderabad",
    "takevolet list space",
  ],
  openGraph: {
    title: "List Your Space Free | Takevolet",
    description: "Post your room, flat, or PG with zero brokerage on Takevolet.",
    url: "https://takevolet.online/list",
  },
  alternates: {
    canonical: "/list",
  },
};

export default function ListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
