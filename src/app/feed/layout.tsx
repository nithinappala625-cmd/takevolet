import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Feed & Property Updates | Takevolet",
  description:
    "Explore community posts, tenant requirements, room discussions, and real-time updates from house owners and seekers across India on Takevolet.",
  keywords: [
    "takevolet feed",
    "community housing feed",
    "room requests hyderabad",
    "tenant posts",
  ],
  openGraph: {
    title: "Community Feed & Property Updates | Takevolet",
    description: "Real-time community housing posts and updates.",
    url: "https://takevolet.online/feed",
  },
  alternates: {
    canonical: "/feed",
  },
};

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
