// src/components/afl/teams/TeamMomentumPulse.tsx
// Neeko+ Gold — Elite ESPN-Style Round Momentum Pulse (Teams)
//
// Key features:
// - Two-column hero: left (title + summary), right (Key Headlines card)
// - Molten gold "sunlight" background with subtle parallax on scroll
// - Boxed Key Headlines card, matching the AFL Players round summary
// - Metric cards with shimmering gold frames + hover pulse/tilt
// - Heavy gold glow sparkline (white line with blurred gold behind)
// - Fully responsive (mobile-first), keeps Neeko+ brand identity

import React from "react";
import { MOCK_TEAMS } from "./mockTeams";
import { Flame, Shield, TrendingUp, BarChart3, Zap } from "lucide-react";

/* ============================================================================
   Global keyframes for shimmering gold border
   ---------------------------------------------------------------------------
   We inject this via a tiny helper component so you DON'T need to edit your
   global CSS or Tailwind config. It defines a simple horizontal shimmer.
============================================================================ */

function GoldShimmerStyles() {
  return (
    <style>
      {`
        @keyframes goldShimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}
    </style>
  );
}

/* ============================================================================
   Utility: simple 1D smoothing for sparkline values
   ---------------------------------------------------------------------------
   Just a light 3-point moving average to avoid noisy zig-zags while keeping
   shape + trend direction.
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

const GOLD_TINT = "rgba(232, 198, 112, 0.36)";
const GOLD_DOT = "#E8C670";

/* ============================================================================
   Sparkline component
   ---------------------------------------------------------------------------
   Heavy-gold-glow style (S3):
   - Thick blurred gold line underneath
   - Sharp white line on top
   - Gold halo on the latest point
   - Soft grid & axis lines
============================================================================ */

function ProSparkline({ values }: SparkProps) {
  const smoothed = smooth(values);

  // Convert values into SVG polyline points (0..100 in X, 0..40 in Y)
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
      // Y inverted for SVG (0 at top)
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
      className="relative h-16 w-full overflow-hidden rounded-xl border border-neutral-800/80 bg-black/85"
      style={{
        // Gold wash from top-left + dark vertical fade
        backgroundImage: `
          radial-gradient(circle_at_top_left, ${GOLD_TINT}, transparent 70%),
          linear-gradient(to bottom, rgba(15,15,15,0.95), rgba(0,0,0,0.98))
        `,
      }}
    >
      {/* Inner dark vignette for depth */}
      <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_24px_rgba(0,0,0,0.95)]" />

      <svg
        viewBox="0 0 100 40"
        className="relative h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Gold glow filter for the "under" line */}
          <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1 0 0 0 0
                0 0.9 0 0 0
                0 0.7 0 0 0
                0 0 0 0.9 0
              "
            />
          </filter>
        </defs>

        {/* Very soft grid lines */}
        <line
          x1="0"
          y1="30"
          x2="100"
          y2="30"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={0.6}
        />
        <line
          x1="0"
          y1="22"
          x2="100"
          y2="22"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={0.5}
        />
        <line
          x1="0"
          y1="14"
          x2="100"
          y2="14"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={0.5}
        />

        {/* Heavy gold glow under-line */}
        <polyline
          points={points}
          fill="none"
          stroke={GOLD_DOT}
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#gold-glow)"
          opacity={0.9}
        />

        {/* Sharp white line on top */}
        <polyline
          points={points}
          fill="none"
          stroke="white"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Latest point with halo */}
        <circle cx={lastX} cy={lastY} r={1.7} fill="white" />
        <circle cx={lastX} cy={lastY} r={3.4} fill={GOLD_DOT} opacity={0.5} />
      </svg>
    </div>
  );
}

/* ============================================================================
   Metric Insight Card
   ---------------------------------------------------------------------------
   - Outer shimmering gold border (1px, animated)
   - Dark glassy interior
   - Hover: slight scale up + tiny tilt + deeper shadow
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
    <div
      className="group rounded-2xl p-[1px] shadow-[0_18px_45px_rgba(0,0,0,0.9)]"
      style={{
        // Gold gradient for border sweep
        backgroundImage:
          "linear-gradient(135deg,#E8C670,#D9A441,#B57C1C,#D9A441,#E8C670)",
        backgroundSize: "260% 260%",
        animation: "goldShimmer 10s linear infinite",
      }}
    >
      <div
        className="
          relative flex h-full flex-col rounded-[1.1rem]
          border border-neutral-900/80
          bg-gradient-to-b from-[#050505] via-black to-[#020202]
          p-5
          transition-transform duration-250 ease-out
          group-hover:scale-[1.02]
          group-hover:-translate-y-[2px]
          group-hover:rotate-[0.3deg]
          group-hover:shadow-[0_24px_60px_rgba(0,0,0,0.95)]
        "
      >
        {/* Top gold glow wash */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[26px] rounded-t-[1.1rem] bg-[radial-gradient(circle_at_top,rgba(232,198,112,0.36),transparent_65%)]" />

        {/* Title row (label + icon) */}
        <div className="relative flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(232,198,112,0.92)]">
          <Icon className="h-4 w-4" />
          {title}
        </div>

        {/* Team name */}
        <div className="mt-2 text-xl font-semibold text-white">{team}</div>

        {/* Metric pill */}
        <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-[rgba(232,198,112,0.55)] bg-black/80 px-2 py-[4px] shadow-[0_0_16px_rgba(0,0,0,0.8)]">
          <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
            Metric
          </span>
          <span className="text-[11px] font-semibold text-neutral-50">
            {metric}
          </span>
        </div>

        {/* Sparkline with heavy gold glow */}
        <div className="mt-3">
          <ProSparkline values={values} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Key Headlines Card (right column in hero)
   ---------------------------------------------------------------------------
   Matches Players layout:
   - Gold headline
   - Bulleted key stories
   - Soft glow + blur to lift from background
============================================================================ */

function HeadlinesCard({ items }: { items: string[] }) {
  return (
    <div className="mt-6 rounded-2xl border border-[rgba(232,198,112,0.38)] bg-black/65 p-6 shadow-[0_0_45px_rgba(232,198,112,0.18)] backdrop-blur-sm lg:mt-0">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(232,198,112,0.9)]">
        <Zap className="h-4 w-4 text-[rgba(232,198,112,0.85)]" />
        Key Headlines
      </div>

      <ul className="mt-3 space-y-1 text-[13px] leading-snug text-neutral-200">
        {items.map((t, i) => (
          <li key={i}>• {t}</li>
        ))}
      </ul>
    </div>
  );
}

/* ============================================================================
   Main Component — with parallax sunlight + editorial two-column layout
============================================================================ */

export default function TeamMomentumPulse() {
  const roundIndex = 22; // R23
  const prevRoundIndex = roundIndex - 1;
  const teams = MOCK_TEAMS;

  // Ref used to compute parallax offset for the sunlight layer
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [parallax, setParallax] = React.useState(0);

  // Parallax handler (very subtle, to avoid nausea / jitter)
  React.useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportH = window.innerHeight || 1;
      const sectionCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportH / 2;
      const raw = (sectionCenter - viewportCenter) / viewportH; // roughly -1..1
      const clamped = Math.max(-1, Math.min(1, raw));
      setParallax(clamped);
    };

    handleScroll(); // run once on mount
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --------------------------------------------------------------------------
  // DATA DERIVATIONS (using mock team stats)
  // --------------------------------------------------------------------------

  // Highest fantasy surge (using attackRating as proxy for fantasy opportunity)
  const fantasyTeam = [...teams].sort(
    (a, b) => b.attackRating - a.attackRating
  )[0];

  // Most dominant scoring team (top score in this round)
  const scoringTeam = [...teams].sort(
    (a, b) => b.scores[roundIndex] - a.scores[roundIndex]
  )[0];
  const scoringScore = scoringTeam?.scores?.[roundIndex] ?? 0;

  // Strongest defensive wall
  const defenceTeam = [...teams].sort(
    (a, b) => b.defenceRating - a.defenceRating
  )[0];

  // Biggest momentum riser (delta of margin between this & previous round)
  const momentumEntries = teams.map((t) => {
    const cur = t.margins?.[roundIndex] ?? 0;
    const prev = t.margins?.[prevRoundIndex] ?? 0;
    return { team: t, delta: cur - prev };
  });
  momentumEntries.sort((a, b) => b.delta - a.delta);
  const momentumTop = momentumEntries[0];
  const momentumTeam = momentumTop.team;
  const momentumDelta = momentumTop.delta;

  // Headlines text
  const headlines = [
    `${fantasyTeam.name} led the round in projected fantasy opportunity (${fantasyTeam.attackRating}/100).`,
    `${scoringTeam.name} delivered the round’s top scoreboard impact (${scoringScore} pts).`,
    `${defenceTeam.name} recorded the strongest defensive rating (${defenceTeam.defenceRating}/100).`,
    `${momentumTeam.name} produced the largest momentum swing (${
      momentumDelta > 0 ? "+" : ""
    }${momentumDelta} pts round-to-round).`,
  ];

  // Translate parallax state into a subtle Y offset (in px)
  const parallaxOffsetY = parallax * 14;

  return (
    <section className="mt-8 rounded-3xl border border-neutral-800/80 bg-[#050507] px-4 py-10 shadow-[0_0_90px_rgba(0,0,0,0.9)] sm:px-6 md:px-8">
      {/* Inject shimmer keyframes (only once) */}
      <GoldShimmerStyles />

      <div ref={containerRef} className="relative overflow-hidden rounded-[1.6rem]">
        {/* Parallax golden sunlight layer */}
        <div
          className="pointer-events-none absolute -inset-16 rounded-[1.8rem]"
          style={{
            background:
              "radial-gradient(circle at top left, rgba(232,198,112,0.28), transparent 72%)",
            transform: `translate3d(0, ${parallaxOffsetY}px, 0)`,
            transition: "transform 80ms linear",
          }}
        />
        {/* Dark overlay to keep content readable */}
        <div className="pointer-events-none absolute inset-0 rounded-[1.6rem] bg-gradient-to-b from-black/45 via-transparent to-black/65" />

        {/* Actual content layer */}
        <div className="relative px-4 py-6 sm:px-6 md:px-8 md:py-8">
          {/* Header pill: round + label */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(232,198,112,0.8)] bg-black/80 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[rgba(232,198,112,0.96)] shadow-[0_0_22px_rgba(0,0,0,0.9)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8C670] shadow-[0_0_10px_#E8C670]" />
            Round Momentum Pulse · R23
          </div>

          {/* Hero: two-column balanced editorial layout */}
          <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            {/* Left column: title + blurb */}
            <div>
              <h2 className="text-xl font-semibold text-white md:text-2xl">
                League-wide fantasy trends &amp; team momentum highlights
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-neutral-200">
                Round 23 fantasy trends reveal usage spikes, role changes and
                matchup edges that shaped team performance across the league.
                This Neeko+ view surfaces the key team-level stories from the
                latest round.
              </p>
            </div>

            {/* Right column: boxed Key Headlines card */}
            <HeadlinesCard items={headlines} />
          </div>

          {/* Section label above the metric cards */}
          <h3 className="mt-8 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(232,198,112,0.9)]">
            Round 23 Summary Metrics
          </h3>

          {/* Four metric cards (2 cols on small, 4 on large) */}
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
        </div>
      </div>
    </section>
  );
}
