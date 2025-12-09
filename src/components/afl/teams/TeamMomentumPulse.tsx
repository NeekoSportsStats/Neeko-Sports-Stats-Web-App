// src/components/afl/teams/TeamMomentumPulse.tsx
// T1 PRIME EDITION — Updated Headlines Layout + Narrative Headlines
//
// - AFLPlayers-style layout
// - Headlines panel aligned with metric cards (correct editorial balance)
// - Narrative headlines (no duplication)
// - Warm gold sunlight background (subtle, premium)
// - Strong but refined card elevation
// - Sparkline with gold glow + white line
// - Fully responsive

import React from "react";
import { MOCK_TEAMS } from "./mockTeams";
import { Flame, Shield, TrendingUp, BarChart3, Zap } from "lucide-react";

/* ============================================================================
   Sparkline — clean white line + soft gold glow
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
          <filter
            id="sparkline-glow"
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
          >
            <feGaussianBlur stdDeviation="1.3" result="blur" />
            <feBlend in="SourceGraphic" in2="blur" mode="screen" />
          </filter>
        </defs>

        {/* soft grid lines */}
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

        {/* gold glow behind line */}
        <polyline
          points={points}
          fill="none"
          stroke="rgba(255,211,105,0.4)"
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
        <circle cx={lastX} cy={lastY} r={1.6} fill="white" />
      </svg>
    </div>
  );
}

/* ============================================================================
   Metric Insight Card — premium broadcast-grade styling
============================================================================ */

interface InsightCardProps {
  title: string;
  team: string;
  metricValue: string;
  metricLabel: string;
  values: number[];
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

function InsightCard({
  title,
  team,
  metricValue,
  metricLabel,
  values,
  icon: Icon,
}: InsightCardProps) {
  return (
    <div className="rounded-2xl border border-[rgba(255,211,105,0.45)] bg-black/65 p-5 shadow-[0_10px_28px_rgba(0,0,0,0.75)] backdrop-blur-[1px]">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.20em] text-[rgba(255,211,105,0.95)]">
        <Icon className="h-4 w-4" />
        {title}
      </div>

      <div className="mt-2 text-xl font-semibold text-white">{team}</div>

      <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[rgba(255,211,105,0.6)] bg-black/85 px-3 py-[6px]">
        <span className="text-sm font-semibold text-white">{metricValue}</span>
        <span className="text-[11px] text-neutral-300">{metricLabel}</span>
      </div>

      <div className="mt-3">
        <Sparkline values={values} />
      </div>
    </div>
  );
}

/* ============================================================================
   Headlines Card — narrative editorial content
============================================================================ */

