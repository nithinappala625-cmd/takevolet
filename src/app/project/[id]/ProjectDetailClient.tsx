"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Smartphone, Download, MapPin, Building, ArrowLeft } from "lucide-react";

export default function ProjectDetailClient({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const deepLink = `takevolet://project/${projectId}`;
  const playStoreLink = "https://play.google.com/store/apps/details?id=com.takevolet.app";

  useEffect(() => {
    async function loadProject() {
      if (!projectId) return;
      try {
        const { data } = await supabase
          .from("top_projects")
          .select("*")
          .eq("id", projectId)
          .maybeSingle();
        if (data) setProject(data);
      } catch (_) {}
      setLoading(false);
    }
    loadProject();
  }, [projectId]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky App Banner */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-[#7B3AEC] to-[#6D28D9] text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs md:text-sm">
        <div className="flex items-center gap-2 font-medium">
          <Smartphone size={18} className="shrink-0" />
          <span>Viewing on Web. Want the full experience?</span>
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

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#7B3AEC] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">Loading project...</p>
          </div>
        ) : !project ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100 max-w-md mx-auto my-12">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Project Found in App</h2>
            <p className="text-sm text-slate-600 mb-6">
              This project is available in the Takevolet mobile application.
            </p>
            <a
              href={deepLink}
              className="inline-block w-full bg-[#7B3AEC] hover:bg-[#6D28D9] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md"
            >
              Open in Takevolet App
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cover Image */}
            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-200 shadow-md">
              {project.cover_image ? (
                <img
                  src={project.cover_image}
                  alt={project.project_name || "Project"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Building size={64} />
                </div>
              )}
              <div className="absolute top-4 left-4">
                <span className="bg-[#7B3AEC] text-white text-xs font-black uppercase px-3 py-1.5 rounded-lg tracking-wider shadow">
                  TOP PROJECT
                </span>
              </div>
            </div>

            {/* Header Details */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                    {project.project_name || "Premium Project"}
                  </h1>
                  <p className="text-slate-600 font-medium text-sm flex items-center gap-1.5 mt-1">
                    <Building size={14} className="text-[#7B3AEC]" />
                    <span>by {project.developer_name || "Verified Builder"}</span>
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Starting At</span>
                  <span className="text-2xl sm:text-3xl font-black text-[#7B3AEC]">
                    ₹{project.starting_price || "--"}
                  </span>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-slate-600 text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                <MapPin size={16} className="text-red-500 shrink-0" />
                <span>{[project.locality, project.city, project.state].filter(Boolean).join(", ") || "Prime Location"}</span>
              </div>

              {/* Status / Possession */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {project.project_type && (
                  <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">Type</span>
                    <span className="text-sm font-bold text-slate-800">{project.project_type}</span>
                  </div>
                )}
                {project.project_status && (
                  <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">Status</span>
                    <span className="text-sm font-bold text-slate-800">{project.project_status}</span>
                  </div>
                )}
                {project.possession_date && (
                  <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">Possession</span>
                    <span className="text-sm font-bold text-slate-800">{project.possession_date}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {project.description && (
                <div className="pt-2">
                  <h3 className="text-base font-bold text-slate-900 mb-2">About Project</h3>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                    {project.description}
                  </p>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-4">
                <a
                  href={deepLink}
                  className="w-full flex items-center justify-center gap-2 bg-[#7B3AEC] hover:bg-[#6D28D9] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-95"
                >
                  <Smartphone size={18} />
                  <span>Open & Contact Builder in Takevolet App</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
