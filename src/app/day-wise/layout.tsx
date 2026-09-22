import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Day-Wise Rooms & Short Stays in Hyderabad — Daily Rentals | Takevolet",
  description:
    "Book affordable day-wise rooms, bachelor short stays, and daily rental accommodations across Hyderabad. Perfect for exams, interviews, work trips, and short visits. Zero brokerage with direct owner contacts.",
  keywords: [
    "day wise room rental hyderabad",
    "daily room rent hyderabad",
    "short stay rooms hyderabad",
    "bachelor daily stay hyderabad",
    "room for 1 day hyderabad",
    "cheap short stay hyderabad",
    "takevolet day wise",
  ],
  openGraph: {
    title: "Day-Wise Rooms & Short Stays in Hyderabad | Takevolet",
    description: "Book affordable daily room rentals and short stays across Hyderabad with zero brokerage.",
    url: "https://takevolet.online/day-wise",
  },
  twitter: {
    card: "summary_large_image",
    title: "Day-Wise Rooms & Short Stays in Hyderabad | Takevolet",
    description: "Daily room rentals for bachelors and travelers in Hyderabad.",
  },
  alternates: {
    canonical: "/day-wise",
  },
};

export default function DayWiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
