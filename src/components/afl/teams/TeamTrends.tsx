// src/components/afl/teams/TeamTrends.tsx
import React, { useMemo } from "react";
import { MOCK_TEAMS } from "./mockTeams";
import { TrendingUp, Shield, Activity, MoveVertical } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                           Sparkline (smoothed line)                         */
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
    const norm = (v - min) / range; // 0–1
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
  const height = 40;

  const pathD = useMemo(
    () => buildSmoothPath(values, width, height, 6, 4),
    [values]
  );

  return (
    <div className="group relative h-10 w-full overflow-hidden rounded-xl bg-gradient-to-b from-neutral-800/70 via-neutral-900/80 to-black border border-slate-500/25 shadow-[0_6px_18px_rgba(0,0,0,0.65)] transition-colors duration-200 hover:border-slate-100/20">
      {/* Top light strip */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-white/8" />

      {/* Soft top highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-[radial-gradient(circle_at_top,_rgba(248,250,252,0.12),transparent_65%)]" />

      {/* Subtle bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 via-black/0" />

      {/* Actual sparkline */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0"
        style={{ color }}
      >
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{
            filter: "drop-shadow(0 0 4px rgba(255,255,255,0.35))",
          }}
        />
      </svg>

      {/* Tiny hover hint */}
      <div className="pointer-events-none absolute bottom-1.5 left-2 rounded-full bg-black/70 px-2 py-[2px] text-[9px] font-medium text-neutral-300/80 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
        League trend • R1–R23
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                        Metric summary (5-round smoothing)                  */
/* -------------------------------------------------------------------------- */

type TrendDirection = "up" | "down" | "flat";

type MetricSummary = {
  current: number; // last 5-round average
  deltaPct: number | null; // last5 vs prev5
  direction: TrendDirection; // arrow direction based on delta sign
  isGood: boolean | null; // whether that change is good for this metric
};

function average(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * goodDirection:
 *  - "up"   => higher is better (attack, midfield, ruck, pressure, intercepts)
 *  - "down" => lower is better (points conceded etc.)
 */
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
    // Not enough history: just use overall average and no delta
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

  const delta = lastAvg - prevAvg;
  const deltaPct = (delta / prevAvg) * 100;
  let direction: TrendDirection = "flat";

  if (deltaPct > 0.1) direction = "up";
  else if (deltaPct < -0.1) direction = "down";

  const isGood =
    goodDirection === "up"
      ? deltaPct >= 0
      : deltaPct <= 0;

  return {
    current: lastAvg,
    deltaPct,
    direction,
    isGood,
  };
}

function formatNumber(value: number, isPercentMetric: boolean): string {
  if (isPercentMetric) {
    return `${value.toFixed(1)}%`;
  }
  // For points etc. 1 decimal looks good at this scale
  return value.toFixed(1);
}

/* -------------------------------------------------------------------------- */
/*                             TEAM TRENDS SECTION                            */
/* -------------------------------------------------------------------------- */
export default function TeamTrends() {
  const rounds = 23;

  /* ---------------------------------------------------------------------- */
  /*                                  ATTACK                                */
  /* ---------------------------------------------------------------------- */

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

  const attackExpected = useMemo(() => {
    return attackPoints.map((v, i) => {
      const prev = attackPoints[i - 1] ?? v;
      return Math.round((v + prev) / 2);
    });
  }, [attackPoints]);

  const attackF50 = useMemo(
    () => attackPoints.map(() => Math.floor(40 + Math.random() * 30)),
    [attackPoints]
  );

  const attackTrend = useMemo(
    () => attackPoints.map(() => Math.floor(50 + Math.random() * 30)),
    [attackPoints]
  );

  /* ---------------------------------------------------------------------- */
  /*                                 DEFENCE                                */
  /* ---------------------------------------------------------------------- */

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

  const pressureIndex = useMemo(
    () => defenceConceded.map(() => Math.floor(40 + Math.random() * 50)),
    [defenceConceded]
  );

  const interceptMarks = useMemo(
    () => defenceConceded.map(() => Math.floor(45 + Math.random() * 25)),
    [defenceConceded]
  );

  const defenceTrend = useMemo(
    () => defenceConceded.map(() => Math.floor(50 + Math.random() * 30)),
    [defenceConceded]
  );

  /* ---------------------------------------------------------------------- */
  /*                                MIDFIELD                                */
  /* ---------------------------------------------------------------------- */

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
        (v) => v - Math.floor(5 - Math.random() * 10)
      ),
    [contestedInfluence]
  );

  const midfieldClearances = useMemo(
    () => contestedInfluence.map(() => Math.floor(35 + Math.random() * 20)),
    [contestedInfluence]
  );

  const midfieldTrend = useMemo(
    () => contestedInfluence.map(() => Math.floor(50 + Math.random() * 30)),
    [contestedInfluence]
  );

  /* ---------------------------------------------------------------------- */
  /*                                   RUCK                                 */
  /* ---------------------------------------------------------------------- */

  const ruckHitOuts = useMemo(
    () =>
      Array.from({ length: rounds }, () =>
        Math.floor(35 + Math.random() * 20)
      ),
    [rounds]
  );

  const ruckHitOutsAdv = useMemo(
    () => ruckHitOuts.map(() => Math.floor(8 + Math.random() * 10)),
    [ruckHitOuts]
  );

  const ruckClearances = useMemo(
    () =>
      Array.from({ length: rounds }, () =>
        Math.floor(20 + Math.random() * 15)
      ),
    [rounds]
  );

  const ruckTrend = useMemo(
    () => ruckHitOuts.map(() => Math.floor(50 + Math.random() * 30)),
    [ruckHitOuts]
  );

  /* ---------------------------------------------------------------------- */
  /*                                 RENDER                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <section className="mt-14">
      {/* Entire section glass panel with gold outline */}
      <div className="relative overflow-hidden rounded-[32px] border border-yellow-500/35 bg-[radial-gradient(circle_at_top,_rgba(17,24,39,0.96),transparent_60%)] px-4 pb-7 pt-5 shadow-[0_28px_80px_rgba(0,0,0,0.9)] md:px-7 md:pb-9 md:pt-7">
        {/* Soft outer halo */}
        <div className="pointer-events-none absolute -inset-px rounded-[34px] bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.18),transparent_55%)] opacity-60" />

        {/* Content */}
        <div className="relative">
          {/* Header pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.18),transparent_55%)] px-3 py-1 shadow-[0_0_12px_rgba(250,204,21,0.35)]">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.9)]" />
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

          {/* Grid of positional cards */}
          <div className="mt-8 grid gap-8 md:grid-cols-2 lg:gap-10">
            {/* ATTACK */}
            <TrendBlock
              title="Attack Trend"
              icon={<TrendingUp className="h-4 w-4 text-yellow-300" />}
              accent="#FACC15"
              description="Scoring output, expected conversion and forward-50 strength."
              series={[
                {
                  label: "Points Scored",
                  values: attackPoints,
                  goodDirection: "up",
                },
                {
                  label: "Expected Score",
                  values: attackExpected,
                  goodDirection: "up",
                },
                {
                  label: "Forward-50 Efficiency (%)",
                  values: attackF50,
                  goodDirection: "up",
                },
                {
                  label: "Trend",
                  values: attackTrend,
                  goodDirection: "up",
                },
              ]}
            />

            {/* DEFENCE */}
            <TrendBlock
              title="Defence Trend"
              icon={<Shield className="h-4 w-4 text-cyan-200" />}
              accent="#22D3EE"
              description="Conceded scoring, pressure indicators and intercept capability."
              series={[
                {
                  label: "Points Conceded",
                  values: defenceConceded,
                  goodDirection: "down", // lower is better
                },
                {
                  label: "Pressure Index",
                  values: pressureIndex,
                  goodDirection: "up",
                },
                {
                  label: "Intercept Marks",
                  values: interceptMarks,
                  goodDirection: "up",
                },
                {
                  label: "Trend",
                  values: defenceTrend,
                  goodDirection: "down",
                },
              ]}
            />

            {/* MIDFIELD */}
            <TrendBlock
              title="Midfield Trend"
              icon={<Activity className="h-4 w-4 text-amber-300" />}
              accent="#FBBF24"
              description="Contested strength, stoppage craft and clearance control."
              series={[
                {
                  label: "Contested Influence",
                  values: contestedInfluence,
                  goodDirection: "up",
                },
                {
                  label: "Stoppage Wins",
                  values: stoppageWins,
                  goodDirection: "up",
                },
                {
                  label: "Clearance",
                  values: midfieldClearances,
                  goodDirection: "up",
                },
                {
                  label: "Trend",
                  values: midfieldTrend,
                  goodDirection: "up",
                },
              ]}
            />

            {/* RUCK */}
            <TrendBlock
              title="Ruck Trend"
              icon={<MoveVertical className="h-4 w-4 text-violet-200" />}
              accent="#A78BFA"
              description="Hit-out strength, advantage taps and ruck-led clearances."
              series={[
                {
                  label: "Hit Outs",
                  values: ruckHitOuts,
                  goodDirection: "up",
                },
                {
                  label: "Hit Outs to Advantage",
                  values: ruckHitOutsAdv,
                  goodDirection: "up",
                },
                {
                  label: "Clearances",
                  values: ruckClearances,
                  goodDirection: "up",
                },
                {
                  label: "Trend",
                  values: ruckTrend,
                  goodDirection: "up",
                },
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                             TREND BLOCK COMPONENT                          */
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
      className="group relative rounded-3xl border border-neutral-800/70 bg-gradient-to-b from-neutral-900/85 via-black to-black/95 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all duration-300 hover:-translate-y-[3px] hover:border-neutral-700 hover:shadow-[0_26px_60px_rgba(0,0,0,0.92)] active:translate-y-0 active:scale-[0.995] md:p-6"
      style={{
        boxShadow:
          "0 20px 50px rgba(0,0,0,0.8), 0 0 24px rgba(15,23,42,0.6)",
      }}
    >
      {/* Thin accent halo */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[26px] opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle_at_top, ${accent}1a, transparent 60%)`,
        }}
      />

      <div className="relative">
        {/* Header row with thin accent bar */}
        <div className="flex items-center gap-3">
          <div
            className="h-4 w-[2px] rounded-full"
            style={{
              background: `linear-gradient(to bottom, ${accent}, transparent)`,
              boxShadow: `0 0 10px ${accent}66`,
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

        <div className="mt-4 border-t border-neutral-800/70 pt-4 md:mt-5 md:pt-5" />

        {/* Metric grid */}
        <div className="grid gap-4 md:grid-cols-2 md:gap-x-6 md:gap-y-5">
          {series.map((s, index) => {
            const summary = computeMetricSummary(
              s.values,
              s.goodDirection
            );
            const isPercent = s.label.includes("%");

            let deltaLabel = "– 0.0%";
            let deltaClass = "text-neutral-400";
            let arrow = "";

            if (summary.deltaPct !== null) {
              const absPct = Math.abs(summary.deltaPct);
              const formattedPct = `${absPct.toFixed(1)}%`;

              if (absPct < 0.1) {
                deltaLabel = "– 0.0%";
                deltaClass = "text-neutral-400";
                arrow = "";
              } else {
                const isUp = summary.direction === "up";
                const isGood = summary.isGood ?? false;

                arrow = isUp ? "▲" : "▼";
                deltaLabel = `${arrow} ${formattedPct}`;

                if (isGood) {
                  deltaClass = "text-emerald-400";
                } else {
                  deltaClass = "text-rose-400";
                }
              }
            }

            const valueLabel = formatNumber(
              summary.current,
              isPercent
            );

            const isTrendLabel = s.label.toLowerCase() === "trend";

            return (
              <div
                key={s.label}
                className={
                  index % 2 === 1
                    ? "space-y-2 md:border-l md:border-neutral-900/70 md:pl-4"
                    : "space-y-2 md:pr-4"
                }
              >
                {/* Label + numbers row (left-aligned numbers) */}
                <div className="flex items-baseline justify-between gap-3">
                  <div
                    className={`text-[9px] md:text-[10px] uppercase tracking-[0.18em] ${
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

                  <div className="flex items-baseline gap-2 text-[11px] md:text-xs">
                    <span className="font-semibold text-neutral-100">
                      {valueLabel}
                    </span>
                    <span className={deltaClass}>{deltaLabel}</span>
                  </div>
                </div>

                {/* Sparkline */}
                <SparklineLarge values={s.values} color={accent} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
