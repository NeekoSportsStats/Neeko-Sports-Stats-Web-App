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
  StatKey,
} from "@/components/afl/players/useAFLMockData";

/* ---------------------------------------------------------
   Stat config (keep in sync with your data)
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
  fantasy: "pts",
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

type PlayerMetrics = {
  id: number;
  name: string;
  team: string;
  pos: string;
  series: number[];
  avgL5: number;
  seasonAvg: number;
  deltaVsSeason: number;
  consistency: number;
  deltaLast: number;
};

function formatPrimaryValue(metric: PlayerMetrics, stat: StatKey): string {
  const value = metric.avgL5;
  const label = STAT_LABELS[stat].toLowerCase();

  if (stat === "fantasy") {
    return `${Math.round(value)} ${label}`;
  }
  if (stat === "goals") {
    return `${value.toFixed(1)} ${label}`;
  }
  return `${value.toFixed(1)} ${label}`;
}

function formatDelta(value: number, stat: StatKey): string {
  const unit = STAT_UNITS[stat];
  const sign = value > 0 ? "+" : value < 0 ? "-" : "±";
  const abs = Math.abs(value);

  if (stat === "fantasy") {
    return `${sign}${abs.toFixed(1)} ${unit}`;
  }

  if (stat === "goals") {
    return `${sign}${abs.toFixed(2)} ${unit}`;
  }

  return `${sign}${abs.toFixed(1)} ${unit}`;
}

/* ---------------------------------------------------------
   Sparkline (only in dropdown)
--------------------------------------------------------- */

