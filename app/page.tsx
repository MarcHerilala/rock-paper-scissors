"use client";
import React from "react";

import HandTracking from "@/components/HandTracking";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black selection:bg-blue-500/30">
      <HandTracking />
    </main>
  );
}
