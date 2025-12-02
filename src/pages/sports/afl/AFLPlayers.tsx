// src/pages/sports/afl/AFLPlayers.tsx

import React, { useState, useMemo } from "react";

import RoundSummary from "@/components/afl/players/RoundSummary";

import {
  useAFLMockPlayers,
  getSeriesForStat,
  lastN,
  average,
  stdDev,
  TEAM_OPTIONS,
  POSITION_OPTIONS,
  ROUND_OPTIONS,
  YEARS,
  StatKey,
} from "@/components/afl/players/useAFLMockData";

// Temporary auth stub
function useAuth() {
  return { isPremium: false };
}

export default function AFLPlayersPage() {
  const { isPremium } = useAuth();
  const players = useAFLMockPlayers();

  /* ---------------------------------------------------
     GLOBAL STAT — drives Section 1 + future sections
  --------------------------------------------------- */
  const [selectedStat, setSelectedStat] =
    useState<StatKey>("fantasy");

  /* ---------------------------------------------------
     FILTERS (team, pos, round) — unused for now
  --------------------------------------------------- */
  const [filters, setFilters] = useState({
    team: "All",
    pos: "All",
    round: "All",
  });

  const [year, setYear] = useState(YEARS[0]);

  /* ---------------------------------------------------
     FILTERED PLAYERS (kept for future sections)
  --------------------------------------------------- */
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      if (filters.team !== "All" && p.team !== filters.team)
        return false;
      if (filters.pos !== "All" && p.pos !== filters.pos)
        return false;
      return true;
    });
  }, [players, filters]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 text-white space-y-12">

      {/* ============================================================
         PAGE HEADER (KEPT VERY NEUTRAL)
         ============================================================ */}
      <div className="mb-4">
        <h1 className="text-4xl font-bold mb-2">AFL Player Performance Dashboard</h1>
        <p className="text-white/60 text-sm">
          Round momentum, trends, stability insights and player performance patterns.
        </p>
      </div>

      {/* ============================================================
         ⭐ SECTION 1 — ROUND SUMMARY (premium glow, animated)
         ============================================================ */}
      <RoundSummary
        selectedStat={selectedStat}
        onStatChange={(s) => setSelectedStat(s)}
      />

      {/* ============================================================
         ⭐ FUTURE SECTIONS GO HERE
         Hot/Cold • Movers • Stability Meter • Trend Radar • Role Shifts
         ============================================================ */}

      {/* <HotColdSection selectedStat={selectedStat} /> */}
      {/* <MoversSection selectedStat={selectedStat} /> */}
      {/* <StabilityMeter players={players} selectedStat={selectedStat} /> */}
      {/* <TrendRadar players={players} stat={selectedStat} /> */}

      {/* ============================================================
         ❌ MASTER TABLE REMOVED FOR NOW
         (will re-add after we finish the full Round Summary stack)
         ============================================================ */}

    </div>
  );
}
