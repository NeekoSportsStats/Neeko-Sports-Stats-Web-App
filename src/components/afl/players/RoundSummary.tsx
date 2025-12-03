// src/components/afl/players/RoundSummary.tsx
import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Flame,
  Zap,
  BarChart3,
  TrendingUp,
  Activity,
  Sparkles,
} from "lucide-react";

import {
  useAFLMockPlayers,
  getSeriesForStat,
  lastN,
  average,
  StatKey,
} from "@/components/afl/players/useAFLMockData";

/* -------------------------------------------------------
   STAT CONFIG
------------------------------------------------------- */

const STATS: StatKey[] = [
  "fantasy",
  "disposals",
  "kicks",
  "marks",
  "tackles",
  "hitouts",
  "goals",
];

const LABELS: Record<StatKey, string> = {
  fantasy: "Fantasy",
  disposals: "Disposals",
  kicks: "Kicks",
  marks: "Marks",
  tackles: "Tackles",
  hitouts: "Hitouts",
  goals: "Goals",
};

/* -------------------------------------------------------
   MINI SPARKLINE (Section 1 only)
------------------------------------------------------- */
function MiniSparkline({ data }: { data: number[] }) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const norm = data.map((v) => ((v - min) / (max - min || 1)) * 100);
  const width = Math.max(norm.length * 20, 60);

  return (
    <div className="relative h-10 w-full mt-2">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${width} 100`}
        preserveAspectRatio="none"
      >
        <polyline
          points={norm
            .map((v, i) => `${(i / (norm.length - 1)) * width},${100 - v}`)
            .join(" ")}
          fill="none"
          stroke="rgba(250,204,21,0.35)"
          strokeWidth={3}
        />
      </svg>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${width} 100`}
        preserveAspectRatio="none"
      >
        <polyline
          points={norm
            .map((v, i) => `${(i / (norm.length - 1)) * width},${100 - v}`)
            .join(" ")}
          fill="none"
          stroke="rgb(250,204,21)"
          strokeWidth={2}
        />
      </svg>
    </div>
  );
}

/* -------------------------------------------------------
   ROUND SUMMARY MAIN
------------------------------------------------------- */

