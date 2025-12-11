// src/components/afl/players/AIInsights.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { BrainCircuit } from "lucide-react";
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
      width="60"
      height="26"
      viewBox="0 0 60 26"
      className="text-yellow-300 opacity-80"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="2,20 10,10 18,15 26,7 34,12 42,5 50,13 58,9"
      />
    </svg>
  );
}

/* ---------------------------------------------------------
   🔥 TEAM-STYLE GOLD EDGE WRAP
--------------------------------------------------------- */

function GoldEdgeWrap() {
  return (
    <div
      className="
        absolute left-0 top-0 h-full w-[3px]
        rounded-l-2xl
        bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-300
        shadow-[0_0_22px_rgba(250,204,21,0.55)]
      "
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
    value >= 75
      ? "High confidence"
      : value >= 50
      ? "Medium confidence"
      : "Low confidence";

  const colour =
    value >= 75 ? "text-yellow-300" : value >= 50 ? "text-orange-300" : "text-red-300";

  return <span className={cn("text-[11px] font-medium", colour)}>{label}</span>;
}

/* ---------------------------------------------------------
   INDIVIDUAL ROW CARD (Team-style, A2 density)
--------------------------------------------------------- */

function AIInsightRow({
  row,
  blurred,
}: {
  row: AIInsightRowModel;
  blurred?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-neutral-800/80",
        "bg-gradient-to-br from-black/95 via-neutral-950 to-black",
        "px-4 py-4 md:px-5 md:py-5",
        "shadow-[0_0_40px_rgba(0,0,0,0.75)]"
      )}
    >
      {/* Gold vertical spine like Teams */}
      <GoldEdgeWrap />

      {/* Content wrapper */}
      <div
        className={cn(
          "relative",
          blurred && "blur-md brightness-[0.5] select-none pointer-events-none"
        )}
      >
        {/* Top Row - Player + sparkline */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-50">
              {row.name}{" "}
              <span className="text-xs font-normal text-neutral-400">
                {row.team} • {row.position}
              </span>
            </p>

            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              Projection • L5 Expected Range
            </p>

            <p className="mt-1 text-lg font-semibold text-neutral-50 md:text-xl">
              {row.projection.toFixed(1)}{" "}
              <span className="text-[13px] font-normal text-neutral-300 md:text-sm">
                ± {row.range.toFixed(1)} fantasy
              </span>{" "}
              <span className="text-[10px] text-neutral-400 md:text-[11px]">
                ({row.low.toFixed(0)}–{row.high.toFixed(0)} range)
              </span>
            </p>
          </div>

          <div className="flex flex-col items-end text-[10px] text-neutral-500">
            <TinySparkline />
            <span className="mt-1">Recent scoring trend</span>
          </div>
        </div>

        {/* AI Summary */}
        <p className="mt-3 text-[11px] leading-relaxed text-neutral-200 md:mt-4 md:text-sm md:pr-8">
          {row.aiText}
        </p>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5 md:mt-3.5 md:gap-2">
          {row.tags.map((t, i) => (
            <span
              key={`${row.id}-tag-${i}`}
              className="rounded-full bg-neutral-900/80 px-2.5 py-1 text-[10px] text-neutral-300"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Confidence */}
        <div className="mt-3 md:mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              Confidence Index
            </p>
            <div className="flex items-center gap-2">
              <ConfidenceBadge value={row.stability} />
              <span className="text-[10px] text-neutral-400">
                {row.stability.toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="h-[3px] w-full overflow-hidden rounded-full bg-neutral-900/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-lime-400 via-yellow-300 to-amber-400"
              style={{ width: `${row.stability}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */

export default function AIInsights() {
  const players = useAFLMockPlayers();

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

  // Fake premium rows
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

  const gatingBlurClass = !IS_PREMIUM
    ? "blur-md brightness-[0.45] select-none pointer-events-none"
    : "";

  return (
    <section
      id="ai-insights"
      className={cn(
        "relative mt-10 rounded-3xl border border-yellow-500/40",
        "bg-gradient-to-b from-neutral-950/95 via-black/96 to-black",
        "px-4 py-8 md:px-6 md:py-10",
        "shadow-[0_0_70px_rgba(0,0,0,0.85)]"
      )}
    >
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/60 bg-black/80 px-3 py-1 text-xs text-yellow-200/90">
          <BrainCircuit className="h-3.5 w-3.5 text-yellow-300" />
          <span className="uppercase tracking-[0.18em]">AI Insights</span>
        </div>

        <h2 className="text-xl font-semibold text-neutral-50 md:text-2xl">
          AI Projection • Usage Forecast • Role Signals
        </h2>

        <p className="max-w-xl text-sm text-neutral-300">
          Predictions generated by Neeko AI — combining role tendencies, matchup
          profiles and volatility pathways.
        </p>

        <p className="mt-2 max-w-xl text-[10px] leading-relaxed text-neutral-500">
          <span className="font-medium text-neutral-300">Role stable</span> =
          consistent position &amp; CBA pattern.{" "}
          <span className="font-medium text-neutral-300">Usage steady</span> =
          involvement near baseline.{" "}
          <span className="font-medium text-neutral-300">Neutral matchup</span> =
          average opponent fantasy concession.
        </p>
      </div>

      {/* FREE ROWS */}
      {/* Mobile: scroll-snap carousel (92% width) */}
      <div className="mt-6 flex gap-4 overflow-x-auto pb-2 md:hidden snap-x snap-mandatory">
        {freeRows.map((row) => (
          <div
            key={row.id}
            className="snap-center shrink-0 basis-[92%]"
          >
            <AIInsightRow row={row} />
          </div>
        ))}
      </div>

      {/* Desktop: 3-column grid */}
      <div className="mt-6 hidden md:grid md:grid-cols-3 md:gap-4">
        {freeRows.map((row) => (
          <AIInsightRow key={row.id} row={row} />
        ))}
      </div>

      {/* PREMIUM GATED ROWS */}
      <div className="relative mt-6">
        {/* Mobile premium carousel */}
        <div className={cn("flex gap-4 overflow-x-auto pb-2 md:hidden snap-x snap-mandatory", gatingBlurClass)}>
          {premiumRows.map((row) => (
            <div
              key={row.id}
              className="snap-center shrink-0 basis-[92%]"
            >
              <AIInsightRow row={row} blurred={!!gatingBlurClass} />
            </div>
          ))}
        </div>

        {/* Desktop premium grid */}
        <div
          className={cn(
            "hidden md:grid md:grid-cols-3 md:gap-4",
            gatingBlurClass
          )}
        >
          {premiumRows.map((row) => (
            <AIInsightRow key={row.id} row={row} blurred={!!gatingBlurClass} />
          ))}
        </div>

        {/* Heavy blur / shimmer overlay + CTA */}
        {!IS_PREMIUM && (
          <div
            className={cn(
              "pointer-events-auto absolute inset-0 flex flex-col items-center justify-center",
              "rounded-3xl border border-yellow-500/70",
              "bg-gradient-to-b from-black/10 via-black/80 to-black/95",
              "shadow-[0_0_50px_rgba(250,204,21,0.75)]"
            )}
          >
            {/* Gold shimmer wash */}
            <div
              className={cn(
                "pointer-events-none absolute -inset-10",
                "bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.28),transparent_55%)]",
                "opacity-70 mix-blend-screen animate-pulse"
              )}
            />

            <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/70 bg-black/80 px-3 py-1">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-yellow-400/70 bg-yellow-400/20 text-xs font-semibold text-yellow-300">
                  +
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200">
                  Neeko+ AI Suite
                </span>
              </div>

              <p className="text-sm text-yellow-50/95">
                Unlock full AI projections, volatility indexes and role-driven matchup
                intelligence for every player.
              </p>

              <div className="mt-1 flex flex-col gap-2">
                <a
                  href="/sports/afl/ai-analysis"
                  className={cn(
                    "rounded-full px-6 py-2 text-sm font-semibold text-black",
                    "bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400",
                    "shadow-[0_0_30px_rgba(250,204,21,0.9)] hover:brightness-110 transition"
                  )}
                >
                  Unlock Neeko+ Insights
                </a>
                <a
                  href="/sports/afl/ai-analysis"
                  className="text-[11px] text-yellow-200/85 underline underline-offset-4 hover:text-yellow-200"
                >
                  View full AI Analysis →
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}