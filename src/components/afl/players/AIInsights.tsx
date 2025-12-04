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
   INDIVIDUAL ROW CARD (pure presentational)
--------------------------------------------------------- */

function AIInsightRow({
  row,
  index,
  blurred,
}: {
  row: AIInsightRowModel;
  index: number;
  blurred?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/5",
        "bg-gradient-to-br from-[#0c0c11] via-[#0c0c12] to-[#0a0a0e]",
        "px-5 py-5 md:px-6 md:py-6",
        "shadow-[0_0_25px_rgba(0,0,0,0.45)]"
      )}
    >
      <GoldPulseStrip />

      {/* Content wrapper (blur for premium gating) */}
      <div
        className={cn(
          "relative",
          blurred && "blur-sm brightness-[0.6] select-none pointer-events-none"
        )}
      >
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
        <p className="text-sm text-white/75 leading-relaxed mt-4 pr-10">
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

      {/* FREE ROWS */}
      <div className="space-y-4 mt-6">
        {freeRows.map((row, idx) => (
          <AIInsightRow key={row.id} row={row} index={idx} blurred={false} />
        ))}
      </div>

      {/* PREMIUM GATED ROWS */}
      <div className="relative mt-6">
        <div
          className={cn(
            "space-y-4",
            !IS_PREMIUM && "blur-sm brightness-[0.6] select-none pointer-events-none"
          )}
        >
          {premiumRows.map((row, idx) => (
            <AIInsightRow
              key={row.id}
              row={row}
              index={idx + freeRows.length}
              blurred={false} // blur handled at wrapper level
            />
          ))}
        </div>

        {!IS_PREMIUM && (
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center",
              "rounded-3xl bg-gradient-to-b from-black/10 via-black/75 to-black/95",
              "border border-yellow-500/35 shadow-[0_0_40px_rgba(250,204,21,0.45)]"
            )}
          >
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400/15 border border-yellow-400/50">
                  <span className="text-xs font-semibold text-yellow-300">+</span>
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
                  Neeko+ AI Suite
                </span>
              </div>

              <p className="text-sm text-yellow-50/95">
                Unlock full AI projections, volatility indexes and role-driven matchup
                intelligence for every player.
              </p>

              <div className="flex flex-col gap-2">
                <a
                  href="/sports/afl/ai-analysis"
                  className={cn(
                    "rounded-full px-6 py-2 text-sm font-semibold text-black",
                    "bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400",
                    "shadow-[0_0_24px_rgba(250,204,21,0.7)] hover:brightness-110 transition"
                  )}
                >
                  Unlock Neeko+ Insights
                </a>
                <a
                  href="/sports/afl/ai-analysis"
                  className="text-[11px] text-yellow-200/80 hover:text-yellow-200 underline underline-offset-4"
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
