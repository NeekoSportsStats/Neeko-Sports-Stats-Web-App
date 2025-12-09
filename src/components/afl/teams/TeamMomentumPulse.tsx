// src/components/afl/teams/TeamMomentumPulse.tsx
// OPTION T1 — AFLPlayers Team Edition (Refined)
// Clean, minimal, on-brand Neeko+ gold layout for team round momentum.

import React from "react";
import { MOCK_TEAMS } from "./mockTeams";
import { Flame, Shield, TrendingUp, BarChart3, Zap } from "lucide-react";

/* ============================================================================
   Sparkline — clean white line with soft gold shadow (AFLPlayers style)
============================================================================ */

function smooth(values: number[]) {
  if (!values || values.length < 3) return values ?? [];
  const out = [...values];
  for (let i = 1; i < values.length - 1; i++) {
    out[i] = (values[i - 1] + values[i] + values[i + 1]) / 3;
  }
  return out;
}

interface SparkProps {
  values: number[];
}

function Sparkline({ values }: SparkProps) {
  const smoothed = smooth(values);

  const { points, lastX, lastY } = React.useMemo(() => {
    if (!smoothed || smoothed.length < 2) {
      return { points: "0,20 100,20", lastX: 100, lastY: 20 };
    }

    const min = Math.min(...smoothed);
    const max = Math.max(...smoothed);
    const range = max - min || 1;

    let pts = "";
    let lx = 100;
    let ly = 20;

    smoothed.forEach((v, i) => {
      const x =
        smoothed.length === 1 ? 50 : (i / (smoothed.length - 1)) * 100;
      const normalized = (v - min) / range;
      const y = 34 - normalized * 20;

      pts += `${x},${y} `;
      if (i === smoothed.length - 1) {
        lx = x;
        ly = y;
      }
    });

    return { points: pts.trim(), lastX: lx, lastY: ly };
  }, [smoothed]);

  return (
    <div className="relative h-16 w-full overflow-hidden rounded-xl border border-neutral-800/70 bg-black/85">
      <svg
        viewBox="0 0 100 40"
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="sparkline-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.3" result="blur" />
            <feBlend in="SourceGraphic" in2="blur" mode="screen" />
          </filter>
        </defs>

        {/* very soft grid */}
        <line
          x1="0"
          y1="30"
          x2="100"
          y2="30"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={0.5}
        />
        <line
          x1="0"
          y1="22"
          x2="100"
          y2="22"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={0.5}
        />
        <line
          x1="0"
          y1="14"
          x2="100"
          y2="14"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={0.5}
        />

        {/* gold shadow under line */}
        <polyline
          points={points}
          fill="none"
          stroke="rgba(232,198,112,0.35)"
          strokeWidth={2.3}
          filter="url(#sparkline-glow)"
        />

        {/* main white line */}
        <polyline
          points={points}
          fill="none"
          stroke="white"
          strokeWidth={1.4}
        />

        {/* last point highlight */}
        <circle cx={lastX} cy={lastY} r={1.5} fill="white" />
      </svg>
    </div>
  );
}

/* ============================================================================
   Metric Insight Card — 1px gold border, dark interior, soft shadow
============================================================================ */

interface InsightCardProps {
  title: string;
  team: string;
  metric: string;
  values: number[];
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

function InsightCard({
  title,
  team,
  metric,
  values,
  icon: Icon,
}: InsightCardProps) {
  return (
    <div className="rounded-2xl border border-[rgba(232,198,112,0.4)] bg-black/60 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.7)] backdrop-blur-[1px]">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.20em] text-[rgba(232,198,112,0.9)]">
        <Icon className="h-4 w-4" />
        {title}
      </div>

      <div className="mt-2 text-xl font-semibold text-white">{team}</div>

      <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[rgba(232,198,112,0.55)] bg-black/80 px-2 py-[4px] text-[11px] text-white">
        Metric: {metric}
      </div>

      <div className="mt-3">
        <Sparkline values={values} />
      </div>
    </div>
  );
}

/* ============================================================================
   Key Headlines Card — slightly more padding + vertical gold accent bar
============================================================================ */

