// src/components/afl/players/PositionTrends.tsx

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
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
   Types & helpers
--------------------------------------------------------- */

type PositionKey = "MID" | "FWD" | "DEF" | "RUC";

type PositionPlayerMetrics = {
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
  stabilityScore: number; // 0–100
  compositeScore: number; // combined trend + stability
};

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

const FANTASY_STAT: StatKey = "fantasy";

const POSITION_CONFIG: {
  key: PositionKey;
  label: string;
  description: string;
  toneClasses: {
    pill: string;
    glow: string;
    border: string;
    header: string;
  };
}[] = [
  {
    key: "MID",
    label: "Mids",
    description: "Inside/wing rotations and centre-square usage trends.",
    toneClasses: {
      pill: "bg-emerald-500/15 text-emerald-200 border-emerald-400/60",
      glow: "from-emerald-500/22 via-transparent to-emerald-400/12",
      border: "border-emerald-400/45",
      header: "text-emerald-100",
    },
  },
  {
    key: "FWD",
    label: "Forwards",
    description: "Forward-half threat, pressure roles and shot volume.",
    toneClasses: {
      pill: "bg-red-500/18 text-red-200 border-red-400/65",
      glow: "from-red-500/25 via-transparent to-orange-400/15",
      border: "border-red-400/45",
      header: "text-red-100",
    },
  },
  {
    key: "DEF",
    label: "Defenders",
    description: "Ball movement chains, intercept load and kick-out share.",
    toneClasses: {
      pill: "bg-sky-500/18 text-sky-100 border-sky-400/60",
      glow: "from-sky-500/25 via-transparent to-cyan-400/15",
      border: "border-sky-400/45",
      header: "text-sky-100",
    },
  },
  {
    key: "RUC",
    label: "Rucks",
    description: "Ruck share, stoppage work and around-the-ground impact.",
    toneClasses: {
      pill: "bg-purple-500/18 text-purple-100 border-purple-400/60",
      glow: "from-purple-500/25 via-transparent to-fuchsia-400/15",
      border: "border-purple-400/45",
      header: "text-purple-100",
    },
  },
];

/* ---------------------------------------------------------
   Mini sparkline
--------------------------------------------------------- */

