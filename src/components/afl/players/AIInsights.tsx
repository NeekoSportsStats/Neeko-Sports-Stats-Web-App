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
   Predictor Logic (Mocked but premium-feeling)
--------------------------------------------------------- */
function computePrediction(series: number[]) {
  const l5 = lastN(series, 5);
  const avgL5 = average(l5);
  const season = average(series);
  const vol = stdDev(l5) || 1;

  const predicted = avgL5 * 0.5 + season * 0.3 + (avgL5 - vol) * 0.2;
  const range = vol * 2;

  const hotProb = Math.max(0, Math.min(100, ((avgL5 - season) / season) * 100 + 50));
  const coldProb = 100 - hotProb;

  const stability = Math.max(0, Math.min(100, 100 - vol * 8));

  return { predicted, range, hotProb, coldProb, stability };
}

/* ---------------------------------------------------------
   Sparkline (static mock)
--------------------------------------------------------- */
function TinySparkline() {
  return (
    <svg width="52" height="24" viewBox="0 0 52 24" className="text-yellow-300 opacity-80">
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
   Gold Pulse Strip (Left)
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
   AI Confidence Badge
--------------------------------------------------------- */
function ConfidenceBadge({ value }: { value: number }) {
  const label =
    value >= 75 ? "High confidence" :
    value >= 50 ? "Medium confidence" :
    "Low confidence";

  const colour =
    value >= 75 ? "text-yellow-300" :
    value >= 50 ? "text-orange-300" :
    "text-red-300";

  return (
    <span className={cn("text-[11px] font-medium", colour)}>
      {label}
    </span>
  );
}

/* ---------------------------------------------------------
   INDIVIDUAL ROW CARD
--------------------------------------------------------- */
function AIInsightRow({ player, index }: { player: any; index: number }) {
  const series = getSeriesForStat(player, "fantasy");
  const pred = computePrediction(series);

  const low = pred.predicted - pred.range;
  const high = pred.predicted + pred.range;

  const aiText = aiLines[index % aiLines.length];
  const tags = tagSets[index % tagSets.length];

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

      {/* Top Row - Player + sparkline */}
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

          {/* Combined projection line */}
          <p className="text-xl font-semibold mt-[4px]">
            {pred.predicted.toFixed(1)}{" "}
            <span className="text-base text-white/70">
              ± {pred.range.toFixed(1)} fantasy
            </span>{" "}
            <span className="text-[11px] text-white/55">
              ({low.toFixed(0)}–{high.toFixed(0)} range)
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
        {aiText}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mt-3.5">
        {tags.map((t, i) => (
          <span
            key={i}
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
          <ConfidenceBadge value={pred.stability} />
        </div>

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
   MAIN COMPONENT
--------------------------------------------------------- */
export default function AIInsights() {
  const players = useAFLMockPlayers().slice(0, 6);

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
          consistent position & CBA pattern.{" "}
          <span className="font-medium text-white/45">Usage steady</span> =
          involvement near baseline.{" "}
          <span className="font-medium text-white/45">Neutral matchup</span> =
          average opponent concession patterns.
        </p>
      </div>

      {/* Rows */}
      <div className="space-y-4 mt-6">
        {players.map((p, idx) => (
          <AIInsightRow key={idx} player={p} index={idx} />
        ))}
      </div>

      {/* Footer CTA */}
      <div className="text-center mt-7">
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
