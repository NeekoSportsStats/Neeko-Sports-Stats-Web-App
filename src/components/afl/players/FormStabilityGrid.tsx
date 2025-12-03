// src/components/afl/players/FormStabilityGrid.tsx
import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Flame, Shield, Snowflake, ChevronDown } from "lucide-react";
import {
  useAFLMockPlayers,
  getSeriesForStat,
  average,
  StatKey,
  Player,
} from "@/components/afl/players/useAFLMockData";

/* ---------------------------------------------------------
   CONFIG
--------------------------------------------------------- */

const STATS: StatKey[] = [
  "fantasy",
  "disposals",
  "kicks",
  "marks",
  "tackles",
  "hitouts",
  "goals",
];

const STAT_LABELS: Record<StatKey, string> = {
  fantasy: "Fantasy",
  disposals: "Disposals",
  kicks: "Kicks",
  marks: "Marks",
  tackles: "Tackles",
  hitouts: "Hitouts",
  goals: "Goals",
};

/* ---------------------------------------------------------
   AI Summaries — Player-specific
--------------------------------------------------------- */

function aiSummaryHot(player: Player, series: number[]) {
  const last = series.at(-1) ?? 0;
  const avg = average(series);
  const delta = last - avg;

  return `${player.name} is showing a strong surge with recent output sitting ${
    delta > 0 ? "+" + delta.toFixed(1) : delta.toFixed(1)
  } vs their L5 baseline — highlighting increased opportunity, role usage and strong form momentum.`;
}

function aiSummaryStable(player: Player, series: number[]) {
  const avg = average(series) || 1;
  const consistency =
    (series.filter((v) => v >= avg).length / Math.max(series.length, 1)) * 100;

  return `${player.name} is delivering one of the most predictable scoring profiles this season, holding a steady ${consistency.toFixed(
    0
  )}% consistency vs their L5 baseline — signalling a reliable, low-volatility role.`;
}

function aiSummaryCooling(player: Player, series: number[]) {
  const last = series.at(-1) ?? 0;
  const avg = average(series);
  const delta = last - avg;

  return `${player.name} is trending ${
    delta < 0 ? "below" : "near"
  } expectations with a ${delta.toFixed(
    1
  )} shift vs their L5 baseline — suggesting reduced opportunity, matchup difficulty or emerging role instability.`;
}

/* ---------------------------------------------------------
   Sparkline
--------------------------------------------------------- */

function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const normalized = data.map((v) => ((v - min) / (max - min || 1)) * 100);
  const width = Math.max(normalized.length * 22, 90);

  return (
    <svg viewBox={`0 0 ${width} 100`} preserveAspectRatio="none" className="w-full h-16">
      <polyline
        points={normalized
          .map((v, i) => `${(i / (normalized.length - 1)) * width},${100 - v}`)
          .join(" ")}
        fill="none"
        stroke="rgb(250,204,21)"
        strokeWidth={3}
      />
    </svg>
  );
}

/* ---------------------------------------------------------
   FSCard
--------------------------------------------------------- */

interface FSCardProps {
  title: string;
  color: string;
  player: Player;
  statLabel: string;
  series: number[];
  aiSummary: string;
}

function FSCard({ title, color, player, statLabel, series, aiSummary }: FSCardProps) {
  const [open, setOpen] = useState(false);

  const last5 = series.at(-1) ?? 0;
  const avg = average(series);
  const diff = last5 - avg;

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 md:p-5 bg-black/60 backdrop-blur-sm",
        "transition hover:-translate-y-1",
        color
      )}
    >
      <h3 className="flex items-center gap-2 mb-2 text-sm font-semibold">
        {title}
      </h3>

      <div className="text-xs text-white/60 mb-1">
        {player.team} • {player.pos}
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <p className="text-2xl font-bold text-white">{last5} {statLabel}</p>
        <span
          className={cn(
            "text-sm font-medium",
            diff >= 0 ? "text-green-400" : "text-red-400"
          )}
        >
          {diff >= 0 ? "+" : ""}
          {diff.toFixed(1)} vs avg
        </span>
      </div>

      {/* Collapse Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-white/70 hover:text-white transition"
      >
        {open ? "Hide trend" : "Show trend"}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Collapsible Content */}
      <div
        className={cn(
          "overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out",
          open ? "max-h-40 opacity-100 mt-3" : "max-h-0 opacity-0"
        )}
      >
        <Sparkline data={series} />

        <p className="mt-3 text-xs text-white/65 leading-relaxed">
          {aiSummary}
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Main Component
--------------------------------------------------------- */

