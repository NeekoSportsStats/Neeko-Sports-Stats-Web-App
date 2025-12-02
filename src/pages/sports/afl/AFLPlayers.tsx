// src/pages/sports/afl/AFLPlayers.tsx

import React, { useState, useMemo } from "react";

import RoundSummary from "@/components/afl/players/RoundSummary";
import HotColdSixGrid from "@/components/afl/players/HotColdSixGrid";
import MoversDualColumn from "@/components/afl/players/MoversDualColumn";
import StabilityMeterGrid from "@/components/afl/players/StabilityMeterGrid";
import MasterPlayerTable from "@/components/afl/players/MasterPlayerTable";

import {
  useAFLMockPlayers,
  getSeriesForStat,
  lastN,
  average,
  stdDev,
  stabilityMeta,
  StatKey,
} from "@/components/afl/players/useAFLMockData";

// replace with your real auth later
function useAuth() {
  return { isPremium: false };
}

export default function AFLPlayersPage() {
  const { isPremium } = useAuth();
  const players = useAFLMockPlayers();

  const [selectedStat, setSelectedStat] = useState<StatKey>("fantasy");
  const [filters, setFilters] = useState({
    team: "All",
    pos: "All",
  });

  /* -------------------------------------------------
     FILTERED PLAYER LIST
  ------------------------------------------------- */
  const filteredPlayers = useMemo(
    () =>
      players.filter((p) => {
        if (filters.team !== "All" && p.team !== filters.team) return false;
        if (filters.pos !== "All" && p.pos !== filters.pos) return false;
        return true;
      }),
    [players, filters]
  );

  /* -------------------------------------------------
     PER-PLAYER STAT OBJECTS
  ------------------------------------------------- */
  const playerStatData = useMemo(
    () =>
      players.map((p) => {
        const series = getSeriesForStat(p, selectedStat);
        const l5 = lastN(series, 5);
        const avgL5 = average(l5);
        const vol = stdDev(l5);

        const baseline = average(series) || 1;
        const consistency =
          (series.filter((v) => v >= baseline).length / series.length) * 100;

        return { player: p, series, l5, avgL5, vol, consistency };
      }),
    [players, selectedStat]
  );

  /* -------------------------------------------------
     HOT / COLD
  ------------------------------------------------- */
  const hot = [...playerStatData]
    .sort((a, b) => b.avgL5 - a.avgL5)
    .slice(0, 6)
    .map((row) => ({
      player: row.player,
      series: row.series,
      avg: row.avgL5,
      vol: row.vol,
      consistency: row.consistency,
    }));

  const cold = [...playerStatData]
    .sort((a, b) => a.avgL5 - b.avgL5)
    .slice(0, 6)
    .map((row) => ({
      player: row.player,
      series: row.series,
      avg: row.avgL5,
      vol: row.vol,
      consistency: row.consistency,
    }));

  /* -------------------------------------------------
     MOVERS
  ------------------------------------------------- */
  const moversBase = playerStatData
    .map((p) => {
      if (p.series.length < 5) return null;
      const diff =
        p.series.at(-1)! - average(p.series.slice(-5, -1));
      return { ...p, diff };
    })
    .filter(Boolean) as (typeof playerStatData[number] & {
    diff: number;
  })[];

  const risers = moversBase
    .filter((m) => m.diff > 0)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 6)
    .map((row) => ({
      player: row.player,
      series: row.series,
      avg: row.avgL5,
      vol: row.vol,
      consistency: row.consistency,
    }));

  const fallers = moversBase
    .filter((m) => m.diff < 0)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 6)
    .map((row) => ({
      player: row.player,
      series: row.series,
      avg: row.avgL5,
      vol: row.vol,
      consistency: row.consistency,
    }));

  /* -------------------------------------------------
     STABILITY
  ------------------------------------------------- */
  const stability = playerStatData
    .map((p) => ({
      player: p.player,
      vol: p.vol,
      ...stabilityMeta(p.vol),
    }))
    .sort((a, b) => a.vol - b.vol)
    .slice(0, 12);

  /* -------------------------------------------------
     PAGE RENDER
  ------------------------------------------------- */
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 text-white space-y-16">

      {/* SECTION 1 — Round Summary */}
      <RoundSummary />

      {/* HOT / COLD */}
      <section className="space-y-2">
        <HotColdSixGrid hot={hot} cold={cold} />
      </section>

      {/* MOVERS */}
      <section className="space-y-2">
        <MoversDualColumn risers={risers} fallers={fallers} />
      </section>

      {/* STABILITY */}
      <section className="space-y-2">
        <StabilityMeterGrid items={stability} isPremium={isPremium} />
      </section>

      {/* MASTER TABLE */}
      <section className="space-y-4">
        <MasterPlayerTable
          players={filteredPlayers}
          statKey={selectedStat}
          isPremium={isPremium}
        />
      </section>
    </div>
  );
}
