// src/components/afl/players/FormStabilityGrid.tsx
import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Flame,
  Shield,
  Snowflake,
  Sparkles,
  ChevronDown,
} from "lucide-react";

import {
  useAFLMockPlayers,
  getSeriesForStat,
  lastN,
  average,
  stdDev,
  StatKey,
} from "@/components/afl/players/useAFLMockData";

/* ---------------------------------------------------------
   Stat config
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

const STAT_UNITS: Record<StatKey, string> = {
  fantasy: "fantasy",
  disposals: "disposals",
  kicks: "kicks",
  marks: "marks",
  tackles: "tackles",
  hitouts: "hitouts",
  goals: "goals",
};

/* ---------------------------------------------------------
   Types & helpers
--------------------------------------------------------- */

type Tone = "hot" | "stable" | "cold";

type PlayerMetrics = {
  id: number;
  name: string;
  team: string;
  pos: string;
  series: number[];
  last5: number[];
  avgL5: number;
  seasonAvg: number;
  deltaVsSeason: number;
  volatility: number;
  last: number;
  prev: number;
  lastVsPrev: number;
};

function formatMainValue(value: number, stat: StatKey): string {
  const unit = STAT_UNITS[stat];
  if (stat === "goals") {
    return `${value.toFixed(1)} ${unit}`;
  }
  return `${Math.round(value)} ${unit}`;
}

function formatDeltaValue(delta: number, stat: StatKey): string {
  const unit = STAT_UNITS[stat];
  if (delta === 0) return `±0 ${unit} vs avg`;

  const sign = delta > 0 ? "+" : "−";
  const abs = Math.abs(delta);
  const num =
    stat === "goals" ? abs.toFixed(1) : abs.toFixed(1); // 1 dp feels nice

  return `${sign}${num} ${unit} vs avg`;
}

function oneLineTag(metric: PlayerMetrics, tone: Tone, stat: StatKey): string {
  const unit = STAT_UNITS[stat];

  if (tone === "hot") {
    return `Trending up in recent ${unit} output.`;
  }
  if (tone === "stable") {
    if (metric.volatility < 3) return "Rock-solid week-to-week profile.";
    if (metric.volatility < 6) return "Steady scoring with low volatility.";
    return "Moderate swings but reliable overall output.";
  }
  // cold
  if (metric.deltaVsSeason < -3) {
    return `Softening impact vs usual ${unit} baseline.`;
  }
  return `Slight cooling vs recent ${unit} form.`;
}

function aiPlayerSummary(
  metric: PlayerMetrics,
  tone: Tone,
  stat: StatKey
): string {
  const unit = STAT_UNITS[stat];
  const delta = metric.deltaVsSeason;
  const deltaStr =
    delta === 0
      ? "in line with their usual output"
      : `${delta > 0 ? "+" : "−"}${Math.abs(delta).toFixed(1)} ${unit} vs season avg`;
  const vol = metric.volatility;

  if (tone === "hot") {
    return `${metric.name} (${metric.team} • ${metric.pos}) is in a strong ${
      unit
    } surge, averaging ${metric.avgL5.toFixed(
      1
    )} ${unit} over their last 5 games (${deltaStr}). Recent rounds point to rising opportunity, role involvement and stronger scoring momentum.`;
  }

  if (tone === "stable") {
    return `${metric.name} (${metric.team} • ${metric.pos}) shows controlled week-to-week movement, with volatility around ${vol.toFixed(
      1
    )} ${unit}. Their recent average of ${metric.avgL5.toFixed(
      1
    )} ${unit} suggests a dependable scoring floor with minimal shock scores.`;
  }

  // cold
  const changeLast = metric.lastVsPrev;
  const lastStr =
    changeLast === 0
      ? "flat in the most recent game"
      : `${changeLast > 0 ? "+" : "−"}${Math.abs(
          changeLast
        ).toFixed(1)} ${unit} in the last round`;

  return `${metric.name} (${metric.team} • ${metric.pos}) is tracking below their usual ${unit} baseline (${deltaStr}), with ${lastStr}. This points to cooling form and potential role, matchup or usage drag to monitor.`;
}

