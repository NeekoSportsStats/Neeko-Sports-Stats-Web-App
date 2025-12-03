import React from "react";
import RoundSummary from "@/components/afl/players/RoundSummary";

export default function AFLPlayersPage() {
  return (
    <div className="w-full flex flex-col items-center">
      {/* PAGE CONTAINER */}
      <div className="w-full max-w-6xl px-4 md:px-6 py-10 space-y-12">

        {/* PAGE HEADER */}
        <header className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold">
            AFL Player Performance Dashboard
          </h1>

          <p className="text-white/60 max-w-3xl leading-relaxed text-base md:text-lg">
            League-wide momentum, fantasy analytics, player trends,
            stability insights and performance signals — all combined
            into one intelligent dashboard for AFL analysis.
          </p>
        </header>

        {/* SECTION 1 — ROUND SUMMARY (Premium Gold Hybrid) */}
        <RoundSummary />

        {/* ------------------------------------------------------------
            FUTURE SECTIONS GO HERE (when you approve next patches):
            ------------------------------------------------------------
            - Form Leaders (Hot List)
            - Risk Watchlist (Cold List)
            - Movers (Risers/Fallers)
            - Stability Meter
            - Position Trends
            - AI Insights
            - Master Table
          ------------------------------------------------------------ */}
        
      </div>
    </div>
  );
}