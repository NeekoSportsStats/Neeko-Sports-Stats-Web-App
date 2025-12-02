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

  /* ---------------------------------------------------
     FIGURE OUT CURRENT ROUND FROM MOCK DATA
  --------------------------------------------------- */
  const firstPlayer = players[0];
  const currentRound = firstPlayer
    ? getSeriesForStat(firstPlayer, "fantasy").length
    : 1;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 text-white space-y-12">

      {/* ============================================================
         PAGE HEADER WITH ROUND NUMBER
      ============================================================ */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-1">
          AFL Player Performance Dashboard — Round {currentRound}
        </h1>
        <p className="text-white/60 text-sm">
          Round momentum, trends, stability insights and player performance patterns.
        </p>
      </div>

      {/* ============================================================
         ⭐ SECTION 1 — ROUND SUMMARY (hero block)
      ============================================================ */}
      <div className="-mt-4">
        <RoundSummary
          selectedStat={selectedStat}
          onStatChange={(s) => setSelectedStat(s)}
        />
      </div>

      {/* ============================================================
         ⭐ FUTURE SECTIONS (to be added)
      ============================================================ */}

      {/* <HotColdSection selectedStat={selectedStat} /> */}
      {/* <MoversSection selectedStat={selectedStat} /> */}
      {/* <StabilityMeter players={players} selectedStat={selectedStat} /> */}
      {/* <TrendRadar players={players} stat={selectedStat} /> */}

      {/* Master table removed for now */}

    </div>
  );
}