/* ---------------------------------------------------------
   Sparkline (only inside expanded row)
--------------------------------------------------------- */

function MiniSparkline({ data }: { data: number[] }) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const normalized = data.map((v) => ((v - min) / (max - min || 1)) * 100);
  const width = Math.max(normalized.length * 22, 80);

  return (
    <div className="relative h-14 w-full mt-3">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${width} 100`}
        preserveAspectRatio="none"
      >
        <polyline
          points={normalized
            .map(
              (v, i) =>
                `${(i / Math.max(normalized.length - 1, 1)) * width},${
                  100 - v
                }`
            )
            .join(" ")}
          fill="none"
          stroke="rgba(250,204,21,0.35)"
          strokeWidth={3}
          className="drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]"
        />
      </svg>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${width} 100`}
        preserveAspectRatio="none"
      >
        <polyline
          points={normalized
            .map(
              (v, i) =>
                `${(i / Math.max(normalized.length - 1, 1)) * width},${
                  100 - v
                }`
            )
            .join(" ")}
          fill="none"
          stroke="rgb(250,204,21)"
          strokeWidth={2}
        />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------
   Row component
--------------------------------------------------------- */

interface PlayerRowProps {
  metric: PlayerMetrics;
  stat: StatKey;
  tone: Tone;
  expanded: boolean;
  onToggle: () => void;
  delay: number;
}

