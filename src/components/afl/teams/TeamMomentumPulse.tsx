// src/components/afl/teams/TeamMomentumPulse.tsx
// Neeko+ Molten Gold — ESPN-Style Round Momentum Pulse (Teams)

import React from "react";
import { MOCK_TEAMS } from "./mockTeams";
import { Flame, Shield, TrendingUp, BarChart3 } from "lucide-react";

/* ============================================================================
   1. Sparkline (white line, gold-backed, broadcast grid)
============================================================================ */

function smooth(values: number[]) {
  if (!values || values.length < 3) return values ?? [];
  const out = [...values];
  for (let i = 1; i < values.length - 1; i++) {
    out[i] = (values[i - 1] + values[i] + values[i + 1]) / 3;
  }
  return out;
}

interface ProSparklineProps {
  values: number[];
}

const GOLD_TINT = "rgba(232, 198, 112, 0.32)";
const GOLD_DOT = "#E8C670";

function ProSparkline({ values }: ProSparklineProps) {
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
      const y = 34 - normalized * 22 + 4;

      pts += `${x.toFixed(1)},${y.toFixed(1)} `;
      if (i === smoothed.length - 1) {
        lx = x;
        ly = y;
      }
    });

    return { points: pts.trim(), lastX: lx, lastY: ly };
  }, [smoothed]);

  return (
    <div
      className="relative h-16 w-full overflow-hidden rounded-xl border border-neutral-800/80 bg-black/80"
      style={{
        backgroundImage: `
          radial-gradient(circle_at_top_left, ${GOLD_TINT}, transparent 70%),
          linear-gradient(to_bottom, rgba(20,20,20,0.95), rgba(0,0,0,0.98))`,
      }}
    >
      {/* inner vignette */}
      <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_24px_rgba(0,0,0,0.95)]" />

      <svg
        className="relative h-full w-full"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
      >
        {/* grid */}
        <line
          x1="0"
          y1="30"
          x2="100"
          y2="30"
          stroke="rgba(255,255,255,0.20)"
          strokeWidth={0.7}
        />
        <line
          x1="0"
          y1="22"
          x2="100"
          y2="22"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={0.6}
        />
        <line
          x1="0"
          y1="14"
          x2="100"
          y2="14"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={0.5}
        />
        {/* left axis tick */}
        <line
          x1="3"
          y1="10"
          x2="3"
          y2="32"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={0.6}
        />

        {/* main line */}
        <polyline
          points={points}
          fill="none"
          stroke="white"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* latest point with gold halo */}
        <circle cx={lastX} cy={lastY} r={1.7} fill="white" />
        <circle cx={lastX} cy={lastY} r={3.2} fill={GOLD_DOT} opacity={0.4} />
      </svg>
    </div>
  );
}

/* ============================================================================
   2. Gold-framed ESPN-style insight card
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
    <div className="rounded-2xl bg-[linear-gradient(135deg,#E8C670,#D9A441,#B57C1C)] p-[1.6px] shadow-[0_22px_50px_rgba(0,0,0,0.9)]">
      <div className="flex h-full flex-col rounded-[1.1rem] border border-neutral-900/80 bg-gradient-to-b from-[#050505] via-black to-[#020202] p-5">
        {/* top glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[26px] rounded-t-[1.1rem] bg-[radial-gradient(circle_at_top,rgba(232,198,112,0.35),transparent_60%)]" />

        {/* header */}
        <div className="relative flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(232,198,112,0.9)]">
          <Icon className="h-4 w-4" />
          <span>{title}</span>
        </div>

        {/* team & metric */}
        <div className="mt-2 text-xl font-semibold text-white">{team}</div>

        <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-[rgba(232,198,112,0.55)] bg-black/80 px-2 py-[4px] shadow-[0_0_16px_rgba(0,0,0,0.8)]">
          <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
            Metric
          </span>
          <span className="text-[11px] font-semibold text-neutral-50">
            {metric}
          </span>
        </div>

        {/* sparkline */}
        <div className="mt-3">
          <ProSparkline values={values} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   3. Key Headlines
============================================================================ */

function KeyHeadlines({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-1 text-[13px] leading-snug text-neutral-200">
      {items.map((t, i) => (
        <li key={i}>• {t}</li>
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

  // fantasy / usage (attackRating proxy)
  const fantasyTeam = [...teams].sort(
    (a, b) => b.attackRating - a.attackRating
  )[0];

  // scoring
  const scoringTeam = [...teams].sort(
    (a, b) => b.scores[roundIndex] - a.scores[roundIndex]
  )[0];
  const scoringScore = scoringTeam?.scores?.[roundIndex] ?? 0;

  // defence
  const defenceTeam = [...teams].sort(
    (a, b) => b.defenceRating - a.defenceRating
  )[0];

  // momentum
  const momentumEntries = teams.map((t) => {
    const current = t.margins?.[roundIndex] ?? 0;
    const prev = t.margins?.[prevRoundIndex] ?? 0;
    return { team: t, delta: current - prev };
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
    <section className="mt-8 rounded-3xl border border-neutral-800/80 bg-[radial-gradient(circle_at_top_left,rgba(232,198,112,0.22),transparent_68%),linear-gradient(to_bottom,#050509,#000000)] px-4 py-8 shadow-[0_0_90px_rgba(0,0,0,0.9)] sm:px-6 md:px-8 md:py-10">
      {/* header pill */}
      <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(232,198,112,0.8)] bg-black/80 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[rgba(232,198,112,0.96)] shadow-[0_0_22px_rgba(0,0,0,0.9)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#E8C670] shadow-[0_0_10px_#E8C670]" />
        Round Momentum Pulse · R23
      </div>

      {/* heading */}
      <h2 className="mt-5 text-xl font-semibold text-white md:text-2xl">
        League-wide fantasy trends &amp; team momentum highlights
      </h2>

      <p className="mt-2 max-w-3xl text-sm text-neutral-200">
        Round 23 fantasy trends reveal usage spikes, role changes and matchup
        edges that shaped team performance across the league. This Neeko+ view
        surfaces the key team-level stories from the latest round.
      </p>

      <KeyHeadlines items={headlines} />

      {/* subheading */}
      <h3 className="mt-8 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(232,198,112,0.9)]">
        Round 23 Summary Metrics
      </h3>

      {/* cards grid */}
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <InsightCard
          title="Highest Fantasy Surge"
          team={fantasyTeam.name}
          metric={`${fantasyTeam.attackRating}/100 usage score`}
          values={fantasyTeam.attackTrend}
          icon={BarChart3}
        />

        <InsightCard
          title="Most Dominant Scoring Team"
          team={scoringTeam.name}
          metric={`${scoringScore} pts (R23)`}
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
          team={momentumTeam.name}
          metric={`${momentumDelta > 0 ? "+" : ""}${momentumDelta} pts swing`}
          values={momentumTeam.margins}
          icon={TrendingUp}
        />
      </div>
    </section>
  );
}
