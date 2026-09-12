"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Heart, MessageCircle, Share2, Send, MapPin, 
  Smartphone, Download, CheckCircle2, Home, Users 
} from "lucide-react";

type Post = {
  id: string;
  author: {
    name: string;
    avatar: string;
    profession: string;
    verified: boolean;
    city: string;
  };
  timeAgo: string;
  category: "room" | "flatmate" | "community" | "pg";
  tag: string;
  content: string;
  price?: number;
  specs?: string[];
  images: string[];
  whatsapp?: string;
  phone?: string;
  likes: number;
  commentsCount: number;
  liked?: boolean;
};

const INITIAL_POSTS: Post[] = [
  {
    id: "feed-1",
    author: {
      name: "Aditya Sharma",
      avatar: "https://i.pravatar.cc/150?img=11",
      profession: "Senior Software Engineer @ Google",
      verified: true,
      city: "Gachibowli, Hyderabad",
    },
    timeAgo: "25m ago",
    category: "room",
    tag: "#RoomHandover",
    content: "Hey folks! Moving to Bangalore next week for a new role. Our spacious, fully-furnished 2BHK flat in Cyber Towers Colony (Madhapur) is up for handover! Zero brokerage directly through Takevolet. High-speed fiber, geyser, AC in both rooms, and bachelor-friendly owner. Who wants to take over?",
    price: 18000,
    specs: ["2 BHK", "Fully Furnished", "2 Allowed", "Ready Nov 1"],
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop&q=80",
    ],
    whatsapp: "+919876543210",
    phone: "+91 98765 43210",
    likes: 42,
    commentsCount: 9,
  },
  {
    id: "feed-2",
    author: {
      name: "Sneha Reddy",
      avatar: "https://i.pravatar.cc/150?img=25",
      profession: "Product Designer @ Microsoft",
      verified: true,
      city: "Koramangala, Bangalore",
    },
    timeAgo: "1h ago",
    category: "flatmate",
    tag: "#FlatmateSearch",
    content: "Looking for a female flatmate to take a private master bedroom with attached washroom in a 3BHK high-rise gated society. Walking distance to Sony Signal & tech parks. Quiet, clean flat with modular kitchen, washing machine, and 24/7 security. DM or ping on WhatsApp!",
    price: 14500,
    specs: ["Private Bedroom", "Attached Bath", "Female Only", "Gated Society"],
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop&q=80",
      "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=1200&h=800&fit=crop&q=80",
    ],
    whatsapp: "+919876543211",
    phone: "+91 98765 43211",
    likes: 38,
    commentsCount: 14,
  },
  {
    id: "feed-3",
    author: {
      name: "Vikram Malhotra",
      avatar: "https://i.pravatar.cc/150?img=33",
      profession: "Financial Analyst @ Deloitte",
      verified: true,
      city: "Andheri East, Mumbai",
    },
    timeAgo: "3h ago",
    category: "room",
    tag: "#1RKStudio",
    content: "Cozy self-contained 1RK near Chakala Metro station. Ready to move immediately. No brokerage fees, deposit is only 1 month. Very safe neighbourhood with supermarkets and cafes downstairs. Direct handover from tenant!",
    price: 22000,
    specs: ["1 RK Studio", "Semi-Furnished", "Any Tenant", "Near Metro"],
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&h=800&fit=crop&q=80",
    ],
    whatsapp: "+919876543212",
    phone: "+91 98765 43212",
    likes: 56,
    commentsCount: 19,
  },
  {
    id: "feed-4",
    author: {
      name: "Takevolet Community Team",
      avatar: "https://i.pravatar.cc/150?img=60",
      profession: "Verified Official Platform",
      verified: true,
      city: "Pan-India Hub",
    },
    timeAgo: "5h ago",
    category: "community",
    tag: "#ZeroBrokerageTips",
    content: "📢 Tip for room seekers in Mumbai, Bangalore, Delhi & Hyderabad: Never pay token money to brokers! Takevolet verifies tenants and owners directly. Always check the property physically and confirm lock-in periods before paying any deposit. Have questions? Ask in the comments below! 👇",
    images: [],
    likes: 124,
    commentsCount: 31,
  },
];

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [activeFilter, setActiveFilter] = useState<"all" | "room" | "flatmate" | "community">("all");
  const [newPostText, setNewPostText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleLike = (postId: string) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const liked = !p.liked;
          return {
            ...p,
            liked,
            likes: liked ? p.likes + 1 : p.likes - 1,
          };
        }
        return p;
      })
    );
  };

  const handleShare = (post: Post) => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/feed/${post.id}` : "";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(post.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newEntry: Post = {
      id: `post-${Date.now()}`,
      author: {
        name: "You (Community Member)",
        avatar: "https://i.pravatar.cc/150?img=12",
        profession: "Active Renter",
        verified: true,
        city: "Hyderabad, IN",
      },
      timeAgo: "Just now",
      category: "community",
      tag: "#CommunityTalk",
      content: newPostText.trim(),
      images: [],
      likes: 1,
      commentsCount: 0,
      liked: true,
    };

    setPosts([newEntry, ...posts]);
    setNewPostText("");
  };

  const filteredPosts = posts.filter(p => {
    if (activeFilter === "all") return true;
    return p.category === activeFilter;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20">
      
      {/* ── TOP MOBILE APP BANNER ── */}
      <div className="bg-gradient-to-r from-[#7B3AEC] via-[#6366F1] to-[#4F46E5] text-white px-4 py-3 shadow-sm">
        <div className="container mx-auto max-w-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Smartphone size={18} />
            </div>
            <div className="text-xs sm:text-sm">
              <span className="font-bold block">Takevolet Social Feed</span>
              <span className="text-white/80 text-[11px] hidden sm:inline">Connect with 15,000+ bachelors &amp; owners across India</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://play.google.com/store/apps/details?id=com.takevolet.app"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-[#7B3AEC] hover:bg-slate-100 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download size={13} /> Get App
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 pt-6">
        
        {/* ── QUICK POST COMPOSER ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0">
              <img src="https://i.pravatar.cc/150?img=12" alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <input
              type="text"
              value={newPostText}
              onChange={e => setNewPostText(e.target.value)}
              placeholder="Leaving a room or looking for flatmates? Share with community..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#7B3AEC] focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <Link href="/post/room" className="text-slate-600 hover:text-[#7B3AEC] font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-purple-50 transition-colors">
                <Home size={14} className="text-[#7B3AEC]" /> Post Room
              </Link>
              <Link href="/post/flatmate" className="text-slate-600 hover:text-[#7B3AEC] font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-purple-50 transition-colors">
                <Users size={14} className="text-[#7B3AEC]" /> Find Flatmate
              </Link>
            </div>
            <button
              onClick={handleCreatePost}
              disabled={!newPostText.trim()}
              className="bg-[#7B3AEC] hover:bg-[#6D28D9] disabled:opacity-40 text-white font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
            >
              Post <Send size={12} />
            </button>
          </div>
        </div>

        {/* ── FILTER TABS ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {[
            { id: "all", label: "🔥 All Feed" },
            { id: "room", label: "🏠 Rooms & Flats" },
            { id: "flatmate", label: "🤝 Flatmates" },
            { id: "community", label: "💬 Community" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? "bg-[#7B3AEC] text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── FEED STREAM ── */}
        <div className="space-y-6">
          {filteredPosts.map(post => (
            <article
              key={post.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#7B3AEC] to-[#4F46E5] shrink-0">
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-full h-full rounded-full object-cover border border-white"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900">{post.author.name}</span>
                      {post.author.verified && (
                        <CheckCircle2 size={14} className="text-[#7B3AEC] fill-purple-50" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <span>{post.author.profession}</span>
                      <span>·</span>
                      <MapPin size={10} className="text-slate-400" />
                      <span>{post.author.city}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                    {post.tag}
                  </span>
                  <span className="text-xs text-slate-400">{post.timeAgo}</span>
                </div>
              </div>

              {/* Content Body */}
              <div className="px-4 pb-3">
                <p className="text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                  {post.content}
                </p>
              </div>

              {/* Price & Specs Badge */}
              {post.price && (
                <div className="mx-4 mb-3 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-500">Rent:</span>
                    <span className="text-base font-black text-[#7B3AEC]">
                      ₹{post.price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-slate-500 font-normal">/month</span>
                  </div>
                  {post.specs && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {post.specs.map((s, idx) => (
                        <span key={idx} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-slate-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Images Carousel / Grid */}
              {post.images.length > 0 && (
                <div className="border-y border-slate-100 bg-slate-900">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5 max-h-[420px] overflow-hidden">
                    {post.images.map((img, idx) => (
                      <div key={idx} className="relative h-64 md:h-72 bg-slate-900">
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons: Like, Comment, WhatsApp, Share */}
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                      post.liked ? "text-rose-600" : "hover:text-rose-600"
                    }`}
                  >
                    <Heart size={18} className={post.liked ? "fill-rose-600" : ""} />
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-bold hover:text-[#7B3AEC] transition-colors">
                    <MessageCircle size={18} />
                    <span>{post.commentsCount}</span>
                  </button>
                  <button
                    onClick={() => handleShare(post)}
                    className="flex items-center gap-1.5 text-xs font-bold hover:text-[#7B3AEC] transition-colors"
                  >
                    <Share2 size={16} />
                    <span>{copiedId === post.id ? "Link Copied!" : "Share"}</span>
                  </button>
                </div>

                {/* Direct WhatsApp / Connect */}
                {post.whatsapp ? (
                  <a
                    href={`https://wa.me/${post.whatsapp.replace(/[^0-9]/g, "")}?text=Hi%20${encodeURIComponent(post.author.name)},%20I%20saw%20your%20post%20on%20Takevolet!`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-all"
                  >
                    WhatsApp Poster
                  </a>
                ) : (
                  <Link
                    href="/rooms"
                    className="text-[#7B3AEC] hover:underline text-xs font-bold flex items-center gap-1"
                  >
                    View Details →
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
