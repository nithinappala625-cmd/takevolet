"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, MapPin, Calendar, IndianRupee, Users, Sofa, ChevronRight, ShoppingBag, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchAllRoomsAction, fetchAllFlatmatesAction } from "@/lib/server-actions";
import { TopBannerCarousel } from "@/components/TopBannerCarousel";
import { getAllFlatmates } from "@/lib/flatmate-db";
import type { Room } from "@/lib/db";
import type { Flatmate } from "@/data/mock";

export function FeaturedRoomsSection() {
  const [featuredRooms, setFeaturedRooms] = useState<Room[]>([]);

  useEffect(() => {
    async function load() {
      const roomsRes = await fetchAllRoomsAction();
      if (roomsRes && Array.isArray(roomsRes)) {
        setFeaturedRooms(roomsRes.filter(r => r.is_available).slice(0, 3));
      }
    }
    load();
  }, []);

  return (
    <>
      {/* Hero Visual */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.3 }}
        className="relative h-[240px] sm:h-[300px] md:h-[500px] mt-8 lg:mt-0 bg-secondary/20">
        {featuredRooms.length > 0 ? (
          <>
            <div className="absolute inset-0 overflow-hidden">
              <img src={featuredRooms[0].images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop&q=80"}
                alt="Bachelor flat for rent in Hyderabad" loading="eager" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
            </div>
            <div className="absolute bottom-6 left-6 right-6 bg-background/90 backdrop-blur-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Bachelor Room Available</p>
                  <h4 className="font-bold line-clamp-1">{featuredRooms[0].title}</h4>
                </div>
                <span className="text-lg font-bold">₹{featuredRooms[0].rent.toLocaleString("en-IN")}<span className="text-xs text-muted-foreground font-normal">/mo</span></span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin size={12} /> {featuredRooms[0].location}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Calendar size={12} /> Leaving {new Date(featuredRooms[0].leaving_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                {(featuredRooms[0].commission || 0) > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-primary font-bold">₹{featuredRooms[0].commission} reward</span>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 animate-pulse flex flex-col justify-end p-6 bg-secondary/50">
            <div className="bg-background border border-border p-5 w-full">
              <div className="flex justify-between items-center mb-3">
                <div className="space-y-2 w-1/2">
                  <div className="h-2 bg-muted w-1/2 rounded" />
                  <div className="h-4 bg-muted w-full rounded" />
                </div>
                <div className="h-6 bg-muted w-20 rounded" />
              </div>
              <div className="flex gap-4">
                <div className="h-3 bg-muted w-16 rounded" />
                <div className="h-3 bg-muted w-24 rounded" />
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Featured Room Cards */}
      <section className="py-28">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">Latest Handovers</p>
              <h2 className="text-3xl font-light">Bachelors <span className="font-bold">leaving soon</span></h2>
            </div>
            <Link href="/rooms" className="text-sm uppercase tracking-wider font-semibold text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredRooms.map((room, i) => (
              <motion.div key={room.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="border border-border overflow-hidden group hover:border-primary/30 transition-all">
                <div className="relative h-48 overflow-hidden">
                  <img src={room.images?.[0] || ""} alt={room.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                    <MapPin size={10} className="text-primary" /> {room.location}
                  </div>
                  {(room.commission || 0) > 0 && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold">
                      ₹{room.commission} reward
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-sm mb-2 line-clamp-1">{room.title}</h3>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="px-2 py-0.5 bg-secondary text-[10px] font-medium uppercase tracking-wider flex items-center gap-1"><Users size={10} /> {room.members_allowed || 1} allowed</span>
                    <span className="px-2 py-0.5 bg-secondary text-[10px] font-medium uppercase tracking-wider flex items-center gap-1"><Sofa size={10} /> {room.furnishing}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-border">
                    <span className="font-bold flex items-center"><IndianRupee size={14} />{room.rent.toLocaleString("en-IN")}<span className="text-xs text-muted-foreground font-normal">/mo</span></span>
                    <Link href={`/rooms/${room.id}`} className="text-xs text-primary font-bold uppercase tracking-wider hover:underline">Details →</Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export function FeaturedFlatmatesSection() {
  const [featuredFlatmates, setFeaturedFlatmates] = useState<Flatmate[]>([]);

  useEffect(() => {
    async function load() {
      const fms = await getAllFlatmates();
      setFeaturedFlatmates(fms.filter(f => f.isAvailable).slice(0, 3));
    }
    load();
  }, []);

  return (
    <section className="py-28 bg-secondary/15 border-t border-border">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">Premium Roommate Matchmaking</p>
            <h2 className="text-4xl font-light">Find compatible <span className="font-bold">Flatmates</span></h2>
            <p className="text-muted-foreground font-light mt-3 max-w-xl text-sm leading-relaxed">
              Connect with verified bachelors who have a vacancy in their flat. Filter by budget, professional background, and lifestyle habits.
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/flatmates" className="text-xs bg-foreground text-background px-6 py-3.5 uppercase tracking-wider font-bold hover:bg-primary hover:text-primary-foreground transition-all">
              Browse Flatmates
            </Link>
            <Link href="/post/flatmate" className="text-xs border border-border px-6 py-3.5 uppercase tracking-wider font-bold hover:border-primary hover:text-primary transition-all">
              Post a Vacancy +
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {featuredFlatmates.map((fm, i) => (
            <motion.div key={fm.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="border border-border bg-background overflow-hidden group hover:border-primary/45 transition-all flex flex-col justify-between shadow-sm">
              
              <div className="relative h-56 overflow-hidden bg-muted">
                <img src={fm.images[0]} alt={fm.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-md px-2.5 py-1 text-[9px] uppercase tracking-wider font-bold text-primary border border-primary/20">
                  Vacancy: {fm.vacancyCount}
                </div>
                <div className="absolute top-3 right-3 bg-foreground text-background px-2.5 py-1 text-[9px] uppercase tracking-wider font-bold">
                  {fm.genderPref}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent p-5 pt-10 text-white">
                  <p className="text-[10px] font-semibold tracking-wider uppercase opacity-85 mb-1 flex items-center gap-1">
                    <MapPin size={10} className="text-primary" /> {fm.location}
                  </p>
                  <h3 className="font-bold text-sm line-clamp-1">{fm.title}</h3>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <div>
                      <span className="block text-[8px] uppercase tracking-widest text-muted-foreground font-bold">Rent Share /mo</span>
                      <span className="font-bold text-lg text-primary flex items-center"><IndianRupee size={14} strokeWidth={2.5} /> {fm.rentShare.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img src={fm.postedBy.avatar} alt={fm.postedBy.name} className="w-8 h-8 rounded-full object-cover border border-primary/20" />
                      <div className="text-right">
                        <p className="text-[10px] font-bold leading-none">{fm.postedBy.name}</p>
                        <p className="text-[9px] text-muted-foreground leading-none mt-1">{fm.postedBy.age} y/o • {fm.postedBy.profession.split(" at ")[0]}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs font-light text-muted-foreground line-clamp-2 leading-relaxed">
                    {fm.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {fm.lifestyleHabits.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="bg-secondary/40 border border-border px-2 py-0.5 text-[9px] text-foreground/80 rounded-full">
                        {tag}
                      </span>
                    ))}
                    {fm.lifestyleHabits.length > 2 && (
                      <span className="bg-secondary/20 border border-border px-2 py-0.5 text-[9px] text-muted-foreground rounded-full">
                        +{fm.lifestyleHabits.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-border pt-4 mt-4 flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-light">Prefers: <strong>{fm.professionPref}</strong></span>
                  <Link href={`/flatmates/${fm.id}`} className="text-xs text-primary font-bold uppercase tracking-wider hover:underline">
                    Details →
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HeroAnimations() {
  return (
    <>
      <TopBannerCarousel />
    </>
  );
}

export function AnimatedStats({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <section className="border-y border-border bg-secondary/30">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className={`py-8 sm:py-10 text-center ${
                i === 0 ? 'border-r border-border' :
                i === 1 ? 'md:border-r md:border-border' :
                i === 2 ? 'border-r border-border' :
                ''
              }`}>
              <p className="text-2xl sm:text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AnimatedSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay }} className={className}>
      {children}
    </motion.div>
  );
}
