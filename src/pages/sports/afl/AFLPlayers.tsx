import React, { useState } from "react";
import RoundSummary from "@/components/afl/players/RoundSummary";
import { StatKey } from "@/components/afl/players/useAFLMockData";

/* -----------------------------------------------------------
   AFL Players Page (Fresh, Clean Version)
   - Section 1 only (Round Summary)
   - Other sections will be added later
----------------------------------------------------------- */

const CURRENT_ROUND = 6;

export default function AFLPlayersPage() {
  // Controls the active stat across the whole page
  const [selectedStat, setSelectedStat] = useState<StatKey>("fantasy");

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-10 text-white space-y-8 md:space-y-10">
      {/* -----------------------------------------------------------
         PAGE HEADER (Not round-specific)
      ----------------------------------------------------------- */}
      <header className="mb-4 md:mb-6">
        <h1 className="text-2xl font-extrabold md:text-4xl">
          AFL Player Performance Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60 md:text-base">
          League-wide momentum, fantasy analytics, player trends, stability
          insights and performance signals — all in one intelligent dashboard.
        </p>
      </header>

      {/* -----------------------------------------------------------
         SECTION 1: Round Summary (Gold Premium Theme)
      ----------------------------------------------------------- */}
      <RoundSummary
        selectedStat={selectedStat}
        onStatChange={setSelectedStat}
        roundNumber={CURRENT_ROUND}
      />

      {/* -----------------------------------------------------------
         FUTURE SECTIONS (placeholders)
         — We'll build these one-by-one after Round Summary.
      ----------------------------------------------------------- */}

      {/*
      <PlayerTrends selectedStat={selectedStat} />
      <HotColdGrid selectedStat={selectedStat} />
      <MoversSection selectedStat={selectedStat} />
      <StabilityInsights selectedStat={selectedStat} />
      <MasterTable selectedStat={selectedStat} />
      */}
    </div>
  );
}
