"use client";
import React from "react";
import dynamic from "next/dynamic";

const HandTracking = dynamic(() => import("@/components/HandTracking"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-white font-mono text-sm animate-pulse uppercase tracking-[0.3em]">
        Loading System...
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black selection:bg-blue-500/30">
      <HandTracking />
    </main>
  );
}
