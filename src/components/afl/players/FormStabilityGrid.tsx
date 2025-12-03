// src/components/afl/players/FormStabilityGrid.tsx
import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Flame,
  Shield,
  Snowflake,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import {
  useAFLMockPlayers,
  getSeriesForStat,
  average,
  StatKey,
} from "@/components/afl/players/useAFLMockData";

/* ---------------------------------------------------------
   CONSTANTS
--------------------------------------------------------- */

const CATEGORY_LIMIT = 5;

const STAT_LABELS: Record<StatKey, string> = {
  fantasy: "fantasy",
  disposals: "disposals",
  kicks: "kicks",
  marks: "marks",
  tackles: "tackles",
  hitouts: "hitouts",
  goals: "goals",
};

const CATEGORY_COLORS = {
  hot: "from-red-600/30 to-red-900/20 border-red-500/30",
  stable: "from-yellow-600/25 to-yellow-900/20 border-yellow-500/25",
  cool: "from-cyan-600/25 to-cyan-900/20 border-cyan-500/25",
};

/* ---------------------------------------------------------
   GENERATE PLAYER-SPECIFIC AI COMMENTARY
--------------------------------------------------------- */

function generatePlayerCommentary(player: any, stat: StatKey, delta: number) {
  const direction =
    delta > 0 ? "surging above" : delta < 0 ? "slipping below" : "aligning with";

  const abs = Math.abs(delta).toFixed(1);

  const trend =
    delta > 0
      ? "showing upward momentum driven by increased opportunity and stronger involvement."
      : delta < 0
      ? "indicating cooling form due to reduced impact or role variability."
      : "reflecting stable role expectation with minimal volatility.";

  return `${player.name} is ${direction} their L5 baseline (${abs} ${STAT_LABELS[stat]}), ${trend}`;
}

/* ---------------------------------------------------------
   PLAYER CARD
--------------------------------------------------------- */

function PlayerCard({
  player,
  stat,
  category,
}: {
  player: any;
  stat: StatKey;
  category: "hot" | "stable" | "cool";
}) {
  const [open, setOpen] = useState(false);

  const series = getSeriesForStat(player, stat);
  const last = series.at(-1) ?? 0;
  const baseline = average(series);
  const delta = last - baseline;

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 cursor-pointer transition-all",
        "hover:-translate-y-1 hover:shadow-xl backdrop-blur-sm",
        "bg-gradient-to-br",
        CATEGORY_COLORS[category]
      )}
      onClick={() => setOpen((p) => !p)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-[13px] font-medium opacity-80">
          {category === "hot"
            ? "Hot form"
            : category === "stable"
            ? "Stability"
            : "Cooling"}
        </p>

        {open ? (
          <ChevronUp className="w-4 h-4 opacity-70" />
        ) : (
          <ChevronDown className="w-4 h-4 opacity-70" />
        )}
      </div>

      {/* Player */}
      <div className="text-left">
        <p className="text-lg font-semibold">{last} {STAT_LABELS[stat]}</p>
        <p className={cn("text-sm mt-1", delta >= 0 ? "text-green-400" : "text-red-400")}>
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)} vs avg
        </p>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="mt-3 border-t border-white/10 pt-3 animate-in fade-in slide-in-from-top-1">
          <p className="text-sm text-white/70 leading-relaxed">
            {generatePlayerCommentary(player, stat, delta)}
          </p>

          {/* Sparkline */}
          <div className="h-16 w-full mt-3 relative">
            <svg viewBox="0 0 100 40" className="absolute inset-0 w-full h-full">
              <polyline
                fill="none"
                stroke="rgba(250,204,21,0.3)"
                strokeWidth={3}
                points={series
                  .map((v, i) => `${(i / (series.length - 1)) * 100},${40 - (v / Math.max(...series)) * 40}`)
                  .join(" ")}
              />
              <polyline
                fill="none"
                stroke="rgba(250,204,21,1)"
                strokeWidth={2}
                points={series
                  .map((v, i) => `${(i / (series.length - 1)) * 100},${40 - (v / Math.max(...series)) * 40}`)
                  .join(" ")}
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   MAIN SECTION
--------------------------------------------------------- */

export default function FormStabilityGrid() {
  const players = useAFLMockPlayers();
  const [selectedStat, setSelectedStat] = useState<StatKey>("fantasy");

  /* Compute L5 metrics for each category */
  const categories = useMemo(() => {
    const list = players.map((p) => {
      const s = getSeriesForStat(p, selectedStat);
      const last = s.at(-1) ?? 0;
      const baseline = average(s);
      const diff = last - baseline;
      return { ...p, last, diff };
    });

    return {
      hot: [...list].sort((a, b) => b.diff - a.diff).slice(0, CATEGORY_LIMIT),
      stable: [...list]
        .sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff))
        .slice(0, CATEGORY_LIMIT),
      cool: [...list].sort((a, b) => a.diff - b.diff).slice(0, CATEGORY_LIMIT),
    };
  }, [players, selectedStat]);

  return (
    <section className="rounded-3xl border border-white/10 bg-black/40 p-6 md:p-8 backdrop-blur-sm mt-12">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex px-4 py-1.5 rounded-full border border-yellow-500/40 bg-yellow-500/10 text-yellow-300 text-xs font-semibold tracking-wide">
          ★ FORM STABILITY GRID
        </div>

        <h2 className="mt-4 text-2xl md:text-3xl font-bold">
          Hot risers, rock-solid anchors & form slumps
        </h2>

        <p className="mt-2 text-sm text-white/70 max-w-2xl">
          Last 5 rounds of <span className="text-yellow-300">{STAT_LABELS[selectedStat]}</span> —
          split into surges, stability leaders, and cooling risks.
        </p>

        {/* Filters */}
        <div className="mt-4 flex gap-2 flex-wrap">
          {Object.keys(STAT_LABELS).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedStat(key as StatKey)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm border transition-all",
                selectedStat === key
                  ? "bg-yellow-300 text-black border-yellow-300 shadow-[0_0_22px_rgba(250,204,21,0.6)]"
                  : "bg-black/30 text-white/70 border-white/10 hover:bg-black/50"
              )}
            >
              {STAT_LABELS[key as StatKey]}
            </button>
          ))}
        </div>
      </div>

      {/* Columns */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Hot */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold">Hot form surge</h3>
          </div>
          <div className="space-y-4">
            {categories.hot.map((p) => (
              <PlayerCard key={p.name} player={p} stat={selectedStat} category="hot" />
            ))}
          </div>
        </div>

        {/* Stability */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-yellow-300" />
            <h3 className="font-semibold">Stability leaders</h3>
          </div>
          <div className="space-y-4">
            {categories.stable.map((p) => (
              <PlayerCard key={p.name} player={p} stat={selectedStat} category="stable" />
            ))}
          </div>
        </div>

        {/* Cooling */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Snowflake className="w-5 h-5 text-cyan-300" />
            <h3 className="font-semibold">Cooling risks</h3>
          </div>
          <div className="space-y-4">
            {categories.cool.map((p) => (
              <PlayerCard key={p.name} player={p} stat={selectedStat} category="cool" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
