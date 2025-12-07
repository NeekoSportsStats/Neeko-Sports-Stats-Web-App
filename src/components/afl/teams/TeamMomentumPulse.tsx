// src/components/afl/teams/TeamMomentumPulse.tsx

import React, { useMemo } from "react";
import { MOCK_TEAMS } from "./mockTeams";
import { Flame, TrendingUp, Shield, Activity } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                         SPARKLINE PLACEHOLDER (REPLACE LATER)              */
/* -------------------------------------------------------------------------- */

function Sparkline({ values }: { values: number[] }) {
  return (
    <div className="h-12 w-full rounded-lg bg-gradient-to-b from-neutral-800/60 to-black shadow-inner" />
  );
}

/* -------------------------------------------------------------------------- */
/*                          TEAM MOMENTUM PULSE (SECTION 1)                   */
/* -------------------------------------------------------------------------- */

export default function TeamMomentumPulse() {
  // Compute league-wide average score per round (23 rounds)
  const leagueAvgSpark = useMemo(() => {
    const rounds = 23;
    const arr: number[] = [];
    for (let r = 0; r < rounds; r++) {
      const roundScores = MOCK_TEAMS.map((t) => t.scores[r]);
      arr.push(
        Math.round(roundScores.reduce((a, b) => a + b, 0) / roundScores.length)
      );
    }
    return arr;
  }, []);

  /* ---------------------------------------------------------------------- */
  /*                             HEADLINES                                  */
  /* ---------------------------------------------------------------------- */

  const highestScoring = useMemo(() => {
    const lastRound = 22; // R23 index
    return [...MOCK_TEAMS].sort(
      (a, b) => b.scores[lastRound] - a.scores[lastRound]
    )[0];
  }, []);

  const strongestDefence = useMemo(() => {
    // Lowest average margin conceded = best defence
    return [...MOCK_TEAMS].sort(
      (a, b) =>
        a.defenceRating - b.defenceRating // defenceRating: higher = better
    )[0];
  }, []);

  const biggestRiser = useMemo(() => {
    // Last 2-round momentum = margin(R23) - margin(R22)
    return [...MOCK_TEAMS]
      .map((t) => ({
        team: t,
        delta: t.margins[22] - t.margins[21],
      }))
      .sort((a, b) => b.delta - a.delta)[0];
  }, []);

  const predictedVolatility = useMemo(() => {
    return [...MOCK_TEAMS].sort(
      (a, b) => b.consistencyIndex - a.consistencyIndex
    )[0];
  }, []);

  /* ---------------------------------------------------------------------- */

  return (
    <section className="mt-8 rounded-3xl border border-neutral-800/70 bg-gradient-to-b from-neutral-950/90 via-black/95 to-black p-6 shadow-[0_0_50px_rgba(0,0,0,0.6)]">
      {/* SECTION LABEL */}
      <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-gradient-to-r from-yellow-500/15 via-yellow-500/5 to-transparent px-3 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.9)]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
          Round Momentum Pulse
        </span>
      </div>

      <h2 className="mt-4 text-xl font-semibold text-neutral-50 md:text-2xl">
        League-wide momentum trends & team signals
      </h2>

      <p className="mt-2 max-w-2xl text-xs text-neutral-400">
        Round-by-round scoring flow, defensive stability, movement indicators
        and team-level momentum signals.
      </p>

      {/* LEAGUE-WIDE SPARKLINE */}
      <div className="mt-6 rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/50 to-black p-5 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          League scoring pulse
        </div>
        <div className="mt-3">
          <Sparkline values={leagueAvgSpark} />
        </div>
      </div>

      {/* HEADLINES GRID */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Highest scoring club */}
        <div className="rounded-2xl border border-neutral-800/70 bg-gradient-to-b from-neutral-900/80 to-black p-5 shadow-[0_0_25px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 text-yellow-300">
            <Flame className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.18em]">
              Highest Scoring (R23)
            </span>
          </div>
          <div className="mt-2 text-lg font-semibold text-neutral-50">
            {highestScoring.name}
          </div>
          <Sparkline values={highestScoring.scores} />
        </div>

        {/* Strongest defensive wall */}
        <div className="rounded-2xl border border-neutral-800/70 bg-gradient-to-b from-neutral-900/80 to-black p-5 shadow-[0_0_25px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 text-teal-300">
            <Shield className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.18em]">
              Strongest Defensive Wall
            </span>
          </div>
          <div className="mt-2 text-lg font-semibold text-neutral-50">
            {strongestDefence.name}
          </div>
          <Sparkline values={strongestDefence.margins} />
        </div>

        {/* Biggest round-to-round riser */}
        <div className="rounded-2xl border border-neutral-800/70 bg-gradient-to-b from-neutral-900/80 to-black p-5 shadow-[0_0_25px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 text-lime-300">
            <TrendingUp className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.18em]">
              Biggest Momentum Riser
            </span>
          </div>
          <div className="mt-2 text-lg font-semibold text-neutral-50">
            {biggestRiser.team.name}
          </div>
          <Sparkline values={biggestRiser.team.margins} />
        </div>

        {/* Predicted volatility (AI) */}
        <div className="rounded-2xl border border-neutral-800/70 bg-gradient-to-b from-neutral-900/80 to-black p-5 shadow-[0_0_25px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 text-orange-300">
            <Activity className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.18em]">
              Predicted Volatility (AI)
            </span>
          </div>
          <div className="mt-2 text-lg font-semibold text-neutral-50">
            {predictedVolatility.name}
          </div>
          <Sparkline values={predictedVolatility.scores} />
        </div>
      </div>
    </section>
  );
}
