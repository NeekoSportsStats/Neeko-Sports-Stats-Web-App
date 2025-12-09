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
/*                         Sparkline Large Placeholder                         */
/* -------------------------------------------------------------------------- */
function SparklineLarge({ values }: { values: number[] }) {
  return (
    <div className="h-24 w-full rounded-xl bg-gradient-to-b from-neutral-800/40 to-black shadow-inner" />
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

  const attackF50 = useMemo(() => {
    return attackPoints.map(
      () => Math.floor(40 + Math.random() * 30) // placeholder: 40%–70%
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
      {/* Header */}
      <div className="inline-flex items-center gap-2 rounded-full border border-yellow-600/40 bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-transparent px-3 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.8)]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
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

      {/* GRID OF 4 POSITIONAL TRENDS */}
      <div className="mt-10 space-y-10">

        {/* ATTACK */}
        <TrendBlock
          title="Attack Trend"
          icon={<TrendingUp className="h-4 w-4 text-yellow-300" />}
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
/* -------------------------------------------------------------------------- */

function TrendBlock({
  title,
  icon,
  description,
  series,
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  series: { label: string; values: number[] }[];
}) {
  return (
    <div className="rounded-3xl border border-neutral-800/70 bg-gradient-to-b from-neutral-900/80 to-black p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="text-lg font-semibold text-neutral-50">{title}</h3>
      </div>

      <p className="mt-1 max-w-xl text-xs text-neutral-400">{description}</p>

      {/* Chart Series */}
      <div className="mt-6 space-y-6">
        {series.map((s) => (
          <div key={s.label}>
            <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              {s.label}
            </div>
            <SparklineLarge values={s.values} />
          </div>
        ))}
      </div>
    </div>
  );
}
