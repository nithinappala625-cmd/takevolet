import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { Star, Building2, MapPin } from "lucide-react";

export const revalidate = 60; // Revalidate every minute

export default async function PartnersPage() {
  // Fetch partners from the database. 
  // If the table doesn't exist yet, we catch the error and show an empty list or mock data.
  const { data: partners, error } = await supabase
    .from("takevolet_partners")
    .select("*")
    .order("created_at", { ascending: false });

  // Fallback data just in case the table hasn't been created yet
  const displayPartners = error || !partners || partners.length === 0 ? [] : partners;

  return (
    <div className="min-h-screen bg-background pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 border border-primary/40 bg-primary/5 px-5 py-2 rounded-full mb-6">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-xs uppercase tracking-[0.25em] font-bold text-primary">Verified House Owners</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6">Our <span className="text-primary">Partners</span></h1>
          <p className="text-xl text-muted-foreground font-light">
            Meet the house owners who have partnered with Takevolet to provide verified, zero-brokerage bachelor rooms across Hyderabad.
          </p>
        </div>

        {displayPartners.length === 0 ? (
          <div className="text-center py-20 bg-secondary/5 border border-border">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-bold mb-2">New Partners Joining Soon!</h3>
            <p className="text-muted-foreground">Are you a house owner? List your property with our board to get featured here.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayPartners.map((partner) => (
              <div key={partner.id} className="border border-border bg-card overflow-hidden group">
                <div className="relative h-[300px] w-full bg-secondary/20">
                  {partner.image_url ? (
                    <img
                      src={partner.image_url}
                      alt={`Takevolet Partner ${partner.owner_name}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-muted-foreground opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-xl">
                    <Star size={12} className="fill-current" /> Verified Partner
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-black mb-2">{partner.owner_name}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                    <MapPin size={16} className="text-primary" />
                    {partner.area || "Hyderabad"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