function HeadlinesCard({ items }: { items: string[] }) {
  return (
    <div className="relative rounded-2xl border border-[rgba(232,198,112,0.4)] bg-black/65 px-7 py-6 shadow-[0_8px_24px_rgba(0,0,0,0.7)] backdrop-blur-[1px]">
      {/* vertical gold accent bar */}
      <div className="pointer-events-none absolute left-4 top-5 bottom-5 w-[2px] rounded-full bg-gradient-to-b from-[rgba(232,198,112,0.9)] via-[rgba(232,198,112,0.5)] to-transparent" />
      <div className="pl-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(255,214,140,1)]">
          <Zap className="h-4 w-4 text-[rgba(255,214,140,1)]" />
          Key Headlines
        </div>
        <ul className="mt-3 space-y-1 text-sm text-neutral-200">
          {items.map((h, i) => (
            <li key={i}>• {h}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ============================================================================
   Main Section
============================================================================ */

export default function TeamMomentumPulse() {
  const roundIndex = 22; // R23
  const prev = roundIndex - 1;
  const teams = MOCK_TEAMS;

  // Highest fantasy surge
  const fantasyTeam = [...teams].sort(
    (a, b) => b.attackRating - a.attackRating
  )[0];

  // Most dominant scoring team
  const scoringTeam = [...teams].sort(
    (a, b) => b.scores[roundIndex] - a.scores[roundIndex]
  )[0];
  const scoringValue = scoringTeam.scores[roundIndex];

  // Strongest defence
  const defenceTeam = [...teams].sort(
    (a, b) => b.defenceRating - a.defenceRating
  )[0];

  // Biggest momentum riser
  const momentum = teams
    .map((t) => ({
      team: t,
      delta: (t.margins?.[roundIndex] ?? 0) - (t.margins?.[prev] ?? 0),
    }))
    .sort((a, b) => b.delta - a.delta)[0];

  const headlines = [
    `${fantasyTeam.name} led the round in projected fantasy opportunity (${fantasyTeam.attackRating}/100).`,
    `${scoringTeam.name} delivered the round’s top scoreboard impact (${scoringValue} pts).`,
    `${defenceTeam.name} recorded the strongest defensive rating (${defenceTeam.defenceRating}/100).`,
    `${momentum.team.name} produced the biggest momentum swing (${momentum.delta > 0 ? "+" : ""}${momentum.delta} pts).`,
  ];

  return (
    <section className="mt-10 px-4 sm:px-6 md:px-8">
      {/* unified hero block with gold wash, like AFLPlayers */}
      <div className="relative rounded-3xl border border-neutral-800/70 bg-[radial-gradient(circle_at_top_left,rgba(232,198,112,0.22),transparent_70%),linear-gradient(to_bottom,#171717,#050505,#000000)] p-6 sm:p-8 md:p-10 shadow-[0_0_60px_rgba(0,0,0,0.75)]">
        {/* SECTION LABEL */}
        <div className="inline-flex items-center gap-[6px] rounded-full border border-[rgba(232,198,112,0.75)] bg-black/75 px-4 py-1 text-[10px] uppercase tracking-[0.22em] text-[rgba(255,214,140,1)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[rgba(255,214,140,1)]" />
          Round Momentum Pulse • R23
        </div>

        {/* TITLE & SUBTITLE */}
        <h2 className="mt-5 text-2xl font-semibold text-white">
          League-wide fantasy trends &amp; team momentum highlights
        </h2>
        <p className="mt-2 max-w-3xl text-[15px] leading-snug text-neutral-200">
          Round 23 fantasy trends reveal usage spikes, role changes and matchup
          edges driving team performance across the league. This Neeko+ view
          highlights the key team-level stories from the latest round.
        </p>

        {/* subtle divider between intro and content */}
        <div className="mt-5 h-px w-full bg-gradient-to-r from-[rgba(232,198,112,0.3)] via-neutral-700/60 to-transparent" />

        {/* CONTENT GRID: metrics left, headlines right */}
        <div className="mt-6 grid items-start gap-10 lg:grid-cols-[1.3fr_0.9fr] lg:gap-14">
          {/* LEFT: Summary metrics + cards */}
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.24em] text-[rgba(232,198,112,0.9)]">
              Round 23 Summary Metrics
            </h3>

            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <InsightCard
                title="Highest Fantasy Surge"
                team={fantasyTeam.name}
                metric={`${fantasyTeam.attackRating}/100 usage`}
                values={fantasyTeam.attackTrend}
                icon={BarChart3}
              />

              <InsightCard
                title="Most Dominant Scoring Team"
                team={scoringTeam.name}
                metric={`${scoringValue} pts`}
                values={scoringTeam.scores}
                icon={Flame}
              />

              <InsightCard
                title="Strongest Defensive Wall"
                team={defenceTeam.name}
                metric={`${defenceTeam.defenceRating}/100 rating`}
                values={defenceTeam.defenceTrend}
                icon={Shield}
              />

              <InsightCard
                title="Biggest Momentum Riser"
                team={momentum.team.name}
                metric={`${momentum.delta} pts swing`}
                values={momentum.team.margins}
                icon={TrendingUp}
              />
            </div>
          </div>

          {/* RIGHT: key headlines */}
          <HeadlinesCard items={headlines} />
        </div>
      </div>
    </section>
  );
}
