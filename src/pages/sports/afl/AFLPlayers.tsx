import React, { useState } from "react";
import RoundSummary from "@/components/afl/players/RoundSummary";
import { StatKey } from "@/components/afl/players/useAFLMockData";

/* -----------------------------------------------------------
   AFL Players Page (Fresh, Clean Version)
   - Section 1 only (Round Summary)
   - Other sections will be added later
----------------------------------------------------------- */

export default function AFLPlayersPage() {
  // Controls the active stat across the whole page
  const [selectedStat, setSelectedStat] = useState<StatKey>("fantasy");

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 text-white space-y-10">

      {/* -----------------------------------------------------------
         PAGE HEADER (Not round-specific)
      ----------------------------------------------------------- */}
      <header className="mb-2">
        <h1 className="text-3xl md:text-4xl font-extrabold">
          AFL Player Performance Dashboard
        </h1>
        <p className="text-white/60 text-sm mt-2 max-w-2xl leading-relaxed">
          League-wide momentum, fantasy analytics, player trends, stability
          insights and performance signals — all in one intelligent dashboard.
        </p>
      </header>

      {/* -----------------------------------------------------------
         SECTION 1: Round Summary (Gold Premium Theme)
      ----------------------------------------------------------- */}
      <RoundSummary
        selectedStat={selectedStat}
        onStatChange={(s) => setSelectedStat(s)}
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