// src/components/afl/teams/TeamMomentumPulse.tsx

import React, { useMemo } from "react";
import { MOCK_TEAMS } from "./mockTeams";
import { Flame, TrendingUp, Shield, Activity } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                         SPARKLINE PLACEHOLDER (UI-ONLY)                    */
/* -------------------------------------------------------------------------- */

function Sparkline({ values }: { values: number[] }) {
  return (
    <div className="relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-b from-neutral-800/60 via-neutral-900/80 to-black shadow-[0_0_28px_rgba(0,0,0,0.75)]">
      {/* highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 via-white/3 to-transparent" />
      {/* midline */}
      <div className="pointer-events-none absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-neutral-500/40 to-transparent" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                        TEAM MOMENTUM PULSE (SECTION 1)                     */
/* -------------------------------------------------------------------------- */

export default function TeamMomentumPulse() {
  // Compute league-wide average sparkline
  const leagueAvgSpark = useMemo(() => {
    const rounds = 23;
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

  /* ------------------------------ HEADLINES -------------------------------- */

  const highestScoring = useMemo(() => {
    const lastRound = 22;
    return [...MOCK_TEAMS].sort(
      (a, b) => b.scores[lastRound] - a.scores[lastRound]
    )[0];
  }, []);

  const strongestDefence = useMemo(
    () => [...MOCK_TEAMS].sort((a, b) => a.defenceRating - b.defenceRating)[0],
    []
  );

  const biggestRiser = useMemo(() => {
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

  /* -------------------------------------------------------------------------- */

  return (
    <section
      className="
        w-full
        mt-8
        rounded-3xl
        border border-yellow-500/30
        bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.13),transparent_70%),linear-gradient(to_bottom,#0a0a0f,#070709,#000)]
        px-5 py-7 md:px-7 md:py-9
        shadow-[0_0_80px_rgba(250,204,21,0.08),0_0_50px_rgba(0,0,0,0.85)]
      "
    >
      {/* SECTION LABEL PILL */}
      <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/60 bg-gradient-to-r from-yellow-500/25 via-yellow-500/10 to-transparent px-3 py-1 shadow-[0_0_20px_rgba(250,204,21,0.25)]">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_16px_rgba(250,204,21,0.95)]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-100">
          Round Momentum Pulse
        </span>
      </div>

      {/* TITLE */}
      <h2 className="mt-4 text-xl md:text-2xl font-semibold tracking-tight text-neutral-50">
        League-wide momentum trends &amp; team signals
      </h2>

      <p className="mt-2 max-w-2xl text-sm text-neutral-400 leading-relaxed">
        Round-by-round scoring flow, defensive stability, movement indicators
        and team-level momentum signals.
      </p>

      {/* LEAGUE-WIDE */}
      <div className="mt-6 rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/70 via-neutral-950/90 to-black p-5 shadow-[0_0_36px_rgba(0,0,0,0.9)]">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
          League scoring pulse
        </div>
        <div className="mt-3">
          <Sparkline values={leagueAvgSpark} />
        </div>
      </div>

      {/* HEADLINE GRID */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* SCORING */}
        <div className="rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black p-5 shadow-[0_0_26px_rgba(0,0,0,0.85)]">
          <div className="flex items-center gap-2 text-yellow-300">
            <Flame className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
              Highest Scoring (R23)
            </span>
          </div>
          <div className="mt-2 text-lg font-semibold text-neutral-50">
            {highestScoring.name}
          </div>
          <div className="mt-3">
            <Sparkline values={highestScoring.scores} />
          </div>
        </div>

        {/* DEFENCE */}
        <div className="rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black p-5 shadow-[0_0_26px_rgba(0,0,0,0.85)]">
          <div className="flex items-center gap-2 text-teal-300">
            <Shield className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
              Strongest Defensive Wall
            </span>
          </div>
          <div className="mt-2 text-lg font-semibold text-neutral-50">
            {strongestDefence.name}
          </div>
          <div className="mt-3">
            <Sparkline values={strongestDefence.margins} />
          </div>
        </div>

        {/* RISER */}
        <div className="rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black p-5 shadow-[0_0_26px_rgba(0,0,0,0.85)]">
          <div className="flex items-center gap-2 text-lime-300">
            <TrendingUp className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
              Biggest Momentum Riser
            </span>
          </div>
          <div className="mt-2 text-lg font-semibold text-neutral-50">
            {biggestRiser.team.name}
          </div>
          <div className="mt-3">
            <Sparkline values={biggestRiser.team.margins} />
          </div>
        </div>

        {/* VOLATILITY */}
        <div className="rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black p-5 shadow-[0_0_26px_rgba(0,0,0,0.85)]">
          <div className="flex items-center gap-2 text-orange-300">
            <Activity className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
              Predicted Volatility (AI)
            </span>
          </div>
          <div className="mt-2 text-lg font-semibold text-neutral-50">
            {predictedVolatility.name}
          </div>
          <div className="mt-3">
            <Sparkline values={predictedVolatility.scores} />
          </div>
        </div>
      </div>
    </section>
  );
}
