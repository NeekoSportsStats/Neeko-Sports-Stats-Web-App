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
   CONFIG — blur off for dev; toggle true for gating later
--------------------------------------------------------- */
const BLUR_ENABLED = false;

/* ---------------------------------------------------------
   Core AI Prediction Logic (simple but premium-feeling)
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
    Math.min(100, ((avgL5 - avgSeason) / (avgSeason || 1)) * 100 + 50)
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
   Gradient Pulse Sparkline (right-aligned micro trend)
--------------------------------------------------------- */

function GradientSparkline({ data }: { data: number[] }) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);

  const points = data
    .map((v, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * 48;
      const y = 22 - ((v - min) / (max - min || 1)) * 18;
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
      {/* soft glow */}
      <polyline
        points={points}
        fill="none"
        stroke="rgba(250, 204, 21, 0.35)"
        strokeWidth={4}
        className="animate-sparkline-glow"
      />
      {/* main line */}
      <polyline
        points={points}
        fill="none"
        stroke="rgb(250, 204, 21)"
        strokeWidth={2}
      />
    </svg>
  );
}

/* ---------------------------------------------------------
   Confidence Bar (0–100)
--------------------------------------------------------- */

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="w-full h-1 rounded-full bg-white/8 overflow-hidden mt-2">
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

interface AIRowCardProps {
  player: any;
  prediction: ReturnType<typeof computePrediction>;
  blurred: boolean;
}

