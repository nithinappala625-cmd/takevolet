import Link from "next/link";
import { MapPin, ShieldCheck, HelpCircle, CheckCircle2, Home, ArrowRight, Users } from "lucide-react";
import { fetchAllRoomsAction } from "@/lib/server-actions";
import RoomCard from "@/components/RoomCard";
import { HYDERABAD_AREAS } from "@/data/locations";

export default async function FamilyRoomsPage() {
  const allRooms = await fetchAllRoomsAction();
  const familyRooms = allRooms.filter(r => (r as any).tenant_type === "family");

  const faqs = [
    {
      q: "Are there zero brokerage family rooms in Hyderabad?",
      a: "Yes! All listings on Takevolet are direct from current tenants or owners. You pay zero brokerage for any family room or flat in Hyderabad.",
    },
    {
      q: "What types of family rooms are available on Takevolet?",
      a: "You can find 1BHK, 2BHK, 3BHK flats, independent houses, and gated community apartments suitable for families across 90+ areas in Hyderabad.",
    },
    {
      q: "How much do family rooms cost in Hyderabad?",
      a: "Family room rents vary by area: Madhapur/Gachibowli (₹15,000–₹40,000), Kukatpally/Miyapur (₹10,000–₹25,000), LB Nagar/Uppal (₹8,000–₹18,000). All listings on Takevolet have transparent pricing.",
    },
    {
      q: "How do I contact the room owner for family rooms?",
      a: "Simply browse family room listings, click on the room you like, and unlock the poster's direct phone number or WhatsApp. No brokers involved.",
    },
    {
      q: "Can I list my family room for handover on Takevolet?",
      a: "Absolutely! If you're leaving your family flat, list it on Takevolet and earn a referral commission when someone takes it over.",
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <div className="pt-36 pb-20 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="container mx-auto px-6 md:px-12">
        {/* SEO Header */}
        <div className="mb-12 max-w-4xl">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs mb-4">
            <Home size={14} /> Family Rooms
          </div>
          <h1 className="text-4xl md:text-5xl font-light mb-6 leading-tight">
            Family Rooms for Rent in <span className="font-bold">Hyderabad</span>
          </h1>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Looking for family rooms for rent in Hyderabad? Takevolet is your zero-brokerage destination for family-friendly 1BHK, 2BHK, and 3BHK flats across Hyderabad&apos;s best neighbourhoods. Whether you&apos;re relocating for work, upgrading your living space, or searching for a safe, comfortable home for your family — find verified listings with transparent pricing and direct owner contact.
            </p>
            <p>
              All family room listings on Takevolet are direct from current tenants or owners. No brokers, no hidden fees. Just honest listings with real photos and instant contact unlock starting at ₹15.
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-10 mb-16">
          <div className="bg-secondary/20 p-8 border border-border">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2"><CheckCircle2 className="text-primary" /> Why families choose Takevolet</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2"><span>•</span> Zero brokerage — save ₹10,000–₹30,000 in broker fees.</li>
              <li className="flex gap-2"><span>•</span> Direct contact with room owners — no middlemen.</li>
              <li className="flex gap-2"><span>•</span> Real photos and honest descriptions.</li>
              <li className="flex gap-2"><span>•</span> Transparent rent, advance, and furnishing details.</li>
              <li className="flex gap-2"><span>•</span> 90+ areas across Hyderabad covered.</li>
            </ul>
          </div>
          <div className="bg-secondary/20 p-8 border border-border">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2"><CheckCircle2 className="text-primary" /> Popular areas for family rooms</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {["Madhapur", "Gachibowli", "Kondapur", "Manikonda", "Miyapur", "LB Nagar", "Secunderabad", "Banjara Hills"].map(area => (
                <li key={area}>
                  <Link href={`/rooms/in/${area.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-primary transition-colors">
                    → Family rooms in {area}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-secondary/20 p-8 border border-border">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2"><CheckCircle2 className="text-primary" /> Typical rent for family flats</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex justify-between border-b border-border/50 pb-2"><span>2BHK (Kukatpally):</span> <strong>₹10,000 - ₹18,000</strong></li>
              <li className="flex justify-between border-b border-border/50 pb-2"><span>2BHK (Madhapur):</span> <strong>₹18,000 - ₹30,000</strong></li>
              <li className="flex justify-between border-b border-border/50 pb-2"><span>3BHK (Gachibowli):</span> <strong>₹25,000 - ₹45,000</strong></li>
              <li className="flex justify-between pb-2"><span>3BHK (LB Nagar):</span> <strong>₹12,000 - ₹22,000</strong></li>
            </ul>
          </div>
        </div>

        {/* Room Listings */}
        <div className="mb-16">
          <h2 className="text-3xl font-light mb-8">Available Family Rooms in <span className="font-bold">Hyderabad</span></h2>

          {familyRooms.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {familyRooms.map(room => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-border bg-secondary/10">
              <Users size={48} className="mx-auto text-muted-foreground/60 mb-4" />
              <p className="text-2xl font-light mb-4">No family rooms listed right now.</p>
              <p className="text-muted-foreground mb-8">Be the first to list a family room and earn referral commission!</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/post/room" className="bg-primary text-primary-foreground px-8 py-3 text-sm font-bold uppercase tracking-wider hover:bg-primary/90 transition-all">
                  List Your Family Room
                </Link>
                <Link href="/rooms" className="border border-border px-8 py-3 text-sm font-bold uppercase tracking-wider hover:border-primary hover:text-primary transition-all flex items-center gap-2">
                  Browse All Rooms <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Area Links */}
        <div className="mb-16">
          <h2 className="text-xl font-bold mb-6">Family Rooms Across Hyderabad</h2>
          <div className="flex flex-wrap gap-2">
            {HYDERABAD_AREAS.slice(0, 40).map(area => (
              <Link key={area} href={`/rooms/in/${area.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-xs bg-secondary/30 px-3 py-1.5 border border-border hover:border-primary hover:text-primary transition-colors">
                Family Rooms in {area}
              </Link>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><HelpCircle className="text-primary" /> FAQs about Family Rooms in Hyderabad</h2>
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