function HeadlinesCard({ items }: { items: string[] }) {
  return (
    <div className="relative rounded-2xl border border-[rgba(255,211,105,0.45)] bg-black/72 px-7 py-6 shadow-[0_10px_28px_rgba(0,0,0,0.75)] backdrop-blur-[2px]">
      {/* vertical gold beam */}
      <div className="pointer-events-none absolute left-4 top-5 bottom-5 w-[2px] rounded-full bg-gradient-to-b from-[rgba(255,211,105,1)] via-[rgba(255,211,105,0.6)] to-transparent" />

      <div className="pl-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(255,220,138,1)]">
          <Zap className="h-4 w-4 text-[rgba(255,220,138,1)]" />
          Key Headlines
        </div>
        <ul className="mt-3 space-y-2 text-sm text-neutral-200 leading-relaxed">
          {items.map((h, i) => (
            <li key={i}>• {h}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ============================================================================
   Main Section — T1 Prime Edition (Updated Layout)
============================================================================ */

export default function TeamMomentumPulse() {
  const roundIndex = 22;
  const prev = roundIndex - 1;
  const teams = MOCK_TEAMS;

  // **Stats for cards**
  const fantasyTeam = [...teams].sort(
    (a, b) => b.attackRating - a.attackRating
  )[0];

  const scoringTeam = [...teams].sort(
    (a, b) => b.scores[roundIndex] - a.scores[roundIndex]
  )[0];

  const defenceTeam = [...teams].sort(
    (a, b) => b.defenceRating - a.defenceRating
  )[0];

  const momentum = teams
    .map((t) => ({
      team: t,
      delta: (t.margins?.[roundIndex] ?? 0) - (t.margins?.[prev] ?? 0),
    }))
    .sort((a, b) => b.delta - a.delta)[0];

  // **Narrative Headlines (not duplicates)**
  const headlines = [
    "Midfield usage shifted significantly this round, with multiple clubs experimenting in key rotations.",
    `${fantasyTeam.name} benefited from increased stoppage presence, driving a surge in opportunity.`,
    `${defenceTeam.name}'s back-half structure showed exceptional consistency late in the match.`,
    `${momentum.team.name} generated sustained forward-half pressure, producing the strongest momentum lift.`,
  ];

  return (
    <section className="mt-10 px-4 sm:px-6 md:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-neutral-800/70 bg-[radial-gradient(circle_at_top_left,rgba(255,211,105,0.22),transparent_70%),linear-gradient(to_bottom,#181818,#080808,#010101)] p-6 sm:p-8 md:p-10 shadow-[0_0_60px_rgba(0,0,0,0.75)]">
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_bottom,rgba(0,0,0,0.55),transparent_65%)]" />

        <div className="relative">
          {/* Section Label */}
          <div className="inline-flex items-center gap-[6px] rounded-full border border-[rgba(255,211,105,0.75)] bg-black/80 px-4 py-1 text-[10px] uppercase tracking-[0.22em] text-[rgba(255,220,138,1)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgba(255,220,138,1)]" />
            Round Momentum Pulse • R23
          </div>

          {/* Header Text */}
          <h2 className="mt-5 text-[22px] font-semibold text-white md:text-[24px]">
            League-wide fantasy trends &amp; team momentum highlights
          </h2>
          <p className="mt-2 max-w-3xl text-[15px] leading-snug text-neutral-200">
            Round 23 fantasy trends reveal usage spikes, role changes and
            matchup edges driving team performance across the league. This
            Neeko+ view highlights the key team-level stories from the latest
            round.
          </p>

          <div className="mt-5 h-px w-full bg-gradient-to-r from-[rgba(255,211,105,0.4)] via-neutral-700/65 to-transparent" />

          {/* CONTENT GRID */}
          <div className="mt-8 grid items-start gap-12 lg:grid-cols-[1.35fr_0.9fr]">
            {/* LEFT — Metrics */}
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.24em] text-[rgba(255,211,105,0.95)]">
                Round 23 Summary Metrics
              </h3>

              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <InsightCard
                  title="Highest Fantasy Surge"
                  team={fantasyTeam.name}
                  metricValue={`${fantasyTeam.attackRating}/100`}
                  metricLabel="Usage score"
                  values={fantasyTeam.attackTrend}
                  icon={BarChart3}
                />

                <InsightCard
                  title="Most Dominant Scoring Team"
                  team={scoringTeam.name}
                  metricValue={`${scoringTeam.scores[roundIndex]} pts`}
                  metricLabel="Scoreboard impact"
                  values={scoringTeam.scores}
                  icon={Flame}
                />

                <InsightCard
                  title="Strongest Defensive Wall"
                  team={defenceTeam.name}
                  metricValue={`${defenceTeam.defenceRating}/100`}
                  metricLabel="Defensive rating"
                  values={defenceTeam.defenceTrend}
                  icon={Shield}
                />

                <InsightCard
                  title="Biggest Momentum Riser"
                  team={momentum.team.name}
                  metricValue={`${momentum.delta} pts`}
                  metricLabel="Round-to-round swing"
                  values={momentum.team.margins}
                  icon={TrendingUp}
                />
              </div>
            </div>

            {/* RIGHT — Headlines (now aligned with card grid) */}
            <div className="lg:pt-4">
              <HeadlinesCard items={headlines} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
