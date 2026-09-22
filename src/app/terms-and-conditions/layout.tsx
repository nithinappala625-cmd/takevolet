import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions | Takevolet",
  description:
    "Takevolet Terms and Conditions. Review the user guidelines, listing rules, and service terms for property owners, flatmates, and tenants.",
  keywords: [
    "takevolet terms and conditions",
    "terms of service",
    "takevolet user agreement",
  ],
  openGraph: {
    title: "Terms and Conditions | Takevolet",
    description: "Review Takevolet's terms of service and user guidelines.",
    url: "https://takevolet.online/terms-and-conditions",
  },
  alternates: {
    canonical: "/terms-and-conditions",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
