// src/components/afl/players/AIInsights.tsx
import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Crown,
  Lock,
  Zap,
  TrendingUp,
  TrendingDown,
  BrainCircuit,
} from "lucide-react";

import {
  useAFLMockPlayers,
  lastN,
  average,
  stdDev,
  getSeriesForStat,
} from "@/components/afl/players/useAFLMockData";

type StatKey = "fantasy";

/* ---------------------------------------------------------
   Predictor math (simple but premium-feeling)
--------------------------------------------------------- */

function computePrediction(series: number[]) {
  const l5 = lastN(series, 5);
  const avgL5 = average(l5);
  const avgSeason = average(series);
  const vol = stdDev(l5) || 1;

  // Weighted prediction
  const predicted =
    avgL5 * 0.5 +
    avgSeason * 0.3 +
    (avgL5 - vol) * 0.2;

  const range = vol * 2; // ± 2 std dev = nice believable range

  const hotProb =
    Math.max(0, Math.min(100, ((avgL5 - avgSeason) / avgSeason) * 100 + 50));

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
   Premium Blur Overlay
--------------------------------------------------------- */

function PremiumBlurOverlay() {
  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex flex-col items-center justify-center gap-4",
        "backdrop-blur-xl bg-black/70 rounded-2xl border border-yellow-500/40",
        "shadow-[0_0_40px_rgba(250,204,21,0.35)]"
      )}
    >
      <Crown className="h-8 w-8 text-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.9)]" />
      <p className="max-w-xs text-center text-sm text-yellow-200/90">
        Unlock the full Neeko+ AI Projection Engine — predictions, probabilities, and role-based insights.
      </p>

      <button
        className={cn(
          "mt-1 rounded-full px-5 py-2 text-sm font-semibold text-black",
          "bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400",
          "shadow-[0_0_20px_rgba(250,204,21,0.55)] hover:brightness-110 transition"
        )}
      >
        Unlock Neeko+ Insights
      </button>
    </div>
  );
}

/* ---------------------------------------------------------
   Main Component
--------------------------------------------------------- */

export default function AIInsights() {
  const players = useAFLMockPlayers();
  const spotlight = players[0]; // spotlight mock player
  const series = getSeriesForStat(spotlight, "fantasy");
  const pred = computePrediction(series);

  const predictedLow = pred.predicted - pred.range;
  const predictedHigh = pred.predicted + pred.range;

  // FREE VS PREMIUM
  const isPremium = false; // <- replace with your auth hook

  return (
    <section
      className={cn(
        "relative mt-8 rounded-3xl border border-white/10",
        "bg-gradient-to-br from-[#050507] via-black to-[#101016]",
        "px-4 py-6 md:px-6 md:py-8 shadow-[0_0_80px_rgba(0,0,0,0.75)]"
      )}
    >
      {/* Background wash */}
      <div className="pointer-events-none absolute inset-x-[-60px] top-20 bottom-[-60px] bg-gradient-to-r from-yellow-500/15 via-purple-500/10 to-yellow-500/18 blur-3xl opacity-70" />

      <div className="relative space-y-4">
        {/* Header */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-black/80 px-3 py-1 text-xs text-yellow-200/90">
            <BrainCircuit className="h-3.5 w-3.5 text-yellow-300" />
            <span className="uppercase tracking-[0.18em]">
              AI Insights (Neeko+)
            </span>
          </div>

          <h2 className="text-xl font-semibold md:text-2xl">
            AI Projection • Forecast • Risk Radar
          </h2>

          <p className="max-w-xl text-xs text-white/70 md:text-sm">
            Neeko AI blends stability scores, usage trends and volatility curves
            to forecast next-round fantasy performance.
          </p>
        </div>

        {/* Main Premium Block */}
        <div className="relative mt-2 overflow-hidden rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-xl md:p-5">
          {!isPremium && <PremiumBlurOverlay />}

          {/* Inner content (blurred for free users) */}
          <div className={cn(!isPremium && "blur-sm select-none opacity-50")}>
            {/* Prediction Value */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-yellow-200">
                  AI Projection (L5 Expected Range)
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {pred.predicted.toFixed(1)}{" "}
                  <span className="text-base text-white/70">
                    ± {pred.range.toFixed(1)}
                  </span>
                </p>
                <p className="text-[11px] text-white/50">
                  {predictedLow.toFixed(0)} → {predictedHigh.toFixed(0)}
                </p>
              </div>

              <Zap className="h-8 w-8 text-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]" />
            </div>

            {/* Probabilities */}
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-md bg-emerald-600/20 p-3 border border-emerald-500/30">
                <TrendingUp className="mx-auto mb-1 h-4 w-4 text-emerald-300" />
                <p className="text-sm font-semibold text-emerald-300">
                  {pred.hotProb.toFixed(0)}%
                </p>
                <p className="text-[10px] text-white/55 uppercase tracking-wider">
                  Hot Chance
                </p>
              </div>

              <div className="rounded-md bg-red-600/20 p-3 border border-red-500/30">
                <TrendingDown className="mx-auto mb-1 h-4 w-4 text-red-300" />
                <p className="text-sm font-semibold text-red-300">
                  {pred.coldProb.toFixed(0)}%
                </p>
                <p className="text-[10px] text-white/55 uppercase tracking-wider">
                  Cold Chance
                </p>
              </div>

              <div className="rounded-md bg-yellow-600/20 p-3 border border-yellow-500/30">
                <Zap className="mx-auto mb-1 h-4 w-4 text-yellow-300" />
                <p className="text-sm font-semibold text-yellow-300">
                  {pred.stability.toFixed(0)}%
                </p>
                <p className="text-[10px] text-white/55 uppercase tracking-wider">
                  Stability
                </p>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="mt-5 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                AI Forecast
              </p>
              <p className="text-sm leading-relaxed text-white/75">
                Based on recent scoring trajectories, volatility behaviour and
                stability weighting,{" "}
                <span className="font-semibold text-yellow-200">
                  {spotlight.name}
                </span>{" "}
                is expected to produce a mid-to-high fantasy output with moderate
                upside potential if usage patterns hold steady.
              </p>
            </div>

            {/* Risk Summary */}
            <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-300">
                Risk Radar
              </p>
              <p className="mt-1 text-sm text-white/75">
                Downside risk increases if role fluctuations reappear or
                volatility spikes exceed recent norms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