function AIRowCard({ player, prediction, blurred }: AIRowCardProps) {
  const low = prediction.predicted - prediction.range;
  const high = prediction.predicted + prediction.range;

  return (
    <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-[#111017] via-[#0b0b10] to-[#08080d] px-4 py-4 md:px-5 md:py-5 shadow-[0_0_40px_rgba(0,0,0,0.55)] overflow-hidden">
      {/* left gold pulse strip */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-[3px] rounded-r-full bg-yellow-400/75 shadow-[0_0_18px_rgba(250,204,21,0.7)] animate-ai-strip" />

      {/* soft wash */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-yellow-500/8 via-transparent to-yellow-500/8 blur-2xl" />

      {/* content (optionally blurred) */}
      <div
        className={cn(
          "relative space-y-3",
          blurred && "blur-sm opacity-40 select-none"
        )}
      >
        {/* top row: player + projection + sparkline */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">
              {player.name}{" "}
              <span className="text-xs font-normal text-white/55">
                {player.team} • {player.pos}
              </span>
            </p>

            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/40">
              Projection • L5 expected range
            </p>

            <p className="mt-0.5 text-lg font-semibold text-yellow-300">
              {prediction.predicted.toFixed(1)}{" "}
              <span className="ml-0.5 text-sm text-white/65">
                ± {prediction.range.toFixed(1)}
              </span>
            </p>
            <p className="text-[11px] text-white/40">
              {low.toFixed(0)} → {high.toFixed(0)}
            </p>
          </div>

          <div className="flex flex-col items-end">
            <GradientSparkline data={prediction.series} />
            <p className="mt-1.5 text-[10px] text-white/35">
              Recent scoring trend
            </p>
          </div>
        </div>

        {/* AI summary */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/40 mb-0.5">
            AI Forecast Summary
          </p>
          <p className="text-[13px] leading-relaxed text-white/72">
            AI expects solid ball involvement with favourable usage projection,
            consistent volatility profile and stable role continuity.
          </p>
        </div>

        {/* tags */}
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] text-white/65">
            Role stable
          </span>
          <span className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] text-white/65">
            Usage steady
          </span>
          <span className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] text-white/65">
            Neutral matchup
          </span>
        </div>

        {/* confidence */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">
            Confidence index
          </p>
          <ConfidenceBar value={prediction.stability} />
        </div>
      </div>

      {/* premium overlay for when BLUR_ENABLED is true */}
      {BLUR_ENABLED && blurred && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-yellow-500/50 bg-black/70 backdrop-blur-xl z-10">
          <p className="max-w-xs text-center text-sm text-yellow-100/90 mb-3">
            Unlock full Neeko+ AI projections, role signals and risk radar.
          </p>
          <a
            href="/sports/afl/ai-analysis"
            className="rounded-full bg-yellow-400 px-6 py-2 text-sm font-semibold text-black shadow-[0_0_24px_rgba(250,204,21,0.6)] hover:brightness-110 transition"
          >
            Unlock Neeko+ Insights
          </a>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Main Component — 6 rows (3 free + 3 premium)
--------------------------------------------------------- */

export default function AIInsights() {
  const players = useAFLMockPlayers();

  const rows = useMemo(() => {
    return players.slice(0, 6).map((p) => ({
      player: p,
      prediction: computePrediction(getSeriesForStat(p, "fantasy")),
    }));
  }, [players]);

  return (
    <section
      id="ai-insights"
      className="relative mt-12 rounded-3xl border border-white/10 bg-gradient-to-br from-[#08080a] via-[#050506] to-[#0a0a0f] px-4 py-8 md:px-6 md:py-10 shadow-[0_0_80px_rgba(0,0,0,0.7)]"
    >
      {/* header */}
      <div className="space-y-1.5 mb-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-black/80 px-3 py-1 text-xs text-yellow-200/90">
          <BrainCircuit className="h-3.5 w-3.5 text-yellow-300" />
          <span className="uppercase tracking-[0.18em]">AI Insights</span>
        </div>

        <h2 className="text-xl font-semibold md:text-2xl">
          AI Projection • Usage Forecast • Role Signals
        </h2>

        <p className="max-w-xl text-xs text-white/70 md:text-sm">
          Next-round expectations predicted by Neeko AI — combining role
          tendencies, matchup profiles and volatility pathways.
        </p>

        {/* micro-legend for tags */}
        <p className="max-w-xl text-[10px] text-white/35 leading-relaxed mt-1.5">
          “Role stable” = consistent position &amp; CBA pattern. “Usage steady” =
          involvement near baseline. “Neutral matchup” = average opponent
          fantasy concession.
        </p>
      </div>

      {/* rows */}
      <div className="space-y-4">
        {/* first 3 — free */}
        {rows.slice(0, 3).map((row, idx) => (
          <AIRowCard
            key={`free-${idx}`}
            player={row.player}
            prediction={row.prediction}
            blurred={false}
          />
        ))}

        {/* dev note about blur */}
        {!BLUR_ENABLED && (
          <p className="text-[11px] text-white/30 italic mt-1">
            (Premium blur disabled for development preview.)
          </p>
        )}

        {/* next 3 — premium teaser */}
        {rows.slice(3).map((row, idx) => (
          <AIRowCard
            key={`premium-${idx}`}
            player={row.player}
            prediction={row.prediction}
            blurred={BLUR_ENABLED}
          />
        ))}
      </div>

      {/* CTA */}
      <div className="mt-7 flex justify-center">
        <a
          href="/sports/afl/ai-analysis"
          className="flex items-center gap-1 text-sm font-semibold text-yellow-300 hover:text-yellow-200 transition"
        >
          View full AI Analysis
          <ChevronRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   Animations (gold strip pulse + sparkline glow)
--------------------------------------------------------- */

if (typeof document !== "undefined") {
  const existing = document.getElementById("ai-insights-styles");
  if (!existing) {
    const styleTag = document.createElement("style");
    styleTag.id = "ai-insights-styles";
    styleTag.innerHTML = `
      @keyframes aiStripPulse {
        0% { opacity: 0.22; }
        50% { opacity: 0.75; }
        100% { opacity: 0.22; }
      }
      .animate-ai-strip {
        animation: aiStripPulse 4.8s ease-in-out infinite;
      }

      @keyframes sparklineGlow {
        0% { opacity: 0.5; }
        50% { opacity: 1; }
        100% { opacity: 0.5; }
      }
      .animate-sparkline-glow {
        animation: sparklineGlow 3.6s ease-in-out infinite;
      }
    `;
    document.head.appendChild(styleTag);
  }
}
