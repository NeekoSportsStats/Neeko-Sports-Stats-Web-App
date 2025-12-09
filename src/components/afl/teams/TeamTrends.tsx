// src/components/afl/teams/TeamTrends.tsx
import React, { useMemo } from "react";
import { MOCK_TEAMS } from "./mockTeams";
import { TrendingUp, Shield, Activity, MoveVertical } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                         Sparkline Large Placeholder                         */
/*    Soft luxury: subtle inner glow, gentle border, compact height           */
/* -------------------------------------------------------------------------- */
function SparklineLarge({ values }: { values: number[] }) {
  return (
    <div className="relative h-10 w-full overflow-hidden rounded-xl bg-gradient-to-b from-neutral-800/70 via-neutral-900/80 to-black shadow-[0_0_0_1px_rgba(148,163,184,0.18)]">
      {/* Soft top highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-[radial-gradient(circle_at_top,_rgba(248,250,252,0.12),transparent_60%)]" />
      {/* Very subtle bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 via-black/0" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                             TEAM TRENDS SECTION                             */
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
  const attackF50 = useMemo(() => {
    return attackPoints.map(
      () => Math.floor(40 + Math.random() * 30)
    );
  }, []);

  const attackTrend = useMemo(() => {
    return attackPoints.map(
      () => Math.floor(50 + Math.random() * 30)
    );
  }, []);

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

  const pressureIndex = useMemo(() => {
    return defenceConceded.map(
      () => Math.floor(40 + Math.random() * 50)
    );
  }, []);

  const interceptMarks = useMemo(() => {
    return defenceConceded.map(
      () => Math.floor(45 + Math.random() * 25)
    );
  }, []);

  const defenceTrend = useMemo(() => {
    return defenceConceded.map(
      () => Math.floor(50 + Math.random() * 30)
    );
  }, []);

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

  const stoppageWins = useMemo(() => {
    return contestedInfluence.map(
      (v) => v - Math.floor(5 - Math.random() * 10)
    );
  }, [contestedInfluence]);

  const midfieldClearances = useMemo(() => {
    return contestedInfluence.map(
      () => Math.floor(35 + Math.random() * 20)
    );
  }, []);

  const midfieldTrend = useMemo(() => {
    return contestedInfluence.map(
      () => Math.floor(50 + Math.random() * 30)
    );
  }, []);

  /* ---------------------------------------------------------------------- */
  /*                                   RUCK                                 */
  /* ---------------------------------------------------------------------- */

  const ruckHitOuts = useMemo(() => {
    return Array.from({ length: rounds }, () =>
      Math.floor(35 + Math.random() * 20)
    );
  }, []);

  const ruckHitOutsAdv = useMemo(() => {
    return ruckHitOuts.map(
      () => Math.floor(8 + Math.random() * 10)
    );
  }, [ruckHitOuts]);

  const ruckClearances = useMemo(() => {
    return Array.from({ length: rounds }, () =>
      Math.floor(20 + Math.random() * 15)
    );
  }, []);

  const ruckTrend = useMemo(() => {
    return ruckHitOuts.map(
      () => Math.floor(50 + Math.random() * 30)
    );
  }, []);

  /* ---------------------------------------------------------------------- */
  /*                                 RENDER                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <section className="mt-14">
      {/* Header pill */}
      <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.24),transparent_55%)] px-3 py-1 shadow-[0_0_18px_rgba(250,204,21,0.45)]">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_14px_rgba(250,204,21,0.95)]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-100">
          Team Trends
        </span>
      </div>

      <h2 className="mt-4 text-xl font-semibold text-neutral-50 md:text-2xl">
        League-wide evolution across all four key positions
      </h2>

      <p className="mt-2 max-w-2xl text-xs text-neutral-400">
        Rolling trends highlighting attacking quality, defensive solidity,
        midfield control and ruck dominance.
      </p>

      {/* 4 POSITIONAL CARDS — 2×2 GRID ON MD+ */}
      <div className="mt-10 grid gap-8 md:grid-cols-2 lg:gap-10">
        {/* ATTACK */}
        <TrendBlock
          title="Attack Trend"
          icon={<TrendingUp className="h-4 w-4 text-yellow-300" />}
          accent="#facc15"
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
          icon={<Shield className="h-4 w-4 text-teal-300" />}
          accent="#5eead4"
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
          accent="#fdba74"
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
          icon={<MoveVertical className="h-4 w-4 text-purple-300" />}
          accent="#c4b5fd"
          description="Hit-out strength, advantage taps and ruck-led clearances."
          series={[
            { label: "Hit Outs", values: ruckHitOuts },
            { label: "Hit Outs to Advantage", values: ruckHitOutsAdv },
            { label: "Clearances", values: ruckClearances },
            { label: "Trend", values: ruckTrend },
          ]}
        />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                             TREND BLOCK COMPONENT                           */
/*    Soft luxury cards: subtle accent glow, hover lift, tidy metric grid     */
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
      className="group relative rounded-3xl border border-neutral-800/70 bg-gradient-to-b from-neutral-900/85 via-black to-black/95 p-5 shadow-[0_32px_80px_rgba(0,0,0,0.85)] transition-all duration-300 hover:-translate-y-1 hover:border-neutral-700 hover:shadow-[0_26px_70px_rgba(0,0,0,0.95)] md:p-6"
      style={{
        boxShadow:
          "0 26px 70px rgba(0,0,0,0.95), 0 0 32px rgba(15,23,42,0.66)",
      }}
    >
      {/* Accent halo */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[26px] opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle_at_top, ${accent}26, transparent 60%)`,
        }}
      />

      {/* Content */}
      <div className="relative">
        {/* Header row with accent bar */}
        <div className="flex items-center gap-3">
          <div
            className="h-6 w-0.5 rounded-full"
            style={{
              background: `linear-gradient(to bottom, ${accent}, transparent)`,
              boxShadow: `0 0 14px ${accent}aa`,
            }}
          />
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-sm font-semibold text-neutral-50 md:text-base">
              {title}
            </h3>
          </div>
        </div>

        <p className="mt-1 max-w-xl text-[11px] text-neutral-400 md:text-xs">
          {description}
        </p>

        {/* Divider before metrics */}
        <div className="mt-4 border-t border-neutral-800/70 pt-4 md:mt-5 md:pt-5" />

        {/* 2-COLUMN METRIC GRID */}
        <div className="grid gap-4 md:grid-cols-2 md:gap-5">
          {series.map((s) => (
            <div key={s.label} className="space-y-2">
              <div className="text-[9px] uppercase tracking-[0.18em] text-neutral-500 md:text-[10px]">
                {s.label}
              </div>
              <SparklineLarge values={s.values} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
