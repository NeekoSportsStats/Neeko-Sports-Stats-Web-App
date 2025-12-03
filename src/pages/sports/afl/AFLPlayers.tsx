// src/pages/sports/afl/AFLPlayers.tsx
import React from "react";
import RoundSummary from "@/components/afl/players/RoundSummary";

export default function AFLPlayersPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-white">
      {/* Page Header */}
      <header className="mb-7 md:mb-9">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          AFL Player Performance Dashboard
        </h1>
        <p className="mt-3 max-w-2xl text-sm md:text-[15px] text-white/70">
          League-wide momentum, fantasy analytics, player trends, stability
          insights and performance signals — all in one intelligent dashboard.
        </p>
      </header>

      {/* Page Sections */}
      <div className="space-y-8 md:space-y-10">
        {/* Section 1 — Round Summary */}
        <RoundSummary />

        {/* Future sections can be added below */}
        {/* <YourNextSection /> */}
      </div>
    </div>
  );
}