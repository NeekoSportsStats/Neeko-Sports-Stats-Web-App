// src/components/afl/teams/TeamMomentumPulse.tsx
// Neeko+ Gold — Elite ESPN-Style Round Momentum Pulse (Teams)

import React from "react";
import { MOCK_TEAMS } from "./mockTeams";
import { Flame, Shield, TrendingUp, BarChart3, Zap } from "lucide-react";

/* ============================================================================
   Inline keyframes for shimmer (so you don't have to touch global CSS)
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
   1. Sparkline — white line w/ molten gold backlight, ESPN grid
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

const GOLD_TINT = "rgba(232,198,112,0.32)";
const GOLD_DOT = "#E8C670";

function ProSparkline({ values }: SparkProps) {
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
      className="relative h-16 w-full overflow-hidden rounded-xl border border-neutral-800/80 bg-black/85"
      style={{
        backgroundImage: `
          radial-gradient(circle_at_top_left, ${GOLD_TINT}, transparent 70%),
          linear-gradient(to bottom, rgba(20,20,20,0.95), rgba(0,0,0,0.98))
        `,
      }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_24px_rgba(0,0,0,0.95)]" />

      <svg
        viewBox="0 0 100 40"
        className="relative h-full w-full"
        preserveAspectRatio="none"
      >
        {/* grid */}
        <line
          x1="0"
          y1="30"
          x2="100"
          y2="30"
          stroke="rgba(255,255,255,0.2)"
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
   2. Metric Insight Card (gold shimmer frame + hover pulse)
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
      className="group rounded-2xl p-[1.6px] shadow-[0_22px_50px_rgba(0,0,0,0.9)]"
      style={{
        backgroundImage:
          "linear-gradient(135deg,#E8C670,#D9A441,#B57C1C,#D9A441,#E8C670)",
        backgroundSize: "300% 300%",
        animation: "goldShimmer 12s linear infinite",
      }}
    >
      <div className="relative flex h-full flex-col rounded-[1.1rem] border border-neutral-900/80 bg-gradient-to-b from-[#050505] via-black to-[#020202] p-5 transition-transform duration-300 ease-out group-hover:scale-[1.02] group-hover:shadow-[0_24px_60px_rgba(0,0,0,0.95)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[28px] rounded-t-[1.1rem] bg-[radial-gradient(circle_at_top,rgba(232,198,112,0.36),transparent_65%)]" />

        <div className="relative flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(232,198,112,0.92)]">
          <Icon className="h-4 w-4" />
          {title}
        </div>

        <div className="mt-2 text-xl font-semibold text-white">{team}</div>

        <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-[rgba(232,198,112,0.55)] bg-black/80 px-2 py-[4px] shadow-[0_0_16px_rgba(0,0,0,0.8)]">
          <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
            Metric
          </span>
          <span className="text-[11px] font-semibold text-neutral-50">
            {metric}
          </span>
        </div>

        <div className="mt-3">
          <ProSparkline values={values} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   3. Key Headlines Card (matches Players page)
============================================================================ */

function HeadlinesCard({ items }: { items: string[] }) {
  return (
    <div className="mt-6 rounded-2xl border border-[rgba(232,198,112,0.35)] bg-black/70 p-5 shadow-[0_0_45px_rgba(232,198,112,0.18)] lg:mt-0">
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
   4. Main Component with parallax sunlight + two-column hero
============================================================================ */

export default function TeamMomentumPulse() {
  const roundIndex = 22; // R23
  const prevRoundIndex = roundIndex - 1;
  const teams = MOCK_TEAMS;

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [parallax, setParallax] = React.useState(0);

  // parallax sunlight movement
  React.useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportH = window.innerHeight || 1;
      const sectionCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportH / 2;
      const raw = (sectionCenter - viewportCenter) / viewportH; // -1..1-ish
      const clamped = Math.max(-1, Math.min(1, raw));
      setParallax(clamped);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Derived teams
  const fantasyTeam = [...teams].sort(
    (a, b) => b.attackRating - a.attackRating
  )[0];

  const scoringTeam = [...teams].sort(
    (a, b) => b.scores[roundIndex] - a.scores[roundIndex]
  )[0];
  const scoringScore = scoringTeam?.scores?.[roundIndex] ?? 0;

  const defenceTeam = [...teams].sort(
    (a, b) => b.defenceRating - a.defenceRating
  )[0];

  const momentumEntries = teams.map((t) => {
    const cur = t.margins?.[roundIndex] ?? 0;
    const prev = t.margins?.[prevRoundIndex] ?? 0;
    return { team: t, delta: cur - prev };
  });
  momentumEntries.sort((a, b) => b.delta - a.delta);
  const momentumTop = momentumEntries[0];
  const momentumTeam = momentumTop.team;
  const momentumDelta = momentumTop.delta;

  const headlines = [
    `${fantasyTeam.name} led the round in projected fantasy opportunity (${fantasyTeam.attackRating}/100).`,
    `${scoringTeam.name} delivered the round’s top scoreboard impact (${scoringScore} pts).`,
    `${defenceTeam.name} recorded the strongest defensive rating (${defenceTeam.defenceRating}/100).`,
    `${momentumTeam.name} produced the largest momentum swing (${
      momentumDelta > 0 ? "+" : ""
    }${momentumDelta} pts round-to-round).`,
  ];

  const parallaxOffsetY = parallax * 16; // px

  return (
    <section className="mt-8 rounded-3xl border border-neutral-800/80 bg-[#050507] px-4 py-10 shadow-[0_0_90px_rgba(0,0,0,0.9)] sm:px-6 md:px-8">
      <GoldShimmerStyles />
      <div ref={containerRef} className="relative overflow-hidden rounded-[1.6rem]">
        {/* parallax sunlight layer */}
        <div
          className="pointer-events-none absolute -inset-16 rounded-[1.8rem]"
          style={{
            background:
              "radial-gradient(circle at top left, rgba(232,198,112,0.25), transparent 70%)",
            transform: `translate3d(0, ${parallaxOffsetY}px, 0)`,
            transition: "transform 80ms linear",
          }}
        />
        {/* subtle dark overlay for contrast */}
        <div className="pointer-events-none absolute inset-0 rounded-[1.6rem] bg-gradient-to-b from-black/40 via-transparent to-black/60" />

        {/* content */}
        <div className="relative px-4 py-6 sm:px-6 md:px-8 md:py-8">
          {/* Header pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(232,198,112,0.8)] bg-black/80 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[rgba(232,198,112,0.96)] shadow-[0_0_22px_rgba(0,0,0,0.9)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8C670] shadow-[0_0_10px_#E8C670]" />
            Round Momentum Pulse · R23
          </div>

          {/* Two-column hero: left = title/summary, right = headlines card */}
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start">
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

            <HeadlinesCard items={headlines} />
          </div>

          {/* Summary metrics heading */}
          <h3 className="mt-8 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(232,198,112,0.9)]">
            Round 23 Summary Metrics
          </h3>

          {/* Metric cards grid */}
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
