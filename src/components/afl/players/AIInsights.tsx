// src/components/afl/players/AIInsights.tsx
import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  BrainCircuit,
  ChevronRight,
} from "lucide-react";

import {
  useAFLMockPlayers,
  lastN,
  average,
  stdDev,
  getSeriesForStat,
} from "@/components/afl/players/useAFLMockData";

/* ---------------------------------------------------------
   Core AI Prediction Logic (Simple but premium-feeling)
--------------------------------------------------------- */

function computePrediction(series: number[]) {
  const l5 = lastN(series, 5);
  const avgL5 = average(l5);
  const avgSeason = average(series);
  const vol = stdDev(l5) || 1;

  const predicted =
    avgL5 * 0.5 +
    avgSeason * 0.3 +
    (avgL5 - vol) * 0.2;

  const range = vol * 2;

  const hotProb = Math.max(
    0,
    Math.min(100, ((avgL5 - avgSeason) / avgSeason) * 100 + 50)
  );

  const coldProb = 100 - hotProb;

  const stability = Math.max(
    0,
    Math.min(100, 100 - vol * 8)
  );

  return {
    predicted,
    range,
    hotProb,
    coldProb,
    stability,
    vol,
    series: l5,
  };
}

/* ---------------------------------------------------------
   Gradient Pulse Sparkline Component
--------------------------------------------------------- */

function GradientSparkline({ data }: { data: number[] }) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 48;
      const y = 24 - ((v - min) / (max - min || 1)) * 22;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width="48"
      height="24"
      viewBox="0 0 48 24"
      className="overflow-visible"
    >
      {/* Soft glow line */}
      <polyline
        points={points}
        fill="none"
        stroke="rgba(255,215,0,0.28)"
        strokeWidth="5"
        className="animate-pulse-slow"
      />

      {/* Main line */}
      <polyline
        points={points}
        fill="none"
        stroke="rgb(255,215,0)"
        strokeWidth="2"
      />
    </svg>
  );
}

/* ---------------------------------------------------------
   Confidence Bar (0–100)
--------------------------------------------------------- */

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mt-2">
      <div
        className="h-full rounded-full bg-yellow-400 transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

/* ---------------------------------------------------------
   Row Card
--------------------------------------------------------- */

function AIRowCard({
  player,
  prediction,
  blur,
}: {
  player: any;
  prediction: ReturnType<typeof computePrediction>;
  blur: boolean;
}) {
  const low = prediction.predicted - prediction.range;
  const high = prediction.predicted + prediction.range;

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-white/10 bg-gradient-to-br from-[#101015] via-[#0c0c0f] to-[#0a0a0e] p-4 md:p-5 overflow-hidden",
        "shadow-[0_0_40px_rgba(255,215,0,0.05)]"
      )}
    >
      {/* Animated soft pulse glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-yellow-500/5 blur-2xl animate-glow-pulse pointer-events-none" />

      {/* Blur layer (disabled for dev) */}
      <div className={cn(!blur ? "" : "blur-md opacity-40 select-none")}>
        {/* Player + sparkline row */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold text-white">
              {player.name}{" "}
              <span className="text-white/50 text-xs">
                {player.team} • {player.pos}
              </span>
            </p>

            {/* Projection Header */}
            <p className="text-[10px] uppercase tracking-wide text-white/40 mt-1">
              Projection • L5 expected range
            </p>

            {/* Projection */}
            <p className="text-lg font-semibold text-yellow-300 mt-0.5">
              {prediction.predicted.toFixed(1)}{" "}
              <span className="text-sm text-white/60">
                ± {prediction.range.toFixed(1)}
              </span>
            </p>

            <p className="text-[11px] text-white/40">
              {low.toFixed(0)} → {high.toFixed(0)}
            </p>
          </div>

          {/* Sparkline */}
          <div className="flex flex-col items-end">
            <GradientSparkline data={prediction.series} />
            <p className="mt-1 text-[10px] text-white/35">
              Recent scoring trend
            </p>
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-white/70 mt-3 leading-relaxed">
          AI expects solid ball involvement with favourable usage projection,
          consistent volatility profile and stable role continuity.
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
            Role stable
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
            Usage steady
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
            Neutral matchup
          </span>
        </div>

        {/* Confidence */}
        <p className="text-[10px] uppercase tracking-wide text-white/40 mt-3">
          Confidence Index
        </p>
        <ConfidenceBar value={prediction.stability} />
      </div>

      {/* Premium overlay placeholder (blur disabled) */}
      {false && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xl flex flex-col items-center justify-center rounded-2xl border border-yellow-500/40">
          <p className="text-yellow-200 text-sm px-6 text-center">
            Unlock full Neeko+ AI insights
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Main Component
--------------------------------------------------------- */

export default function AIInsights() {
  const players = useAFLMockPlayers();

  const rows = useMemo(() => {
    return players.slice(0, 6).map((p) => ({
      player: p,
      prediction: computePrediction(
        getSeriesForStat(p, "fantasy")
      ),
    }));
  }, [players]);

  return (
    <section
      id="ai-insights"
      className="relative mt-12 rounded-3xl border border-white/10 bg-gradient-to-br from-[#09090a] via-[#050506] to-[#0a0a0e] px-4 py-8 md:px-6 md:py-10 shadow-[0_0_70px_rgba(0,0,0,0.65)]"
    >
      {/* Header */}
      <div className="space-y-1.5 mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-black/80 px-3 py-1 text-xs text-yellow-200/90">
          <BrainCircuit className="h-3.5 w-3.5 text-yellow-300" />
          <span className="uppercase tracking-[0.18em]">AI Insights</span>
        </div>

        <h2 className="text-xl font-semibold md:text-2xl">
          AI Projection • Usage Forecast • Role Signals
        </h2>

        <p className="max-w-xl text-xs text-white/70 md:text-sm">
          Next-round expectations predicted by Neeko AI — combining role tendencies,
          matchup profiles and volatility pathways.
        </p>
      </div>

      {/* Row List */}
      <div className="space-y-4">
        {/* First 3 = Free */}
        {rows.slice(0, 3).map((row, i) => (
          <AIRowCard
            key={i}
            player={row.player}
            prediction={row.prediction}
            blur={false}
          />
        ))}

        <p className="text-[11px] text-white/35 italic">
          (Blur disabled for development preview)
        </p>

        {/* Next 3 = Premium (blur ON later) */}
        {rows.slice(3).map((row, i) => (
          <AIRowCard
            key={i}
            player={row.player}
            prediction={row.prediction}
            blur={false} // ← enable later
          />
        ))}
      </div>

      {/* CTA */}
      <div className="mt-8 flex justify-center">
        <a
          href="/sports/afl/ai-analysis"
          className="text-sm font-semibold text-yellow-300 hover:text-yellow-200 transition flex items-center gap-1"
        >
          View full AI Analysis <ChevronRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   Animations
--------------------------------------------------------- */

const style = document.createElement("style");
style.innerHTML = `
@keyframes glow-pulse {
  0% { opacity: 0.25; }
  50% { opacity: 0.6; }
  100% { opacity: 0.25; }
}

.animate-glow-pulse {
  animation: glow-pulse 6s ease-in-out infinite;
}

@keyframes pulse-slow {
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
}

.animate-pulse-slow {
  animation: pulse-slow 3.5s ease-in-out infinite;
}
`;
document.head.appendChild(style);
