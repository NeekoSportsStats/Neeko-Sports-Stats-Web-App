// src/components/afl/teams/TeamMomentumPulse.tsx

import React, { useMemo } from "react";
import { MOCK_TEAMS } from "./mockTeams";
import { Flame, TrendingUp, Shield, Activity } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                         SPARKLINE PLACEHOLDER (REPLACE LATER)              */
/* -------------------------------------------------------------------------- */

type SparklineVariant = "neutral" | "attack" | "defence" | "momentum" | "volatility";

function Sparkline({
  values,
  variant = "neutral",
}: {
  values: number[];
  variant?: SparklineVariant;
}) {
  // Placeholder only – values are unused for now, but kept for future real charts
  let gradient = "from-neutral-800/60 via-neutral-900/60 to-black";

  if (variant === "attack") {
    gradient = "from-yellow-500/25 via-yellow-500/10 to-black";
  } else if (variant === "defence") {
    gradient = "from-teal-500/25 via-teal-500/10 to-black";
  } else if (variant === "momentum") {
    gradient = "from-lime-400/25 via-lime-400/10 to-black";
  } else if (variant === "volatility") {
    gradient = "from-orange-400/25 via-orange-400/10 to-black";
  }

  return (
    <div
      className={`h-12 w-full rounded-lg bg-gradient-to-b ${gradient} shadow-inner shadow-black/60`}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                           REUSABLE HEADLINE CARD                           */
/* -------------------------------------------------------------------------- */

type HeadlineCardProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  accentClassName: string;
  highlight: string;
  metricLabel?: string;
  metricValue?: string;
  sparkValues: number[];
  sparkVariant?: SparklineVariant;
};

function HeadlineCard({
  icon: Icon,
  label,
  accentClassName,
  highlight,
  metricLabel,
  metricValue,
  sparkValues,
  sparkVariant = "neutral",
}: HeadlineCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-800/70 bg-gradient-to-b from-neutral-900/80 to-black p-5 shadow-[0_0_25px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between gap-3">
        <div className={`flex items-center gap-2 ${accentClassName}`}>
          <Icon className="h-4 w-4" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-current">
            {label}
          </span>
        </div>

        {metricLabel && metricValue && (
          <div className="inline-flex items-center gap-1 rounded-full border border-neutral-700/80 bg-neutral-900/70 px-2 py-0.5">
            <span className="text-[9px] uppercase tracking-[0.16em] text-neutral-500">
              {metricLabel}
            </span>
            <span className="text-[11px] font-semibold text-neutral-100">
              {metricValue}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 text-lg font-semibold text-neutral-50">
        {highlight}
      </div>

      <div className="mt-3">
        <Sparkline values={sparkValues} variant={sparkVariant} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          TEAM MOMENTUM PULSE (SECTION 1)                   */
/* -------------------------------------------------------------------------- */

export default function TeamMomentumPulse() {
  const rounds = 23;
  const lastRoundIndex = rounds - 1;

  // Compute league-wide average score per round (R1–R23)
  const leagueAvgSpark = useMemo(() => {
    const arr: number[] = [];
    for (let r = 0; r < rounds; r++) {
      const roundScores = MOCK_TEAMS.map((t) => t.scores?.[r] ?? 0);
      const avg =
        roundScores.length > 0
          ? Math.round(
              roundScores.reduce((a, b) => a + b, 0) / roundScores.length
            )
          : 0;
      arr.push(avg);
    }
    return arr;
  }, [rounds]);

  const currentLeagueAvg =
    leagueAvgSpark[leagueAvgSpark.length - 1] ?? leagueAvgSpark[0] ?? 0;
  const prevLeagueAvg =
    leagueAvgSpark[leagueAvgSpark.length - 2] ?? currentLeagueAvg;
  const leagueDelta = currentLeagueAvg - prevLeagueAvg;

  /* ---------------------------------------------------------------------- */
  /*                             HEADLINES                                  */
  /* ---------------------------------------------------------------------- */

  const highestScoring = useMemo(() => {
    return [...MOCK_TEAMS].sort(
      (a, b) => b.scores[lastRoundIndex] - a.scores[lastRoundIndex]
    )[0];
  }, [lastRoundIndex]);

  const strongestDefence = useMemo(() => {
    // defenceRating: 0–100, higher = better defence
    return [...MOCK_TEAMS].sort(
      (a, b) => b.defenceRating - a.defenceRating
    )[0];
  }, []);

  const biggestRiser = useMemo(() => {
    // Last 2-round momentum = margin(R23) - margin(R22)
    const penultimateRoundIndex = lastRoundIndex - 1;
    return [...MOCK_TEAMS]
      .map((t) => ({
        team: t,
        delta:
          (t.margins?.[lastRoundIndex] ?? 0) -
          (t.margins?.[penultimateRoundIndex] ?? 0),
      }))
      .sort((a, b) => b.delta - a.delta)[0];
  }, [lastRoundIndex]);

  const predictedVolatility = useMemo(() => {
    // consistencyIndex: 0–100, higher = more consistent (lower volatility)
    // We invert it to get a volatility score so the UI stays intuitive.
    return [...MOCK_TEAMS]
      .map((team) => ({
        team,
        volatility: Math.max(0, Math.min(100, 100 - team.consistencyIndex)),
      }))
      .sort((a, b) => b.volatility - a.volatility)[0];
  }, []);

  /* ---------------------------------------------------------------------- */

  const highestScoringScore = highestScoring?.scores?.[lastRoundIndex] ?? 0;
  const strongestDefenceRating = strongestDefence?.defenceRating ?? 0;
  const biggestRiserDelta = biggestRiser?.delta ?? 0;
  const volatilityScore = predictedVolatility?.volatility ?? 0;

  const leagueDeltaLabel =
    leagueDelta === 0
      ? "Flat vs R22"
      : `${leagueDelta > 0 ? "+" : "–"}${Math.abs(leagueDelta)} vs R22`;

  const leagueDeltaClass =
    leagueDelta > 0
      ? "text-lime-300"
      : leagueDelta < 0
      ? "text-red-300"
      : "text-neutral-400";

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
        League-wide momentum trends &amp; team signals
      </h2>

      <p className="mt-2 max-w-2xl text-xs text-neutral-400">
        Round-by-round scoring flow, defensive stability, movement indicators
        and team-level momentum signals.
      </p>

      {/* LEAGUE-WIDE SPARKLINE */}
      <div className="mt-6 rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/50 to-black p-5 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            League scoring pulse
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <div className="inline-flex items-center gap-1 rounded-full border border-neutral-700/70 bg-neutral-900/80 px-2 py-0.5 text-neutral-300">
              <span className="uppercase tracking-[0.16em] text-neutral-500">
                Avg R23
              </span>
              <span className="text-[11px] font-semibold text-neutral-50">
                {currentLeagueAvg}
              </span>
            </div>
            <div
              className={`inline-flex items-center gap-1 rounded-full bg-neutral-900/60 px-2 py-0.5 ${leagueDeltaClass}`}
            >
              <span className="text-[9px] uppercase tracking-[0.16em]">
                {leagueDeltaLabel}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <Sparkline values={leagueAvgSpark} variant="neutral" />
        </div>
      </div>

      {/* HEADLINES GRID */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Highest scoring club */}
        <HeadlineCard
          icon={Flame}
          label="Highest Scoring (R23)"
          accentClassName="text-yellow-300"
          highlight={highestScoring?.name ?? "—"}
          metricLabel="Score"
          metricValue={`${highestScoringScore} pts`}
          sparkValues={highestScoring?.scores ?? []}
          sparkVariant="attack"
        />

        {/* Strongest defensive wall */}
        <HeadlineCard
          icon={Shield}
          label="Strongest Defensive Wall"
          accentClassName="text-teal-300"
          highlight={strongestDefence?.name ?? "—"}
          metricLabel="Rating"
          metricValue={`${strongestDefenceRating.toFixed(0)}/100`}
          sparkValues={strongestDefence?.margins ?? []}
          sparkVariant="defence"
        />

        {/* Biggest round-to-round riser */}
        <HeadlineCard
          icon={TrendingUp}
          label="Biggest Momentum Riser"
          accentClassName="text-lime-300"
          highlight={biggestRiser?.team?.name ?? "—"}
          metricLabel="Δ Margin"
          metricValue={`${
            biggestRiserDelta > 0 ? "+" : ""
          }${biggestRiserDelta.toFixed(0)} pts`}
          sparkValues={biggestRiser?.team?.margins ?? []}
          sparkVariant="momentum"
        />

        {/* Predicted volatility (AI) */}
        <HeadlineCard
          icon={Activity}
          label="Predicted Volatility (AI)"
          accentClassName="text-orange-300"
          highlight={predictedVolatility?.team?.name ?? "—"}
          metricLabel="Volatility"
          metricValue={`${volatilityScore.toFixed(0)}/100`}
          sparkValues={predictedVolatility?.team?.scores ?? []}
          sparkVariant="volatility"
        />
      </div>
    </section>
  );
}
