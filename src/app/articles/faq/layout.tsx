import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bachelor Room FAQs Hyderabad 2026 | Takevolet",
  description:
    "40+ answers to the most common questions bachelors ask about finding rooms in Hyderabad, using Takevolet, earning commission, finding flatmates, and buying/selling furniture — all in one place.",
  keywords: [
    "bachelor room faq hyderabad",
    "find bachelor room hyderabad questions",
    "takevolet faq",
    "hyderabad room rent questions",
    "zero brokerage room hyderabad faq",
    "bachelor room handover questions",
    "flatmate finder hyderabad faq",
    "room rent ameerpet faq",
    "room rent madhapur questions",
    "how to find bachelor room hyderabad",
  ],
  alternates: {
    canonical: "/articles/faq",
  },
  openGraph: {
    title: "Bachelor Room FAQs Hyderabad 2026 | Takevolet",
    description:
      "40+ answers to the most common questions bachelors ask about finding rooms, flatmates, and using Takevolet in Hyderabad.",
    type: "article",
  },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
