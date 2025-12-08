// src/components/afl/teams/TeamMomentumPulse.tsx
// AFL Team Round Momentum — professional, round-summary hero section

import React from "react";
import { MOCK_TEAMS } from "./mockTeams";
import { Flame, Shield, TrendingUp, BarChart3 } from "lucide-react";

/* ============================================================================
   1. Professional white-line sparkline (no glow, ESPN-style)
============================================================================ */

function smooth(values: number[]) {
  if (!values || values.length < 3) return values ?? [];
  const out = [...values];
  for (let i = 1; i < values.length - 1; i++) {
    out[i] = (values[i - 1] + values[i] + values[i + 1]) / 3;
  }
  return out;
}

function ProSparkline({ values }: { values: number[] }) {
  const smoothed = smooth(values);
  const points = React.useMemo(() => {
    if (!smoothed || smoothed.length < 2) return "0,20 100,20";

    const min = Math.min(...smoothed);
    const max = Math.max(...smoothed);
    const range = max - min || 1;

    return smoothed
      .map((v, i) => {
        const x =
          smoothed.length === 1 ? 50 : (i / (smoothed.length - 1)) * 100;
        const normalized = (v - min) / range;
        const y = 40 - normalized * 26 - 7; // 40px height, 7–33px range
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [smoothed]);

  return (
    <div className="relative h-14 w-full overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
      <svg
        className="h-full w-full"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
      >
        {/* subtle baseline grid */}
        <line
          x1="0"
          y1="30"
          x2="100"
          y2="30"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.6"
        />
        <line
          x1="0"
          y1="20"
          x2="100"
          y2="20"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="0.5"
        />

        {/* main white line */}
        <polyline
          points={points}
          fill="none"
          stroke="white"
          strokeWidth={1.1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* ============================================================================
   2. Insight card (4 tiles)
============================================================================ */

type InsightCardProps = {
  title: string;
  team: string;
  metric: string;
  values: number[];
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

function InsightCard({ title, team, metric, values, icon: Icon }: InsightCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-[0_0_25px_rgba(0,0,0,0.6)]">
      {/* Title row */}
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </div>

      {/* Team name */}
      <div className="mt-2 text-lg font-semibold text-neutral-50">{team}</div>

      {/* Metric pill */}
      <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-900 px-2 py-[2px]">
        <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Metric
        </span>
        <span className="text-[11px] font-semibold text-neutral-50">
          {metric}
        </span>
      </div>

      {/* Sparkline */}
      <div className="mt-3">
        <ProSparkline values={values} />
      </div>
    </div>
  );
}

/* ============================================================================
   3. Key Headlines (3–4 bullets)
============================================================================ */

type KeyHeadlinesProps = {
  scoringTeamName: string;
  scoringScore: number;
  defenceTeamName: string;
  defenceRating: number;
  fantasyTeamName: string;
  fantasyRating: number;
  momentumTeamName: string;
  momentumDelta: number;
};

function KeyHeadlines({
  scoringTeamName,
  scoringScore,
  defenceTeamName,
  defenceRating,
  fantasyTeamName,
  fantasyRating,
  momentumTeamName,
  momentumDelta,
}: KeyHeadlinesProps) {
  return (
    <ul className="mt-4 space-y-1 text-[13px] leading-snug text-neutral-300">
      <li>
        • {scoringTeamName} delivered the round&apos;s most dominant scoreboard
        impact ({scoringScore} pts).
      </li>
      <li>
        • {defenceTeamName} posted the strongest defensive rating of the round (
        {defenceRating.toFixed(0)}/100).
      </li>
      <li>
        • {fantasyTeamName} led the league in projected fantasy opportunity (
        {fantasyRating.toFixed(0)}/100 usage score).
      </li>
      <li>
        • {momentumTeamName} generated the biggest momentum swing (
        {momentumDelta > 0 ? "+" : ""}
        {momentumDelta.toFixed(0)} pts round-to-round).
      </li>
    </ul>
  );
}

/* ============================================================================
   4. Main Section — Round Momentum Pulse (latest round only)
============================================================================ */

export default function TeamMomentumPulse() {
  // For now, treat index 22 as "latest round" (R23)
  const roundIndex = 22;
  const previousRoundIndex = roundIndex - 1;

  const teams = MOCK_TEAMS;

  // Highest scoring team this round
  const scoringSorted = [...teams].sort(
    (a, b) => b.scores[roundIndex] - a.scores[roundIndex]
  );
  const scoringTeam = scoringSorted[0];
  const scoringScore = scoringTeam?.scores?.[roundIndex] ?? 0;

  // Strongest defensive wall using defenceRating (0–100, higher = better)
  const defenceSorted = [...teams].sort(
    (a, b) => b.defenceRating - a.defenceRating
  );
  const defenceTeam = defenceSorted[0];
  const defenceRating = defenceTeam?.defenceRating ?? 0;

  // Highest fantasy surge — use attackRating as proxy for fantasy opportunity
  const fantasySorted = [...teams].sort(
    (a, b) => b.attackRating - a.attackRating
  );
  const fantasyTeam = fantasySorted[0];
  const fantasyRating = fantasyTeam?.attackRating ?? 0;

  // Biggest momentum riser — margin delta between last two rounds
  const momentumCandidates = teams.map((t) => {
    const current = t.margins?.[roundIndex] ?? 0;
    const prev = t.margins?.[previousRoundIndex] ?? 0;
    return {
      team: t,
      delta: current - prev,
    };
  });
  momentumCandidates.sort((a, b) => b.delta - a.delta);
  const momentumTop = momentumCandidates[0] ?? {
    team: teams[0],
    delta: 0,
  };

  const momentumTeam = momentumTop.team;
  const momentumDelta = momentumTop.delta;

  return (
    <section className="mt-8 rounded-3xl border border-neutral-800 bg-black px-4 py-6 shadow-[0_0_40px_rgba(0,0,0,0.7)] sm:px-6 md:px-8 md:py-7">
      {/* Section label */}
      <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-neutral-300">
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-100" />
        Round Momentum Pulse — Round 23
      </div>

      {/* Title + description */}
      <h2 className="mt-4 text-xl font-semibold text-neutral-50 md:text-2xl">
        League-wide fantasy trends &amp; team momentum highlights
      </h2>

      <p className="mt-2 max-w-3xl text-sm text-neutral-400">
        League-wide fantasy trends reflect shifts driven by usage rates, matchup
        edges and evolving roles. This snapshot surfaces the key team-level
        stories from the latest round.
      </p>

      {/* Key headlines */}
      <KeyHeadlines
        scoringTeamName={scoringTeam?.name ?? "—"}
        scoringScore={scoringScore}
        defenceTeamName={defenceTeam?.name ?? "—"}
        defenceRating={defenceRating}
        fantasyTeamName={fantasyTeam?.name ?? "—"}
        fantasyRating={fantasyRating}
        momentumTeamName={momentumTeam?.name ?? "—"}
        momentumDelta={momentumDelta}
      />

      {/* Insight cards — mobile: vertical stack, sm: 2 cols, lg: 4 cols */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InsightCard
          title="Highest Fantasy Surge"
          team={fantasyTeam?.name ?? "—"}
          metric={`${fantasyRating.toFixed(0)}/100 opportunity`}
          values={fantasyTeam?.attackTrend ?? []}
          icon={BarChart3}
        />

        <InsightCard
          title="Most Dominant Scoring Team"
          team={scoringTeam?.name ?? "—"}
          metric={`${scoringScore} pts (R23)`}
          values={scoringTeam?.scores ?? []}
          icon={Flame}
        />

        <InsightCard
          title="Strongest Defensive Wall"
          team={defenceTeam?.name ?? "—"}
          metric={`${defenceRating.toFixed(0)}/100 rating`}
          values={defenceTeam?.defenceTrend ?? []}
          icon={Shield}
        />

        <InsightCard
          title="Biggest Momentum Riser"
          team={momentumTeam?.name ?? "—"}
          metric={`${momentumDelta > 0 ? "+" : ""}${momentumDelta.toFixed(
            0
          )} pts swing`}
          values={momentumTeam?.margins ?? []}
          icon={TrendingUp}
        />
      </div>
    </section>
  );
}