function MiniSparkline({ data }: { data: number[] }) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const normalized = data.map((v) => ((v - min) / (max - min || 1)) * 100);
  const width = Math.max(normalized.length * 18, 64);

  return (
    <div className="relative h-10 w-full">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${width} 100`}
        preserveAspectRatio="none"
      >
        {/* soft glow */}
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
          stroke="rgba(250,250,250,0.22)"
          strokeWidth={4}
          className="drop-shadow-[0_0_10px_rgba(0,0,0,0.7)]"
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
          stroke="rgba(250,250,250,0.9)"
          strokeWidth={2}
        />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------
   Role-style helpers (label & badge)
--------------------------------------------------------- */

function inferRoleType(pos: string): string {
  const upper = pos.toUpperCase();
  if (upper.includes("MID") && upper.includes("FWD")) return "MID/FWD hybrid";
  if (upper.includes("MID") && upper.includes("DEF")) return "MID/DEF hybrid";
  if (upper.includes("MID")) return "Inside/wing mid";
  if (upper.includes("RUC") && upper.includes("FWD")) return "Ruck/forward split";
  if (upper.includes("RUC")) return "Primary ruck";
  if (upper.includes("DEF")) return "Rebounding defender";
  if (upper.includes("FWD")) return "Attacking forward";
  return "Versatile role";
}

function roleDirectionLabel(delta: number): { label: string; tone: string } {
  if (delta > 5) return { label: "Role trending up", tone: "text-emerald-300" };
  if (delta > 1.5) return { label: "Subtle uptick", tone: "text-emerald-200" };
  if (delta < -5) return { label: "Role trending down", tone: "text-red-300" };
  if (delta < -1.5) return { label: "Softening role", tone: "text-red-200" };
  return { label: "Role holding steady", tone: "text-zinc-300" };
}

/* ---------------------------------------------------------
   Row card (for hot & cold lists)
--------------------------------------------------------- */

function PositionPlayerCard({
  metric,
  variant, // "hot" | "cold"
}: {
  metric: PositionPlayerMetrics;
  variant: "hot" | "cold";
}) {
  const { label: directionLabel, tone } = roleDirectionLabel(
    metric.deltaVsSeason
  );

  const icon =
    variant === "hot" ? (
      <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
    ) : (
      <TrendingDown className="h-3.5 w-3.5 text-red-300" />
    );

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/60 px-3.5 py-3 text-xs shadow-[0_0_18px_rgba(0,0,0,0.7)] backdrop-blur-xl md:px-4 md:py-3.5">
      {/* subtle top wash */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/6 via-transparent to-transparent" />
      <div className="relative flex flex-col gap-2">
        {/* header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2 py-0.5">
              {icon}
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
                {variant === "hot" ? "Hot mover" : "Cooling signal"}
              </span>
            </div>
            <p className="text-sm font-semibold text-white">{metric.name}</p>
            <p className="text-[11px] text-white/55">
              {metric.team} • {metric.pos} • {inferRoleType(metric.pos)}
            </p>
          </div>

          <div className="text-right space-y-0.5">
            <p className="text-[11px] text-white/65">
              L5 avg{" "}
              <span className="font-semibold text-white">
                {metric.avgL5.toFixed(1)}
              </span>
            </p>
            <p className="text-[11px] text-white/65">
              Season{" "}
              <span className="font-semibold text-white/90">
                {metric.avgSeason.toFixed(1)}
              </span>
            </p>
            <p className={cn("text-[11px] font-medium", tone)}>
              {metric.deltaVsSeason > 0
                ? `+${metric.deltaVsSeason.toFixed(1)} vs avg`
                : `${metric.deltaVsSeason.toFixed(1)} vs avg`}
            </p>
            <p className="text-[11px] text-white/60">
              Stability{" "}
              <span className="font-semibold text-yellow-300">
                {metric.stabilityScore.toFixed(0)}%
              </span>
            </p>
          </div>
        </div>

        {/* sparkline & directional text */}
        <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)] gap-2 pt-1">
          <div>
            <MiniSparkline data={metric.l5} />
          </div>
          <div className="flex flex-col justify-center gap-1 text-[11px] text-white/70">
            <p className={tone}>{directionLabel}</p>
            <p className="text-white/55">
              Composite role trend score{" "}
              <span className="font-semibold text-white/90">
                {metric.compositeScore.toFixed(1)}
              </span>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Main Section
--------------------------------------------------------- */

export default function PositionTrends() {
  const players = useAFLMockPlayers();
  const [selectedPos, setSelectedPos] = useState<PositionKey>("MID");

  // Build metrics for each player for the FANTASY_STAT
  const metricsByPosition: Record<PositionKey, PositionPlayerMetrics[]> =
    useMemo(() => {
      const base: Record<PositionKey, PositionPlayerMetrics[]> = {
        MID: [],
        FWD: [],
        DEF: [],
        RUC: [],
      };

      players.forEach((p) => {
        const series = getSeriesForStat(p, FANTASY_STAT);
        if (!series?.length) return;

        const l5 = lastN(series, 5);
        const avgL5 = average(l5);
        const avgSeason = average(series);
        const deltaVsSeason = avgL5 - avgSeason;

        const vol = stdDev(l5);
        const baseVal = avgL5 || avgSeason || 1;
        const stability = clamp01(1 - vol / baseVal) * 100;

        // Composite trend: combine delta and stability
        // Weight: 70% trend, 30% stability factor
        const stabilityFactor = 0.3 + 0.7 * (stability / 100);
        const composite = deltaVsSeason * stabilityFactor;

        const metrics: PositionPlayerMetrics = {
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
          stabilityScore: stability,
          compositeScore: composite,
        };

        const upperPos = p.pos.toUpperCase();

        if (upperPos.includes("MID")) base.MID.push(metrics);
        if (upperPos.includes("FWD")) base.FWD.push(metrics);
        if (upperPos.includes("DEF")) base.DEF.push(metrics);
        if (upperPos.includes("RUC")) base.RUC.push(metrics);
      });

      return base;
    }, [players]);

  const currentConfig = POSITION_CONFIG.find((c) => c.key === selectedPos)!;
  const currentMetrics = metricsByPosition[selectedPos] ?? [];

  const hot = useMemo(
    () =>
      [...currentMetrics]
        .sort((a, b) => b.compositeScore - a.compositeScore)
        .slice(0, 3),
    [currentMetrics]
  );

  const cold = useMemo(
    () =>
      [...currentMetrics]
        .sort((a, b) => a.compositeScore - b.compositeScore)
        .slice(0, 3),
    [currentMetrics]
  );

  return (
    <section
      className={cn(
        "relative mt-8 rounded-3xl border border-white/10",
        "bg-gradient-to-br from-[#050507] via-black to-[#101016]",
        "px-4 py-6 md:px-6 md:py-8",
        "shadow-[0_0_70px_rgba(0,0,0,0.75)] overflow-hidden"
      )}
    >
      {/* background wash tuned per section */}
      <div className="pointer-events-none absolute inset-x-[-60px] top-24 bottom-[-60px] bg-gradient-to-r from-emerald-500/15 via-red-500/10 to-sky-500/18 blur-3xl opacity-60" />

      {/* top glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-44 w-[380px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />

      <div className="relative space-y-5">
        {/* Header row */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/50 bg-black/80 px-3 py-1 text-xs text-violet-100/90">
              <Sparkles className="h-3.5 w-3.5 text-violet-200" />
              <span className="uppercase tracking-[0.18em]">
                Position Trends
              </span>
            </div>
            <h2 className="text-xl font-semibold md:text-2xl">
              Role-driven trends by line
            </h2>
            <p className="max-w-xl text-xs text-white/70 md:text-sm">
              Blends{" "}
              <span className="font-semibold text-emerald-200">
                recent fantasy output
              </span>{" "}
              with{" "}
              <span className="font-semibold text-sky-200">
                stability and volatility
              </span>{" "}
              to surface the most important movers and softening role signals
              across each position.
            </p>
          </div>

          {/* Tabs for positions */}
          <div className="flex flex-col items-start gap-2 md:items-end">
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/45">
              Position lens
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POSITION_CONFIG.map((pos) => {
                const active = pos.key === selectedPos;
                return (
                  <button
                    key={pos.key}
                    onClick={() => {
                      setSelectedPos(pos.key);
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs md:text-[13px] backdrop-blur-sm transition-all",
                      active
                        ? "bg-white text-black border-white shadow-[0_0_18px_rgba(250,250,250,0.65)]"
                        : "bg-white/5 text-white/70 border-white/15 hover:bg-white/10"
                    )}
                  >
                    <Activity className="h-3.5 w-3.5" />
                    <span>{pos.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active position shell */}
        <div
          className={cn(
            "relative mt-1 rounded-2xl border bg-black/60 px-4 py-4 md:px-5 md:py-5",
            "overflow-hidden backdrop-blur-xl",
            currentConfig.toneClasses.border
          )}
        >
          {/* tone wash */}
          <div
            className={cn(
              "pointer-events-none absolute inset-0 rounded-2xl opacity-65 bg-gradient-to-br",
              currentConfig.toneClasses.glow
            )}
          />

          <div className="relative space-y-4">
            {/* Position header row */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1.5">
                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]",
                    currentConfig.toneClasses.pill
                  )}
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>{currentConfig.label} – Role Tilt View</span>
                </div>
                <p
                  className={cn(
                    "text-xs md:text-sm",
                    currentConfig.toneClasses.header
                  )}
                >
                  {currentConfig.description}
                </p>
              </div>

              <div className="text-[11px] text-white/60 md:text-right">
                <p className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Composite trend = L5 vs season × stability factor</span>
                </p>
                <p className="mt-1">
                  Higher scores highlight players whose role and scoring profile
                  are shifting meaningfully.
                </p>
              </div>
            </div>

            {/* 2-column layout: hot vs cold */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Hot movers */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100">
                        Hot movers
                      </p>
                      <p className="text-[11px] text-white/70">
                        Rising form with improving role indicators.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-white/45">
                    Top 3 by composite trend
                  </span>
                </div>

                {hot.length === 0 && (
                  <p className="text-[11px] text-white/50">
                    Not enough data for this position yet.
                  </p>
                )}

                {hot.map((m) => (
                  <PositionPlayerCard
                    key={`hot-${selectedPos}-${m.id}`}
                    metric={m}
                    variant="hot"
                  />
                ))}
              </div>

              {/* Cooling signals */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/15">
                      <TrendingDown className="h-3.5 w-3.5 text-red-300" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-100">
                        Cooling risks
                      </p>
                      <p className="text-[11px] text-white/70">
                        Softening trend lines that may signal role pressure.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-white/45">
                    Bottom 3 by composite trend
                  </span>
                </div>

                {cold.length === 0 && (
                  <p className="text-[11px] text-white/50">
                    Not enough data for this position yet.
                  </p>
                )}

                {cold.map((m) => (
                  <PositionPlayerCard
                    key={`cold-${selectedPos}-${m.id}`}
                    metric={m}
                    variant="cold"
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
