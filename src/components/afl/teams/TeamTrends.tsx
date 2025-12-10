// src/components/afl/teams/TeamTrends.tsx

import React, { useMemo, useState, useId } from "react";
import { MOCK_TEAMS } from "./mockTeams";
import { TrendingUp, Shield, Activity, MoveVertical } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                           Tooltip formatting helpers                       */
/* -------------------------------------------------------------------------- */

function inferUnit(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes("%") || lower.includes("efficiency")) return "%";
  if (lower.includes("points") || lower.includes("score") || lower.includes("conceded")) return "pts";
  if (lower.includes("clearance")) return "clearances";
  if (lower.includes("wins")) return "wins";
  if (lower.includes("intercept")) return "marks";
  if (lower.includes("hit") || lower.includes("hit outs")) return "hitouts";
  if (lower.includes("influence")) return "rating";
  if (lower.includes("pressure")) return "index";
  if (lower.includes("trend")) return "index";
  return "";
}

function formatTooltipValue(value: number, unit: string): string {
  const v = value.toFixed(1);
  if (unit === "%") return `${v}%`;
  if (!unit) return v;
  return `${v} ${unit}`;
}

function formatTooltipDelta(delta: number | null, unit: string): string {
  if (delta === null) return "Δ —";
  if (Math.abs(delta) < 0.05) return "Δ 0.0";
  const sign = delta > 0 ? "+" : "−";
  const mag = Math.abs(delta).toFixed(1);
  if (!unit) return `Δ ${sign}${mag}`;
  if (unit === "%") return `Δ ${sign}${mag}%`;
  return `Δ ${sign}${mag} ${unit}`;
}

/* -------------------------------------------------------------------------- */
/*                   Heatline Strip v4 — Premium Telemetry Bar               */
/* -------------------------------------------------------------------------- */

type HeatlineStripProps = {
  values: number[];
  accent: string;
  label: string;
  isPositiveTrend: boolean | null;
};

