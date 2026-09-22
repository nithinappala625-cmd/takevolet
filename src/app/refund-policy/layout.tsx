import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund and Cancellation Policy | Takevolet",
  description:
    "Takevolet Refund and Cancellation Policy. Learn about our clear, fair policies regarding contact unlock transactions and digital service purchases.",
  keywords: [
    "takevolet refund policy",
    "cancellation policy",
    "takevolet refund terms",
  ],
  openGraph: {
    title: "Refund and Cancellation Policy | Takevolet",
    description: "Learn about Takevolet's refund and cancellation policies.",
    url: "https://takevolet.online/refund-policy",
  },
  alternates: {
    canonical: "/refund-policy",
  },
};

export default function RefundPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
