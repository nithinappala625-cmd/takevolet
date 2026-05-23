"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Home, Users, ShoppingBag, HelpCircle, ArrowRight } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQSection {
  icon: React.ElementType;
  title: string;
  items: FAQItem[];
}

const faqSections: FAQSection[] = [
  {
    icon: Home,
    title: "Finding Bachelor Rooms in Hyderabad",
    items: [
      {
        q: "How do I find a bachelor room in Hyderabad without a broker?",
        a: "The easiest way is to use Takevolet — Hyderabad's zero-brokerage bachelor room platform. Browse rooms by area, budget, and number of members. All listings are direct from bachelors handing over their rooms. You only pay a small unlock fee (from ₹10) to get the poster's phone number — no broker commission ever.",
      },
      {
        q: "Which areas in Hyderabad have the most bachelor rooms?",
        a: "The top areas for bachelor rooms in Hyderabad are: Madhapur, Kondapur, and Gachibowli (IT corridor), KPHB/Kukatpally (metro-connected, affordable), SR Nagar/Ameerpet (central, budget-friendly), Dilsukhnagar (south Hyderabad, affordable), and Uppal/Nagole (east Hyderabad IT parks). Takevolet has listings across 90+ Hyderabad areas.",
      },
      {
        q: "What is the average rent for a bachelor room in Hyderabad in 2026?",
        a: "Average rent depends heavily on area: Madhapur/Gachibowli shared rooms: ₹10,000–₹20,000/person/month. KPHB/Kondapur: ₹6,000–₹12,000/person/month. Ameerpet/SR Nagar: ₹4,500–₹9,000/person/month. Dilsukhnagar/Uppal: ₹3,500–₹8,000/person/month. Budget single rooms across Hyderabad: ₹5,000–₹8,000/month.",
      },
      {
        q: "Can I find bachelor rooms under ₹5,000 in Hyderabad?",
        a: "Yes! Shared rooms in areas like Dilsukhnagar, Uppal, LB Nagar, and Malkajgiri often start from ₹3,500–₹5,000 per person in a 3–4 sharing setup. Even in Ameerpet and SR Nagar, shared rooms under ₹5,000 exist. Browse Takevolet filtered by your budget.",
      },
      {
        q: "What is a 'room handover' and how does it work in Hyderabad?",
        a: "A room handover is when a bachelor who is leaving their rented flat directly transfers it to the next bachelor — bypassing the landlord's broker process. The person leaving posts their room on Takevolet, interested bachelors contact them, and after agreement, the new person takes over the existing rent and advance terms. The outgoing bachelor recovers their deposit and earns a commission.",
      },
      {
        q: "What documents do I need to rent a bachelor room in Hyderabad?",
        a: "Typically: Government ID (Aadhaar card, passport, or driving licence), PAN card copy, company ID or offer letter (for working professionals), passport-size photographs (2–3), and police verification form (some landlords require this). For advance payment, have your UPI or bank account ready.",
      },
      {
        q: "How much advance deposit is standard for bachelor rooms in Hyderabad?",
        a: "Standard advance deposits in Hyderabad are 1–3 months of rent. In premium areas (Madhapur, Gachibowli), 2–3 months advance is common. In budget areas, 1–2 months is typical. When using Takevolet for room handovers, the advance terms are usually those already agreed by the previous tenant — often more reasonable than fresh listings.",
      },
      {
        q: "Is it safe to take over a room from another bachelor in Hyderabad?",
        a: "Yes, with precautions. Always visit the room in person before finalizing. Meet the landlord and confirm they know about the handover. Get the terms (rent, advance, notice period) in writing or via WhatsApp message at minimum. On Takevolet, all posters are verified bachelor community members.",
      },
      {
        q: "Can two bachelors share a 1BHK in Hyderabad?",
        a: "Absolutely — it's one of the most common living arrangements in Hyderabad. Two bachelors sharing a 1BHK brings the effective per-person rent to ₹5,000–₹10,000 in most areas, making premium locations affordable. Many listings on Takevolet specify 'members allowed' so you can filter for 2-member-friendly rooms.",
      },
      {
        q: "Are there bachelor rooms near Hitech City and Cyber Towers?",
        a: "Yes! Madhapur, Jubilee Hills, Kondapur, and parts of Banjara Hills have rooms within walking distance or a 10–15 minute auto ride to Hitech City and Cyber Towers. Browse Takevolet filtered by the 'Madhapur' or 'Kondapur' area.",
      },
      {
        q: "How do I filter for rooms that allow a specific number of members?",
        a: "On Takevolet's room search page, you can filter by 'Members Allowed' — select 1, 2, 3, or 4+ members. This filters rooms based on what the landlord has approved, so you don't waste time calling about rooms you can't take.",
      },
      {
        q: "Are furnished rooms available for bachelors in Hyderabad?",
        a: "Yes — Takevolet listings specify furnishing level: Fully Furnished (bed, fridge, washing machine, AC), Semi-Furnished (bed, fan, basic fixtures), or Unfurnished. In IT corridor areas, furnished rooms are common. For unfurnished or semi-furnished rooms, check Takevolet's marketplace for used furniture from departing bachelors.",
      },
      {
        q: "How quickly can I move into a room found on Takevolet?",
        a: "Room handovers on Takevolet can be very fast — sometimes within 24–48 hours if the leaving bachelor is in a hurry. In most cases, 7–15 days is the typical timeline. The speed depends on how quickly you unlock the contact, visit, and agree on terms with the poster.",
      },
      {
        q: "Do bachelor rooms in Hyderabad allow cooking?",
        a: "Most independent bachelor rooms (1RK, 1BHK, 2BHK) in Hyderabad allow cooking. However, some PG-style accommodations prohibit cooking. When browsing Takevolet, check the room details — posters usually mention if cooking is allowed or if there's a shared kitchen.",
      },
      {
        q: "Can I find bachelor rooms near major Hyderabad IT parks?",
        a: "Yes. Takevolet has listings near all major Hyderabad IT parks: HITEC City, Cyber Towers (Madhapur area), DLF IT Park (Gachibowli), Raheja Mindspace (Madhapur/Pochampally), Microsoft/Amazon campuses (Gachibowli), Infosys SDB (Gachibowli), TCS (Adibatla, Gachibowli), Uppal Software Park. Filter by area on Takevolet's rooms page.",
      },
    ],
  },
  {
    icon: HelpCircle,
    title: "About Takevolet",
    items: [
      {
        q: "What is Takevolet?",
        a: "Takevolet is Hyderabad's #1 zero-brokerage platform for bachelor room handovers, flatmate matching, and used furniture/appliance marketplace. Founded in 2026, it's built exclusively for the bachelor community in Hyderabad. Unlike generic property portals, every listing on Takevolet is from a bachelor — not a broker.",
      },
      {
        q: "Is Takevolet free to use?",
        a: "Browsing rooms, flatmates, and marketplace items on Takevolet is completely free. To get a poster's contact details (phone number for call/WhatsApp), you pay a small unlock fee starting from just ₹10 per contact. This keeps the platform spam-free and ensures serious inquiries only.",
      },
      {
        q: "Is Takevolet a broker?",
        a: "No! Takevolet is 100% zero-brokerage. We are a peer-to-peer platform that connects bachelors directly. The small unlock fee to get a poster's contact is a platform fee — not a broker commission. You keep all negotiation and agreement directly with the poster.",
      },
      {
        q: "Which city does Takevolet currently operate in?",
        a: "Takevolet currently focuses exclusively on Hyderabad, Telangana. We cover 90+ areas across Hyderabad including all major IT corridors, budget zones, and premium localities.",
      },
      {
        q: "How is Takevolet different from NoBroker or OLX?",
        a: "Takevolet is the only platform exclusively for the bachelor community in Hyderabad. NoBroker lists all property types and still has many broker listings. OLX is unvetted. Takevolet's room listings are specifically bachelor handovers (peer-to-peer), our flatmate section is bachelor-verified, our marketplace is hyper-local for bachelors, and we offer a unique ₹1,000 commission for successful handovers.",
      },
      {
        q: "How do I contact Takevolet support?",
        a: "You can reach Takevolet at hello@takevolet.online or via our Contact page. For urgent matters, WhatsApp us at +91 79819 94870. We typically respond within a few hours.",
      },
      {
        q: "Is my data safe on Takevolet?",
        a: "Yes. Your personal phone number is never shown publicly — it's only unlocked when someone pays the contact unlock fee. All transactions are secured by Razorpay (PCI DSS compliant). We never sell your data to third parties. Read our Privacy Policy for full details.",
      },
      {
        q: "How does the ₹10 contact unlock work?",
        a: "When you find a room, flatmate profile, or marketplace item you're interested in, click 'Unlock Contact'. Choose a contact plan (single contact for ₹10 or bundle plans for more contacts at lower per-contact rates). Pay via UPI, card, or netbanking through Razorpay. The poster's phone number is instantly revealed. Use it to call or WhatsApp directly.",
      },
    ],
  },
  {
    icon: Home,
    title: "Posting Rooms & Earning Commission",
    items: [
      {
        q: "How do I post my room on Takevolet?",
        a: "Go to the 'Post Room' page on Takevolet, sign in or create a free account, and fill in your room details: photos, location, rent, advance deposit, leaving date, number of members allowed, furnishing details, and gender preference. Your listing goes live within minutes.",
      },
      {
        q: "How much commission do I earn on Takevolet?",
        a: "When a new bachelor takes over your room through Takevolet and confirms the handover, you earn ₹500–₹1,000 as a commission. The exact amount depends on the plan and whether the handover is confirmed through the platform.",
      },
      {
        q: "Is posting a room on Takevolet free?",
        a: "Yes! Posting your room on Takevolet is completely free. You create your listing at no cost. You only earn money — you don't pay anything to list.",
      },
      {
        q: "How long will my room listing be active?",
        a: "Your listing stays active until you mark it as handed over or deactivate it manually. We recommend updating your leaving date if it changes so interested bachelors have accurate information.",
      },
      {
        q: "What if I don't find a taker for my room?",
        a: "Try improving your listing with better photos, accurate pricing, and detailed descriptions. Make sure your rent and advance are competitive for your area. You can also share your Takevolet listing link in WhatsApp groups to get more visibility. Our support team can also help promote urgent listings.",
      },
      {
        q: "Can I post my flatmate vacancy on Takevolet?",
        a: "Yes! If you have a vacancy in your flat (you're already living there but need a flatmate), go to 'Post Flatmate Vacancy' on Takevolet. Specify how many vacancies you have, your preferred profiles, lifestyle habits, rent share, and area.",
      },
      {
        q: "Can house owners list their properties on Takevolet?",
        a: "Yes! House owners can become Takevolet Partners and list their bachelor-friendly properties. Go to 'Become a Partner' to register. Owner-listed properties get the 'Bachelor Verified' badge which attracts more genuine bachelors.",
      },
      {
        q: "Can I list items for sale on Takevolet's marketplace?",
        a: "Yes! If you're leaving your flat, list your furniture, electronics, and appliances on Takevolet's marketplace at the same time as your room handover. Bachelors moving into your area are your most likely buyers. Go to 'Sell/Rent Items' to list.",
      },
    ],
  },
  {
    icon: Users,
    title: "Flatmates in Hyderabad",
    items: [
      {
        q: "How do I find a compatible flatmate in Hyderabad?",
        a: "Use Takevolet's Flatmates section. Browse verified bachelor profiles filtered by area, profession, budget, and lifestyle preferences. You can see their working hours, food preferences, and more before you even contact them. This saves enormous time compared to random WhatsApp groups.",
      },
      {
        q: "Is it safe to live with a stranger from the internet in Hyderabad?",
        a: "With proper vetting, yes. On Takevolet, all profiles include profession, company, and verified contact. Always: video call or meet in person before agreeing, get their company ID, start with a short trial period (1–2 months), and set clear household rules in writing from the start.",
      },
      {
        q: "What is the typical rent share for 2 bachelors in Hyderabad?",
        a: "For 2 bachelors sharing a 2BHK: Madhapur/Kondapur: ₹12,000–₹18,000/person, KPHB/Ameerpet: ₹7,000–₹11,000/person, Dilsukhnagar/Uppal: ₹5,000–₹8,500/person. Add ₹1,500–₹3,000 for electricity, Wi-Fi, and maid per month.",
      },
      {
        q: "Can girls/females find flatmates on Takevolet?",
        a: "Yes! Takevolet has a gender preference filter on all flatmate listings. Female bachelors can filter for female-only flatmate listings. Many listings in Hyderabad are open to any gender as well.",
      },
      {
        q: "What if my flatmate stops paying rent?",
        a: "This is a risk in any shared living situation. To protect yourself: always have a clear written agreement on payment dates, don't pay the other person's share yourself, speak to the landlord together about the issue, and if needed, ask the non-paying flatmate to find a replacement. Platforms like Takevolet can help you find a replacement flatmate quickly.",
      },
    ],
  },
  {
    icon: ShoppingBag,
    title: "Marketplace — Buying & Selling Furniture",
    items: [
      {
        q: "What items can I sell on Takevolet's marketplace?",
        a: "Any item relevant to bachelor living in Hyderabad: beds and mattresses, refrigerators, washing machines, air coolers and ACs, study tables and chairs, sofas, microwaves, inverters/UPS, TV sets, water purifiers, and other household items. Electronics and furniture are the most popular categories.",
      },
      {
        q: "How do I get a fair price for my used furniture in Hyderabad?",
        a: "A rough guide: items under 1 year old → 60–70% of original price, 1–3 years → 40–55%, 3–5 years → 25–40%. Always include photos, brand name, model, year of purchase, and current condition. Honest, detailed listings get better prices faster. Compare similar listings on Takevolet for reference.",
      },
      {
        q: "Can I rent out my furniture instead of selling it?",
        a: "Yes! On Takevolet's marketplace, you can list items for rent on a monthly basis. Bachelors who need items for 3–6 months will rent them at a premium, and you get your items back when they leave. Great for ACs, coolers, and washing machines.",
      },
      {
        q: "Is Takevolet's marketplace only for furniture?",
        a: "Primarily, yes — it's focused on bachelor living essentials. Furniture, appliances, electronics, kitchenware, and home accessories are all welcome. We don't list vehicles, clothing, or unrelated items. Focus is on things a bachelor moving into or out of a Hyderabad flat would need.",
      },
    ],
  },
];