export default function RoundSummary() {
  const players = useAFLMockPlayers();
  const [stat, setStat] = useState<StatKey>("fantasy");

  const statLabel = LABELS[stat];

  /* ---------------------- METRICS ---------------------- */
  const metrics = useMemo(() => {
    const all: {
      topScore: number;
      topPlayer: string;
      biggestRise: number;
      biggestRiser: string;
      mostConsistent: number;
      consistencyPlayer: string;
      sparkline: number[];
    } = {
      topScore: 0,
      topPlayer: "—",
      biggestRise: 0,
      biggestRiser: "—",
      mostConsistent: 0,
      consistencyPlayer: "—",
      sparkline: [],
    };

    // mock scoring
    players.forEach((p) => {
      const series = getSeriesForStat(p, stat);
      const last = series[series.length - 1] || 0;
      const prev = series[series.length - 2] || 0;

      // top score
      if (last > all.topScore) {
        all.topScore = last;
        all.topPlayer = p.name;
      }

      // biggest riser
      const diff = last - prev;
      if (diff > all.biggestRise) {
        all.biggestRise = diff;
        all.biggestRiser = p.name;
      }

      // consistency
      const base = average(series);
      const consistency =
        (series.filter((v) => v >= base).length / series.length) * 100;

      if (consistency > all.mostConsistent) {
        all.mostConsistent = consistency;
        all.consistencyPlayer = p.name;
      }
    });

    // league sparkline = average of all players for each round
    const spark: number[] = [];
    const roundsCount = players[0][stat].length;

    for (let r = 0; r < roundsCount; r++) {
      const avgRound =
        players.reduce((sum, p) => sum + p[stat][r], 0) / players.length;
      spark.push(avgRound);
    }

    all.sparkline = spark;

    return all;
  }, [players, stat]);

  /* -------------------------------------------------------
     UI RENDER
  ------------------------------------------------------- */

  return (
    <section
      id="round-summary"
      className={cn(
        "rounded-3xl border border-white/10",
        "bg-gradient-to-br from-[#080808] via-black to-[#111010]",
        "p-5 md:p-7 lg:p-8",
        "shadow-[0_0_60px_rgba(0,0,0,0.6)]"
      )}
    >
      {/* HEADER ROW (pill + title + description) */}
      <div className="space-y-1.5 mb-6 md:mb-8">
        {/* New pill — consistent with Form Stability Grid */}
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-black/70 px-3 py-1 text-xs text-yellow-200/90">
          <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
          <span className="uppercase tracking-[0.18em]">
            Round Momentum
          </span>
        </div>

        <h2 className="text-xl md:text-2xl font-semibold">
          Round Momentum Summary
        </h2>

        <p className="text-xs md:text-sm text-white/70">
          Round 6 • <span className="text-yellow-300">Fantasy Snapshot</span>
        </p>

        <p className="max-w-xl text-xs md:text-sm text-white/60">
          Live round snapshot — track fantasy trends, standout players and
          role/stability shifts as this stat moves week to week.
        </p>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-2 mb-6 md:mb-7">
        {STATS.map((s) => (
          <button
            key={s}
            onClick={() => setStat(s)}
            className={cn(
              "rounded-full px-3 py-1 text-xs border backdrop-blur-sm transition-all",
              stat === s
                ? "bg-yellow-400 text-black border-yellow-300 shadow-[0_0_18px_rgba(250,204,21,0.6)]"
                : "bg-white/5 text-white/70 border-white/15 hover:bg-white/10"
            )}
          >
            {LABELS[s]}
          </button>
        ))}
      </div>

      {/* GRID: Pulse + Headlines */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-5 mb-6 md:mb-8">
        {/* PULSE */}
        <div
          className={cn(
            "rounded-2xl border border-white/15 bg-black/40 p-4 md:p-5",
            "shadow-[0_0_25px_rgba(255,255,255,0.06)]"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-yellow-300" />
            <h3 className="text-sm font-semibold">Round Momentum Pulse</h3>
          </div>

          <p className="text-xs text-white/60 mb-3">
            League-wide {statLabel} trends reflect shifts driven by usage
            rates, matchup edges and evolving roles.
          </p>

          <MiniSparkline data={metrics.sparkline} />
        </div>

        {/* HEADLINES */}
        <div
          className={cn(
            "rounded-2xl border border-white/15 bg-black/40 p-4 md:p-5",
            "shadow-[0_0_25px_rgba(255,255,255,0.06)]"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-4 w-4 text-orange-300" />
            <h3 className="text-sm font-semibold">Key Headlines</h3>
          </div>

          <ul className="text-xs text-white/70 space-y-1.5">
            <li>
              • <span className="font-semibold">{metrics.topPlayer}</span> led
              this round with{" "}
              <span className="font-semibold">{metrics.topScore}</span>{" "}
              {statLabel.toLowerCase()}.
            </li>
            <li>
              • <span className="font-semibold">{metrics.biggestRiser}</span>{" "}
              climbed{" "}
              <span className="font-semibold">
                {metrics.biggestRise.toFixed(1)}
              </span>{" "}
              on last week.
            </li>
            <li>
              • <span className="font-semibold">{metrics.consistencyPlayer}</span>{" "}
              holds{" "}
              <span className="font-semibold">
                {metrics.mostConsistent.toFixed(0)}%
              </span>{" "}
              consistent games.
            </li>
            <li>
              • League-wide {statLabel.toLowerCase()} output shows meaningful
              stability + role changes.
            </li>
          </ul>
        </div>
      </div>

      {/* 3 MINI CARDS */}
      <div className="grid md:grid-cols-3 gap-4 md:gap-5">
        {/* Top Score */}
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 shadow-[0_0_22px_rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="h-4 w-4 text-yellow-300" />
            <span className="uppercase text-[11px] text-white/45 tracking-wide">
              Top Score
            </span>
          </div>
          <p className="text-lg font-semibold text-yellow-300">
            {metrics.topScore} {statLabel.toLowerCase()}
          </p>
          <p className="text-[11px] text-white/60">{metrics.topPlayer}</p>
        </div>

        {/* Biggest Riser */}
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 shadow-[0_0_22px_rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-yellow-300" />
            <span className="uppercase text-[11px] text-white/45 tracking-wide">
              Biggest Riser
            </span>
          </div>
          <p className="text-lg font-semibold text-yellow-300">
            {metrics.biggestRise.toFixed(1)} {statLabel.toLowerCase()}
          </p>
          <p className="text-[11px] text-white/60">{metrics.biggestRiser}</p>
        </div>

        {/* Most Consistent */}
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 shadow-[0_0_22px_rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-yellow-300" />
            <span className="uppercase text-[11px] text-white/45 tracking-wide">
              Most Consistent
            </span>
          </div>
          <p className="text-lg font-semibold text-yellow-300">
            {metrics.mostConsistent.toFixed(0)}%
          </p>
          <p className="text-[11px] text-white/60">
            {metrics.consistencyPlayer}
          </p>
        </div>
      </div>
    </section>
  );
}
