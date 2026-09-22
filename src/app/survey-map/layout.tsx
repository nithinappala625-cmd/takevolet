import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Land Survey Maps & Records — Telangana & Andhra Pradesh | Takevolet",
  description:
    "Check official land survey numbers, Dharani cadastral maps, Meebhoomi FMB sketches, Pahani ROR 1-B records, prohibited lands (22A), and RERA status across Telangana and Andhra Pradesh.",
  keywords: [
    "survey map telangana",
    "dharani survey numbers",
    "meebhoomi ap survey number",
    "bhunaksha ts",
    "village survey map hyderabad",
    "pahani ror 1b check",
    "takevolet survey map",
  ],
  openGraph: {
    title: "Land Survey Maps & Records | Takevolet",
    description: "Search survey numbers, cadastral maps, and revenue land records for Telangana & AP.",
    url: "https://takevolet.online/survey-map",
  },
  twitter: {
    card: "summary_large_image",
    title: "Land Survey Maps & Records | Takevolet",
    description: "Search land survey maps & records.",
  },
  alternates: {
    canonical: "/survey-map",
  },
};

export default function SurveyMapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
