import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { BrainCircuit, Lock, ArrowRight, X } from "lucide-react";
import {
  useAFLMockPlayers,
  lastN,
  average,
  stdDev,
  getSeriesForStat,
} from "@/components/afl/players/useAFLMockData";

/**
 * TEMP GATING FLAG
 * Replace later with: const { isPremium } = useAuth();
 */
const IS_PREMIUM = false;

/* ---------------------------------------------------------
   Predictor Logic (Mocked but premium-feeling)
--------------------------------------------------------- */

function computePrediction(series: number[]) {
  const l5 = lastN(series, 5);
  const avgL5 = average(l5);
  const season = average(series);
  const vol = stdDev(l5) || 1;

  const predicted = avgL5 * 0.5 + season * 0.3 + (avgL5 - vol) * 0.2;
  const range = vol * 2;

  const hotProb = Math.max(
    0,
    Math.min(100, ((avgL5 - season) / (season || 1)) * 100 + 50)
  );
  const coldProb = 100 - hotProb;

  const stability = Math.max(0, Math.min(100, 100 - vol * 8));

  return { predicted, range, hotProb, coldProb, stability };
}

/* ---------------------------------------------------------
   Static tiny sparkline
--------------------------------------------------------- */

function TinySparkline() {
  return (
    <svg
      width="52"
      height="24"
      viewBox="0 0 52 24"
      className="text-yellow-300 opacity-80"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="2,18 10,8 18,14 26,6 34,10 42,4 50,12"
      />
    </svg>
  );
}

/* ---------------------------------------------------------
   Gold Pulse Strip (Left Edge)
--------------------------------------------------------- */

function GoldPulseStrip() {
  return (
    <div
      className={cn(
        "absolute left-0 top-0 h-full w-[3px] rounded-l-full",
        "bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-400",
        "shadow-[0_0_18px_rgba(250,204,21,0.55)]",
        "animate-[pulse_4s_ease-in-out_infinite]"
      )}
    />
  );
}

/* ---------------------------------------------------------
   AI Micro-Sentences (rotating)
--------------------------------------------------------- */

const aiLines = [
  "Projection supported by consistent centre-square tendencies and stable usage chains.",
  "Volatility curve trending tighter, supporting an elevated scoring floor.",
  "Matchup neutrality offsets minor volatility spikes in recent games.",
  "Role continuity suggests reliable baseline output moving into next round.",
  "Usage patterns holding steady, reinforcing stable projection confidence.",
  "Short-term scoring window supported by consistent midfield engagement.",
];

/* ---------------------------------------------------------
   Tag Variations (rotating)
--------------------------------------------------------- */

const tagSets = [
  ["CBA lift", "Transition chains", "Volatility normal"],
  ["Role stable", "Usage steady", "Neutral matchup"],
  ["Favourable role split", "High involvement", "Floor intact"],
  ["Inside-mid presence", "Transition impact", "Contest chain"],
  ["Matchup stable", "Usage consistent", "Low volatility"],
  ["High time-on-ground", "Chain involvement", "Balanced matchup"],
];

/* ---------------------------------------------------------
   Row Model
--------------------------------------------------------- */

type AIInsightRowModel = {
  id: string;
  name: string;
  team: string;
  position: string;
  projection: number;
  range: number;
  low: number;
  high: number;
  stability: number;
  aiText: string;
  tags: string[];
};

/* ---------------------------------------------------------
   AI Confidence Badge
--------------------------------------------------------- */

function ConfidenceBadge({ value }: { value: number }) {
  const label =
    value >= 75 ? "High confidence" : value >= 50 ? "Medium confidence" : "Low confidence";

  const colour =
    value >= 75 ? "text-yellow-300" : value >= 50 ? "text-orange-300" : "text-red-300";

  return <span className={cn("text-[11px] font-medium", colour)}>{label}</span>;
}

/* ---------------------------------------------------------
   REAL PLAYER CARD (3-col grid / mobile carousel)
--------------------------------------------------------- */

