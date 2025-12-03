// src/components/afl/players/FormStabilityGrid.tsx
import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Flame,
  Shield,
  Snowflake,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import {
  useAFLMockPlayers,
  getSeriesForStat,
  lastN,
  average,
  type StatKey,
  type Player,
} from "@/components/afl/players/useAFLMockData";

/* ---------------------------------------------------------
   CONFIG
--------------------------------------------------------- */

const CATEGORY_LIMIT = 5;

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

const STAT_UNITS: Record<StatKey, string> = {
  fantasy: "fantasy",
  disposals: "disposals",
  kicks: "kicks",
  marks: "marks",
  tackles: "tackles",
  hitouts: "hitouts",
  goals: "goals",
};

type Category = "hot" | "stable" | "cool";

const CATEGORY_TITLE: Record<Category, string> = {
  hot: "Hot form surge",
  stable: "Stability leaders",
  cool: "Cooling risks",
};

const CATEGORY_ICON: Record<Category, React.ElementType> = {
  hot: Flame,
  stable: Shield,
  cool: Snowflake,
};

const CATEGORY_ICON_COLOR: Record<Category, string> = {
  hot: "text-orange-400",
  stable: "text-yellow-300",
  cool: "text-sky-400",
};

const ROW_ACCENT_BORDER: Record<Category, string> = {
  hot: "hover:border-orange-400/70",
  stable: "hover:border-yellow-300/70",
  cool: "hover:border-sky-400/70",
};

const ROW_ACCENT_BG: Record<Category, string> = {
  hot: "hover:bg-orange-500/5",
  stable: "hover:bg-yellow-400/5",
  cool: "hover:bg-sky-500/5",
};

const COLUMN_GLOW_BG: Record<Category, string> = {
  hot: "from-red-500/15 via-transparent to-transparent",
  stable: "from-yellow-400/15 via-transparent to-transparent",
  cool: "from-sky-400/15 via-transparent to-transparent",
};

/* ---------------------------------------------------------
   TYPES & HELPERS
--------------------------------------------------------- */

type PlayerMetric = {
  player: Player;
  series: number[];
  last5Avg: number;
  seasonAvg: number;
  diff: number; // L5 avg - season avg
};

function getTrendLabel(diff: number): string {
  if (diff > 5) return "Strong surge";
  if (diff > 2) return "Trending up";
  if (diff > 0.5) return "Slight rise";
  if (diff > -0.5) return "In line with usual";
  if (diff > -2) return "Softening";
  return "Significant decline";
}

function getTrendColour(diff: number, category: Category): string {
  if (category === "hot") {
    return diff >= 0 ? "text-orange-400" : "text-zinc-300";
  }
  if (category === "stable") {
    return Math.abs(diff) <= 1 ? "text-emerald-400" : "text-amber-300";
  }
  // cooling
  return diff <= 0 ? "text-sky-400" : "text-zinc-300";
}

function generatePlayerCommentary(
  metric: PlayerMetric,
  stat: StatKey,
  category: Category
): string {
  const { player, diff } = metric;
  const direction =
    diff > 0.75 ? "surging above" : diff < -0.75 ? "slipping below" : "tracking close to";
  const abs = Math.abs(diff).toFixed(1);
  const unit = STAT_UNITS[stat];

  let roleLine: string;
  if (category === "hot") {
    roleLine =
      "Recent rounds suggest elevated opportunity and stronger involvement in key passages of play.";
  } else if (category === "stable") {
    roleLine =
      "Output is holding steady with a reliable contribution week to week, minimising volatility.";
  } else {
    roleLine =
      "Recent games point to softening output that may reflect role tweaks, matchup difficulty or form dip.";
  }

  return `${player.name} (${player.team} • ${player.pos}) is ${direction} their recent average (${abs} ${unit}), indicating ${roleLine}`;
}

/* ---------------------------------------------------------
   SPARKLINE
--------------------------------------------------------- */

