import React, { useState } from "react";
import RoundSummary from "@/components/afl/players/RoundSummary";
import { StatKey } from "@/components/afl/players/useAFLMockData";

const CURRENT_ROUND = 6;

export default function AFLPlayersPage() {
  const [selectedStat, setSelectedStat] =
    useState<StatKey>("fantasy");

  return (// src/pages/sports/afl/AFLPlayers.tsx
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
    <div className="mx-auto max-w-6xl px-4 pt-5 md:pt-8 pb-12 text-white space-y-8 md:space-y-12">

      {/* PAGE HEADER */}
      <header className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-4xl font-extrabold">
          AFL Player Performance Dashboard
        </h1>

        <p className="mt-2 max-w-2xl text-sm md:text-base text-white/60 leading-relaxed">
          League-wide momentum, fantasy analytics, player trends,
          stability insights and performance signals — all in one
          intelligent dashboard.
        </p>
      </header>

      {/* SECTION 1 */}
      <RoundSummary
        selectedStat={selectedStat}
        onStatChange={setSelectedStat}
        roundNumber={CURRENT_ROUND}
      />

    </div>
  );
}
