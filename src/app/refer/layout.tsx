import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refer & Earn — Cash Rewards & Rental Credits | Takevolet",
  description:
    "Join the Takevolet Refer & Earn program. Refer bachelors, friends, and property owners to earn direct cash rewards and free contact unlock credits.",
  keywords: [
    "takevolet refer and earn",
    "real estate referral rewards",
    "referral bonus hyderabad",
  ],
  openGraph: {
    title: "Refer & Earn | Takevolet",
    description: "Earn cash rewards and contact credits by inviting friends and owners to Takevolet.",
    url: "https://takevolet.online/refer",
  },
  alternates: {
    canonical: "/refer",
  },
};

export default function ReferLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
