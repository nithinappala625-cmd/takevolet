"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Smartphone, Download, ArrowLeft } from "lucide-react";

export default function FeedDetailClient({ postId }: { postId: string }) {
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const deepLink = `takevolet://feed/${postId}`;
  const playStoreLink = "https://play.google.com/store/apps/details?id=com.takevolet.app";

  useEffect(() => {
    async function loadPost() {
      if (!postId) return;
      try {
        const { data } = await supabase
          .from("social_posts")
          .select("*, profiles:user_id(full_name, avatar_url)")
          .eq("id", postId)
          .maybeSingle();
        if (data) setPost(data);
      } catch (_) {}
      setLoading(false);
    }
    loadPost();
  }, [postId]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky App Banner */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-[#7B3AEC] to-[#6D28D9] text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs md:text-sm">
        <div className="flex items-center gap-2 font-medium">
          <Smartphone size={18} className="shrink-0" />
          <span>Viewing Community on Web. Want to join the conversation?</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={deepLink}
            className="bg-white text-[#7B3AEC] hover:bg-white/90 font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all text-xs"
          >
            Open in App
          </a>
          <a
            href={playStoreLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white font-medium px-3 py-1.5 rounded-lg transition-all text-xs"
          >
            <Download size={14} /> Get App
          </a>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-xl">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#7B3AEC] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">Loading post...</p>
          </div>
        ) : !post ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100 max-w-md mx-auto my-12">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Post on Takevolet</h2>
            <p className="text-sm text-slate-600 mb-6">
              View this post and join the discussion in the Takevolet mobile app.
            </p>
            <a
              href={deepLink}
              className="inline-block w-full bg-[#7B3AEC] hover:bg-[#6D28D9] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md"
            >
              Open in Takevolet App
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
            {/* User header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-purple-100 text-[#7B3AEC] font-bold flex items-center justify-center overflow-hidden shrink-0">
                {post.profiles?.avatar_url ? (
                  <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{post.profiles?.full_name?.[0]?.toUpperCase() || "U"}</span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{post.profiles?.full_name || "Community Member"}</h3>
                <span className="text-xs text-slate-400">Takevolet Community</span>
              </div>
            </div>

            {/* Post content */}
            <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-line">
              {post.content}
            </p>

            {/* Image if any */}
            {post.image_url && (
              <div className="rounded-xl overflow-hidden bg-slate-100 max-h-96">
                <img src={post.image_url} alt="Post attachment" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Open in app callout */}
            <div className="pt-4 border-t border-slate-100">
              <a
                href={deepLink}
                className="w-full flex items-center justify-center gap-2 bg-[#7B3AEC] hover:bg-[#6D28D9] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-95 text-sm"
              >
                <Smartphone size={18} />
                <span>Like, Comment & Reply in App</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
