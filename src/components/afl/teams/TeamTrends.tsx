// src/components/afl/teams/TeamTrends.tsx

import React, { useMemo } from "react";
import { MOCK_TEAMS } from "./mockTeams";
import {
  TrendingUp,
  Shield,
  Activity,
  MoveVertical,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                           Sparkline (smoothed line)                        */
/* -------------------------------------------------------------------------- */

function buildSmoothPath(
  values: number[],
  width: number,
  height: number,
  paddingX: number,
  paddingY: number
): string {
  if (!values || values.length === 0) return "";

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;
  const stepX =
    values.length === 1 ? 0 : innerWidth / (values.length - 1);

  const points = values.map((v, i) => {
    const norm = (v - min) / range;
    const x = paddingX + i * stepX;
    const y = paddingY + (1 - norm) * innerHeight;
    return { x, y };
  });

  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x} ${p.y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx = (p0.x + p1.x) / 2;
    const cy = (p0.y + p1.y) / 2;
    d += ` Q ${cx} ${cy} ${p1.x} ${p1.y}`;
  }

  return d;
}

function SparklineLarge({
  values,
  color,
}: {
  values: number[];
  color: string;
}) {
  const width = 100;
  const height = 50; // UPDATED: larger sparkline height

  const PADDING_X = 10;
  const PADDING_Y = 14; // option B spacing

  const pathD = useMemo(
    () => buildSmoothPath(values, width, height, PADDING_X, PADDING_Y),
    [values]
  );

  return (
    <div
      className="group relative h-[54px] w-full rounded-xl bg-gradient-to-b from-neutral-700/40 via-neutral-900/80 to-black border border-slate-400/25 shadow-[0_6px_16px_rgba(0,0,0,0.6)]"
      style={{
        overflow: "hidden",
        WebkitMaskImage: "linear-gradient(black, black)",
        maskImage: "linear-gradient(black, black)",
      }}
    >
      {/* Top light strip */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-white/8" />

      {/* Soft top highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-[radial-gradient(circle_at_top,_rgba(248,250,252,0.12),transparent_65%)]" />

      {/* Subtle bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 via-black/0" />

      {/* Midline */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="rgba(148,163,184,0.18)"
          strokeWidth={0.6}
        />
      </svg>

      {/* Actual sparkline */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ color }}
      >
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{
            filter: "drop-shadow(0 0 4px rgba(255,255,255,0.35))",
          }}
        />
      </svg>
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
    return {
      current: 0,
      deltaPct: null,
      direction: "flat",
      isGood: null,
    };
  }

  if (values.length < 10) {
    const current = average(values);
    return {
      current,
      deltaPct: null,
      direction: "flat",
      isGood: null,
    };
  }

  const last5 = values.slice(-5);
  const prev5 = values.slice(-10, -5);

  const lastAvg = average(last5);
  const prevAvg = average(prev5);

  if (prevAvg === 0) {
    return {
      current: lastAvg,
      deltaPct: null,
      direction: "flat",
      isGood: null,
    };
  }

  let deltaPct = ((lastAvg - prevAvg) / prevAvg) * 100;

  if (deltaPct > 15) deltaPct = 15;
  if (deltaPct < -15) deltaPct = -15;

  let direction: TrendDirection = "flat";
  if (deltaPct > 0.1) direction = "up";
  else if (deltaPct < -0.1) direction = "down";

  const isGood =
    goodDirection === "up" ? deltaPct >= 0 : deltaPct <= 0;

  return {
    current: lastAvg,
    deltaPct,
    direction,
    isGood,
  };
}

