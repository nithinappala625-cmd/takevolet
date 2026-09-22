import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Takevolet",
  description:
    "Takevolet Privacy Policy. Understand how we collect, use, and protect your personal information, contact privacy, and account security when using our services.",
  keywords: [
    "takevolet privacy policy",
    "privacy policy",
    "takevolet terms",
  ],
  openGraph: {
    title: "Privacy Policy | Takevolet",
    description: "Learn about how Takevolet handles and protects user privacy.",
    url: "https://takevolet.online/privacy-policy",
  },
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
