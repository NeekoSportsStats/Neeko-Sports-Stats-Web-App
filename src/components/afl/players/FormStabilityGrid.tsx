// src/components/afl/players/FormStabilityGrid.tsx
// Hybrid C layout + collapsible sparkline + AI summaries

import React, { useMemo, useState } from "react";
import {
  Flame,
  Shield,
  Snowflake,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAFLMockPlayers,
  getSeriesForStat,
  average,
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

/* ---------------------------------------------------------
   AI summaries (per column)
--------------------------------------------------------- */

const HOT_AI_SUMMARY =
  "AI Summary: Output is trending sharply upward, showing short-term momentum well above season baseline. Signals point to elevated opportunity or role-driven spikes.";

const STABLE_AI_SUMMARY =
  "AI Summary: Strong role stability and low weekly variance. Production clusters tightly around season average, signalling reliable fantasy floors.";

const COOL_AI_SUMMARY =
  "AI Summary: Output is softening versus season norms. Downward drift hints at reduced opportunity, matchup headwinds or role volatility to monitor closely.";

/* ---------------------------------------------------------
   Collapsible Sparkline
--------------------------------------------------------- */

function Sparkline({ data, expanded }: { data: number[]; expanded: boolean }) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const normalized = data.map((v) => ((v - min) / (max - min || 1)) * 100);
  const width = Math.max(normalized.length * 20, 80);

  return (
    <div
      className={cn(
        "transition-all duration-500 ease-out overflow-hidden",
        expanded ? "max-h-24 opacity-100 mt-3" : "max-h-0 opacity-0"
      )}
    >
      <div className="relative h-16 w-full">
        {/* Back line */}
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
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={4}
            className="transition-all duration-700 ease-[cubic-bezier(.17,.67,.43,1)]"
          />
        </svg>

        {/* Foreground line */}
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
            stroke="rgb(255,255,255)"
            strokeWidth={2}
            className="transition-all duration-700 delay-75 ease-out"
          />
        </svg>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Player card (FSCard) — collapsible sparkline + AI text
--------------------------------------------------------- */

interface FSCardProps {
  player: string;
  team: string;
  pos: string;
  value: number;
  unit: string;
  diff: number;
  data: number[];
  accent: string;
  labelTopRight: string;
  aiSummary: string;
}

function FSCard({
  player,
  team,
  pos,
  value,
  unit,
  diff,
  data,
  accent,
  labelTopRight,
  aiSummary,
}: FSCardProps) {
  const [expanded, setExpanded] = useState(false);

  const diffLabel =
    diff > 0 ? `+${diff.toFixed(1)}` : diff < 0 ? diff.toFixed(1) : "0.0";

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className={cn(
        "relative w-full rounded-2xl border p-4 md:p-5 text-left",
        "bg-black/60 backdrop-blur-sm",
        "transition-all duration-300",
        "hover:-translate-y-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60",
        accent
      )}
    >
      {/* Glow on expand */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-0 blur-2xl transition-opacity duration-500",
          expanded && "opacity-30"
        )}
        style={{
          background: accent.includes("red")
            ? "rgba(248,113,113,0.45)"
            : accent.includes("yellow")
            ? "rgba(250,204,21,0.45)"
            : "rgba(56,189,248,0.45)",
        }}
      />

      <div className="relative">
        {/* Header row */}
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-[13px] font-semibold">{player}</p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">
              {team} • {pos}
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.16em] text-white/38">
            {labelTopRight}
          </span>
        </div>

        {/* Value + diff */}
        <div className="mb-1 text-xl font-semibold tabular-nums">
          {value} {unit}
        </div>
        <p className="flex items-center gap-1 text-xs text-white/55 tabular-nums">
          {diff > 0 && (
            <span className="font-semibold text-emerald-300">{diffLabel}</span>
          )}
          {diff < 0 && (
            <span className="font-semibold text-red-300">{diffLabel}</span>
          )}
          {diff === 0 && (
            <span className="font-semibold text-white/40">{diffLabel}</span>
          )}
          <span className="text-white/40">vs avg</span>
        </p>

        {/* Toggle row */}
        <div className="mt-2 flex items-center justify-between text-[11px] text-white/45">
          <span>{expanded ? "Hide trend & AI summary" : "Show trend & AI summary"}</span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-white/45" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/45" />
          )}
        </div>

        {/* Expanded content: AI summary + sparkline */}
        {expanded && (
          <p className="mt-2 text-[11px] leading-snug text-white/70">
            {aiSummary}
          </p>
        )}

        <Sparkline expanded={expanded} data={data} />
      </div>
    </button>
  );
}

/* ---------------------------------------------------------
   Column wrapper (FSColumn) — aligned headers + glow
--------------------------------------------------------- */

interface FSColumnProps {
  title: string;
  icon: React.ReactNode;
  glowClass: string;
  children: React.ReactNode;
}

function FSColumn({ title, icon, glowClass, children }: FSColumnProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-5 md:p-6">
      {/* soft column glow */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-25 blur-3xl",
          glowClass
        )}
      />
      <div className="relative">
        <div className="mb-5 flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        </div>

        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   MAIN SECTION
--------------------------------------------------------- */

