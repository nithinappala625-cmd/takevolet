import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create an Account | Takevolet",
  description: "Sign up on Takevolet to connect directly with room owners, find flatmates, or list properties with zero brokerage.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
