// src/components/afl/teams/TeamMomentumPulse.tsx
// ELITE PRO BROADCAST VERSION — Round Momentum Pulse (Teams)

import React from "react";
import { MOCK_TEAMS } from "./mockTeams";
import { Flame, Shield, TrendingUp, BarChart3 } from "lucide-react";

/* ============================================================================
   1. Professional white-line sparkline with accent-tinted background
============================================================================ */

function smooth(values: number[]) {
  if (!values || values.length < 3) return values ?? [];
  const smoothed = [...values];
  for (let i = 1; i < values.length - 1; i++) {
    smoothed[i] = (values[i - 1] + values[i] + values[i + 1]) / 3;
  }
  return smoothed;
}

interface ProSparklineProps {
  values: number[];
  accent?: string; // rgba/hex accent for subtle tint
}

function ProSparkline({ values, accent }: ProSparklineProps) {
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
      const y = 34 - normalized * 22 + 4; // keep in a calm band

      pts += `${x.toFixed(1)},${y.toFixed(1)} `;
      if (i === smoothed.length - 1) {
        lx = x;
        ly = y;
      }
    });

    return { points: pts.trim(), lastX: lx, lastY: ly };
  }, [smoothed]);

  const accentTint = accent ?? "rgba(148, 163, 184, 0.35)";
  const gridPrimary = "rgba(255,255,255,0.14)";
  const gridSecondary = "rgba(255,255,255,0.08)";

  return (
    <div
      className="relative h-16 w-full overflow-hidden rounded-xl border border-neutral-800/90 bg-neutral-950/80"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,0.04), transparent),
                          radial-gradient(circle at top left, ${accentTint}, transparent 65%)`,
      }}
    >
      {/* inner vignette */}
      <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_18px_rgba(0,0,0,0.85)]" />

      <svg
        className="relative h-full w-full"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
      >
        {/* broadcast-style grid */}
        <line x1="0" y1="30" x2="100" y2="30" stroke={gridPrimary} strokeWidth={0.7} />
        <line x1="0" y1="22" x2="100" y2="22" stroke={gridSecondary} strokeWidth={0.6} />
        <line x1="0" y1="14" x2="100" y2="14" stroke={gridSecondary} strokeWidth={0.5} />

        {/* left axis tick */}
        <line x1="2" y1="10" x2="2" y2="32" stroke="rgba(255,255,255,0.16)" strokeWidth={0.6} />

        {/* main white line */}
        <polyline
          points={points}
          fill="none"
          stroke="white"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* latest value dot */}
        <circle cx={lastX} cy={lastY} r={1.5} fill="white" />
      </svg>
    </div>
  );
}

/* ============================================================================
   2. Broadcast-style insight card
============================================================================ */

interface InsightCardProps {
  title: string;
  team: string;
  metric: string;
  values: number[];
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  accent: string;
}

function InsightCard({
  title,
  team,
  metric,
  values,
  icon: Icon,
  accent,
}: InsightCardProps) {
  return (
    <div className="relative rounded-2xl border border-neutral-800/90 bg-gradient-to-b from-neutral-950 via-black to-black p-5 shadow-[0_22px_45px_rgba(0,0,0,0.85)]">
      {/* accent top edge */}
      <div
        className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl"
        style={{ backgroundImage: `linear-gradient(to right, transparent, ${accent}, transparent)` }}
      />

      {/* card header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
          <Icon className="h-4 w-4" />
          <span>{title}</span>
        </div>
      </div>

      {/* team name */}
      <div className="mt-2 text-xl font-semibold text-white">{team}</div>

      {/* metric pill */}
      <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-neutral-700/90 bg-neutral-900/90 px-2 py-[3px] shadow-[0_0_16px_rgba(0,0,0,0.7)]">
        <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Metric
        </span>
        <span className="text-[11px] font-semibold text-neutral-100">
          {metric}
        </span>
      </div>

      {/* sparkline */}
      <div className="mt-3">
        <ProSparkline values={values} accent={accent} />
      </div>
    </div>
  );
}

/* ============================================================================
   3. Key Headlines component
============================================================================ */

function KeyHeadlines({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-1 text-[13px] leading-snug text-neutral-300">
      {items.map((text, idx) => (
        <li key={idx}>• {text}</li>
      ))}
    </ul>
  );
}

/* ============================================================================
   4. Main Section — Round Momentum Pulse (Teams)
============================================================================ */

export default function TeamMomentumPulse() {
  const roundIndex = 22; // R23
  const prevRoundIndex = roundIndex - 1;
  const teams = MOCK_TEAMS;

  // Highest fantasy surge (attackRating proxy)
  const fantasyTeam = [...teams].sort(
    (a, b) => b.attackRating - a.attackRating
  )[0];

  // Most dominant scoring team
  const scoringTeam = [...teams].sort(
    (a, b) => b.scores[roundIndex] - a.scores[roundIndex]
  )[0];
  const scoringScore = scoringTeam?.scores?.[roundIndex] ?? 0;

  // Strongest defensive wall
  const defenceTeam = [...teams].sort(
    (a, b) => b.defenceRating - a.defenceRating
  )[0];

  // Biggest momentum riser
  const momentumEntries = teams.map((t) => {
    const current = t.margins?.[roundIndex] ?? 0;
    const prev = t.margins?.[prevRoundIndex] ?? 0;
    return {
      team: t,
      delta: current - prev,
    };
  });
  momentumEntries.sort((a, b) => b.delta - a.delta);
  const momentumTop = momentumEntries[0];
  const momentumTeam = momentumTop.team;
  const momentumDelta = momentumTop.delta;

  const headlines = [
    `${fantasyTeam.name} led the round in projected fantasy opportunity (${fantasyTeam.attackRating}/100).`,
    `${scoringTeam.name} delivered the round’s top scoreboard impact (${scoringScore} pts).`,
    `${defenceTeam.name} recorded the strongest defensive rating (${defenceTeam.defenceRating}/100).`,
    `${momentumTeam.name} produced the largest momentum swing (${momentumDelta > 0 ? "+" : ""}${momentumDelta} pts round-to-round).`,
  ];

  return (
    <section className="mt-8 rounded-3xl border border-neutral-800/80 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.28),_transparent_55%),linear-gradient(to_bottom,#020617,#000)] px-4 py-6 shadow-[0_0_70px_rgba(0,0,0,0.8)] sm:px-6 md:px-8 md:py-7">
      {/* section label */}
      <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700/90 bg-neutral-900/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-300 shadow-[0_0_18px_rgba(0,0,0,0.7)]">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
        Round Momentum Pulse · R23
      </div>

      {/* heading */}
      <h2 className="mt-4 text-xl font-semibold text-white md:text-2xl">
        League-wide fantasy trends &amp; team momentum highlights
      </h2>

      <p className="mt-2 max-w-3xl text-sm text-neutral-300">
        Round 23 fantasy trends reveal usage spikes, role changes and matchup
        edges that shaped team performance across the league. This broadcast-style
        summary surfaces the key team-level stories from the latest round.
      </p>

      {/* key headlines */}
      <KeyHeadlines items={headlines} />

      {/* subheading for cards */}
      <h3 className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
        Round 23 Summary Metrics
      </h3>

      {/* insight cards — vertical on mobile */}
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InsightCard
          title="Highest Fantasy Surge"
          team={fantasyTeam.name}
          metric={`${fantasyTeam.attackRating}/100 usage score`}
          values={fantasyTeam.attackTrend}
          accent="rgba(45, 212, 191, 0.7)" // teal
          icon={BarChart3}
        />

        <InsightCard
          title="Most Dominant Scoring Team"
          team={scoringTeam.name}
          metric={`${scoringScore} pts (R23)`}
          values={scoringTeam.scores}
          accent="rgba(251, 191, 36, 0.7)" // amber
          icon={Flame}
        />

        <InsightCard
          title="Strongest Defensive Wall"
          team={defenceTeam.name}
          metric={`${defenceTeam.defenceRating}/100 rating`}
          values={defenceTeam.defenceTrend}
          accent="rgba(59, 130, 246, 0.7)" // blue
          icon={Shield}
        />

        <InsightCard
          title="Biggest Momentum Riser"
          team={momentumTeam.name}
          metric={`${momentumDelta > 0 ? "+" : ""}${momentumDelta} pts swing`}
          values={momentumTeam.margins}
          accent="rgba(190, 242, 100, 0.7)" // lime
          icon={TrendingUp}
        />
      </div>
    </section>
  );
}
