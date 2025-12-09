// src/components/afl/teams/TeamTrends.tsx
import React, { useMemo } from "react";
import { MOCK_TEAMS } from "./mockTeams";
import { TrendingUp, Shield, Activity, MoveVertical } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                         Sparkline Compact Placeholder                      */
/*   Soft luxury glass bar + top strip + tiny hover hint                     */
/* -------------------------------------------------------------------------- */
function SparklineLarge({ values }: { values: number[] }) {
  return (
    <div className="relative h-10 w-full overflow-hidden rounded-xl bg-gradient-to-b from-neutral-800/70 via-neutral-900/80 to-black border border-slate-500/25 shadow-[0_6px_18px_rgba(0,0,0,0.65)] hover:border-slate-100/20 transition-colors duration-200">
      {/* Top light strip */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-white/8" />

      {/* Soft top highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-[radial-gradient(circle_at_top,_rgba(248,250,252,0.12),transparent_65%)]" />

      {/* Subtle bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 via-black/0" />

      {/* Tiny hover hint */}
      <div className="pointer-events-none absolute bottom-1.5 left-2 rounded-full bg-black/70 px-2 py-[2px] text-[9px] font-medium text-neutral-300/80 opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:opacity-100">
        League trend • R1–R23
      </div>
    </div>
  );
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
  }, []);

  const attackExpected = useMemo(() => {
    return attackPoints.map((v, i) => {
      const prev = attackPoints[i - 1] ?? v;
      return Math.round((v + prev) / 2);
    });
  }, [attackPoints]);

  // Placeholder: 40–70% forward-50 efficiency
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
  }, []);

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
  }, []);

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
      {/* Header pill (slightly softened glow) */}
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

      {/* Meta sublabel for scope */}
      <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        League averages • Last 23 rounds • Synthetic positional trend lenses
      </p>

      {/* Panel wrapper with soft halo grouping the 4 cards */}
      <div className="mt-8 rounded-[32px] border border-neutral-900/70 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.85),transparent_55%)] px-3 pb-6 pt-5 md:px-5 md:pb-7 md:pt-6">
        {/* 4 POSITIONAL CARDS — 2×2 GRID ON MD+ */}
        <div className="grid gap-8 md:grid-cols-2 lg:gap-10">
          {/* ATTACK */}
          <TrendBlock
            title="Attack Trend"
            icon={<TrendingUp className="h-4 w-4 text-yellow-300" />}
            accent="#facc15" // warm gold
            description="Scoring output, expected conversion and forward-50 strength."
            series={[
              { label: "Points Scored", values: attackPoints },
              { label: "Expected Score", values: attackExpected },
              { label: "Forward-50 Efficiency (%)", values: attackF50 },
              { label: "Trend", values: attackTrend },
            ]}
          />

          {/* DEFENCE */}
          <TrendBlock
            title="Defence Trend"
            icon={<Shield className="h-4 w-4 text-teal-200" />}
            accent="#38b2ac" // slightly desaturated teal
            description="Conceded scoring, pressure indicators and intercept capability."
            series={[
              { label: "Points Conceded", values: defenceConceded },
              { label: "Pressure Index", values: pressureIndex },
              { label: "Intercept Marks", values: interceptMarks },
              { label: "Trend", values: defenceTrend },
            ]}
          />

          {/* MIDFIELD */}
          <TrendBlock
            title="Midfield Trend"
            icon={<Activity className="h-4 w-4 text-orange-300" />}
            accent="#fb923c" // amber/orange
            description="Contested strength, stoppage craft and clearance control."
            series={[
              { label: "Contested Influence", values: contestedInfluence },
              { label: "Stoppage Wins", values: stoppageWins },
              { label: "Clearance", values: midfieldClearances },
              { label: "Trend", values: midfieldTrend },
            ]}
          />

          {/* RUCK */}
          <TrendBlock
            title="Ruck Trend"
            icon={<MoveVertical className="h-4 w-4 text-purple-200" />}
            accent="#8b5cf6" // softened purple
            description="Hit-out strength, advantage taps and ruck-led clearances."
            series={[
              { label: "Hit Outs", values: ruckHitOuts },
              { label: "Hit Outs to Advantage", values: ruckHitOutsAdv },
              { label: "Clearances", values: ruckClearances },
              { label: "Trend", values: ruckTrend },
            ]}
          />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                             TREND BLOCK COMPONENT                          */
/*   Softer glow, press state, tidy metric grid, label hierarchy              */
/* -------------------------------------------------------------------------- */

type TrendSeries = { label: string; values: number[] };

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
  accent: string; // hex colour string for glow
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
      {/* Accent halo */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[26px] opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle_at_top, ${accent}1a, transparent 60%)`,
        }}
      />

      {/* Content */}
      <div className="relative">
        {/* Header row with accent bar */}
        <div className="flex items-center gap-3">
          <div
            className="h-4 w-[3px] rounded-full"
            style={{
              background: `linear-gradient(to bottom, ${accent}, transparent)`,
              boxShadow: `0 0 10px ${accent}aa`,
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

        {/* Divider before metrics */}
        <div className="mt-4 border-t border-neutral-800/70 pt-4 md:mt-5 md:pt-5" />

        {/* 2-COLUMN METRIC GRID */}
        <div className="grid gap-4 md:grid-cols-2 md:gap-x-6 md:gap-y-5">
          {series.map((s, index) => {
            const isTrend = s.label.toLowerCase() === "trend";

            return (
              <div
                key={s.label}
                className={
                  // On md+, add slight inner separation on right column
                  index % 2 === 1
                    ? "space-y-2 md:border-l md:border-neutral-900/70 md:pl-4"
                    : "space-y-2 md:pr-4"
                }
              >
                <div
                  className={`text-[9px] md:text-[10px] uppercase tracking-[0.18em] ${
                    isTrend
                      ? "text-neutral-400"
                      : "text-neutral-500"
                  }`}
                >
                  {/* Small coloured dot only on Trend label */}
                  {isTrend ? (
                    <span
                      className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
                      style={{
                        background: accent,
                        boxShadow: `0 0 8px ${accent}a0`,
                      }}
                    />
                  ) : null}
                  {s.label}
                </div>
                <SparklineLarge values={s.values} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