export default function FormStabilityGrid() {
  const players = useAFLMockPlayers();
  const [selected, setSelected] = useState<StatKey>("fantasy");

  const unit: string =
    selected === "fantasy"
      ? "pts"
      : selected === "goals"
      ? "goals"
      : selected;

  /* ----- Derived lists ----- */

  const hot = useMemo(() => {
    return [...players]
      .sort((a, b) => {
        const aSeries = getSeriesForStat(a, selected);
        const bSeries = getSeriesForStat(b, selected);
        const aDelta =
          (aSeries.at(-1) ?? 0) - average(aSeries);
        const bDelta =
          (bSeries.at(-1) ?? 0) - average(bSeries);
        return bDelta - aDelta;
      })
      .slice(0, 6);
  }, [players, selected]);

  const stable = useMemo(() => {
    return [...players]
      .sort((a, b) => {
        const aSeries = getSeriesForStat(a, selected);
        const bSeries = getSeriesForStat(b, selected);
        const aBase = average(aSeries) || 1;
        const bBase = average(bSeries) || 1;
        const aConsistency =
          (aSeries.filter((v) => v >= aBase).length /
            Math.max(aSeries.length, 1)) * 100;
        const bConsistency =
          (bSeries.filter((v) => v >= bBase).length /
            Math.max(bSeries.length, 1)) * 100;
        return bConsistency - aConsistency;
      })
      .slice(0, 6);
  }, [players, selected]);

  const cooling = useMemo(() => {
    return [...players]
      .sort((a, b) => {
        const aSeries = getSeriesForStat(a, selected);
        const bSeries = getSeriesForStat(b, selected);
        const aDelta =
          average(aSeries) - (aSeries.at(-1) ?? 0);
        const bDelta =
          average(bSeries) - (bSeries.at(-1) ?? 0);
        return bDelta - aDelta;
      })
      .slice(0, 6);
  }, [players, selected]);

  return (
    <section
      id="form-stability"
      className={cn(
        "mt-14 rounded-3xl border border-white/10",
        "bg-gradient-to-br from-black via-[#050507] to-[#05040a]",
        "px-4 py-8 md:px-8 md:py-11",
        "shadow-[0_0_100px_rgba(0,0,0,0.7)]"
      )}
    >
      {/* background glow */}
      <div className="pointer-events-none absolute inset-x-0 -top-40 h-64 bg-yellow-500/10 blur-3xl" />

      <div className="relative">
        {/* Header pill */}
        <div className="mb-5 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/45 bg-black/70 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-yellow-300">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            FORM STABILITY GRID
          </span>
        </div>

        <h2 className="text-xl font-semibold md:text-2xl">
          Hot risers, rock-solid anchors & form slumps
        </h2>
        <p className="mt-2 mb-6 max-w-2xl text-sm text-white/70 md:text-[15px]">
          Last 5 rounds of{" "}
          <span className="font-semibold text-yellow-300">
            {STAT_LABELS[selected].toLowerCase()}
          </span>{" "}
          — split into surges, stability leaders and cooling risks against each
          player&apos;s season profile.
        </p>

        {/* Stat filter row */}
        <div className="mb-8 flex flex-wrap gap-2">
          {STATS.map((stat) => (
            <button
              key={stat}
              onClick={() => setSelected(stat)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs md:text-sm transition-all",
                "backdrop-blur-sm",
                selected === stat
                  ? "border-yellow-300 bg-yellow-400 text-black font-semibold shadow-[0_0_18px_rgba(250,204,21,0.7)]"
                  : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              {STAT_LABELS[stat]}
            </button>
          ))}
        </div>

        {/* Columns — Hybrid C */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-7 lg:grid-cols-3 lg:gap-8">
          {/* HOT COLUMN */}
          <FSColumn
            title="Hot form surge"
            icon={<Flame className="h-5 w-5 text-red-400" />}
            glowClass="bg-red-500/40"
          >
            {hot.map((p) => {
              const series = getSeriesForStat(p, selected);
              const last = series.at(-1) ?? 0;
              const delta = last - average(series);
              return (
                <FSCard
                  key={p.id}
                  player={p.name}
                  team={p.team}
                  pos={p.pos}
                  value={Math.round(last)}
                  unit={unit}
                  diff={delta}
                  data={series}
                  labelTopRight="AVG LAST 5"
                  accent="border-red-500/45"
                  aiSummary={HOT_AI_SUMMARY}
                />
              );
            })}
          </FSColumn>

          {/* STABILITY COLUMN */}
          <FSColumn
            title="Stability leaders"
            icon={<Shield className="h-5 w-5 text-yellow-300" />}
            glowClass="bg-yellow-400/40"
          >
            {stable.map((p) => {
              const series = getSeriesForStat(p, selected);
              const last = series.at(-1) ?? 0;
              const base = average(series) || 1;
              const consistency =
                (series.filter((v) => v >= base).length /
                  Math.max(series.length, 1)) * 100;

              return (
                <FSCard
                  key={p.id}
                  player={p.name}
                  team={p.team}
                  pos={p.pos}
                  value={Math.round(last)}
                  unit={unit}
                  diff={0} // we explain consistency via label
                  data={series}
                  labelTopRight={`${consistency.toFixed(0)}% CONSISTENCY`}
                  accent="border-yellow-300/45"
                  aiSummary={STABLE_AI_SUMMARY}
                />
              );
            })}
          </FSColumn>

          {/* COOLING COLUMN */}
          <FSColumn
            title="Cooling risks"
            icon={<Snowflake className="h-5 w-5 text-sky-300" />}
            glowClass="bg-sky-400/40"
          >
            {cooling.map((p) => {
              const series = getSeriesForStat(p, selected);
              const last = series.at(-1) ?? 0;
              const delta = last - average(series);
              return (
                <FSCard
                  key={p.id}
                  player={p.name}
                  team={p.team}
                  pos={p.pos}
                  value={Math.round(last)}
                  unit={unit}
                  diff={delta}
                  data={series}
                  labelTopRight="LAST VS AVG"
                  accent="border-sky-300/45"
                  aiSummary={COOL_AI_SUMMARY}
                />
              );
            })}
          </FSColumn>
        </div>
      </div>
    </section>
  );
}
