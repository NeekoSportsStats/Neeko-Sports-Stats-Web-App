// src/components/afl/teams/TeamMomentumPulse.tsx
// OPTION T1 — AFLPlayers Team Edition
//
// This version matches the exact UI system of the AFL Players "Round Momentum Summary":
// - Clean gold wash background (top-left directional)
// - Boxed Key Headlines card with subtle gold border
// - 1px gold metric cards (no shimmer, no tilt, no animations)
// - Clean white sparkline with soft glow shadow
// - Professional spacing + hierarchy identical to Players page
// - Fully responsive, mobile-friendly
//
// This is the correct premium Neeko+ style.

import React from "react";
import { MOCK_TEAMS } from "./mockTeams";
import { Flame, Shield, TrendingUp, BarChart3, Zap } from "lucide-react";

/* ============================================================================
   Sparkline — AFLPlayers Style (Clean White Line + Soft Gold Shadow)
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
      const x = (i / (smoothed.length - 1)) * 100;
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
    <div className="relative h-16 w-full overflow-hidden rounded-xl bg-black/70 border border-neutral-800/70">
      <svg
        viewBox="0 0 100 40"
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          {/* soft gold shadow under the line */}
          <filter id="line-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feBlend in="SourceGraphic" in2="blur" mode="lighter" />
          </filter>
        </defs>

        {/* faint grid lines */}
        <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(255,255,255,0.08)" strokeWidth={0.5}/>
        <line x1="0" y1="22" x2="100" y2="22" stroke="rgba(255,255,255,0.06)" strokeWidth={0.5}/>
        <line x1="0" y1="14" x2="100" y2="14" stroke="rgba(255,255,255,0.04)" strokeWidth={0.5}/>

        {/* gold glow (under) */}
        <polyline
          points={points}
          fill="none"
          stroke="rgba(232,198,112,0.35)"
          strokeWidth={2.4}
          filter="url(#line-glow)"
        />

        {/* white line (main) */}
        <polyline
          points={points}
          fill="none"
          stroke="white"
          strokeWidth={1.4}
        />

        {/* highlight last point */}
        <circle cx={lastX} cy={lastY} r={1.6} fill="white" />
      </svg>
    </div>
  );
}

/* ============================================================================
   Metric Card — AFLPlayers Style (1px Gold Border, Dark Surface)
============================================================================ */

interface InsightCardProps {
  title: string;
  team: string;
  metric: string;
  values: number[];
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

function InsightCard({ title, team, metric, values, icon: Icon }: InsightCardProps) {
  return (
    <div className="rounded-2xl border border-[rgba(232,198,112,0.4)] bg-black/60 backdrop-blur-[1px] p-5 shadow-[0_0_22px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.20em] text-[rgba(232,198,112,0.9)]">
        <Icon className="h-4 w-4" />
        {title}
      </div>

      <div className="mt-2 text-xl font-semibold text-white">{team}</div>

      <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[rgba(232,198,112,0.4)] px-2 py-[4px] text-[11px] text-white/90 bg-black/70">
        Metric: {metric}
      </div>

      <div className="mt-3">
        <Sparkline values={values} />
      </div>
    </div>
  );
}

/* ============================================================================
   Headlines Card — AFLPlayers Style
============================================================================ */

function HeadlinesCard({ items }: { items: string[] }) {
  return (
    <div className="rounded-2xl border border-[rgba(232,198,112,0.4)] bg-black/65 p-6 shadow-[0_0_22px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(232,198,112,0.9)]">
        <Zap className="h-4 w-4 text-[rgba(232,198,112,0.9)]" />
        Key Headlines
      </div>
      <ul className="mt-3 space-y-1 text-sm text-neutral-200">
        {items.map((h, i) => (
          <li key={i}>• {h}</li>
        ))}
      </ul>
    </div>
  );
}

/* ============================================================================
   MAIN SECTION
============================================================================ */

export default function TeamMomentumPulse() {
  const roundIndex = 22; // R23
  const prev = roundIndex - 1;
  const teams = MOCK_TEAMS;

  // 1. Highest fantasy surge
  const fantasyTeam = [...teams].sort((a, b) => b.attackRating - a.attackRating)[0];

  // 2. Most dominant scoring team
  const scoringTeam = [...teams].sort((a, b) => b.scores[roundIndex] - a.scores[roundIndex])[0];
  const scoringValue = scoringTeam.scores[roundIndex];

  // 3. Strongest defence
  const defenceTeam = [...teams].sort((a, b) => b.defenceRating - a.defenceRating)[0];

  // 4. Biggest momentum riser
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
      {/* Background block identical to AFLPlayers */}
      <div className="rounded-3xl border border-neutral-800/70 bg-gradient-to-br from-[#1a1a1a] via-[#0c0c0c] to-black p-6 sm:p-8 md:p-10 shadow-[0_0_60px_rgba(0,0,0,0.75)]">

        {/* Top gold wash */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top_left,rgba(232,198,112,0.18),transparent_70%)]" />

        {/* SECTION LABEL */}
        <div className="inline-flex items-center gap-[6px] rounded-full border border-[rgba(232,198,112,0.7)] px-4 py-1 text-[10px] uppercase tracking-[0.22em] text-[rgba(232,198,112,0.9)] bg-black/70">
          <span className="h-1.5 w-1.5 rounded-full bg-[rgba(232,198,112,0.9)]"></span>
          Round Momentum Pulse • R23
        </div>

        {/* TITLE & SUBTITLE */}
        <h2 className="mt-4 text-2xl font-semibold text-white">
          League-wide fantasy trends & team momentum highlights
        </h2>
        <p className="mt-2 max-w-3xl text-neutral-200 text-[15px] leading-snug">
          Round 23 fantasy trends reveal usage spikes, role changes and matchup edges
          driving team performance across the league. This Neeko+ view highlights the key
          team-level stories from the latest round.
        </p>

        {/* HEADLINES + METRICS */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.9fr] items-start">

          {/* LEFT: Summary metrics heading */}
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

          {/* RIGHT: Key Headlines */}
          <HeadlinesCard items={headlines} />
        </div>
      </div>
    </section>
  );
}
