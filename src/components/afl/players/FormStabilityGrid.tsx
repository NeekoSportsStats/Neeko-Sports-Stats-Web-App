// src/components/afl/players/FormStabilityGrid.tsx
import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, ChevronDown } from "lucide-react";

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

/* ---------------------------------------------------------
   Types / helpers
--------------------------------------------------------- */

type Tone = "hot" | "stable" | "cold";

type PlayerMetrics = {
  id: number;
  name: string;
  team: string;
  pos: string;
  series: number[];
  l5: number[];
  avgL5: number;
  avgSeason: number;
  deltaVsSeason: number;
  volatility: number;
  consistency: number;
};

function formatMainValue(value: number, stat: StatKey): string {
  const label = STAT_LABELS[stat].toLowerCase();
  if (stat === "goals") {
    return `${value.toFixed(1)} ${label}`;
  }
  return `${Math.round(value)} ${label}`;
}

function formatDelta(delta: number, stat: StatKey): string {
  const label = STAT_LABELS[stat].toLowerCase();
  if (Math.abs(delta) < 0.05) return `±0.0 ${label} vs avg`;

  const sign = delta > 0 ? "+" : "−";
  const abs = Math.abs(delta);
  const rounded = stat === "goals" ? abs.toFixed(1) : abs.toFixed(1);

  return `${sign}${rounded} ${label} vs avg`;
}

