import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Takevolet — Customer Support & Help Desk",
  description:
    "Get in touch with the Takevolet customer support team. Reach us for listing assistance, owner verification, partner inquiries, or real estate help via WhatsApp, phone, or email.",
  keywords: [
    "contact takevolet",
    "takevolet customer care",
    "takevolet support",
    "takevolet phone number",
    "takevolet hyderabad office",
  ],
  openGraph: {
    title: "Contact Takevolet — Customer Support & Help Desk",
    description: "Reach our customer support team for listing help, verification, or questions.",
    url: "https://takevolet.online/contact-us",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Takevolet | Support",
    description: "Get in touch with Takevolet support.",
  },
  alternates: {
    canonical: "/contact-us",
  },
};

export default function ContactUsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
