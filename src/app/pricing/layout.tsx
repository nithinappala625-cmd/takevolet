import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing & Contact Unlock Plans — Low Cost Direct Contact | Takevolet",
  description:
    "Simple, transparent pricing. Unlock verified owner and flatmate phone numbers starting at just ₹10. No broker commissions, no subscriptions, pay only for what you unlock.",
  keywords: [
    "takevolet pricing",
    "zero brokerage pricing",
    "unlock owner contact",
    "direct owner contact fee",
    "cheap rental contact unlock",
  ],
  openGraph: {
    title: "Pricing & Contact Unlock Plans | Takevolet",
    description: "Unlock direct owner phone numbers starting at just ₹10. Zero brokerage fees.",
    url: "https://takevolet.online/pricing",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing & Contact Unlock Plans | Takevolet",
    description: "Transparent pricing with zero brokerage.",
  },
  alternates: {
    canonical: "/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
