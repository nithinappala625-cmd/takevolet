"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ServiceDeepLinkRedirect({ params }: { params: { id: string } }) {
  const router = useRouter();

  useEffect(() => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isAndroid) {
      window.location.href = "https://play.google.com/store/apps/details?id=com.takevolet.app&pcampaignid=web_share";
    } else {
      router.push("/");
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-[#7B3AEC] mb-4">Takevolet</h1>
        <p className="text-gray-600 mb-8">
          This service is best viewed in the Takevolet mobile app.
        </p>
        <a 
          href="https://play.google.com/store/apps/details?id=com.takevolet.app"
          className="inline-block bg-[#7B3AEC] hover:bg-[#6D28D9] text-white font-bold py-3 px-8 rounded-lg transition-transform hover:scale-105 shadow-md shadow-purple-500/20"
        >
          Download for Android
        </a>
      </div>
    </div>
  );
}
