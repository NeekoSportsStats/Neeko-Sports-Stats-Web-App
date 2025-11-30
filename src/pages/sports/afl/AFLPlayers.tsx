import React, { useState, useMemo } from "react";
import PageHeaderHero from "@/components/afl/players/PageHeaderHero";
import PlayerStatLensHeader from "@/components/afl/players/PlayerStatLensHeader";
import HotColdSixGrid from "@/components/afl/players/HotColdSixGrid";
import MoversDualColumn from "@/components/afl/players/MoversDualColumn";
import StabilityMeterGrid from "@/components/afl/players/StabilityMeterGrid";
import MasterTableProShell from "@/components/afl/players/MasterTableProShell";
import MasterPlayerTable from "@/components/afl/players/MasterPlayerTable";
import {
  useAFLMockPlayers,
  getSeriesForStat,
  lastN,
  average,
  stdDev,
  stabilityMeta,
  TEAM_OPTIONS,
  POSITION_OPTIONS,
  ROUND_OPTIONS,
  YEARS,
  StatKey,
} from "@/components/afl/players/useAFLMockData";

// stubbed auth for now – replace with your real hook
function useAuth() {
  return { isPremium: false };
}

export default function AFLPlayersPage() {
  const { isPremium } = useAuth();
  const players = useAFLMockPlayers();

  const [selectedStat, setSelectedStat] =
    useState<StatKey>("fantasy");
  const [filters, setFilters] = useState({
    team: "All",
    pos: "All",
    round: "All",
  });
  const [year, setYear] = useState(YEARS[0]);

  const filteredPlayers = useMemo(
    () =>
      players.filter((p) => {
        if (filters.team !== "All" && p.team !== filters.team) return false;
        if (filters.pos !== "All" && p.pos !== filters.pos) return false;
        // round filter would be wired into real data later
        return true;
      }),
    [players, filters]
  );

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

  const statLensSeries = useMemo(() => {
    const rounds = [0, 0, 0, 0, 0, 0];
    players.forEach((p) => {
      const s = getSeriesForStat(p, selectedStat);
      s.forEach((v, i) => {
        if (rounds[i] !== undefined) rounds[i] += v;
      });
    });
    return rounds.map((v) =>
      players.length ? Math.round(v / players.length) : 0
    );
  }, [players, selectedStat]);

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

  const stability = playerStatData
    .map((p) => {
      const meta = stabilityMeta(p.vol);
      return {
        player: p.player,
        vol: p.vol,
        label: meta.label,
        reason: meta.reason,
      };
    })
    .sort((a, b) => a.vol - b.vol)
    .slice(0, 12);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-white">
      {/* Hero + stat pills + news ticker */}
      <PageHeaderHero
        selectedStat={selectedStat}
        onChangeStat={(v) => setSelectedStat(v as StatKey)}
        isPremium={isPremium}
      />

      {/* Global stat lens with sparkline */}
      <PlayerStatLensHeader
        value={selectedStat}
        onChange={(v) => setSelectedStat(v as StatKey)}
        avgSeries={statLensSeries}
        isPremium={isPremium}
      />

      {/* Hot / cold grid */}
      <HotColdSixGrid hot={hot} cold={cold} />

      {/* Movers section */}
      <MoversDualColumn risers={risers} fallers={fallers} />

      {/* Stability meter */}
      <StabilityMeterGrid items={stability} isPremium={isPremium} />

      {/* Master table shell */}
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

      {/* Master table anchor */}
      <MasterPlayerTable
        players={filteredPlayers}
        statKey={selectedStat}
        isPremium={isPremium}
      />
    </div>
  );
}
