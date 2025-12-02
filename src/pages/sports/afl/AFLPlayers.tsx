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

// Temporary stub – swap for your real auth hook later
function useAuth() {
  return { isPremium: false };
}

type SectionShellProps = {
  title: string;
  emoji?: string;
  subtitle?: string;
  children: React.ReactNode;
};

function SectionShell({ title, emoji, subtitle, children }: SectionShellProps) {
  return (
    <section
      className="
        group relative overflow-hidden rounded-2xl border border-white/5
        bg-gradient-to-b from-slate-900/70 via-slate-950/80 to-black/90
        p-5 md:p-6 shadow-lg shadow-black/40
        transition-transform duration-300 ease-out
        hover:-translate-y-1 hover:shadow-2xl
        animate-in fade-in slide-in-from-bottom-2
      "
    >
      {/* subtle top highlight bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

      <header className="mb-4 flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            {emoji && <span className="text-lg">{emoji}</span>}
            <span>{title}</span>
          </h2>
          {subtitle && (
            <p className="text-sm text-white/60 max-w-2xl">{subtitle}</p>
          )}
        </div>
      </header>

      <div className="mt-2">{children}</div>
    </section>
  );
}

export default function AFLPlayersPage() {
  const { isPremium } = useAuth();
  const players = useAFLMockPlayers();

  const [selectedStat, setSelectedStat] = useState<StatKey>("fantasy");
  const [filters, setFilters] = useState({ team: "All", pos: "All" });

  // 🔵 Filter players
  const filteredPlayers = useMemo(
    () =>
      players.filter((p) => {
        if (filters.team !== "All" && p.team !== filters.team) return false;
        if (filters.pos !== "All" && p.pos !== filters.pos) return false;
        return true;
      }),
    [players, filters]
  );

  // 🔵 Build stat data per player
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

  // 🔥 Hot (top 6 avg last 5)
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

  // ❄️ Cold (bottom 6)
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

  // 📈 Movers
  const moversBase = playerStatData
    .map((p) => {
      if (p.series.length < 5) return null;
      const diff = p.series.at(-1)! - average(p.series.slice(-5, -1));
      return { ...p, diff };
    })
    .filter(Boolean) as (typeof playerStatData[number] & { diff: number })[];

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

  // 🛡 Stability (lowest volatility first)
  const stability = playerStatData
    .map((p) => ({
      player: p.player,
      vol: p.vol,
      ...stabilityMeta(p.vol),
    }))
    .sort((a, b) => a.vol - b.vol)
    .slice(0, 12);

  return (
    <div
      className="
        max-w-6xl mx-auto px-4 py-10 text-white space-y-16
        relative
      "
    >
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-slate-950 via-slate-950 to-black" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-emerald-500/15 via-transparent to-transparent blur-3xl" />

      {/* 🟣 Round AI Summary – hero stays standalone */}
      <RoundSummary />

      {/* 🔥 HOT & COLD */}
      <SectionShell
        title="Form Leaders"
        emoji="🔥"
        subtitle="Players trending hottest and coldest based on their 5-round form."
      >
        <HotColdSixGrid hot={hot} cold={cold} />
      </SectionShell>

      {/* 📈 MOVERS */}
      <SectionShell
        title="Player Movement"
        emoji="📈"
        subtitle="Short-term risers and fallers based on last-round performance delta."
      >
        <MoversDualColumn risers={risers} fallers={fallers} />
      </SectionShell>

      {/* 🛡 STABILITY */}
      <SectionShell
        title="Stability Meter"
        emoji="🛡"
        subtitle="Low-volatility, reliable scorers with strong consistency profiles."
      >
        <StabilityMeterGrid items={stability} isPremium={isPremium} />
      </SectionShell>

      {/* 📊 MASTER TABLE */}
      <SectionShell
        title="Full Player Table"
        emoji="📊"
        subtitle="All players with filters and detailed fantasy metrics."
      >
        <MasterPlayerTable
          players={filteredPlayers}
          statKey={selectedStat}
          isPremium={isPremium}
        />
      </SectionShell>
    </div>
  );
}
