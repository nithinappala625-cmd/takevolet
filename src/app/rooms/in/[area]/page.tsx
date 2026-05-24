import type { Metadata } from "next";
import { fetchAllRoomsAction } from "@/lib/server-actions";
import RoomCard from "@/components/RoomCard";
import Link from "next/link";
import { MapPin, ShieldCheck, HelpCircle, CheckCircle2 } from "lucide-react";
import type { Room } from "@/lib/db";

type Props = {
  params: { area: string };
};

function formatAreaName(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const areaName = formatAreaName(params.area);
  
  return {
    title: `Bachelor Rooms for Rent in ${areaName} Hyderabad — Zero Brokerage | Takevolet`,
    description: `Find zero brokerage bachelor rooms, 1BHKs, and flatmates in ${areaName}, Hyderabad. Direct owner contact, no brokers. Find your next room today!`,
    alternates: {
      canonical: `/rooms/in/${params.area}`,
    },
    openGraph: {
      title: `Bachelor Rooms for Rent in ${areaName} | Zero Brokerage`,
      description: `Direct bachelor room handovers and flatmates in ${areaName}, Hyderabad.`,
      url: `https://takevolet.online/rooms/in/${params.area}`,
    },
  };
}

export default async function AreaRoomsPage({ params }: Props) {
  const areaName = formatAreaName(params.area);
  const allRooms = await fetchAllRoomsAction();
  
  // Filter rooms that belong to this area (case-insensitive includes)
  const areaRooms = allRooms.filter(r => 
    (r.location || "").toLowerCase().includes(areaName.toLowerCase()) || 
    (r.colony || "").toLowerCase().includes(areaName.toLowerCase())
  );

  const faqs = [
    {
      q: `Are there zero brokerage rooms available in ${areaName}?`,
      a: `Yes! All listings on Takevolet are direct handovers from existing tenants or owners. You pay zero brokerage for any room in ${areaName}.`
    },
    {
      q: `How do I contact the room owner in ${areaName}?`,
      a: `Simply click on the room you like and use our secure contact unlock feature to get the poster's direct phone number or WhatsApp.`
    },
    {
      q: `Can I post my room in ${areaName} for handover?`,
      a: `Absolutely! If you are leaving your room in ${areaName}, you can list it on Takevolet and even earn a referral commission when someone takes it.`
    },
    {
      q: `What types of rooms are available for bachelors in ${areaName}?`,
      a: `You can find single rooms, 1RKs, 1BHK flats, and shared flatmate accommodations specifically optimized for bachelor living.`
    },
    {
      q: `Is ${areaName} a good location for bachelors?`,
      a: `Yes, ${areaName} is a popular and bustling locality with a large population of students and working professionals, making it a highly preferred choice.`
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  return (
    <div className="pt-36 pb-20 min-h-screen">
      {/* FAQ Schema Markup */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="container mx-auto px-6 md:px-12">
        {/* SEO Header & Intro */}
        <div className="mb-12 max-w-4xl">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs mb-4">
            <MapPin size={14} /> Location Focus
          </div>
          <h1 className="text-4xl md:text-5xl font-light mb-6 leading-tight">
            Bachelor Rooms for Rent in <span className="font-bold">{areaName}</span>, Hyderabad
          </h1>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Looking for a bachelor room for rent in {areaName}, Hyderabad? Located close to major hubs and essential amenities, {areaName} has become one of the top choices for bachelors, students, and IT professionals. Whether you need a single room, a 1BHK, or a shared flatmate setup, living here offers unmatched convenience and a vibrant lifestyle.
            </p>
            <p>
              With Takevolet, you can discover direct room handovers from outgoing tenants without paying a single rupee in brokerage. Say goodbye to greedy brokers and hidden fees. Browse our real-time listings in {areaName} below and connect directly with verified posters!
            </p>
          </div>
        </div>

        {/* Dynamic SEO Content Blocks */}
        <div className="grid md:grid-cols-3 gap-10 mb-16">
          <div className="bg-secondary/20 p-8 border border-border">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2"><CheckCircle2 className="text-primary" /> Why bachelors choose {areaName}</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2"><span>•</span> Strategic location with seamless connectivity.</li>
              <li className="flex gap-2"><span>•</span> Highly affordable 1RK and shared 1BHK options.</li>
              <li className="flex gap-2"><span>•</span> Abundance of local tiffin centers, gyms, and supermarkets.</li>
              <li className="flex gap-2"><span>•</span> Excellent public transport via TSRTC and Metro.</li>
              <li className="flex gap-2"><span>•</span> A large community of like-minded young professionals.</li>
            </ul>
          </div>
          <div className="bg-secondary/20 p-8 border border-border">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2"><CheckCircle2 className="text-primary" /> How Takevolet works</h2>
            <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
              <li>Browse direct listings for rooms in {areaName}.</li>
              <li>Unlock the poster's direct contact details.</li>
              <li>Contact them instantly via Call or WhatsApp.</li>
              <li>Finalize your room with <strong>Zero Brokerage</strong>!</li>
            </ol>
          </div>
          <div className="bg-secondary/20 p-8 border border-border">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2"><CheckCircle2 className="text-primary" /> Typical rent in {areaName}</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex justify-between border-b border-border/50 pb-2"><span>Shared / Flatmates:</span> <strong>₹4,000 - ₹8,000</strong></li>
              <li className="flex justify-between border-b border-border/50 pb-2"><span>1RK / Single Rooms:</span> <strong>₹8,000 - ₹12,000</strong></li>
              <li className="flex justify-between pb-2"><span>1BHK Flats:</span> <strong>₹12,000 - ₹20,000</strong></li>
            </ul>
          </div>
        </div>

        {/* Room Listings */}
        <div className="mb-16">
          <h2 className="text-3xl font-light mb-8">Available Rooms in <span className="font-bold">{areaName}</span></h2>
          
          {areaRooms.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {areaRooms.map(room => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-border bg-secondary/10">
              <p className="text-2xl font-light mb-4">No rooms available in {areaName} right now.</p>
              <p className="text-muted-foreground mb-8">Be the first to list a room here and earn referral commission!</p>
              <Link href="/post/room" className="bg-primary text-primary-foreground px-8 py-3 text-sm font-bold uppercase tracking-wider hover:bg-primary/90 transition-all">
                List Your Room
              </Link>
            </div>
          )}
        </div>

        {/* FAQs */}
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><HelpCircle className="text-primary" /> FAQs about {areaName} Rooms</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-border p-5 bg-background">
                <h3 className="font-bold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
