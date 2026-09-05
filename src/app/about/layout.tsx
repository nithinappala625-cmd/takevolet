import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Takevolet — Hyderabad's Zero Brokerage Room Rental Platform",
  description:
    "Takevolet Technologies is Hyderabad's #1 zero-brokerage platform for rooms for rent, bachelor rooms, family rooms, flatmate matching, and used furniture marketplace. Founded in 2026. No brokers, direct contact.",
  keywords: [
    "about takevolet",
    "takevolet company",
    "takevolet technologies",
    "takevolet hyderabad",
    "who is takevolet",
    "takevolet founder",
    "zero brokerage platform hyderabad",
    "room rental startup hyderabad",
  ],
  openGraph: {
    title: "About Takevolet | Zero Brokerage Rooms in Hyderabad",
    description: "Takevolet Technologies is Hyderabad's #1 zero-brokerage room rental platform.",
    url: "https://takevolet.online/about",
  },
  alternates: {
    canonical: "/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
