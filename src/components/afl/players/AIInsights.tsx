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

/* ---------------------------------------------------------
   Mini Predictor (mocked for UI)
--------------------------------------------------------- */
function computePrediction(series: number[]) {
  const l5 = lastN(series, 5);
  const avgL5 = average(l5);
  const avgSeason = average(series);
  const vol = stdDev(l5) || 1;

  const predicted =
    avgL5 * 0.5 + avgSeason * 0.3 + (avgL5 - vol) * 0.2;

  const range = vol * 2;

  const hotProb = Math.max(
    0,
    Math.min(100, ((avgL5 - avgSeason) / avgSeason) * 100 + 50)
  );

  const coldProb = 100 - hotProb;

  return {
    predicted,
    range,
    hotProb,
    coldProb,
    stability: Math.max(0, Math.min(100, 100 - vol * 8)),
  };
}

/* ---------------------------------------------------------
   Small inline sparkline (mocked)
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
   Row Card
--------------------------------------------------------- */
function AIInsightRow({ player }: { player: any }) {
  const series = getSeriesForStat(player, "fantasy");
  const pred = computePrediction(series);

  const low = pred.predicted - pred.range;
  const high = pred.predicted + pred.range;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/5",
        "bg-gradient-to-br from-[#0c0c11] via-[#0c0c12] to-[#0a0a0e]",
        "px-5 py-4 md:px-6 md:py-5",
        "shadow-[0_0_25px_rgba(0,0,0,0.45)]"
      )}
    >
      <GoldPulseStrip />

      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold">
            {player.name}{" "}
            <span className="text-white/50 text-xs font-normal">
              {player.team} • {player.position}
            </span>
          </p>

          <p className="text-[10px] uppercase tracking-[0.16em] text-white/35 mt-1">
            Projection • L5 Expected Range
          </p>

          {/* Projection */}
          <p className="text-xl font-semibold mt-[2px]">
            {pred.predicted.toFixed(1)}{" "}
            <span className="text-base text-white/70">
              ± {pred.range.toFixed(1)}
            </span>
          </p>

          <p className="text-[11px] text-white/55 mt-[1px]">
            {low.toFixed(0)} → {high.toFixed(0)}
          </p>
        </div>

        {/* Sparkline */}
        <div className="flex flex-col items-end text-[10px] text-white/45">
          <TinySparkline />
          <span className="mt-1">Recent scoring trend</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-white/75 leading-relaxed mt-3.5 pr-10">
        AI expects solid ball involvement with favourable usage projection,
        consistent volatility profile and stable role continuity.
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mt-3">
        <span className="px-2.5 py-1 text-[10px] rounded-full bg-white/10 text-white/60">
          Role stable
        </span>
        <span className="px-2.5 py-1 text-[10px] rounded-full bg-white/10 text-white/60">
          Usage steady
        </span>
        <span className="px-2.5 py-1 text-[10px] rounded-full bg-white/10 text-white/60">
          Neutral matchup
        </span>
      </div>

      {/* Confidence Index */}
      <div className="mt-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-white/35 mb-1.5">
          Confidence Index
        </p>

        <div className="h-[3px] w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full"
            style={{ width: `${pred.stability}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Main Component
--------------------------------------------------------- */
export default function AIInsights() {
  const players = useAFLMockPlayers().slice(0, 6); // Limit to 6 rows

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
          Next-round expectations predicted by Neeko AI — combining role
          tendencies, matchup profiles and volatility pathways.
        </p>

        {/* Legend */}
        <p className="max-w-xl text-[10px] text-white/35 leading-relaxed mt-2">
          <span className="font-medium text-white/45">Role stable</span> =
          consistent position & CBA pattern.{" "}
          <span className="font-medium text-white/45">Usage steady</span> =
          involvement near baseline.{" "}
          <span className="font-medium text-white/45">Neutral matchup</span> =
          opponent fantasy concession at average levels.
        </p>
      </div>

      {/* Rows */}
      <div className="space-y-4 mt-6">
        {players.map((p, idx) => (
          <AIInsightRow key={idx} player={p} />
        ))}
      </div>

      {/* Footer CTA */}
      <div className="text-center mt-6">
        <a
          href="/sports/afl/ai-analysis"
          className="text-sm text-yellow-300 hover:text-yellow-200 transition"
        >
          View full AI Analysis →
        </a>
      </div>
    </section>
  );
}