function PlayerRealCard({ row }: { row: AIInsightRowModel }) {
  return (
    <article
      className={cn(
        "relative min-w-[260px] snap-start",
        "rounded-3xl border border-neutral-800/90",
        "bg-gradient-to-b from-[#0c0c11] via-[#0c0c12] to-black",
        "px-5 py-5 md:px-6 md:py-6",
        "shadow-[0_0_45px_rgba(0,0,0,0.8)] transition hover:brightness-110"
      )}
    >
      <GoldPulseStrip />

      <div className="relative">
        {/* Top Row - Player + sparkline */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold">
              {row.name}{" "}
              <span className="text-white/50 text-xs font-normal">
                {row.team} • {row.position}
              </span>
            </p>

            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35 mt-1">
              Projection • L5 Expected Range
            </p>

            {/* Combined projection line */}
            <p className="text-xl font-semibold mt-[4px]">
              {row.projection.toFixed(1)}{" "}
              <span className="text-base text-white/70">
                ± {row.range.toFixed(1)} fantasy
              </span>{" "}
              <span className="text-[11px] text-white/55">
                ({row.low.toFixed(0)}–{row.high.toFixed(0)} range)
              </span>
            </p>
          </div>

          <div className="flex flex-col items-end text-[10px] text-white/45">
            <TinySparkline />
            <span className="mt-1">Recent scoring trend</span>
          </div>
        </div>

        {/* AI Summary Sentence */}
        <p className="text-sm text-white/75 leading-relaxed mt-4">
          {row.aiText}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-3.5">
          {row.tags.map((t, i) => (
            <span
              key={`${row.id}-tag-${i}`}
              className="px-2.5 py-1 text-[10px] rounded-full bg-white/10 text-white/60"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Confidence Index Row */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">
              Confidence Index
            </p>
            <div className="flex items-center gap-2">
              <ConfidenceBadge value={row.stability} />
              <span className="text-[10px] text-white/55">
                {row.stability.toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="h-[3px] w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full"
              style={{ width: `${row.stability}%` }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

/* ---------------------------------------------------------
   BLURRED LOCKED CARD (Player version of Team BlurredCard)
--------------------------------------------------------- */

function PlayerBlurredCard() {
  return (
    <article
      className={cn(
        "relative min-w-[260px] snap-start rounded-3xl border border-yellow-500/25",
        "bg-black/50 px-5 py-5 backdrop-blur-2xl opacity-30 scale-[0.98]",
        "select-none pointer-events-none shadow-[0_0_45px_rgba(0,0,0,0.8)] overflow-hidden"
      )}
    >
      {/* Deep blur base layer */}
      <div className="absolute inset-0 backdrop-blur-3xl bg-black/40 pointer-events-none z-0" />

      {/* Gold shimmer */}
      <div className="pointer-events-none absolute inset-0 z-[1] opacity-70 mix-blend-screen animate-pulse">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(250,204,21,0.22),transparent_65%),radial-gradient(circle_at_80%_100%,rgba(250,204,21,0.18),transparent_60%)]" />
      </div>

      {/* GOLD → AMBER luxury diagonal streak */}
      <div
        className="
          pointer-events-none absolute inset-0 z-[2]
          bg-gradient-to-br from-yellow-300/20 via-amber-400/20 to-transparent
          animate-[luxstreak_7s_ease-in-out_infinite]
        "
        style={{
          maskImage:
            "linear-gradient(55deg, transparent 45%, black 50%, transparent 55%)",
          WebkitMaskImage:
            "linear-gradient(55deg, transparent 45%, black 50%, transparent 55%)",
        }}
      />

      {/* Content (blurred behind) */}
      <div className="relative z-[3]">
        <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full border border-yellow-500/50 bg-black/70 shadow-[0_0_16px_rgba(250,204,21,0.65)]">
          <Lock className="h-3.5 w-3.5 text-yellow-300" />
        </div>

        <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200/80">
          AI Projections Locked
        </div>

        <div className="mt-1 text-sm font-semibold text-neutral-200/80">
          Hidden Player
        </div>

        <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-neutral-300/75">
          <li className="flex gap-2">
            <span className="mt-[5px] h-[3px] w-[3px] rounded-full bg-neutral-400/80" />
            <span>Projection range unavailable.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-[5px] h-[3px] w-[3px] rounded-full bg-neutral-400/80" />
            <span>Role &amp; usage model hidden.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-[5px] h-[3px] w-[3px] rounded-full bg-neutral-400/80" />
            <span>Volatility profile locked behind Neeko+.</span>
          </li>
        </ul>
      </div>
    </article>
  );
}

/* ---------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */

export default function AIInsights() {
  const players = useAFLMockPlayers();
  const [showModal, setShowModal] = useState(false);

  // Build real free rows (top 3)
  const freeRows: AIInsightRowModel[] = players.slice(0, 3).map((p, idx) => {
    const series = getSeriesForStat(p, "fantasy");
    const pred = computePrediction(series);

    const low = pred.predicted - pred.range;
    const high = pred.predicted + pred.range;

    const tags = tagSets[idx % tagSets.length];
    const aiText = aiLines[idx % aiLines.length];

    return {
      id: `free-${idx}`,
      name: p.name,
      team: p.team,
      position: (p as any).pos ?? (p as any).position ?? "",
      projection: pred.predicted,
      range: pred.range,
      low,
      high,
      stability: pred.stability,
      aiText,
      tags,
    };
  });

  // Fake premium rows (realistic-looking but hard-coded)
  const premiumRows: AIInsightRowModel[] = [
    {
      id: "premium-1",
      name: "Player 58",
      team: "RICH",
      position: "MID",
      projection: 88.1,
      range: 7.4,
      low: 80.7,
      high: 95.5,
      stability: 78,
      aiText:
        "Projection built on expanding centre-bounce window and strong link-up chains through midfield.",
      tags: ["Role expansion", "Usage spike", "Favourable matchup"],
    },
    {
      id: "premium-2",
      name: "Player 42",
      team: "ESS",
      position: "FWD",
      projection: 75.3,
      range: 9.2,
      low: 66.1,
      high: 84.5,
      stability: 65,
      aiText:
        "Forward-half role with rising inside-50 involvements, supported by stable time-on-ground profile.",
      tags: ["High TOG", "Inside-50 chains", "Volatility moderate"],
    },
    {
      id: "premium-3",
      name: "Player 71",
      team: "ADE",
      position: "DEF",
      projection: 81.6,
      range: 8.0,
      low: 73.6,
      high: 89.6,
      stability: 82,
      aiText:
        "Defensive distributor with consistent kick-mark chains and favourable rebound opportunities.",
      tags: ["Rebound role", "Kick-mark chains", "Floor intact"],
    },
  ];

  return (
    <>
      <section
        id="ai-insights"
        className={cn(
          "relative mt-12 rounded-3xl border border-white/10",
          "bg-gradient-to-b from-[#0c0c11] via-[#0a0a0d] to-[#050507]",
          "px-4 py-8 md:px-6 md:py-10",
          "shadow-[0_0_60px_rgba(0,0,0,0.65)]"
        )}
      >
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-black/80 px-3 py-1 text-xs text-yellow-200/90">
            <BrainCircuit className="h-3.5 w-3.5 text-yellow-300" />
            <span className="uppercase tracking-[0.18em]">AI Insights</span>
          </div>

          <h2 className="text-xl font-semibold md:text-2xl">
            AI Projection • Usage Forecast • Role Signals
          </h2>

          <p className="max-w-xl text-sm text-white/70">
            Predictions generated by Neeko AI — combining role tendencies, matchup
            profiles and volatility pathways.
          </p>

          {/* Legend */}
          <p className="max-w-xl text-[10px] text-white/35 leading-relaxed mt-2">
            <span className="font-medium text-white/45">Role stable</span> =
            consistent position &amp; CBA pattern.{" "}
            <span className="font-medium text-white/45">Usage steady</span> =
            involvement near baseline.{" "}
            <span className="font-medium text-white/45">Neutral matchup</span> =
            average opponent fantasy concession.
          </p>
        </div>

        {/* FREE PLAYER CARDS — horizontal carousel on mobile, 3-col grid on desktop */}
        <div className="mt-6 mb-6 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible">
          {freeRows.map((row) => (
            <PlayerRealCard key={row.id} row={row} />
          ))}
        </div>

        {/* PREMIUM LOCKED CARDS — blurred, shimmered, same as Team AI pattern */}
        <div className="mb-8 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible">
          {premiumRows.map((row) => (
            <PlayerBlurredCard key={row.id} />
          ))}
        </div>

        {/* Neeko+ CTA card (opens modal) */}
        {!IS_PREMIUM && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="group inline-flex w-full items-center justify-between rounded-3xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-yellow-500/0 to-transparent px-6 py-4 text-left transition hover:brightness-110"
          >
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-yellow-200/80">
                Neeko+ AI
              </div>
              <div className="mt-1 text-sm font-semibold text-yellow-100">
                Unlock full AFL AI projections across all players
              </div>
              <p className="mt-1 text-xs text-neutral-300">
                Access deeper projection ranges, role-driven matchup flags and
                volatility models for every listed player.
              </p>
            </div>

            <div className="ml-4 flex h-9 w-9 items-center justify-center rounded-full border border-yellow-400/50 bg-black/60 shadow-[0_0_14px_rgba(250,204,21,0.6)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
              <ArrowRight className="h-4 w-4 text-yellow-300" />
            </div>
          </button>
        )}
      </section>

      {/* Neeko+ Modal (same pattern as Team AI modal) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="relative w-full max-w-md rounded-3xl border border-yellow-500/40 bg-gradient-to-b from-neutral-950 via-black to-black px-6 py-6 shadow-[0_0_80px_rgba(0,0,0,1)]">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700/70 bg-black/70 text-neutral-300 hover:text-white hover:border-neutral-500 transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-gradient-to-r from-yellow-500/25 via-yellow-500/5 to-transparent px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.9)]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-100">
                Neeko+ Upgrade
              </span>
            </div>

            <h3 className="mt-3 text-xl font-semibold text-neutral-50">
              Unlock full AFL AI analysis
            </h3>

            <p className="mt-2 text-xs text-neutral-300">
              Neeko+ unlocks every player, every projection band, volatility model and
              role-driven matchup insight across the AFL.
            </p>

            <ul className="mt-4 space-y-2 text-xs text-neutral-200">
              <li className="flex gap-2">
                <span className="h-[4px] w-[4px] rounded-full bg-yellow-400 mt-[5px]" />
                <span>Full AI projections for every AFL-listed player.</span>
              </li>
              <li className="flex gap-2">
                <span className="h-[4px] w-[4px] rounded-full bg-yellow-400 mt-[5px]" />
                <span>Role, usage and volatility indexes updated round-to-round.</span>
              </li>
              <li className="flex gap-2">
                <span className="h-[4px] w-[4px] rounded-full bg-yellow-400 mt-[5px]" />
                <span>Premium features across other sports as they launch.</span>
              </li>
            </ul>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="/neeko-plus"
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-yellow-400/70 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 px-4 py-2.5 text-sm font-semibold text-black shadow-[0_0_30px_rgba(250,204,21,0.85)] hover:brightness-110 transition"
              >
                Upgrade to Neeko+
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>

              <button
                onClick={() => setShowModal(false)}
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-neutral-700 bg-black/70 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:border-neutral-500 hover:text-white transition"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                     KEYFRAMES: GOLD-AMBER STREAK (GLOBAL)                  */
/* -------------------------------------------------------------------------- */

const style = `
@keyframes luxstreak {
  0% {
    transform: translate(-55%, -55%) rotate(0deg);
  }
  100% {
    transform: translate(55%, 55%) rotate(0deg);
  }
}
`;

if (typeof document !== "undefined" && !document.getElementById("luxstreak-keyframes")) {
  const tag = document.createElement("style");
  tag.id = "luxstreak-keyframes";
  tag.innerHTML = style;
  document.head.appendChild(tag);
}