// Accordion item component
function AccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 py-5 px-1 text-left hover:text-primary transition-colors group"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-sm md:text-base leading-snug group-hover:text-primary transition-colors">
          {item.q}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 mt-0.5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="pb-5 px-1">
          <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalQA = faqSections.reduce((sum, s) => sum + s.items.length, 0);

  // FAQPage JSON-LD for Google rich results
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqSections.flatMap((section) =>
      section.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      }))
    ),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://takevolet.online" },
      { "@type": "ListItem", position: 2, name: "Articles", item: "https://takevolet.online/articles" },
      { "@type": "ListItem", position: 3, name: "FAQ", item: "https://takevolet.online/articles/faq" },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="pt-36 pb-20 min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 md:px-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-10" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/articles" className="hover:text-primary transition-colors">Articles</Link>
            <span>/</span>
            <span className="text-foreground">FAQ</span>
          </nav>

          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider mb-5">
                <HelpCircle size={12} />
                {totalQA} Questions Answered
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 leading-tight">
                Bachelor Room <span className="text-primary">FAQ</span>
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
                Everything bachelors in Hyderabad ask about finding rooms, using Takevolet, earning commission, finding flatmates, and buying/selling furniture. All answered in one place.
              </p>
            </div>

            {/* Jump to section links */}
            <div className="flex flex-wrap gap-2 mb-12 p-4 bg-secondary/20 border border-border">
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground w-full mb-1">Jump to:</span>
              {faqSections.map((section) => (
                <a
                  key={section.title}
                  href={`#${section.title.replace(/\s+/g, "-").toLowerCase()}`}
                  className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors border border-border px-3 py-1 hover:border-primary"
                >
                  {section.title} ({section.items.length})
                </a>
              ))}
            </div>

            {/* FAQ Sections */}
            <div className="space-y-12">
              {faqSections.map((section) => (
                <section
                  key={section.title}
                  id={section.title.replace(/\s+/g, "-").toLowerCase()}
                  className="scroll-mt-32"
                >
                  <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-primary">
                    <div className="w-8 h-8 bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                      <section.icon size={16} className="text-primary" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold">{section.title}</h2>
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5">
                      {section.items.length} Q&amp;As
                    </span>
                  </div>

                  <div className="border border-border divide-y divide-border">
                    {section.items.map((item, idx) => {
                      const key = `${section.title}-${idx}`;
                      return (
                        <AccordionItem
                          key={key}
                          item={item}
                          isOpen={!!openItems[key]}
                          onToggle={() => toggleItem(key)}
                        />
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            {/* CTA Block */}
            <div className="mt-16 border border-primary/30 bg-primary/5 p-8 text-center">
              <h3 className="text-2xl font-bold mb-3">Still have questions?</h3>
              <p className="text-muted-foreground mb-6 text-sm max-w-md mx-auto">
                Our team is here to help. WhatsApp or email us — we respond within a few hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/rooms"
                  className="bg-primary text-primary-foreground px-8 py-3 text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  Browse Rooms <ArrowRight size={14} />
                </Link>
                <Link
                  href="/contact"
                  className="border border-border px-8 py-3 text-sm font-bold uppercase tracking-wider hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                >
                  Contact Us
                </Link>
              </div>
            </div>

            {/* Related Articles */}
            <div className="mt-12">
              <h3 className="text-lg font-bold mb-4 pb-2 border-b border-border">Related Articles</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { title: "Best Areas in Hyderabad for Bachelors 2026", slug: "best-areas-in-hyderabad-for-bachelors-2026" },
                  { title: "What is Takevolet? How It Works", slug: "what-is-takevolet-hyderabad-zero-brokerage-platform" },
                  { title: "PG vs Bachelor Room — Which is Better?", slug: "pg-vs-bachelor-room-hyderabad-which-is-better" },
                  { title: "Room Handover Guide — Earn ₹1,000", slug: "room-handover-hyderabad-earn-commission" },
                ].map((article) => (
                  <Link
                    key={article.slug}
                    href={`/articles/${article.slug}`}
                    className="border border-border p-4 hover:border-primary transition-colors group flex items-center justify-between gap-3"
                  >
                    <span className="text-sm font-semibold group-hover:text-primary transition-colors">{article.title}</span>
                    <ArrowRight size={14} className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