function MiniSparkline({ data }: { data: number[] }) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const normalized = data.map((v) => ((v - min) / (max - min || 1)) * 100);
  const width = Math.max(normalized.length * 20, 80);

  const lastIndex = normalized.length - 1;
  const denom = Math.max(lastIndex, 1);
  const lastX = (lastIndex / denom) * width;
  const lastY = 100 - normalized[lastIndex];

  return (
    <div className="relative h-16 w-full">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${width} 100`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="sparkline-stroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(250,204,21,0.25)" />
            <stop offset="100%" stopColor="rgba(250,204,21,0.9)" />
          </linearGradient>
        </defs>
        <polyline
          points={normalized
            .map(
              (v, i) =>
                `${(i / denom) * width},${100 - v}`
            )
            .join(" ")}
          fill="none"
          stroke="url(#sparkline-stroke)"
          strokeWidth={3}
          className="drop-shadow-[0_0_12px_rgba(250,204,21,0.7)]"
        />
        {/* terminal point */}
        <circle
          cx={lastX}
          cy={lastY}
          r={3.5}
          fill="rgb(250,204,21)"
          stroke="rgba(15,23,42,0.95)"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------
   Player-level AI-style insight
--------------------------------------------------------- */

type Tone = "hot" | "stable" | "cold";

function buildPlayerInsight(
  metric: PlayerMetrics,
  tone: Tone,
  stat: StatKey
): string {
  const label = STAT_LABELS[stat].toLowerCase();
  const unit = STAT_UNITS[stat];
  const deltaSeason = metric.deltaVsSeason;
  const deltaLast = metric.deltaLast;
  const directionSeason = deltaSeason >= 0 ? "above" : "below";
  const absSeason = Math.abs(deltaSeason);
  const absLast = Math.abs(deltaLast);

  if (tone === "hot") {
    return `${
      metric.name
    } is running hot with their recent ${label} output sitting ${absSeason.toFixed(
      1
    )} ${unit} ${directionSeason} their season baseline, pointing to elevated opportunity and stronger involvement in key passages of play.`;
  }

  if (tone === "stable") {
    return `${
      metric.name
    } is delivering a reliable scoring floor, hitting or beating their usual ${label} baseline in ${metric.consistency.toFixed(
      0
    )}% of recent games and showing controlled week-to-week movement.`;
  }

  // cold / cooling
  if (deltaLast < 0) {
    return `${
      metric.name
    } has softened in their latest outing, dropping ${absLast.toFixed(
      1
    )} ${unit} on last week with recent output now trending below their usual ${label} range.`;
  }

  return `${
    metric.name
  } is showing a flatter patch of form with recent ${label} output tracking close to, but slightly under, their season baseline.`;
}

/* ---------------------------------------------------------
   Row component (screenshot-style list)
--------------------------------------------------------- */

interface FormRowProps {
  metric: PlayerMetrics;
  tone: Tone;
  stat: StatKey;
  selectedLabel: string;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}

function FormRow({
  metric,
  tone,
  stat,
  selectedLabel,
  isExpanded,
  onToggle,
  index,
}: FormRowProps) {
  const accent =
    tone === "hot"
      ? "border-red-500/50 text-red-50"
      : tone === "stable"
      ? "border-yellow-400/60 text-yellow-50"
      : "border-cyan-400/60 text-cyan-50";

  const accentPill =
    tone === "hot"
      ? "text-red-400"
      : tone === "stable"
      ? "text-yellow-300"
      : "text-cyan-300";

  const shortTrend =
    tone === "hot"
      ? `Trending up in recent ${selectedLabel.toLowerCase()} output.`
      : tone === "stable"
      ? `Steady ${selectedLabel.toLowerCase()} with low volatility.`
      : `Softening impact vs usual ${selectedLabel.toLowerCase()} baseline.`;

  const deltaLabel = `${formatDelta(metric.deltaVsSeason, stat)} vs avg`;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "group relative w-full rounded-2xl border bg-black/40 px-4 py-3.5 text-left",
        "backdrop-blur-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:bg-black/55",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70",
        accent,
        isExpanded && "bg-black/75"
      )}
      style={{ animationDelay: `${80 + index * 25}ms` }}
    >
      {/* subtle row glow */}
      <div className="pointer-events-none absolute inset-x-0 -bottom-6 h-10 bg-gradient-to-t from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className={cn("inline-flex items-center gap-1.5", accentPill)}>
              {tone === "hot" && <Flame className="h-3.5 w-3.5" />}
              {tone === "stable" && <Shield className="h-3.5 w-3.5" />}
              {tone === "cold" && <Snowflake className="h-3.5 w-3.5" />}
              <span className="font-medium">
                {tone === "hot"
                  ? "Hot form"
                  : tone === "stable"
                  ? "Stability"
                  : "Cooling"}
              </span>
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {metric.name}
            </p>
            <p className="text-[11px] text-white/55">
              {metric.team} · {metric.pos}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <p className="text-sm font-semibold text-white">
            {formatPrimaryValue(metric, stat)}
          </p>
          <p
            className={cn(
              "text-[11px] font-medium",
              metric.deltaVsSeason > 0
                ? "text-emerald-400"
                : metric.deltaVsSeason < 0
                ? "text-red-400"
                : "text-slate-300"
            )}
          >
            {deltaLabel}
          </p>
          <div className="inline-flex items-center gap-1 text-[11px] text-white/60">
            <span>{isExpanded ? "Hide trend" : "Show trend"}</span>
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          </div>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-white/65">{shortTrend}</p>

      {isExpanded && (
        <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
          <MiniSparkline data={metric.series} />
          <p className="text-xs leading-relaxed text-white/70">
            {buildPlayerInsight(metric, tone, stat)}
          </p>
        </div>
      )}
    </button>
  );
}

/* ---------------------------------------------------------
   Column shell with glow
--------------------------------------------------------- */

interface ColumnProps {
  title: string;
  tone: Tone;
  children: React.ReactNode;
}

function FormColumn({ title, tone, children }: ColumnProps) {
  const headingColor =
    tone === "hot"
      ? "text-red-300"
      : tone === "stable"
      ? "text-yellow-200"
      : "text-cyan-200";

  const glow =
    tone === "hot"
      ? "from-red-500/25"
      : tone === "stable"
      ? "from-yellow-500/25"
      : "from-cyan-400/25";

  const border =
    tone === "hot"
      ? "border-red-500/25"
      : tone === "stable"
      ? "border-yellow-500/25"
      : "border-cyan-400/25";

  return (
    <div className={cn("relative rounded-3xl border bg-black/60 p-3 md:p-4", border)}>
      <div
        className={cn(
          "pointer-events-none absolute inset-x-6 -top-10 h-16 blur-3xl",
          "bg-gradient-to-b to-transparent",
          glow
        )}
      />
      <div className="relative space-y-2">
        <h3 className={cn("text-sm font-semibold tracking-tight", headingColor)}>
          {title}
        </h3>
        <div className="space-y-2.5 md:space-y-3">{children}</div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   MAIN SECTION: FormStabilityGrid
--------------------------------------------------------- */

export default function FormStabilityGrid() {
  const players = useAFLMockPlayers();
  const [selectedStat, setSelectedStat] = useState<StatKey>("fantasy");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const selectedLabel = STAT_LABELS[selectedStat];

  const metrics: PlayerMetrics[] = useMemo(() => {
    return players.map((p) => {
      const series = getSeriesForStat(p, selectedStat);
      const l5 = lastN(series, 5);
      const avgL5 = average(l5);
      const seasonAvg = average(series);
      const base = seasonAvg || 1;
      const consistency =
        (series.filter((v) => v >= base).length / Math.max(series.length, 1)) *
        100;

      const last = series[series.length - 1] ?? seasonAvg ?? 0;
      const prev = series[series.length - 2] ?? last;
      const deltaLast = last - prev;
      const deltaVsSeason = avgL5 - seasonAvg;

      return {
        id: p.id,
        name: p.name,
        team: p.team,
        pos: p.pos,
        series,
        avgL5,
        seasonAvg,
        deltaVsSeason,
        consistency,
        deltaLast,
      };
    });
  }, [players, selectedStat]);

  // top 5 in each bucket
  const hot = useMemo(
    () =>
      [...metrics]
        .sort((a, b) => b.deltaVsSeason - a.deltaVsSeason)
        .slice(0, 5),
    [metrics]
  );

  const stable = useMemo(
    () =>
      [...metrics]
        .sort((a, b) => b.consistency - a.consistency)
        .slice(0, 5),
    [metrics]
  );

  const cold = useMemo(
    () =>
      [...metrics]
        .sort((a, b) => a.deltaVsSeason - b.deltaVsSeason)
        .slice(0, 5),
    [metrics]
  );

  const handleToggleRow = (id: number) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  return (
    <section
      className={cn(
        "relative rounded-3xl border border-white/10",
        "bg-gradient-to-br from-[#050507] via-black to-[#111010]",
        "px-4 py-6 md:px-6 md:py-8",
        "shadow-[0_0_80px_rgba(0,0,0,0.75)] overflow-hidden"
      )}
    >
      {/* soft background sparkle */}
      <div className="pointer-events-none absolute -top-24 left-12 h-40 w-40 rounded-full bg-yellow-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-60px] right-10 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl" />

      <div className="relative space-y-4 md:space-y-5">
        {/* Header row */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-black/70 px-3 py-1 text-xs text-yellow-200/90">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              <span className="uppercase tracking-[0.18em]">
                Form Stability Grid
              </span>
            </div>
            <h2 className="text-xl font-semibold md:text-2xl">
              Hot risers, rock-solid anchors &amp; form slumps
            </h2>
            <p className="max-w-xl text-xs text-white/65 md:text-sm">
              Last 5 rounds of{" "}
              <span className="font-semibold text-yellow-200">
                {selectedLabel.toLowerCase()}
              </span>{" "}
              — split into recent surges, stability leaders and cooling risks
              against each player&apos;s season baseline.
            </p>
          </div>

          {/* Stat lens */}
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">
              Stat lens
            </span>
            <div className="flex flex-wrap gap-1.5">
              {STATS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSelectedStat(s);
                    setExpandedId(null);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs md:text-[13px] transition-all border",
                    "backdrop-blur-sm",
                    selectedStat === s
                      ? "bg-yellow-400 text-black border-yellow-300 shadow-[0_0_18px_rgba(250,204,21,0.6)]"
                      : "bg-white/5 text-white/70 border-white/15 hover:bg-white/10"
                  )}
                >
                  {STAT_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3-column grid with subtle glow per column */}
        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {/* HOT */}
          <FormColumn title="Hot form surge" tone="hot">
            {hot.map((m, index) => (
              <FormRow
                key={m.id}
                metric={m}
                tone="hot"
                stat={selectedStat}
                selectedLabel={selectedLabel}
                isExpanded={expandedId === m.id}
                onToggle={() => handleToggleRow(m.id)}
                index={index}
              />
            ))}
          </FormColumn>

          {/* STABLE */}
          <FormColumn title="Stability leaders" tone="stable">
            {stable.map((m, index) => (
              <FormRow
                key={m.id}
                metric={m}
                tone="stable"
                stat={selectedStat}
                selectedLabel={selectedLabel}
                isExpanded={expandedId === m.id}
                onToggle={() => handleToggleRow(m.id)}
                index={index}
              />
            ))}
          </FormColumn>

          {/* COLD */}
          <FormColumn title="Cooling risks" tone="cold">
            {cold.map((m, index) => (
              <FormRow
                key={m.id}
                metric={m}
                tone="cold"
                stat={selectedStat}
                selectedLabel={selectedLabel}
                isExpanded={expandedId === m.id}
                onToggle={() => handleToggleRow(m.id)}
                index={index}
              />
            ))}
          </FormColumn>
        </div>
      </div>
    </section>
  );
}
