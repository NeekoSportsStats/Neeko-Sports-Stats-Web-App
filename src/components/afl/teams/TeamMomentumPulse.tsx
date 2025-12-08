// src/components/afl/teams/TeamMomentumPulse.tsx
// FINAL POLISHED VERSION — Professional AFL Round Summary Hero Panel

import React from "react";
import { MOCK_TEAMS } from "./mockTeams";
import { Flame, Shield, TrendingUp, BarChart3 } from "lucide-react";

/* ============================================================================
   1. Professional white-line sparkline (contrast-enhanced, with latest dot)
============================================================================ */

function smooth(values: number[]) {
  if (!values || values.length < 3) return values ?? [];
  const smoothed = [...values];
  for (let i = 1; i < values.length - 1; i++) {
    smoothed[i] = (values[i - 1] + values[i] + values[i + 1]) / 3;
  }
  return smoothed;
}

function ProSparkline({ values }: { values: number[] }) {
  const smoothed = smooth(values);

  const { points, lastX, lastY } = React.useMemo(() => {
    if (!smoothed || smoothed.length < 2)
      return { points: "0,20 100,20", lastX: 100, lastY: 20 };

    const min = Math.min(...smoothed);
    const max = Math.max(...smoothed);
    const range = max - min || 1;

    let pts = "";
    let lx = 100,
      ly = 20;

    smoothed.forEach((v, i) => {
      const x =
        smoothed.length === 1 ? 50 : (i / (smoothed.length - 1)) * 100;
      const normalized = (v - min) / range;
      const y = 34 - normalized * 24 + 4; // slightly lifted

      pts += `${x.toFixed(1)},${y.toFixed(1)} `;
      if (i === smoothed.length - 1) {
        lx = x;
        ly = y;
      }
    });

    return { points: pts.trim(), lastX: lx, lastY: ly };
  }, [smoothed]);

  return (
    <div className="relative h-16 w-full overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/40">
      <svg
        className="h-full w-full"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
      >
        {/* Grid lines (boosted visibility) */}
        <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(255,255,255,0.10)" strokeWidth="0.6" />
        <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />

        {/* Main line */}
        <polyline
          points={points}
          fill="none"
          stroke="white"
          strokeWidth={1.3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Latest point dot */}
        <circle cx={lastX} cy={lastY} r="1.4" fill="white" />
      </svg>
    </div>
  );
}

/* ============================================================================
   2. Insight card with subtle muted accent strip
============================================================================ */

function InsightCard({
  title,
  team,
  metric,
  values,
  icon: Icon,
  accent,
}: {
  title: string;
  team: string;
  metric: string;
  values: number[];
  icon: any;
  accent: string; // muted accent strip colour
}) {
  return (
    <div className="relative rounded-2xl border border-neutral-800 bg-neutral-950 shadow-[0_0_25px_rgba(0,0,0,0.5)] p-5">
      {/* subtle accent strip */}
      <div
        className="absolute left-0 top-0 h-[3px] w-full rounded-t-2xl"
        style={{ backgroundColor: accent }}
      />

      {/* Title */}
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
        <Icon className="h-4 w-4" />
        {title}
      </div>

      {/* Team */}
      <div className="mt-2 text-lg font-semibold text-white">{team}</div>

      {/* Metric pill */}
      <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-900 px-2 py-[2px]">
        <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
          Metric
        </span>
        <span className="text-[11px] font-semibold text-neutral-200">
          {metric}
        </span>
      </div>

      {/* Chart */}
      <div className="mt-3">
        <ProSparkline values={values} />
      </div>
    </div>
  );
}

/* ============================================================================
   3. Key Headlines
============================================================================ */

function KeyHeadlines({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-1 text-[13px] leading-snug text-neutral-300">
      {items.map((t, i) => (
        <li key={i}>• {t}</li>
      ))}
    </ul>
  );
}

/* ============================================================================
   4. Main Section — Fully polished
============================================================================ */

export default function TeamMomentumPulse() {
  const roundIndex = 22;
  const prev = roundIndex - 1;
  const teams = MOCK_TEAMS;

  // Highest Fantasy Surge
  const fantasyTeam = [...teams].sort((a, b) => b.attackRating - a.attackRating)[0];

  // Most Dominant Scoring Team
  const scoringTeam = [...teams].sort(
    (a, b) => b.scores[roundIndex] - a.scores[roundIndex]
  )[0];

  // Strongest Defensive Wall
  const defenceTeam = [...teams].sort(
    (a, b) => b.defenceRating - a.defenceRating
  )[0];

  // Biggest Momentum Riser
  const momentumSorted = teams
    .map((t) => ({
      team: t,
      delta: (t.margins?.[roundIndex] ?? 0) - (t.margins?.[prev] ?? 0),
    }))
    .sort((a, b) => b.delta - a.delta);

  const momentumTeam = momentumSorted[0].team;
  const momentumDelta = momentumSorted[0].delta;

  const headlines = [
    `${fantasyTeam.name} led the round in projected fantasy opportunity (${fantasyTeam.attackRating}/100).`,
    `${scoringTeam.name} delivered the round’s top scoreboard impact (${scoringTeam.scores[roundIndex]} pts).`,
    `${defenceTeam.name} recorded the strongest defensive rating (${defenceTeam.defenceRating}/100).`,
    `${momentumTeam.name} produced the biggest momentum swing (${momentumDelta > 0 ? "+" : ""}${momentumDelta} pts).`,
  ];

  return (
    <section className="mt-8 rounded-3xl border border-neutral-800 bg-neutral-950/95 px-4 py-6 shadow-[0_0_40px_rgba(0,0,0,0.7)] sm:px-6 md:px-8 md:py-7">
      {/* Label */}
      <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-neutral-300">
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-100" />
        Round Momentum Pulse · R23
      </div>

      {/* Title */}
      <h2 className="mt-4 text-xl font-semibold text-neutral-50 md:text-2xl">
        League-wide fantasy trends & team momentum highlights
      </h2>

      {/* Subheading */}
      <p className="mt-2 max-w-3xl text-sm text-neutral-400">
        Round 23 fantasy trends reveal usage spikes, role changes and matchup
        edges that shaped team performance across the league.
      </p>

      <KeyHeadlines items={headlines} />

      {/* Cards — mobile: vertical stack */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InsightCard
          title="Highest Fantasy Surge"
          team={fantasyTeam.name}
          metric={`${fantasyTeam.attackRating}/100`}
          values={fantasyTeam.attackTrend}
          accent="rgba(52, 211, 153, 0.35)" // teal
          icon={BarChart3}
        />

        <InsightCard
          title="Most Dominant Scoring Team"
          team={scoringTeam.name}
          metric={`${scoringTeam.scores[roundIndex]} pts (R23)`}
          values={scoringTeam.scores}
          accent="rgba(251, 191, 36, 0.35)" // amber
          icon={Flame}
        />

        <InsightCard
          title="Strongest Defensive Wall"
          team={defenceTeam.name}
          metric={`${defenceTeam.defenceRating}/100`}
          values={defenceTeam.defenceTrend}
          accent="rgba(96, 165, 250, 0.35)" // blue
          icon={Shield}
        />

        <InsightCard
          title="Biggest Momentum Riser"
          team={momentumTeam.name}
          metric={`${momentumDelta > 0 ? "+" : ""}${momentumDelta} pts`}
          values={momentumTeam.margins}
          accent="rgba(163, 230, 53, 0.35)" // lime
          icon={TrendingUp}
        />
      </div>
    </section>
  );
}