function PlayerRow({
  metric,
  stat,
  tone,
  expanded,
  onToggle,
  delay,
}: PlayerRowProps) {
  const mainValue = formatMainValue(metric.avgL5, stat);
  const deltaText = formatDeltaValue(metric.deltaVsSeason, stat);
  const tag = oneLineTag(metric, tone, stat);

  const toneBorder =
    tone === "hot"
      ? "border-red-500/50"
      : tone === "stable"
      ? "border-yellow-400/50"
      : "border-cyan-400/50";

  const title =
    tone === "hot" ? "Hot form" : tone === "stable" ? "Stability" : "Cooling";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "group relative w-full text-left rounded-2xl border bg-black/70",
        "px-4 py-3.5 md:px-4.5 md:py-4",
        "backdrop-blur-sm transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(250,204,21,0.4)]",
        "animate-in fade-in slide-in-from-bottom-4",
        toneBorder
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* subtle per-row glow */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 -bottom-10 h-16 blur-2xl",
          tone === "hot"
            ? "bg-red-500/20"
            : tone === "stable"
            ? "bg-yellow-400/20"
            : "bg-cyan-400/20"
        )}
      />

      <div className="relative">
        {/* top line */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-sm md:text-[15px] font-semibold text-white">
                {metric.name}
              </p>
              <p className="text-[11px] text-white/55">
                {metric.team} • {metric.pos}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm md:text-[15px] font-semibold text-yellow-300">
              {mainValue}
            </p>
            <p className="text-[11px] text-emerald-300">{deltaText}</p>
          </div>
        </div>

        {/* micro copy row + chevron */}
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] md:text-xs">
          <p className="text-white/65 line-clamp-1">{tag}</p>
          <div className="flex items-center gap-1 text-white/60">
            <span className="hidden md:inline">
              {expanded ? "Hide trend" : "Show trend"}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                expanded && "rotate-180"
              )}
            />
          </div>
        </div>

        {/* expandable panel */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300",
            expanded ? "mt-3 max-h-64 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          {expanded && (
            <div className="pt-1 border-t border-white/10 mt-2">
              <MiniSparkline data={metric.last5} />
              <p className="mt-3 text-[11px] md:text-xs text-white/75 leading-relaxed">
                {aiPlayerSummary(metric, tone, stat)}
              </p>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

/* ---------------------------------------------------------
   Column shell
--------------------------------------------------------- */

interface ColumnProps {
  tone: Tone;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function ColumnShell({ tone, title, subtitle, icon: Icon, children }: ColumnProps) {
  const border =
    tone === "hot"
      ? "border-red-500/50"
      : tone === "stable"
      ? "border-yellow-400/50"
      : "border-cyan-400/50";

  const bgGradient =
    tone === "hot"
      ? "from-red-950 via-black to-black"
      : tone === "stable"
      ? "from-yellow-950 via-black to-black"
      : "from-cyan-950 via-black to-black";

  const glowColour =
    tone === "hot"
      ? "bg-red-500/35"
      : tone === "stable"
      ? "bg-yellow-400/35"
      : "bg-cyan-400/35";

  return (
    <div
      className={cn(
        "relative rounded-3xl border bg-gradient-to-b p-4 md:p-5 space-y-3 md:space-y-3.5",
        border,
        bgGradient
      )}
    >
      {/* column glow */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-8 -top-10 h-16 blur-3xl",
          glowColour
        )}
      />

      <div className="relative mb-1 flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Icon
              className={cn(
                "h-4 w-4",
                tone === "hot"
                  ? "text-red-400"
                  : tone === "stable"
                  ? "text-yellow-300"
                  : "text-cyan-300"
              )}
            />
            <h3 className="text-sm font-semibold tracking-tight md:text-[15px]">
              {title}
            </h3>
          </div>
          <p className="mt-1 text-[11px] md:text-xs text-white/65">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="relative space-y-2.5 md:space-y-3">{children}</div>
    </div>
  );
}

/* ---------------------------------------------------------
   MAIN SECTION
--------------------------------------------------------- */

export default function FormStabilityGrid() {
  const players = useAFLMockPlayers();
  const [selectedStat, setSelectedStat] = useState<StatKey>("fantasy");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const selectedLabel = STAT_LABELS[selectedStat];

  const metrics: PlayerMetrics[] = useMemo(() => {
    return players.map((p) => {
      const series = getSeriesForStat(p, selectedStat) || [];
      const last5 = lastN(series, 5);
      const avgL5 = average(last5);
      const seasonAvg = average(series);
      const deltaVsSeason = avgL5 - seasonAvg;
      const volatility = stdDev(last5);

      const last = series.at(-1) ?? 0;
      const prev = series.length >= 2 ? series.at(-2)! : last;
      const lastVsPrev = last - prev;

      return {
        id: p.id,
        name: p.name,
        team: p.team,
        pos: p.pos,
        series,
        last5,
        avgL5,
        seasonAvg,
        deltaVsSeason,
        volatility,
        last,
        prev,
        lastVsPrev,
      };
    });
  }, [players, selectedStat]);

  const hot = useMemo(() => {
    return [...metrics]
      .sort((a, b) => {
        // primary: bigger delta vs season
        if (b.deltaVsSeason !== a.deltaVsSeason) {
          return b.deltaVsSeason - a.deltaVsSeason;
        }
        // secondary: higher L5 avg
        return b.avgL5 - a.avgL5;
      })
      .slice(0, 5);
  }, [metrics]);

  const stable = useMemo(() => {
    return [...metrics]
      .filter((m) => m.last5.length >= 3)
      .sort((a, b) => {
        // primary: lower volatility
        if (a.volatility !== b.volatility) {
          return a.volatility - b.volatility;
        }
        // secondary: slightly prefer higher L5 avg
        return b.avgL5 - a.avgL5;
      })
      .slice(0, 5);
  }, [metrics]);

  const cold = useMemo(() => {
    const negative = metrics.filter((m) => m.deltaVsSeason < 0);
    const pool = negative.length >= 5 ? negative : metrics;

    return [...pool]
      .sort((a, b) => {
        // primary: more negative delta vs season
        if (a.deltaVsSeason !== b.deltaVsSeason) {
          return a.deltaVsSeason - b.deltaVsSeason;
        }
        // secondary: lower L5 avg
        if (a.avgL5 !== b.avgL5) {
          return a.avgL5 - b.avgL5;
        }
        // tertiary: worse last vs prev
        return a.lastVsPrev - b.lastVsPrev;
      })
      .slice(0, 5);
  }, [metrics]);

  const makeKey = (tone: Tone, id: number) => `${tone}-${id}`;

  return (
    <section
      className={cn(
        "relative rounded-3xl border border-white/10",
        "bg-gradient-to-br from-[#050507] via-black to-[#121013]",
        "px-4 py-6 md:px-6 md:py-8",
        "shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden"
      )}
    >
      {/* soft background glow */}
      <div className="pointer-events-none absolute -top-28 left-10 h-36 w-36 rounded-full bg-yellow-500/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-60px] right-8 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="relative space-y-4 md:space-y-5">
        {/* Header row */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/60 bg-black/80 px-3 py-1 text-xs text-yellow-200/90">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              <span className="uppercase tracking-[0.18em]">
                Form Stability Grid
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold">
              Hot risers, rock-solid anchors &amp; form slumps
            </h2>
            <p className="text-xs md:text-sm text-white/70 max-w-xl">
              Last 5 rounds of{" "}
              <span className="font-semibold text-yellow-200">
                {selectedLabel.toLowerCase()}
              </span>{" "}
              — split into recent surges, stability leaders and cooling risks
              against each player&apos;s season baseline.
            </p>
          </div>

          {/* Stat lens pills */}
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">
              Stat lens
            </span>
            <div className="flex flex-wrap gap-1.5">
              {STATS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSelectedStat(s);
                    setExpandedKey(null);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs md:text-[13px] border transition-all",
                    "backdrop-blur-sm",
                    selectedStat === s
                      ? "bg-yellow-400 text-black border-yellow-300 shadow-[0_0_18px_rgba(250,204,21,0.7)]"
                      : "bg-white/5 text-white/70 border-white/15 hover:bg-white/10"
                  )}
                >
                  {STAT_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3-column grid */}
        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {/* HOT */}
          <ColumnShell
            tone="hot"
            title="Hot form surge"
            subtitle="Biggest L5-round surges vs each player's season baseline."
            icon={Flame}
          >
            {hot.map((m, index) => {
              const key = makeKey("hot", m.id);
              return (
                <PlayerRow
                  key={key}
                  metric={m}
                  stat={selectedStat}
                  tone="hot"
                  expanded={expandedKey === key}
                  onToggle={() =>
                    setExpandedKey((prev) => (prev === key ? null : key))
                  }
                  delay={120 + index * 40}
                />
              );
            })}
          </ColumnShell>

          {/* STABLE */}
          <ColumnShell
            tone="stable"
            title="Stability leaders"
            subtitle="Lowest volatility profiles with dependable L5-round output."
            icon={Shield}
          >
            {stable.map((m, index) => {
              const key = makeKey("stable", m.id);
              return (
                <PlayerRow
                  key={key}
                  metric={m}
                  stat={selectedStat}
                  tone="stable"
                  expanded={expandedKey === key}
                  onToggle={() =>
                    setExpandedKey((prev) => (prev === key ? null : key))
                  }
                  delay={140 + index * 40}
                />
              );
            })}
          </ColumnShell>

          {/* COLD */}
          <ColumnShell
            tone="cold"
            title="Cooling risks"
            subtitle="Softening L5 output vs usual baseline and recent trend."
            icon={Snowflake}
          >
            {cold.map((m, index) => {
              const key = makeKey("cold", m.id);
              return (
                <PlayerRow
                  key={key}
                  metric={m}
                  stat={selectedStat}
                  tone="cold"
                  expanded={expandedKey === key}
                  onToggle={() =>
                    setExpandedKey((prev) => (prev === key ? null : key))
                  }
                  delay={160 + index * 40}
                />
              );
            })}
          </ColumnShell>
        </div>
      </div>
    </section>
  );
}
