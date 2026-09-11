import type { Metadata } from "next";
import { fetchAllRoomsAction } from "@/lib/server-actions";
import RoomCard from "@/components/RoomCard";
import Link from "next/link";
import { MapPin, ShieldCheck, HelpCircle, CheckCircle2, Sparkles, Building2 } from "lucide-react";
import type { Room } from "@/lib/db";
import {
  BANGALORE_AREAS,
  PUNE_AREAS,
  MUMBAI_AREAS,
  DELHI_AREAS,
  CHENNAI_AREAS,
} from "@/data/locations";

type Props = {
  params: Promise<{ area: string }>;
};

function formatAreaName(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getCityForArea(areaSlug: string, areaName: string): string {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "").replace(/[-_.]/g, "");
  const target = norm(areaSlug);

  if (BANGALORE_AREAS.some(a => norm(a) === target || target.includes(norm(a)))) return "Bangalore";
  if (PUNE_AREAS.some(a => norm(a) === target || target.includes(norm(a)))) return "Pune";
  if (MUMBAI_AREAS.some(a => norm(a) === target || target.includes(norm(a)))) return "Mumbai";
  if (DELHI_AREAS.some(a => norm(a) === target || target.includes(norm(a)))) return "Delhi NCR";
  if (CHENNAI_AREAS.some(a => norm(a) === target || target.includes(norm(a)))) return "Chennai";
  return "Hyderabad";
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const areaName = formatAreaName(params.area);
  const cityName = getCityForArea(params.area, areaName);
  const canonicalUrl = `https://takevolet.online/rooms/in/${params.area}`;
  
  return {
    title: `Rooms, Flats & PGs for Rent in ${areaName}, ${cityName} — Zero Brokerage | Takevolet`,
    description: `Find zero brokerage bachelor rooms, 1BHK/2BHK flats, PGs, and flatmates in ${areaName}, ${cityName}. Direct owner contact without broker fees. Start living in ${areaName} today!`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Rooms & PGs for Rent in ${areaName}, ${cityName} | Zero Brokerage`,
      description: `Direct room handovers, flats, and PGs in ${areaName}, ${cityName}. Zero brokerage.`,
      url: canonicalUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: `Rooms, Flats & PGs for Rent in ${areaName}, ${cityName}`,
      description: `Verified rooms, flats, and PGs in ${areaName}, ${cityName} with zero brokerage.`,
    },
  };
}

export default async function AreaRoomsPage(props: Props) {
  const params = await props.params;
  const areaName = formatAreaName(params.area);
  const cityName = getCityForArea(params.area, areaName);
  const allRooms = await fetchAllRoomsAction();
  
  // Filter rooms that belong to this area (case-insensitive includes)
  const areaRooms = allRooms.filter(r => 
    (r.location || "").toLowerCase().includes(areaName.toLowerCase()) || 
    (r.colony || "").toLowerCase().includes(areaName.toLowerCase()) ||
    (r.city || "").toLowerCase().includes(areaName.toLowerCase())
  );

  // Fallback nearby/popular rooms to prevent empty thin pages (Soft 404 prevention)
  const nearbyRooms = allRooms.filter(r =>
    (r.city || "").toLowerCase().includes(cityName.toLowerCase())
  ).slice(0, 6);

  const fallbackRooms = areaRooms.length > 0 ? areaRooms : (nearbyRooms.length > 0 ? nearbyRooms : allRooms.slice(0, 6));

  const faqs = [
    {
      q: `Are there zero brokerage rooms available in ${areaName}, ${cityName}?`,
      a: `Yes! All listings on Takevolet are direct handovers from existing tenants or owners. You pay zero brokerage for any room or PG in ${areaName}.`
    },
    {
      q: `How do I contact the room owner in ${areaName}?`,
      a: `Simply click on the room you like and use our secure contact unlock feature to get the poster's direct phone number or WhatsApp.`
    },
    {
      q: `Can I post my room or flat in ${areaName} for handover?`,
      a: `Absolutely! If you are leaving your room in ${areaName}, you can list it on Takevolet and connect directly with tenants looking for quick handovers.`
    },
    {
      q: `What types of accommodations are available in ${areaName}?`,
      a: `You can find single rooms, 1RKs, 1BHK/2BHK flats, shared flatmate rooms, Paying Guest (PG) accommodations, and day-wise stays.`
    },
    {
      q: `Is ${areaName} well connected for working professionals and students?`,
      a: `Yes, ${areaName} in ${cityName} offers prime connectivity to nearby business parks, metro stations, transit hubs, and retail centers.`
    }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://takevolet.online" },
          { "@type": "ListItem", "position": 2, "name": "Rooms", "item": "https://takevolet.online/rooms" },
          { "@type": "ListItem", "position": 3, "name": `${areaName}, ${cityName}`, "item": `https://takevolet.online/rooms/in/${params.area}` }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a
          }
        }))
      }
    ]
  };

  return (
    <div className="pt-32 pb-20 min-h-screen">
      {/* Structured Data (Breadcrumbs & FAQs) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <div className="container mx-auto px-6 md:px-12">
        {/* SEO Header & Breadcrumb */}
        <div className="mb-10 max-w-4xl">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Link href="/" className="hover:text-primary transition">Home</Link>
            <span>/</span>
            <Link href="/rooms" className="hover:text-primary transition">Rooms</Link>
            <span>/</span>
            <span className="text-primary font-medium">{areaName}, {cityName}</span>
          </nav>

          <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/10 px-3 py-1 rounded-full text-primary font-bold uppercase tracking-widest text-[11px] mb-4">
            <MapPin size={13} /> {cityName} Hub Focus
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight tracking-tight">
            Rooms, Flats &amp; PGs for Rent in <span className="gold-gradient">{areaName}</span>, {cityName}
          </h1>

          <div className="space-y-4 text-muted-foreground leading-relaxed text-sm md:text-base">
            <p>
              Looking for a room, flat, or PG in {areaName}, {cityName}? Situated in prime proximity to major commercial corridors, metro routes, and educational centers, {areaName} is one of the most in-demand destinations for students, bachelors, and working professionals.
            </p>
            <p>
              On Takevolet, you connect directly with genuine property owners and departing tenants. Enjoy 100% zero brokerage, transparent rent tariffs, verified photos, and instant phone or WhatsApp contact.
            </p>
          </div>
        </div>

        {/* Locality Insights Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-secondary/30 p-6 rounded-2xl border border-border">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-foreground">
              <CheckCircle2 size={18} className="text-primary shrink-0" /> Why Live in {areaName}
            </h2>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li className="flex gap-2"><span>•</span> Convenient access to major IT corridors and transit routes.</li>
              <li className="flex gap-2"><span>•</span> Wide range of furnished 1RK, 1BHK, 2BHK, and PG choices.</li>
              <li className="flex gap-2"><span>•</span> Abundance of supermarkets, dining hubs, and gym facilities.</li>
              <li className="flex gap-2"><span>•</span> Active and secure residential neighborhood.</li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-6 rounded-2xl border border-border">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-foreground">
              <CheckCircle2 size={18} className="text-primary shrink-0" /> Zero Brokerage Advantage
            </h2>
            <ol className="space-y-2.5 text-xs text-muted-foreground list-decimal list-inside">
              <li>Browse verified room and PG listings in {areaName}.</li>
              <li>Unlock direct contact for just ₹10–₹50.</li>
              <li>Call or WhatsApp the owner directly.</li>
              <li>Move in with <strong>₹0 broker commission</strong>!</li>
            </ol>
          </div>

          <div className="bg-secondary/30 p-6 rounded-2xl border border-border">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-foreground">
              <CheckCircle2 size={18} className="text-primary shrink-0" /> Average Rent in {areaName}
            </h2>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li className="flex justify-between border-b border-border/50 pb-2">
                <span>Shared / PGs:</span> <strong className="text-foreground">₹5,000 - ₹9,000</strong>
              </li>
              <li className="flex justify-between border-b border-border/50 pb-2">
                <span>1RK / Single Rooms:</span> <strong className="text-foreground">₹8,000 - ₹14,000</strong>
              </li>
              <li className="flex justify-between pb-2">
                <span>1BHK / 2BHK Flats:</span> <strong className="text-foreground">₹14,000 - ₹28,000</strong>
              </li>
            </ul>
          </div>
        </div>

        {/* Room Listings Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {areaRooms.length > 0 ? (
                  <>Available Accommodations in <span className="text-primary">{areaName}</span></>
                ) : (
                  <>Verified Properties in <span className="text-primary">{cityName}</span></>
                )}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {areaRooms.length > 0 
                  ? `Showing direct verified listings in ${areaName}.`
                  : `Currently zero active vacancies in ${areaName} proper — exploring verified options in ${cityName}:`
                }
              </p>
            </div>
            <Link
              href="/post/room"
              className="hidden md:inline-flex items-center gap-2 text-xs bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl hover:opacity-90 transition"
            >
              Post a Room in {areaName}
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fallbackRooms.map(room => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>

          {areaRooms.length === 0 && (
            <div className="mt-8 text-center p-8 rounded-2xl border border-border bg-secondary/20">
              <p className="text-base font-semibold text-foreground mb-2">
                Have a vacant room, flat, or PG in {areaName}?
              </p>
              <p className="text-xs text-muted-foreground mb-6 max-w-xl mx-auto">
                Tenants are actively searching for rooms in {areaName}. List your space for free on Takevolet with zero brokerage and reach thousands of seekers across India.
              </p>
              <Link
                href="/post/room"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition"
              >
                List Your Room in {areaName}
              </Link>
            </div>
          )}
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <HelpCircle size={22} className="text-primary" /> Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-border p-5 rounded-xl bg-secondary/20">
                <h3 className="font-bold text-sm mb-2 text-foreground">{faq.q}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