function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const safeRange = max === min ? 1 : max - min;
  const normalized = data.map((v) => (v - min) / safeRange);

  return (
    <div className="relative h-14 w-full">
      <svg viewBox="0 0 100 40" className="absolute inset-0 h-full w-full">
        {/* soft glow */}
        <polyline
          fill="none"
          stroke="rgba(250,204,21,0.35)"
          strokeWidth={4}
          points={normalized
            .map((v, i) => `${(i / Math.max(normalized.length - 1, 1)) * 100},${36 - v * 30}`)
            .join(" ")}
          className="drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]"
        />
        {/* main line */}
        <polyline
          fill="none"
          stroke="rgb(250,204,21)"
          strokeWidth={2}
          points={normalized
            .map((v, i) => `${(i / Math.max(normalized.length - 1, 1)) * 100},${36 - v * 30}`)
            .join(" ")}
        />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------
   ROW CARD
--------------------------------------------------------- */

interface RowCardProps {
  metric: PlayerMetric;
  stat: StatKey;
  category: Category;
  index: number;
}

function RowCard({ metric, stat, category, index }: RowCardProps) {
  const [open, setOpen] = useState(false);
  const unit = STAT_UNITS[stat];
  const statLabelLower = STAT_LABELS[stat].toLowerCase();
  const trendLabel = getTrendLabel(metric.diff);
  const trendColour = getTrendColour(metric.diff, category);

  const Icon = CATEGORY_ICON[category];

  const mainValue = `${metric.last5Avg.toFixed(0)} ${unit}`;
  const diffValue = `${metric.diff >= 0 ? "+" : ""}${metric.diff.toFixed(1)} vs avg`;

  return (
    <div
      className={cn(
        "group rounded-2xl border border-white/8 bg-black/70 px-4 py-3.5 md:px-4.5 md:py-3.5",
        "transition-all duration-200 cursor-pointer",
        ROW_ACCENT_BORDER[category],
        ROW_ACCENT_BG[category],
        "hover:shadow-[0_0_26px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-2"
      )}
      style={{ animationDelay: `${120 + index * 40}ms` }}
      onClick={() => setOpen((prev) => !prev)}
    >
      {/* Top row: name + value */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon
              className={cn(
                "h-3.5 w-3.5",
                CATEGORY_ICON_COLOR[category]
              )}
            />
            <p className="truncate text-sm font-medium text-white">
              {metric.player.name}
            </p>
          </div>
          <p className="mt-0.5 text-[11px] text-white/55">
            {metric.player.team} • {metric.player.pos}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-white">{mainValue}</p>
          <p
            className={cn(
              "mt-0.5 text-[11px] font-medium",
              trendColour
            )}
          >
            {diffValue}
          </p>
        </div>
      </div>

      {/* Bottom row: trend + chevron */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[11px] text-white/55">
          {trendLabel} in recent {statLabelLower} output.
        </p>
        <div className="flex items-center gap-1 text-[11px] text-white/60">
          <span>{open ? "Hide trend" : "Show trend"}</span>
          {open ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="mt-3 border-t border-white/8 pt-3 space-y-3 animate-in fade-in slide-in-from-top-1">
          <Sparkline data={metric.series} />
          <p className="text-[12px] leading-relaxed text-white/70">
            {generatePlayerCommentary(metric, stat, category)}
          </p>
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

  const metrics: PlayerMetric[] = useMemo(() => {
    return players.map((p) => {
      const series = getSeriesForStat(p, selectedStat);
      const last5 = lastN(series, 5);
      const last5Avg = average(last5);
      const seasonAvg = average(series);
      const diff = last5Avg - seasonAvg;

      return {
        player: p,
        series,
        last5Avg,
        seasonAvg,
        diff,
      };
    });
  }, [players, selectedStat]);

  const hot = useMemo(
    () =>
      [...metrics]
        .sort((a, b) => b.diff - a.diff)
        .slice(0, CATEGORY_LIMIT),
    [metrics]
  );

  const stable = useMemo(
    () =>
      [...metrics]
        .sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff))
        .slice(0, CATEGORY_LIMIT),
    [metrics]
  );

  const cool = useMemo(
    () =>
      [...metrics]
        .sort((a, b) => a.diff - b.diff)
        .slice(0, CATEGORY_LIMIT),
    [metrics]
  );

  const selectedLabel = STAT_LABELS[selectedStat].toLowerCase();

  return (
    <section
      className={cn(
        "relative mt-10 rounded-3xl border border-white/12",
        "bg-gradient-to-b from-black via-[#050507] to-[#0b0b0d]",
        "px-4 py-6 md:px-8 md:py-8",
        "shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden"
      )}
      id="form-stability"
    >
      {/* soft column glows */}
      <div className="pointer-events-none absolute inset-y-10 left-[6%] right-[68%] bg-gradient-to-br opacity-50 blur-3xl md:block hidden bg-red-500/20" />
      <div className="pointer-events-none absolute inset-y-10 left-[34%] right-[34%] opacity-50 blur-3xl md:block hidden bg-yellow-400/16" />
      <div className="pointer-events-none absolute inset-y-10 left-[68%] right-[6%] opacity-50 blur-3xl md:block hidden bg-sky-400/18" />

      <div className="relative space-y-5 md:space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-yellow-500/15 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-200">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            <span>Form Stability Grid</span>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Hot risers, rock-solid anchors &amp; form slumps
            </h2>
            <p className="mt-2 max-w-2xl text-xs md:text-sm text-white/70">
              Last 5 rounds of{" "}
              <span className="font-semibold text-yellow-300">
                {selectedLabel}
              </span>{" "}
              — split into recent surges, stability leaders and cooling risks
              against each player&apos;s season baseline.
            </p>
          </div>

          {/* Stat filter pills */}
          <div className="mt-1 -mx-2 overflow-x-auto scrollbar-thin scrollbar-thumb-yellow-500/30">
            <div className="flex min-w-max gap-2 px-2 pb-1">
              {STATS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStat(s)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs md:text-[13px] font-medium border backdrop-blur-md transition-all",
                    selectedStat === s
                      ? "bg-yellow-400 text-black border-yellow-300 shadow-[0_0_18px_rgba(250,204,21,0.7)]"
                      : "bg-black/40 text-white/70 border-white/14 hover:bg-black/60 hover:text-white"
                  )}
                >
                  {STAT_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Columns */}
        <div className="grid gap-5 md:grid-cols-3 md:gap-6">
          {/* HOT */}
          <div className="relative">
            <div
              className={cn(
                "pointer-events-none absolute -top-4 -bottom-4 -left-4 -right-4 hidden md:block",
                "bg-gradient-to-b",
                COLUMN_GLOW_BG.hot
              )}
            />
            <div className="relative space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="h-4 w-4 text-orange-400" />
                <h3 className="text-sm font-semibold text-white">
                  {CATEGORY_TITLE.hot}
                </h3>
              </div>
              <div className="space-y-3">
                {hot.map((m, idx) => (
                  <RowCard
                    key={m.player.id}
                    metric={m}
                    stat={selectedStat}
                    category="hot"
                    index={idx}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* STABLE */}
          <div className="relative">
            <div
              className={cn(
                "pointer-events-none absolute -top-4 -bottom-4 -left-4 -right-4 hidden md:block",
                "bg-gradient-to-b",
                COLUMN_GLOW_BG.stable
              )}
            />
            <div className="relative space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-yellow-300" />
                <h3 className="text-sm font-semibold text-white">
                  {CATEGORY_TITLE.stable}
                </h3>
              </div>
              <div className="space-y-3">
                {stable.map((m, idx) => (
                  <RowCard
                    key={m.player.id}
                    metric={m}
                    stat={selectedStat}
                    category="stable"
                    index={idx}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* COOL */}
          <div className="relative">
            <div
              className={cn(
                "pointer-events-none absolute -top-4 -bottom-4 -left-4 -right-4 hidden md:block",
                "bg-gradient-to-b",
                COLUMN_GLOW_BG.cool
              )}
            />
            <div className="relative space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Snowflake className="h-4 w-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-white">
                  {CATEGORY_TITLE.cool}
                </h3>
              </div>
              <div className="space-y-3">
                {cool.map((m, idx) => (
                  <RowCard
                    key={m.player.id}
                    metric={m}
                    stat={selectedStat}
                    category="cool"
                    index={idx}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
