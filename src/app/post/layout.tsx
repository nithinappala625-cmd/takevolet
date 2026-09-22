import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Post a Listing | Takevolet",
  description: "Post your room, flat, PG, property, or service on Takevolet with zero brokerage.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function PostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