export default function FormStabilityGrid() {
  const [selected, setSelected] = useState<StatKey>("fantasy");
  const players = useAFLMockPlayers();

  const statLabel = STAT_LABELS[selected];

  /* compute groups */
  const groups = useMemo(() => {
    const hot: Player[] = [];
    const stable: Player[] = [];
    const cool: Player[] = [];

    players.forEach((p) => {
      const s = getSeriesForStat(p, selected);
      const last = s.at(-1) ?? 0;
      const avg = average(s);
      const diff = last - avg;

      if (diff >= 3) hot.push(p);
      else if (Math.abs(diff) < 1.5) stable.push(p);
      else cool.push(p);
    });

    return { hot, stable, cool };
  }, [players, selected]);

  return (
    <section
      className="rounded-3xl border border-white/10 bg-black/20 px-4 py-8 md:px-8 md:py-10 backdrop-blur-xl shadow-2xl"
      id="form-stability"
    >
      {/* Header Pill */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-300">
          Form Stability Grid
        </span>
      </div>

      <h2 className="text-2xl md:text-3xl font-bold mb-2">
        Hot risers, rock-solid anchors & form slumps
      </h2>

      <p className="text-sm text-white/70 mb-5 max-w-2xl">
        Last 5 rounds of <span className="text-yellow-300">{statLabel.toLowerCase()}</span> — split into surges, stability leaders, and cooling risks.
      </p>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATS.map((s) => (
          <button
            key={s}
            onClick={() => setSelected(s)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm border backdrop-blur-md transition",
              selected === s
                ? "bg-yellow-400 text-black border-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.4)]"
                : "bg-black/30 text-white/70 border-white/10 hover:bg-black/40"
            )}
          >
            {STAT_LABELS[s]}
          </button>
        ))}
      </div>

      {/* 3 Columns */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* HOT */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 font-semibold text-red-400">
            <Flame className="h-4 w-4" /> Hot form surge
          </h3>

          {groups.hot.map((p) => {
            const series = getSeriesForStat(p, selected);
            return (
              <FSCard
                key={p.id}
                title="Hot form"
                color="border-red-500/25"
                player={p}
                statLabel={statLabel.toLowerCase()}
                series={series}
                aiSummary={aiSummaryHot(p, series)}
              />
            );
          })}
        </div>

        {/* STABLE */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 font-semibold text-yellow-400">
            <Shield className="h-4 w-4" /> Stability leaders
          </h3>

          {groups.stable.map((p) => {
            const series = getSeriesForStat(p, selected);
            return (
              <FSCard
                key={p.id}
                title="Stability"
                color="border-yellow-500/25"
                player={p}
                statLabel={statLabel.toLowerCase()}
                series={series}
                aiSummary={aiSummaryStable(p, series)}
              />
            );
          })}
        </div>

        {/* COOLING */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 font-semibold text-cyan-300">
            <Snowflake className="h-4 w-4" /> Cooling risks
          </h3>

          {groups.cool.map((p) => {
            const series = getSeriesForStat(p, selected);
            return (
              <FSCard
                key={p.id}
                title="Cooling"
                color="border-cyan-400/25"
                player={p}
                statLabel={statLabel.toLowerCase()}
                series={series}
                aiSummary={aiSummaryCooling(p, series)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