function HeatlineStrip({ values, accent, label, isPositiveTrend }: HeatlineStripProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Last 12 rounds only
  const recent = useMemo(
    () => (values.length > 12 ? values.slice(-12) : values),
    [values]
  );
  const startIndex = values.length - recent.length;

  const min = Math.min(...recent);
  const max = Math.max(...recent);
  const range = max - min || 1;

  const unit = useMemo(() => inferUnit(label), [label]);
  const gradientId = useId();

  const baselineTranslate =
    isPositiveTrend == null
      ? "translateY(0)"
      : isPositiveTrend
      ? "translateY(-4px)"
      : "translateY(4px)";

  return (
    <div
      className="
        relative h-[54px] w-full rounded-xl overflow-hidden 
        bg-gradient-to-b from-neutral-700/40 via-neutral-900/80 to-black
        border border-slate-400/20 shadow-[0_6px_16px_rgba(0,0,0,0.55)]
        flex items-center justify-between px-[6px]
      "
    >
      {/* Fade edges */}
      <div className="absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-black via-black/60 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-black via-black/60 to-transparent pointer-events-none" />

      {/* Midline baseline with rising animation when positive */}
      <div
        className="absolute left-0 w-full border-t border-white/7 pointer-events-none transition-transform duration-400"
        style={{
          top: "50%",
          transform: baselineTranslate,
        }}
      />

      {/* SVG scan sweep (subtle) */}
      <svg
        className="absolute inset-0 pointer-events-none opacity-[0.16]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor={accent} stopOpacity={0.7} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <rect
          x="-40%"
          y="0"
          width="40%"
          height="100%"
          fill={`url(#${gradientId})`}
          style={{ animation: "scanSweep 5s linear infinite" }}
        />
      </svg>

      {/* Flow shimmer overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.14]"
        style={{
          background: `repeating-linear-gradient(
            -75deg,
            transparent 0%,
            ${accent}22 8%,
            transparent 16%
          )`,
          animation: "flowMove 3.6s linear infinite",
        }}
      />

      {/* Bars + mobile 2-row layout (6x2 on mobile, 12x1 on >= sm) */}
      <div
        className="
          w-full h-full grid 
          grid-cols-6 grid-rows-2 
          sm:grid-cols-12 sm:grid-rows-1
          gap-[2px] 
          items-end
          px-[4px]
        "
      >
        {recent.map((v, i) => {
          const norm = (v - min) / range;
          const barH = 6 + norm * 34;

          const isPeak = v === max;
          const isLow = v === min;
          const isHover = hoverIndex === i;

          // Colour ramp: darker base → bright → glow
          const ramp = `linear-gradient(
            to top,
            ${accent}22,
            ${accent}55,
            ${accent}cc
          )`;

          const globalIndex = startIndex + i;
          const prevVal = globalIndex > 0 ? values[globalIndex - 1] : null;
          const delta = prevVal != null ? v - prevVal : null;

          const valueLabel = formatTooltipValue(v, unit);
          const deltaLabel = formatTooltipDelta(delta, unit);

          return (
            <div
              key={i}
              className="relative flex items-end justify-center"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              {/* Extreme ticks + micro labels */}
              {isPeak && (
                <>
                  <div
                    className="absolute top-[2px] h-[3px] w-[4px] rounded-sm"
                    style={{
                      background: accent,
                      boxShadow: `0 0 4px ${accent}`,
                    }}
                  />
                  <div className="absolute top-[8px] text-[7px] font-semibold text-neutral-200 tracking-[0.14em] uppercase">
                    H
                  </div>
                </>
              )}
              {isLow && (
                <>
                  <div
                    className="absolute bottom-[2px] h-[3px] w-[4px] rounded-sm"
                    style={{
                      background: accent,
                      boxShadow: `0 0 4px ${accent}`,
                    }}
                  />
                  <div className="absolute bottom-[8px] text-[7px] font-semibold text-neutral-400 tracking-[0.14em] uppercase">
                    L
                  </div>
                </>
              )}

              {/* Main bar */}
              <div
                className="w-[4px] rounded-full transition-all duration-200 origin-bottom"
                style={{
                  height: `${barH}px`,
                  background: ramp,
                  opacity: isHover ? 1 : 0.82,
                  boxShadow: isHover
                    ? `0 0 6px ${accent}, 0 0 14px ${accent}cc`
                    : `0 0 3px ${accent}55`,
                  transform: isHover
                    ? "translateZ(0) scaleY(1.18) scaleX(1.12)"
                    : "translateZ(0) scale(1)",
                  filter: isHover ? `drop-shadow(0 0 8px ${accent}aa)` : "none",
                  willChange: "transform, opacity",
                }}
              />

              {/* Tooltip */}
              {isHover && (
                <div
                  className="
                    absolute bottom-full mb-1 px-2 py-1 rounded-md text-[10px] 
                    bg-black/90 backdrop-blur-sm border border-white/10 text-neutral-200
                    whitespace-nowrap pointer-events-none z-20
                  "
                >
                  <div className="uppercase text-[8px] tracking-wider text-neutral-400">
                    Round {globalIndex + 1}
                  </div>
                  <div className="font-semibold">{valueLabel}</div>
                  {delta !== null && (
                    <div className="text-[9px] text-neutral-400">{deltaLabel}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Keyframes (global, but defined once per component mount) */}
      <style>{`
        @keyframes flowMove {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
        @keyframes scanSweep {
          0% { transform: translateX(0%); }
          100% { transform: translateX(200%); }
        }
        @keyframes breath {
          0% { opacity: 0.0; transform: scale(0.96); }
          50% { opacity: 1; transform: scale(1.04); }
          100% { opacity: 0.0; transform: scale(0.96); }
        }
      `}</style>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Metric summary (5-round smoothing)                 */
/* -------------------------------------------------------------------------- */

type TrendDirection = "up" | "down" | "flat";

type MetricSummary = {
  current: number;
  deltaPct: number | null;
  direction: TrendDirection;
  isGood: boolean | null;
};

function average(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function computeMetricSummary(
  values: number[],
  goodDirection: "up" | "down"
): MetricSummary {
  if (!values.length) {
    return { current: 0, deltaPct: null, direction: "flat", isGood: null };
  }

  if (values.length < 10) {
    const current = average(values);
    return { current, deltaPct: null, direction: "flat", isGood: null };
  }

  const last5 = values.slice(-5);
  const prev5 = values.slice(-10, -5);

  const lastAvg = average(last5);
  const prevAvg = average(prev5);

  if (prevAvg === 0) {
    return { current: lastAvg, deltaPct: null, direction: "flat", isGood: null };
  }

  let deltaPct = ((lastAvg - prevAvg) / prevAvg) * 100;

  // Clamp volatility
  if (deltaPct > 15) deltaPct = 15;
  if (deltaPct < -15) deltaPct = -15;

  let direction: TrendDirection = "flat";
  if (deltaPct > 0.1) direction = "up";
  else if (deltaPct < -0.1) direction = "down";

  const isGood = goodDirection === "up" ? deltaPct >= 0 : deltaPct <= 0;

  return { current: lastAvg, deltaPct, direction, isGood };
}

function formatNumber(value: number, isPercentMetric: boolean): string {
  if (isPercentMetric) return `${value.toFixed(1)}%`;
  return value.toFixed(1);
}

/* -------------------------------------------------------------------------- */
/*                             Trend block component                          */
/* -------------------------------------------------------------------------- */

type TrendSeries = {
  label: string;
  values: number[];
  goodDirection: "up" | "down";
};

function TrendBlock({
  title,
  icon,
  description,
  accent,
  series,
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  accent: string;
  series: TrendSeries[];
}) {
  return (
    <div
      className="group relative rounded-3xl border border-neutral-800/70 
      bg-gradient-to-b from-neutral-900/85 via-black to-black/95 
      p-4 md:p-5 shadow-[0_18px_48px_rgba(0,0,0,0.85)]"
      style={{
        boxShadow:
          "0 18px 48px rgba(0,0,0,0.85), 0 0 22px rgba(15,23,42,0.6)",
      }}
    >
      {/* Live breathing halo on hover */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[26px] 
        opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle_at_top, ${accent}14, transparent 60%)`,
          animation: "breath 3.4s ease-in-out infinite",
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="h-4 w-[1.5px] rounded-full"
            style={{
              background: `linear-gradient(to bottom, ${accent}, transparent)`,
              boxShadow: `0 0 8px ${accent}44`,
            }}
          />
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-base font-semibold text-neutral-50 md:text-lg">
              {title}
            </h3>
          </div>
        </div>

        <p className="mt-1 max-w-xl text-[11px] text-neutral-300 leading-snug md:text-xs">
          {description}
        </p>

        <div className="mt-4 border-t border-neutral-800/70 pt-4" />

        {/* Metric grid */}
        <div className="grid gap-4 md:grid-cols-2 md:gap-x-6 md:gap-y-5">
          {series.map((s, index) => {
            const summary = computeMetricSummary(s.values, s.goodDirection);
            const isPercent = s.label.includes("%");
            const isTrendLabel = s.label.toLowerCase() === "trend";

            let deltaLabel = "– 0.0%";
            let deltaClass = "text-neutral-400";
            let arrow = "";

            if (summary.deltaPct !== null) {
              const absPct = Math.abs(summary.deltaPct);
              const formattedPct = `${absPct.toFixed(1)}%`;

              if (absPct < 0.1) {
                deltaLabel = "– 0.0%";
                deltaClass = "text-neutral-400";
              } else {
                const isUp = summary.direction === "up";
                const isGood = summary.isGood ?? false;
                arrow = isUp ? "▲" : "▼";
                deltaLabel = `${arrow} ${formattedPct}`;
                deltaClass = isGood ? "text-emerald-400" : "text-rose-400";
              }
            }

            const valueLabel = formatNumber(summary.current, isPercent);
            const isPositiveTrend =
              summary.deltaPct !== null ? summary.deltaPct >= 0 : null;

            return (
              <div
                key={s.label}
                className={
                  index % 2 === 1
                    ? "space-y-2 md:border-l md:border-neutral-900/70 md:pl-4"
                    : "space-y-2 md:pr-4"
                }
              >
                {/* Label + numbers */}
                <div className="flex items-baseline justify-between gap-3">
                  <div
                    className={`text-[9px] md:text-[10px] uppercase tracking-[0.16em] ${
                      isTrendLabel ? "text-neutral-400" : "text-neutral-500"
                    }`}
                  >
                    {isTrendLabel && (
                      <span
                        className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
                        style={{
                          background: accent,
                          boxShadow: `0 0 8px ${accent}a0`,
                        }}
                      />
                    )}
                    {s.label}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums whitespace-nowrap md:text-xs">
                    <span className="font-semibold text-neutral-100">
                      {valueLabel}
                    </span>
                    <span className={deltaClass} style={{ opacity: 0.85 }}>
                      {deltaLabel}
                    </span>
                  </div>
                </div>

                {/* Heatline strip (replaces sparkline) */}
                <div className="mt-1 h-[54px] rounded-xl overflow-hidden">
                  <HeatlineStrip
                    values={s.values}
                    accent={accent}
                    label={s.label}
                    isPositiveTrend={isPositiveTrend}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                       Mocked rolling data helpers (smoothed)               */
/* -------------------------------------------------------------------------- */

function buildPressureSeries(length: number): number[] {
  const values: number[] = [];
  let base = 55;
  for (let i = 0; i < length; i++) {
    base =
      base +
      (Math.random() - 0.5) * 2 + // gentle random walk
      Math.sin(i / 4); // soft oscillation
    values.push(Math.round(base));
  }
  return values;
}

function buildPercentSeries(
  length: number,
  base: number,
  swing: number
): number[] {
  const values: number[] = [];
  let current = base;
  for (let i = 0; i < length; i++) {
    const drift = Math.sin(i / 6) * (swing * 0.3);
    const noise = (Math.random() - 0.5) * swing * 0.35;
    current = current + drift * 0.04 + noise * 0.15;
    const v = Math.max(0, Math.min(100, current));
    values.push(v);
  }
  return values;
}

/* -------------------------------------------------------------------------- */
/*                               TeamTrends section                           */
/* -------------------------------------------------------------------------- */

export default function TeamTrends() {
  const rounds = 23;

  /* ------------------------------- ATTACK -------------------------------- */

  const attackPoints = useMemo(() => {
    const arr: number[] = [];
    for (let r = 0; r < rounds; r++) {
      const roundScores = MOCK_TEAMS.map((t) => t.scores[r]);
      arr.push(
        Math.round(
          roundScores.reduce((a, b) => a + b, 0) / roundScores.length
        )
      );
    }
    return arr;
  }, [rounds]);

  const attackExpected = useMemo(
    () =>
      attackPoints.map((v, i) => {
        const prev = attackPoints[i - 1] ?? v;
        return (v + prev) / 2;
      }),
    [attackPoints]
  );

  const attackF50 = useMemo(
    () => buildPercentSeries(rounds, 56, 12),
    [rounds]
  );

  const attackTrend = useMemo(
    () => buildPercentSeries(rounds, 68, 10),
    [rounds]
  );

  /* ------------------------------ DEFENCE -------------------------------- */

  const defenceConceded = useMemo(() => {
    const arr: number[] = [];
    for (let r = 0; r < rounds; r++) {
      const conceded = MOCK_TEAMS.map(
        (t) => t.scores[r] - t.margins[r]
      );
      arr.push(
        Math.round(
          conceded.reduce((a, b) => a + b, 0) / conceded.length
        )
      );
    }
    return arr;
  }, [rounds]);

  const pressureIndex = useMemo(
    () => buildPressureSeries(rounds),
    [rounds]
  );

  const interceptMarks = useMemo(
    () => buildPercentSeries(rounds, 60, 14),
    [rounds]
  );

  const defenceTrend = useMemo(
    () => buildPercentSeries(rounds, 65, 11),
    [rounds]
  );

  /* ------------------------------ MIDFIELD ------------------------------- */

  const contestedInfluence = useMemo(() => {
    const arr: number[] = [];
    for (let r = 0; r < rounds; r++) {
      const contested = MOCK_TEAMS.map(
        (t) => t.clearanceDom[r] + t.margins[r] / 3
      );
      arr.push(
        Math.round(
          contested.reduce((a, b) => a + b, 0) / contested.length
        )
      );
    }
    return arr;
  }, [rounds]);

  const stoppageWins = useMemo(
    () =>
      contestedInfluence.map(
        (v) => v - (5 - Math.random() * 6)
      ),
    [contestedInfluence]
  );

  const midfieldClearances = useMemo(
    () => buildPercentSeries(rounds, 52, 10),
    [rounds]
  );

  const midfieldTrend = useMemo(
    () => buildPercentSeries(rounds, 66, 9),
    [rounds]
  );

  /* -------------------------------- RUCK --------------------------------- */

  const ruckHitOuts = useMemo(
    () =>
      Array.from({ length: rounds }, (_, i) =>
        Math.round(
          40 +
            Math.sin(i / 3) * 4 +
            (Math.random() * 4 - 2)
        )
      ),
    [rounds]
  );

  const ruckHitOutsAdv = useMemo(
    () =>
      Array.from({ length: rounds }, (_, i) =>
        Math.round(
          12 +
            Math.sin(i / 4) * 3 +
            (Math.random() * 3 - 1.5)
        )
      ),
    [rounds]
  );

  const ruckClearances = useMemo(
    () =>
      Array.from({ length: rounds }, (_, i) =>
        Math.round(
          22 +
            Math.sin(i / 3.5) * 3 +
            (Math.random() * 3 - 1.5)
        )
      ),
    [rounds]
  );

  const ruckTrend = useMemo(
    () => buildPercentSeries(rounds, 60, 10),
    [rounds]
  );

  return (
    <section className="mt-10">
      {/* Whole glass section */}
      <div className="relative overflow-hidden rounded-[32px] border border-yellow-500/30 bg-[radial-gradient(circle_at_top,_rgba(12,12,13,0.85),_rgba(3,3,4,0.95)_60%,_black_90%)] px-4 pb-7 pt-5 shadow-[0_24px_72px_rgba(0,0,0,0.9)] backdrop-blur-2xl md:px-7 md:pb-9 md:pt-7">
        {/* Halo */}
        <div className="pointer-events-none absolute -inset-px rounded-[34px] bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.16),transparent_55%)] opacity-60" />

        <div className="relative">
          {/* Header pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/25 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.18),transparent_55%)] px-3 py-1 shadow-[0_0_10px_rgba(250,204,21,0.3)]">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.85)]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-100/90">
              Team Trends
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-semibold text-neutral-50 md:text-3xl">
            League-wide evolution across all four key positions
          </h2>

          <p className="mt-2 max-w-2xl text-xs text-neutral-400">
            Rolling trends highlighting attacking quality, defensive solidity, midfield control and ruck dominance.
          </p>

          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            League averages • Last 23 rounds • Synthetic positional trend lenses
          </p>

          {/* Positional cards grid */}
          <div className="mt-8 grid gap-8 md:grid-cols-2 lg:gap-10">
            {/* Attack */}
            <TrendBlock
              title="Attack Trend"
              icon={<TrendingUp className="h-4 w-4 text-yellow-300" />}
              accent="#FACC15"
              description="Scoring output, expected conversion and forward-50 strength."
              series={[
                { label: "Points Scored", values: attackPoints, goodDirection: "up" },
                { label: "Expected Score", values: attackExpected, goodDirection: "up" },
                { label: "Forward-50 Efficiency (%)", values: attackF50, goodDirection: "up" },
                { label: "Trend", values: attackTrend, goodDirection: "up" },
              ]}
            />

            {/* Defence */}
            <TrendBlock
              title="Defence Trend"
              icon={<Shield className="h-4 w-4 text-cyan-200" />}
              accent="#22D3EE"
              description="Conceded scoring, pressure indicators and intercept capability."
              series={[
                { label: "Points Conceded", values: defenceConceded, goodDirection: "down" },
                { label: "Pressure Index", values: pressureIndex, goodDirection: "up" },
                { label: "Intercept Marks", values: interceptMarks, goodDirection: "up" },
                { label: "Trend", values: defenceTrend, goodDirection: "down" },
              ]}
            />

            {/* Midfield */}
            <TrendBlock
              title="Midfield Trend"
              icon={<Activity className="h-4 w-4 text-orange-300" />}
              accent="#FB923C"
              description="Contested strength, stoppage craft and clearance control."
              series={[
                { label: "Contested Influence", values: contestedInfluence, goodDirection: "up" },
                { label: "Stoppage Wins", values: stoppageWins, goodDirection: "up" },
                { label: "Clearance", values: midfieldClearances, goodDirection: "up" },
                { label: "Trend", values: midfieldTrend, goodDirection: "up" },
              ]}
            />

            {/* Ruck */}
            <TrendBlock
              title="Ruck Trend"
              icon={<MoveVertical className="h-4 w-4 text-violet-200" />}
              accent="#A78BFA"
              description="Hit-out strength, advantage taps and ruck-led clearances."
              series={[
                { label: "Hit Outs", values: ruckHitOuts, goodDirection: "up" },
                { label: "Hit Outs to Advantage", values: ruckHitOutsAdv, goodDirection: "up" },
                { label: "Clearances", values: ruckClearances, goodDirection: "up" },
                { label: "Trend", values: ruckTrend, goodDirection: "up" },
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
