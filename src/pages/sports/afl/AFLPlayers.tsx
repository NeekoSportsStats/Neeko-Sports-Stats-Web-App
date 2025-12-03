// src/pages/sports/afl/AFLPlayers.tsx
import React from "react";
import RoundSummary from "@/components/afl/players/RoundSummary";

export default function AFLPlayersPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 text-white space-y-10">

      {/* PAGE HEADER (about the dashboard, not the round) */}
      <header className="mb-6">
        <h1 className="text-4xl font-bold leading-tight mb-3">
          AFL Player Performance Dashboard
        </h1>

        <p className="text-white/60 max-w-2xl text-base leading-relaxed">
          League-wide momentum, fantasy analytics, player trends, stability scores
          and performance insights — all in one intelligent dashboard.
        </p>
      </header>

      {/* SECTION 1 — Round Summary (Neon Gold) */}
      <RoundSummary />

      {/* ⭐ NEXT SECTIONS WILL GO HERE */}
      {/* Section 2: Hot/Cold */}
      {/* Section 3: Movers */}
      {/* Section 4: Stability Meter */}
      {/* Section 5: AI Signals */}
      {/* Section 6: Master Table */}
    </div>
  );
}