function formatNumber(value: number, isPercent: boolean) {
  return isPercent ? `${value.toFixed(1)}%` : value.toFixed(1);
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
      className="group relative rounded-3xl border border-neutral-800/70 bg-gradient-to-b from-neutral-900/85 via-black to-black/95 p-4 md:p-5 shadow-[0_18px_48px_rgba(0,0,0,0.85)]"
      style={{
        boxShadow:
          "0 18px 48px rgba(0,0,0,0.85), 0 0 22px rgba(15,23,42,0.6)",
      }}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-[26px] opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle_at_top, ${accent}14, transparent 60%)`,
        }}
      />

      <div className="relative">
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

        <p className="mt-1 text-[11px] text-neutral-300 md:text-xs">
          {description}
        </p>

        <div className="mt-4 border-t border-neutral-800/70 pt-4" />

        <div className="grid gap-4 md:grid-cols-2 md:gap-x-6 md:gap-y-5">
          {series.map((s, i) => {
            const summary = computeMetricSummary(s.values, s.goodDirection);
            const isPercent = s.label.includes("%");
            const isTrendLabel = s.label.toLowerCase() === "trend";

            let deltaLabel = "– 0.0%";
            let deltaClass = "text-neutral-400";
            let arrow = "";

            if (summary.deltaPct !== null) {
              const abs = Math.abs(summary.deltaPct);

              if (abs < 0.1) {
                deltaLabel = "– 0.0%";
              } else {
                const formatted = abs.toFixed(1) + "%";
                arrow = summary.direction === "up" ? "▲" : "▼";
                deltaClass =
                  summary.isGood === true
                    ? "text-emerald-400"
                    : "text-rose-400";
                deltaLabel = `${arrow} ${formatted}`;
              }
            }

            const valueLabel = formatNumber(summary.current, isPercent);

            return (
              <div
                key={s.label}
                className={
                  i % 2 === 1
                    ? "space-y-2 md:border-l md:border-neutral-900/70 md:pl-4"
                    : "space-y-2 md:pr-4"
                }
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div
                    className={`text-[9px] md:text-[10px] uppercase tracking-[0.16em] ${
                      isTrendLabel
                        ? "text-neutral-400"
                        : "text-neutral-500"
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

                  <div className="flex items-center gap-2 text-[11px] font-mono md:text-xs">
                    <span className="font-semibold text-neutral-100">
                      {valueLabel}
                    </span>
                    <span className={deltaClass}>{deltaLabel}</span>
                  </div>
                </div>

                {/* Updated wrapper height */}
                <div className="mt-1 h-[54px] rounded-xl overflow-hidden">
                  <SparklineLarge values={s.values} color={accent} />
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
/*                       Mocked rolling data helpers                          */
/* -------------------------------------------------------------------------- */

function buildPressureSeries(length: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < length; i++) {
    out.push(
      Math.round(
        55 + Math.sin(i / 3) * 8 + (Math.random() * 8 - 4)
      )
    );
  }
  return out;
}

function buildPercentSeries(length: number, base: number, swing: number) {
  const out: number[] = [];
  for (let i = 0; i < length; i++) {
    const v =
      base +
      Math.sin(i / 4) * (swing * 0.6) +
      (Math.random() * swing - swing / 2);

    out.push(Math.max(0, Math.min(100, v)));
  }
  return out;
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
      const scores = MOCK_TEAMS.map((t) => t.scores[r]);
      arr.push(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length));
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

  const attackF50 = useMemo(() => buildPercentSeries(rounds, 56, 12), [rounds]);
  const attackTrend = useMemo(() => buildPercentSeries(rounds, 68, 10), [rounds]);

  /* ------------------------------ DEFENCE -------------------------------- */

  const defenceConceded = useMemo(() => {
    const arr: number[] = [];
    for (let r = 0; r < rounds; r++) {
      const conceded = MOCK_TEAMS.map(
        (t) => t.scores[r] - t.margins[r]
      );
      arr.push(
        Math.round(conceded.reduce((a, b) => a + b, 0) / conceded.length)
      );
    }
    return arr;
  }, [rounds]);

  const pressureIndex = useMemo(() => buildPressureSeries(rounds), [rounds]);
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
        Math.round(contested.reduce((a, b) => a + b, 0) / contested.length)
      );
    }
    return arr;
  }, [rounds]);

  const stoppageWins = useMemo(
    () =>
      contestedInfluence.map(
        (v) => v - (5 - Math.random() * 10)
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
          40 + Math.sin(i / 3) * 6 + (Math.random() * 10 - 5)
        )
      ),
    [rounds]
  );

  const ruckHitOutsAdv = useMemo(
    () =>
      Array.from({ length: rounds }, (_, i) =>
        Math.round(
          12 + Math.sin(i / 4) * 4 + (Math.random() * 6 - 3)
        )
      ),
    [rounds]
  );

  const ruckClearances = useMemo(
    () =>
      Array.from({ length: rounds }, (_, i) =>
        Math.round(
          22 + Math.sin(i / 3.5) * 5 + (Math.random() * 6 - 3)
        )
      ),
    [rounds]
  );

  const ruckTrend = useMemo(() => buildPercentSeries(rounds, 60, 10), [rounds]);

  return (
    <section className="mt-10">
      <div className="relative overflow-hidden rounded-[32px] border border-yellow-500/30 bg-[radial-gradient(circle_at_top,_rgba(12,12,13,0.85),_rgba(3,3,4,0.95)_60%,_black_90%)] px-4 pb-7 pt-5 shadow-[0_24px_72px_rgba(0,0,0,0.9)] backdrop-blur-2xl md:px-7 md:pb-9 md:pt-7">
        <div className="pointer-events-none absolute -inset-px rounded-[34px] bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.16),transparent_55%)] opacity-60" />

        <div className="relative">
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
            Rolling trends highlighting attacking quality, defensive solidity,
            midfield control and ruck dominance.
          </p>

          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            League averages • Last 23 rounds • Synthetic positional trend lenses
          </p>

          <div className="mt-8 grid gap-8 md:grid-cols-2 lg:gap-10">
            {/* ATTACK */}
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

            {/* DEFENCE */}
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

            {/* MIDFIELD */}
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

            {/* RUCK */}
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
