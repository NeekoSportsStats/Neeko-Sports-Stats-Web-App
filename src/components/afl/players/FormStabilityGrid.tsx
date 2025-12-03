import React, { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Flame,
  Shield,
  Snowflake,
  TrendingUp,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";

import {
  useAFLMockPlayers,
  getSeriesForStat,
  lastN,
  average,
  StatKey,
  stdDev,
  stabilityMeta,
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

type StatFilterKey = StatKey | "all";
const STAT_FILTERS: StatFilterKey[] = ["all", ...STATS];
const STAT_FILTER_STORAGE_KEY = "afl_form_grid_stat";

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
  consistency: number;
  volatility: number;
  l5DeltaFromSeason: number;
  diffLast: number | null; // last - previous
  slumpScore: number;
};

function formatUnitValue(value: number, stat: StatKey): string {
  const unit = STAT_UNITS[stat];
  if (stat === "fantasy") return `${Math.round(value)} ${unit}`;
  if (stat === "goals") return `${value.toFixed(1)} ${unit}`;
  return `${value.toFixed(1)} ${unit}`;
}

function formatDeltaUnit(value: number, stat: StatKey): string {
  const unit = STAT_UNITS[stat];
  if (value === 0) return `±0 ${unit}`;

  const sign = value > 0 ? "+" : "-";
  const abs = Math.abs(value);

  if (stat === "fantasy") {
    return `${sign}${Math.round(abs)} ${unit}`;
  }

  if (stat === "goals") {
    return `${sign}${abs.toFixed(1)} ${unit}`;
  }

  return `${sign}${abs.toFixed(1)} ${unit}`;
}

/* ---------------------------------------------------------
   Mini Sparkline
--------------------------------------------------------- */

function MiniSparkline({
  data,
  baseline,
}: {
  data: number[];
  baseline?: number;
}) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const denom = max - min || 1;
  const normalized = data.map((v) => ((v - min) / denom) * 100);
  const width = Math.max(normalized.length * 18, 60);

  const baselineNorm =
    baseline !== undefined ? ((baseline - min) / denom) * 100 : null;

  const lastIndex = normalized.length - 1;
  const lastX =
    (lastIndex / Math.max(normalized.length - 1, 1)) * width || width;
  const lastY = 100 - normalized[lastIndex];
  const first = normalized[0];
  const delta = normalized[lastIndex] - first;

  let moodColour = "rgba(250,204,21,0.95)"; // neutral / slight move
  if (delta > 7) {
    moodColour = "rgba(34,197,94,0.95)"; // strong up
  } else if (delta < -7) {
    moodColour = "rgba(248,113,113,0.95)"; // strong down
  }

  return (
    <div className="relative mt-1 h-10 w-full overflow-hidden rounded-xl bg-gradient-to-tr from-white/5 via-transparent to-transparent">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${width} 100`}
        preserveAspectRatio="none"
      >
        {/* soft glow under line */}
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
          strokeWidth={4}
          className="drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]"
        />

        {/* main line */}
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

        {/* baseline / season average guide */}
        {baselineNorm !== null && (
          <line
            x1={0}
            x2={width}
            y1={100 - baselineNorm}
            y2={100 - baselineNorm}
            stroke="rgba(148,163,184,0.55)"
            strokeDasharray="4 3"
            strokeWidth={1}
          />
        )}

        {/* mood bubble at latest point */}
        <circle
          cx={lastX}
          cy={lastY}
          r={3.5}
          fill={moodColour}
          stroke="rgba(15,23,42,0.9)"
          strokeWidth={1.3}
        />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------
   Shared Player Card
--------------------------------------------------------- */

interface PlayerFormCardProps {
  name: string;
  team: string;
  pos: string;
  metricLabel: string;
  metricValue: string;
  metricSubLabel?: React.ReactNode;
  series: number[];
  baseline: number;
  tone: "hot" | "stable" | "cold";
  delay: number;
  metricIcon?: React.ElementType;
}

function PlayerFormCard({
  name,
  team,
  pos,
  metricLabel,
  metricValue,
  metricSubLabel,
  series,
  baseline,
  tone,
  delay,
  metricIcon: MetricIcon,
}: PlayerFormCardProps) {
  const toneClasses =
    tone === "hot"
      ? "border-red-500/30 bg-gradient-to-br from-red-900/40 via-black to-black"
      : tone === "cold"
      ? "border-cyan-400/30 bg-gradient-to-br from-sky-900/30 via-black to-black"
      : "border-yellow-500/25 bg-gradient-to-br from-zinc-900/60 via-black to-black";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl px-4 py-3.5 md:px-4.5 md:py-4",
        "border backdrop-blur-sm",
        "transition-transform duration-300 hover:-translate-y-1",
        "hover:shadow-[0_0_32px_rgba(250,204,21,0.45)]",
        "animate-in fade-in slide-in-from-bottom-4"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* soft card glow */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 -bottom-10 h-20 blur-2xl",
          tone === "hot"
            ? "bg-red-500/25"
            : tone === "cold"
            ? "bg-cyan-400/30"
            : "bg-yellow-500/20"
        )}
      />
      <div className={cn("relative rounded-xl p-0.5", toneClasses)}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="truncate text-sm font-semibold text-white">
              {name}
            </p>
            <p className="text-[11px] text-white/55">
              {team} • {pos}
            </p>
          </div>
          <div className="text-right">
            {MetricIcon && (
              <div className="mb-0.5 flex justify-end">
                <MetricIcon className="h-3.5 w-3.5 text-white/45" />
              </div>
            )}
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
              {metricLabel}
            </p>
            <p className="text-sm font-semibold text-yellow-300">
              {metricValue}
            </p>
            {metricSubLabel && (
              <div className="mt-0.5 text-[11px] text-white/50">
                {metricSubLabel}
              </div>
            )}
          </div>
        </div>
        <MiniSparkline data={series} baseline={baseline} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Column shells
--------------------------------------------------------- */

interface ColumnProps {
  title: string;
  subtitle: string;
  tone: "hot" | "stable" | "cold";
  icon: React.ElementType;
  children: React.ReactNode;
}

function FormColumn({
  title,
  subtitle,
  tone,
  icon: Icon,
  children,
}: ColumnProps) {
  const accentBorder =
    tone === "hot"
      ? "border-red-500/40"
      : tone === "cold"
      ? "border-cyan-400/40"
      : "border-yellow-500/35";

  return (
    <div
      className={cn(
        "relative space-y-3 rounded-3xl border bg-black/60 p-4 backdrop-blur-sm md:space-y-4 md:p-5",
        accentBorder
      )}
    >
      {/* subtle column glow */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-6 -top-10 h-16 blur-3xl",
          tone === "hot"
            ? "bg-red-500/30"
            : tone === "cold"
            ? "bg-cyan-400/30"
            : "bg-yellow-500/25"
        )}
      />
      <div className="relative flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Icon
              className={cn(
                "h-4 w-4",
                tone === "hot"
                  ? "text-red-400"
                  : tone === "cold"
                  ? "text-cyan-300"
                  : "text-yellow-300"
              )}
            />
            <h3 className="text-sm font-semibold tracking-tight md:text-[15px]">
              {title}
            </h3>
          </div>
          <p className="mt-1.5 text-[11px] text-white/55 md:text-xs">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="relative space-y-2.5 md:space-y-3">{children}</div>
    </div>
  );
}

/* ---------------------------------------------------------
   MAIN SECTION: FormStabilityGrid
--------------------------------------------------------- */

export default function FormStabilityGrid() {
  const players = useAFLMockPlayers();
  const [selectedStat, setSelectedStat] = useState<StatFilterKey>("fantasy");

  // restore persisted stat lens preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(
      STAT_FILTER_STORAGE_KEY
    ) as StatFilterKey | null;
    if (stored && (stored === "all" || STATS.includes(stored as StatKey))) {
      setSelectedStat(stored);
    }
  }, []);

  const effectiveStat: StatKey =
    selectedStat === "all" ? "fantasy" : selectedStat;

  const selectedLabel =
    selectedStat === "all"
      ? "All Stats"
      : STAT_LABELS[selectedStat as StatKey];

  const statDescriptor =
    selectedStat === "all"
      ? "all key stats combined"
      : selectedLabel.toLowerCase();

  const metrics: PlayerMetrics[] = useMemo(() => {
    return players.map((p) => {
      const series = getSeriesForStat(p, effectiveStat);
      const l5 = lastN(series, 5);
      const avgL5 = average(l5);
      const seasonAvg = average(series) || 1;
      const volatility = stdDev(l5);

      const consistency =
        (series.filter((v) => v >= seasonAvg).length /
          Math.max(series.length, 1)) *
        100;

      let diffLast: number | null = null;
      let slumpScore = 0;
      const last = series[series.length - 1] ?? avgL5;
      const prev = series[series.length - 2] ?? avgL5;
      diffLast = series.length >= 2 ? last - prev : null;

      const l5DeltaFromSeason = avgL5 - seasonAvg;

      // simple blended slump score:
      // heavy weight on L5 vs season, small weight on last-game change
      slumpScore =
        l5DeltaFromSeason * 0.7 + (diffLast !== null ? diffLast * 0.3 : 0);

      return {
        id: p.id,
        name: p.name,
        team: p.team,
        pos: p.pos,
        series,
        avgL5,
        seasonAvg,
        consistency,
        volatility,
        l5DeltaFromSeason,
        diffLast,
        slumpScore,
      };
    });
  }, [players, effectiveStat]);

  const hot = useMemo(
    () =>
      [...metrics]
        .sort((a, b) => b.avgL5 - a.avgL5)
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
        .sort((a, b) => a.slumpScore - b.slumpScore)
        .slice(0, 5),
    [metrics]
  );

  const handleStatClick = (stat: StatFilterKey) => {
    setSelectedStat(stat);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STAT_FILTER_STORAGE_KEY, stat);
    }
  };

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10",
        "bg-gradient-to-br from-[#050507] via-black to-[#111010]",
        "px-4 py-6 md:px-6 md:py-8",
        "shadow-[0_0_80px_rgba(0,0,0,0.75)]"
      )}
    >
      {/* soft background sparkle */}
      <div className="pointer-events-none absolute -top-24 left-10 h-40 w-40 rounded-full bg-yellow-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 right-6 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl" />

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
              Hot risers, rock-solid anchors & form slumps
            </h2>
            <p className="max-w-xl text-xs text-white/65 md:text-sm">
              Last 5 rounds of{" "}
              <span className="font-semibold text-yellow-200">
                {statDescriptor}
              </span>{" "}
              — split into explosive surges, stability leaders and cooling-off
              risks against each player&apos;s season baseline.
            </p>
          </div>

          {/* Stat lens */}
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">
              Stat lens
            </span>
            <div className="flex flex-wrap gap-1.5">
              {STAT_FILTERS.map((s) => {
                const isActive = selectedStat === s;
                const label =
                  s === "all" ? "All" : STAT_LABELS[s as StatKey] ?? s;
                return (
                  <button
                    key={s}
                    onClick={() => handleStatClick(s)}
                    className={cn(
                      "relative overflow-hidden rounded-full px-3 py-1 text-xs md:text-[13px]",
                      "border backdrop-blur-sm transition-all",
                      isActive
                        ? "border-yellow-300 bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,0.6)] scale-[1.03]"
                        : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
                    )}
                  >
                    {isActive && (
                      <span className="pointer-events-none absolute inset-0 -z-10 bg-radial from-white/40 via-yellow-300/20 to-transparent opacity-80" />
                    )}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3-column grid with glow separators on desktop */}
        <div
          className={cn(
            "grid gap-4 md:grid-cols-3 md:gap-5",
            "md:[&>div:nth-child(2)]:border-x md:[&>div:nth-child(2)]:border-white/10",
            "md:[&>div:nth-child(1)]:pr-4 md:[&>div:nth-child(2)]:px-4 md:[&>div:nth-child(3)]:pl-4"
          )}
        >
          {/* HOT */}
          <FormColumn
            title="🔥 Hot form surge"
            subtitle="Highest L5-round output spikes vs season baseline."
            tone="hot"
            icon={Flame}
          >
            {hot.map((p, index) => (
              <PlayerFormCard
                key={p.id}
                name={p.name}
                team={p.team}
                pos={p.pos}
                series={p.series}
                baseline={p.seasonAvg}
                tone="hot"
                metricLabel="Avg last 5"
                metricValue={formatUnitValue(p.avgL5, effectiveStat)}
                metricSubLabel={
                  <span>
                    {formatDeltaUnit(
                      p.l5DeltaFromSeason,
                      effectiveStat
                    )}{" "}
                    <span className="text-white/60">vs season avg</span>
                  </span>
                }
                delay={120 + index * 40}
                metricIcon={TrendingUp}
              />
            ))}
          </FormColumn>

          {/* STABLE */}
          <FormColumn
            title="🛡️ Stability leaders"
            subtitle="High game-to-game reliability & controlled volatility."
            tone="stable"
            icon={Shield}
          >
            {stable.map((p, index) => {
              const meta = stabilityMeta(p.volatility);
              return (
                <PlayerFormCard
                  key={p.id}
                  name={p.name}
                  team={p.team}
                  pos={p.pos}
                  series={p.series}
                  baseline={p.seasonAvg}
                  tone="stable"
                  metricLabel="Consistency"
                  metricValue={`${p.consistency.toFixed(0)}%`}
                  metricSubLabel={
                    <span>
                      <span className={cn("font-medium", meta.colour)}>
                        {meta.label}
                      </span>
                      <span className="text-white/60">
                        {" "}
                        • {meta.reason}
                      </span>
                    </span>
                  }
                  delay={140 + index * 40}
                  metricIcon={Shield}
                />
              );
            })}
          </FormColumn>

          {/* COLD */}
          <FormColumn
            title="❄️ Cooling risks"
            subtitle="Softening outputs and negative trend vs usual form."
            tone="cold"
            icon={Snowflake}
          >
            {cold.map((p, index) => (
              <PlayerFormCard
                key={p.id}
                name={p.name}
                team={p.team}
                pos={p.pos}
                series={p.series}
                baseline={p.seasonAvg}
                tone="cold"
                metricLabel="Last vs prev"
                metricValue={formatDeltaUnit(
                  p.diffLast ?? 0,
                  effectiveStat
                )}
                metricSubLabel={
                  <span>
                    {formatDeltaUnit(
                      p.l5DeltaFromSeason,
                      effectiveStat
                    )}{" "}
                    <span className="text-white/60">vs season avg</span>
                  </span>
                }
                delay={160 + index * 40}
                metricIcon={ArrowDownRight}
              />
            ))}
          </FormColumn>
        </div>
      </div>
    </section>
  );
}
