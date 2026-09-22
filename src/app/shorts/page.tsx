"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Play,
  Pause,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Smartphone,
  ArrowLeft,
  Loader2,
  Film,
  Building2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type ShortItem = {
  id: string;
  video_url: string;
  caption: string;
  author: string;
  author_id?: string;
  avatar_url?: string;
  likes: number;
  comments: number;
  views: string;
  listing?: {
    id?: string;
    title: string;
    rent: string;
    location: string;
    route: string;
  };
};

function ShortsContent() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get("id");

  const [shorts, setShorts] = useState<ShortItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadShorts() {
      setLoading(true);
      const items: ShortItem[] = [];

      try {
        // 1. Fetch from 'shorts' table
        const { data: shortsData } = await supabase
          .from("shorts")
          .select("id, video_url, caption, user_id, likes_count, comments_count, views_count, attached_listing, profiles(full_name, avatar_url)")
          .order("created_at", { ascending: false })
          .limit(30);

        if (shortsData && shortsData.length > 0) {
          for (const s of shortsData) {
            if (s.video_url && s.video_url.trim().startsWith("http")) {
              const prof = (s.profiles as any) || {};
              const att = s.attached_listing as any;
              items.push({
                id: s.id.toString(),
                video_url: s.video_url,
                caption: s.caption || "Property Tour Reel",
                author: prof.full_name || "Takevolet Member",
                author_id: s.user_id,
                avatar_url: prof.avatar_url,
                likes: s.likes_count || 12,
                comments: s.comments_count || 3,
                views: s.views_count ? `${(s.views_count / 1000).toFixed(1)}K` : "1.2K",
                listing: att
                  ? {
                      id: att.id,
                      title: att.title || "Featured Listing",
                      rent: att.rent ? `₹${att.rent}` : "Check Price",
                      location: att.locality || "Hyderabad",
                      route: att.type === "room" ? `/room/${att.id}` : `/properties`,
                    }
                  : undefined,
              });
            }
          }
        }
      } catch (err) {
        console.error("Error fetching shorts:", err);
      }

      try {
        // 2. Fetch from active 'rooms' with videos
        const { data: roomVideos } = await supabase
          .from("rooms")
          .select("id, title, bhk_type, locality, city, rent, video_url, videos, profiles(full_name, avatar_url)")
          .eq("is_available", true)
          .limit(20);

        if (roomVideos) {
          for (const r of roomVideos) {
            let vUrl = r.video_url?.trim();
            if (!vUrl && r.videos) {
              if (Array.isArray(r.videos) && r.videos.length > 0) {
                vUrl = r.videos[0];
              } else if (typeof r.videos === "string") {
                try {
                  const parsed = JSON.parse(r.videos);
                  if (Array.isArray(parsed) && parsed.length > 0) vUrl = parsed[0];
                } catch {
                  if (r.videos.startsWith("http")) vUrl = r.videos.trim();
                }
              }
            }

            if (vUrl && vUrl.startsWith("http")) {
              const prof = (r.profiles as any) || {};
              items.push({
                id: r.id.toString(),
                video_url: vUrl,
                caption: `${r.title || r.bhk_type || "Room"} for rent in ${r.locality || r.city || "Hyderabad"} #ZeroBrokerage`,
                author: prof.full_name || "Room Host",
                avatar_url: prof.avatar_url,
                likes: 24,
                comments: 5,
                views: "1.5K",
                listing: {
                  id: r.id.toString(),
                  title: r.title || `${r.bhk_type || "Room"} in ${r.locality || "Hyderabad"}`,
                  rent: `₹${r.rent}/mo`,
                  location: r.locality || r.city || "Hyderabad",
                  route: `/room/${r.id}`,
                },
              });
            }
          }
        }
      } catch (err) {
        console.error("Error fetching room videos:", err);
      }

      // If targetId was passed in query, prioritize it to the top or fetch directly
      if (targetId) {
        const foundIdx = items.findIndex((i) => i.id === targetId);
        if (foundIdx > 0) {
          const [targeted] = items.splice(foundIdx, 1);
          items.unshift(targeted);
        } else if (foundIdx === -1) {
          try {
            const { data: direct } = await supabase
              .from("shorts")
              .select("id, video_url, caption, user_id, likes_count, comments_count, views_count, attached_listing, profiles(full_name, avatar_url)")
              .eq("id", targetId)
              .maybeSingle();
            if (direct && direct.video_url) {
              const prof = (direct.profiles as any) || {};
              const att = direct.attached_listing as any;
              items.unshift({
                id: direct.id.toString(),
                video_url: direct.video_url,
                caption: direct.caption || "Property Tour Reel",
                author: prof.full_name || "Takevolet Member",
                author_id: direct.user_id,
                avatar_url: prof.avatar_url,
                likes: direct.likes_count || 12,
                comments: direct.comments_count || 3,
                views: direct.views_count ? `${(direct.views_count / 1000).toFixed(1)}K` : "1.2K",
                listing: att
                  ? {
                      id: att.id,
                      title: att.title || "Featured Listing",
                      rent: att.rent ? `₹${att.rent}` : "Check Price",
                      location: att.locality || "Hyderabad",
                      route: att.type === "room" ? `/room/${att.id}` : `/properties`,
                    }
                  : undefined,
              });
            }
          } catch (e) {
            console.error("Direct fetch for shared short error:", e);
          }
        }
      }

      setShorts(items);
      setLoading(false);
    }

    loadShorts();
  }, [targetId]);

  const current = shorts[currentIndex];

  const handleNext = () => {
    if (currentIndex < shorts.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
    }
  };

  const toggleLike = (id: string) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleShare = () => {
    if (!current) return;
    const shareUrl = `${window.location.origin}/shorts?id=${current.id}`;
    if (navigator.share) {
      navigator
        .share({
          title: "Takevolet Shorts - Property Tour Reel",
          text: current.caption,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Reel link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
        <p className="text-sm font-medium text-slate-400">Loading Takevolet Reels...</p>
      </div>
    );
  }

  if (shorts.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-purple-900/40 border border-purple-500/30 flex items-center justify-center mb-6">
          <Film className="w-10 h-10 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No Reels Published Yet</h2>
        <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
          Be the first to record and upload a 9:16 vertical video tour for your room or flat with zero brokerage!
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="https://play.google.com/store/apps/details?id=com.takevolet.app"
            target="_blank"
            rel="noreferrer"
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <Smartphone size={16} />
            Post on Takevolet App
          </a>
          <Link
            href="/rooms"
            className="border border-slate-700 hover:border-slate-500 text-white text-sm font-semibold px-6 py-3 rounded-xl transition"
          >
            Browse Rooms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center relative select-none">
      {/* Smart App Download Banner */}
      <div className="w-full bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 py-2.5 px-4 text-center text-xs sm:text-sm font-semibold flex flex-wrap items-center justify-center gap-3 fixed top-0 left-0 right-0 z-50 shadow-lg">
        <span>🎬 For the best full-screen reel experience, use the Takevolet App!</span>
        <a
          href={current ? `takevolet://shorts/${current.id}` : "takevolet://shorts"}
          className="bg-white text-purple-900 px-3 py-1 rounded-full text-xs font-bold hover:bg-slate-100 transition shadow"
        >
          Open in App
        </a>
      </div>

      {/* Main Reel Container */}
      <div className="w-full max-w-md h-[90vh] max-h-[820px] bg-black rounded-3xl overflow-hidden relative shadow-2xl border border-slate-800 flex flex-col mt-10">
        {/* Top Header */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
          <Link
            href="/"
            className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white/90 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex gap-4 text-sm font-bold bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
            <span className="text-white border-b-2 border-purple-500 pb-0.5">🔥 Reels</span>
            <span className="text-white/60 hover:text-white cursor-pointer">Live</span>
          </div>
          <a
            href="https://play.google.com/store/apps/details?id=com.takevolet.app"
            target="_blank"
            rel="noreferrer"
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow"
          >
            + Post Reel
          </a>
        </div>

        {/* Video Player */}
        <div
          className="relative w-full h-full flex items-center justify-center bg-slate-900 cursor-pointer"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          <video
            key={current.video_url}
            src={current.video_url}
            className="w-full h-full object-cover"
            autoPlay={isPlaying}
            loop
            muted
            playsInline
          />

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40 pointer-events-none" />

          {/* Pause overlay icon */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/25">
              <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </div>
          )}

          {/* Right Action Sidebar */}
          <div
            className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-20 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Author Avatar */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 shadow-md">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-base text-white overflow-hidden">
                  {current.avatar_url ? (
                    <img
                      src={current.avatar_url}
                      alt={current.author}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    current.author[0]?.toUpperCase() || "T"
                  )}
                </div>
              </div>
              <a
                href={current ? `takevolet://shorts/${current.id}` : "takevolet://shorts"}
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-purple-600 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shadow"
              >
                +
              </a>
            </div>

            {/* Like */}
            <button
              onClick={() => toggleLike(current.id)}
              className="flex flex-col items-center group"
            >
              <div
                className={`p-2.5 rounded-full bg-black/40 backdrop-blur-sm transition ${
                  liked[current.id] ? "text-red-500" : "text-white"
                }`}
              >
                <Heart
                  className={`w-6 h-6 ${liked[current.id] ? "fill-red-500" : ""}`}
                />
              </div>
              <span className="text-xs font-semibold mt-1">
                {current.likes + (liked[current.id] ? 1 : 0)}
              </span>
            </button>

            {/* Comments */}
            <a
              href={current ? `takevolet://shorts/${current.id}` : "takevolet://shorts"}
              className="flex flex-col items-center"
            >
              <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white hover:text-purple-400 transition">
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold mt-1">{current.comments}</span>
            </a>

            {/* Views */}
            <div className="flex flex-col items-center text-white/80">
              <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm">
                <Eye className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold mt-1">{current.views}</span>
            </div>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex flex-col items-center text-white hover:text-purple-400 transition"
            >
              <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm">
                <Share2 className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold mt-1">Share</span>
            </button>
          </div>

          {/* Bottom Info & Attached Listing Card */}
          <div className="absolute left-4 right-16 bottom-5 z-20 pointer-events-auto">
            <h3 className="font-bold text-base flex items-center gap-1.5 text-white">
              @{current.author.toLowerCase().replace(/\s+/g, "")}
              <span className="bg-purple-500 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                VERIFIED
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 line-clamp-2">
              {current.caption}
            </p>

            {/* Attached Listing Card */}
            {current.listing && (
              <div className="mt-3 bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/15 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">
                    Featured Listing
                  </span>
                  <p className="text-xs font-bold text-white truncate">
                    {current.listing.title}
                  </p>
                  <p className="text-[11px] text-purple-200 font-semibold">
                    {current.listing.rent}
                  </p>
                </div>
                <Link
                  href={current.listing.route}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow transition"
                >
                  View Details
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Up / Down Navigation buttons for desktop */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex flex-col gap-3 z-30">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center disabled:opacity-30 hover:bg-purple-600 transition"
          >
            ↑
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === shorts.length - 1}
            className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center disabled:opacity-30 hover:bg-purple-600 transition"
          >
            ↓
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ShortsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
          <p className="text-sm font-medium text-slate-400">Loading Takevolet Reels...</p>
        </div>
      }
    >
      <ShortsContent />
    </Suspense>
  );
}