function deltaTone(delta: number): string {
  if (delta > 0.1) return "text-emerald-300";
  if (delta < -0.1) return "text-red-300";
  return "text-zinc-400";
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

/* ---------------------------------------------------------
   Sparkline
--------------------------------------------------------- */

function TrendSparkline({ data, tone }: { data: number[]; tone: Tone }) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const normalized = data.map((v) => ((v - min) / (max - min || 1)) * 100);
  const width = Math.max(normalized.length * 22, 80);

  const strokeBase =
    tone === "hot"
      ? "rgba(248,113,113"
      : tone === "stable"
      ? "rgba(250,204,21"
      : "rgba(56,189,248";

  return (
    <div className="relative mt-3 h-16 w-full">
      {/* Glow line */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${width} 100`}
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
          stroke={`${strokeBase},0.35)`}
          strokeWidth={4}
          className="drop-shadow-[0_0_14px_rgba(0,0,0,0.8)]"
        />
      </svg>

      {/* Main line */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${width} 100`}
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
          stroke={`${strokeBase},1)`}
          strokeWidth={2.4}
        />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------
   Summaries
--------------------------------------------------------- */

const buildHotSummary = (m: PlayerMetrics, stat: StatKey) => {
  const label = STAT_LABELS[stat].toLowerCase();
  const direction = m.deltaVsSeason > 0 ? "above" : "below";
  const abs = Math.abs(m.deltaVsSeason).toFixed(1);
  return `${m.name} is running hot with recent ${label} output sitting ${abs} ${label} ${direction} their season baseline.`;
};

const buildStableSummary = (m: PlayerMetrics, stat: StatKey) => {
  const label = STAT_LABELS[stat].toLowerCase();
  return `${m.name} is a rock-solid ${label} option, tracking a ${m.consistency.toFixed(
    0
  )}% consistency score with minimal swings.`;
};

const buildCoolingSummary = (m: PlayerMetrics, stat: StatKey) => {
  const label = STAT_LABELS[stat].toLowerCase();
  const abs = Math.abs(m.deltaVsSeason).toFixed(1);
  return `${m.name} has cooled off, sitting ${abs} ${label} below their usual baseline across the last five rounds.`;
};

/* ---------------------------------------------------------
   Row Card
--------------------------------------------------------- */

function PlayerRowCard({
  tone,
  title,
  metric,
  stat,
  isOpen,
  onToggle,
  summaryBuilder,
  showConsistency,
}: {
  tone: Tone;
  title: string;
  metric: PlayerMetrics;
  stat: StatKey;
  isOpen: boolean;
  onToggle: () => void;
  summaryBuilder: (m: PlayerMetrics, stat: StatKey) => string;
  showConsistency?: boolean;
}) {
  const mainValue = formatMainValue(metric.avgL5, stat);
  const deltaLabel = formatDelta(metric.deltaVsSeason, stat);

  const badgeBg =
    tone === "hot"
      ? "bg-red-500/25 text-red-200"
      : tone === "stable"
      ? "bg-yellow-400/25 text-yellow-100"
      : "bg-cyan-400/25 text-cyan-100";

  const cardGlow =
    tone === "hot"
      ? "shadow-[0_0_20px_rgba(239,68,68,0.45)]"
      : tone === "stable"
      ? "shadow-[0_0_20px_rgba(250,204,21,0.45)]"
      : "shadow-[0_0_20px_rgba(56,189,248,0.45)]";

  const cardBorder =
    tone === "hot"
      ? "border-red-500/35"
      : tone === "stable"
      ? "border-yellow-400/35"
      : "border-cyan-400/35";

  return (
    <button
      onClick={onToggle}
      className={cn(
        "group relative w-full text-left rounded-xl border px-4 py-3 md:px-5 md:py-4",
        "bg-black/55 backdrop-blur-xl transition-all duration-200 hover:-translate-y-[2px]",
        cardGlow,
        cardBorder
      )}
    >
      {/* Inner gradient glow */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-xl opacity-60",
          tone === "hot" &&
            "bg-gradient-to-br from-red-600/20 via-transparent to-red-400/10",
          tone === "stable" &&
            "bg-gradient-to-br from-yellow-400/25 via-transparent to-yellow-300/10",
          tone === "cold" &&
            "bg-gradient-to-br from-sky-400/25 via-transparent to-sky-300/10"
        )}
      />

      <div className="relative space-y-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.15em]",
                badgeBg
              )}
            >
              {title}
            </span>

            <div>
              <p className="text-sm font-semibold text-white">{metric.name}</p>
              <p className="text-[11px] text-white/55">
                {metric.team} • {metric.pos}
              </p>
            </div>
          </div>

          <div className="text-right space-y-1">
            <p className="text-sm font-semibold text-white">{mainValue}</p>
            <p className={cn("text-[11px] font-medium", deltaTone(metric.deltaVsSeason))}>
              {deltaLabel}
            </p>
            {showConsistency && (
              <p className="text-[11px] text-white/60">
                Consistency{" "}
                <span className="font-semibold text-yellow-300">
                  {metric.consistency.toFixed(0)}%
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Tagline + chevron */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-white/65 md:text-xs">
            {tone === "hot" && "Trending up in recent output."}
            {tone === "stable" && "Steady output with controlled volatility."}
            {tone === "cold" && "Softening output vs usual baseline."}
          </p>

          <div className="flex items-center gap-1 text-[11px] text-white/60">
            <span>{isOpen ? "Hide trend" : "Show trend"}</span>
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")}
            />
          </div>
        </div>

        {/* Expanded */}
        {isOpen && (
          <div className="mt-3 border-t border-white/10 pt-3 animate-in fade-in slide-in-from-top-1">
            <TrendSparkline data={metric.l5} tone={tone} />
            <p className="mt-2 text-[11px] text-white/70 md:text-xs leading-relaxed">
              {summaryBuilder(metric, stat)}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}

/* ---------------------------------------------------------
   Column Shell
--------------------------------------------------------- */

function ColumnShell({
  tone,
  title,
  subtitle,
  children,
}: {
  tone: Tone;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const headingColor =
    tone === "hot"
      ? "text-red-200"
      : tone === "stable"
      ? "text-yellow-200"
      : "text-cyan-200";

  return (
    <div className="relative space-y-4">
      <div>
        <p className={cn("text-xs font-semibold uppercase tracking-[0.17em]", headingColor)}>
          {title}
        </p>
        <p className="text-[11px] text-white/65 md:text-xs">{subtitle}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

/* ---------------------------------------------------------
   Main
--------------------------------------------------------- */

export default function FormStabilityGrid() {
  const players = useAFLMockPlayers();
  const [selectedStat, setSelectedStat] = useState<StatKey>("fantasy");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const statLabel = STAT_LABELS[selectedStat];

  const metrics: PlayerMetrics[] = useMemo(() => {
    return players.map((p) => {
      const series = getSeriesForStat(p, selectedStat);
      const l5 = lastN(series, 5);
      const avgL5 = average(l5);
      const avgSeason = average(series);
      const deltaVsSeason = avgL5 - avgSeason;

      const vol = stdDev(l5);
      const base = avgL5 || avgSeason || 1;
      const consistency = clamp01(1 - vol / base) * 100;

      return {
        id: p.id,
        name: p.name,
        team: p.team,
        pos: p.pos,
        series,
        l5,
        avgL5,
        avgSeason,
        deltaVsSeason,
        volatility: vol,
        consistency,
      };
    });
  }, [players, selectedStat]);

  const hot = useMemo(
    () => [...metrics].sort((a, b) => b.deltaVsSeason - a.deltaVsSeason).slice(0, 5),
    [metrics]
  );

  const stable = useMemo(
    () => [...metrics].sort((a, b) => b.consistency - a.consistency).slice(0, 5),
    [metrics]
  );

  const cooling = useMemo(
    () => [...metrics].sort((a, b) => a.deltaVsSeason - b.deltaVsSeason).slice(0, 5),
    [metrics]
  );

  const makeKey = (tone: Tone, id: number) => `${tone}-${id}`;

  return (
    <section
      className={cn(
        "relative rounded-3xl border border-white/10 px-4 py-6 md:px-6 md:py-8",
        "bg-gradient-to-br from-[#050507] via-black to-[#111010]",
        "shadow-[0_0_80px_rgba(0,0,0,0.75)] overflow-hidden"
      )}
    >
      {/* Column glow wash */}
      <div className="pointer-events-none absolute inset-x-[-90px] top-28 bottom-[-90px] bg-gradient-to-r from-red-500/25 via-yellow-400/25 to-sky-400/25 blur-3xl opacity-70" />

      {/* Top glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-48 w-[420px] -translate-x-1/2 rounded-full bg-yellow-500/20 blur-3xl" />

      <div className="relative space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-black/80 px-3 py-1 text-xs text-yellow-200/90">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              <span className="uppercase tracking-[0.18em]">Form Stability Grid</span>
            </div>

            <h2 className="text-xl font-semibold md:text-2xl">
              Hot risers, rock-solid anchors &amp; form slumps
            </h2>

            <p className="max-w-xl text-xs text-white/70 md:text-sm">
              Last 5 rounds of{" "}
              <span className="font-semibold text-yellow-200">{statLabel.toLowerCase()}</span>{" "}
              — split into recent surges, stability leaders and cooling risks.
            </p>
          </div>

          {/* Stat lens */}
          <div className="flex flex-col items-start gap-2 md:items-end">
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/45">
              Stat lens
            </span>

            <div className="flex flex-wrap gap-1.5">
              {STATS.map((s) => {
                const active = selectedStat === s;
                return (
                  <button
                    key={s}
                    onClick={() => {
                      setSelectedStat(s);
                      setOpenKey(null);
                    }}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs md:text-[13px] border transition-all backdrop-blur-sm",
                      active
                        ? "bg-yellow-400 text-black border-yellow-300 font-semibold shadow-[0_0_22px_rgba(250,204,21,0.9)]"
                        : "bg-white/5 text-white/70 border-white/12 hover:bg-white/10"
                    )}
                  >
                    {STAT_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columns */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* HOT */}
          <ColumnShell
            tone="hot"
            title="Hot Form Surge"
            subtitle="Biggest L5 surges vs season baseline."
          >
            {hot.map((m) => {
              const key = makeKey("hot", m.id);
              return (
                <PlayerRowCard
                  key={key}
                  tone="hot"
                  title="Hot Form"
                  metric={m}
                  stat={selectedStat}
                  isOpen={openKey === key}
                  onToggle={() => setOpenKey(openKey === key ? null : key)}
                  summaryBuilder={buildHotSummary}
                />
              );
            })}
          </ColumnShell>

          {/* STABLE */}
          <ColumnShell
            tone="stable"
            title="Stability Leaders"
            subtitle="Lowest volatility with dependable L5 output."
          >
            {stable.map((m) => {
              const key = makeKey("stable", m.id);
              return (
                <PlayerRowCard
                  key={key}
                  tone="stable"
                  title="Stability"
                  metric={m}
                  stat={selectedStat}
                  isOpen={openKey === key}
                  onToggle={() => setOpenKey(openKey === key ? null : key)}
                  summaryBuilder={buildStableSummary}
                  showConsistency
                />
              );
            })}
          </ColumnShell>

          {/* COOLING */}
          <ColumnShell
            tone="cold"
            title="Cooling Risks"
            subtitle="Softening L5 output vs usual baseline."
          >
            {cooling.map((m) => {
              const key = makeKey("cold", m.id);
              return (
                <PlayerRowCard
                  key={key}
                  tone="cold"
                  title="Cooling"
                  metric={m}
                  stat={selectedStat}
                  isOpen={openKey === key}
                  onToggle={() => setOpenKey(openKey === key ? null : key)}
                  summaryBuilder={buildCoolingSummary}
                />
              );
            })}
          </ColumnShell>
        </div>
      </div>
    </section>
  );
}
