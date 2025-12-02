// src/pages/sports/afl/AFLPlayers.tsx

import React, { useState, useMemo } from "react";

import RoundSummary from "@/components/afl/players/RoundSummary";

import MasterPlayerTable from "@/components/afl/players/MasterPlayerTable";
import MasterTableProShell from "@/components/afl/players/MasterTableProShell";

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
     GLOBAL STAT — drives Section 1 + later sections
  --------------------------------------------------- */
  const [selectedStat, setSelectedStat] =
    useState<StatKey>("fantasy");

  /* ---------------------------------------------------
     FILTERS (team, pos, round)
  --------------------------------------------------- */
  const [filters, setFilters] = useState({
    team: "All",
    pos: "All",
    round: "All",
  });

  const [year, setYear] = useState(YEARS[0]);

  /* ---------------------------------------------------
     FILTERED PLAYERS
  --------------------------------------------------- */
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      if (filters.team !== "All" && p.team !== filters.team)
        return false;
      if (filters.pos !== "All" && p.pos !== filters.pos)
        return false;
      // Round filter can hook into real round-by-round data later
      return true;
    });
  }, [players, filters]);

  /* ---------------------------------------------------
     MASTER TABLE STAT CALCS
  --------------------------------------------------- */
  const playerStatData = useMemo(() => {
    return players.map((p) => {
      const series = getSeriesForStat(p, selectedStat);
      const l5 = lastN(series, 5);
      const avgL5 = average(l5);
      const vol = stdDev(l5);
      const baseAvg = average(series) || 1;

      const consistency =
        (series.filter((v) => v >= baseAvg).length /
          series.length) *
        100;

      return {
        player: p,
        series,
        l5,
        avgL5,
        vol,
        consistency,
      };
    });
  }, [players, selectedStat]);

  /* ---------------------------------------------------
     PAGE RENDER
  --------------------------------------------------- */
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 text-white space-y-12">

      {/********************************************************************
       ⭐ SECTION 1 — ROUND SUMMARY (premium glow, animated)
       *********************************************************************/}
      <RoundSummary
        selectedStat={selectedStat}
        onStatChange={(s) => setSelectedStat(s)}
      />


      {/********************************************************************
       ⭐ FUTURE SECTIONS (Hot/Cold, Movers, Stability, AI Signals…)
       We will reintroduce these after polishing Section 1.
       *********************************************************************/}


      {/********************************************************************
       ⭐ SECTION 6 — MASTER TABLE (unchanged)
       *********************************************************************/}
      <MasterTableProShell
        teamList={TEAM_OPTIONS}
        posList={POSITION_OPTIONS}
        roundList={ROUND_OPTIONS}
        values={filters}
        onFilterChange={(v) =>
          setFilters((prev) => ({ ...prev, ...v }))
        }
        selectedStat={selectedStat}
        onStatChange={(v) => setSelectedStat(v as StatKey)}
        selectedYear={year}
        onYearChange={setYear}
        totalPlayers={players.length}
        showingPlayers={filteredPlayers.length}
        isPremium={isPremium}
      />

      <MasterPlayerTable
        players={filteredPlayers}
        statKey={selectedStat}
        isPremium={isPremium}
      />

    </div>
  );
}
