import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Construction Services & Materials — Builders, Architects & Contractors | Takevolet",
  description:
    "Hire trusted civil contractors, home builders, architects, interior designers, and building material suppliers in Hyderabad and across India. Turnkey construction, renovation, and structural engineering with verified professionals.",
  keywords: [
    "construction services hyderabad",
    "house construction contractors",
    "home builders hyderabad",
    "architects in hyderabad",
    "interior designers hyderabad",
    "building materials hyderabad",
    "civil contractors near me",
    "takevolet build",
  ],
  openGraph: {
    title: "Construction Services & Materials | Takevolet",
    description: "Connect with verified civil contractors, architects, interior designers, and building material suppliers.",
    url: "https://takevolet.online/build",
  },
  twitter: {
    card: "summary_large_image",
    title: "Construction Services & Materials | Takevolet",
    description: "Verified contractors, architects, and building materials across India.",
  },
  alternates: {
    canonical: "/build",
  },
};

export default function BuildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
