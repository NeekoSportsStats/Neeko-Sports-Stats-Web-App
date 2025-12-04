// src/components/afl/players/AIInsights.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { Crown, BrainCircuit } from "lucide-react";

/* ---------------------------------------------------------
   CONFIG — Blur OFF for development
--------------------------------------------------------- */
const BLUR_ENABLED = false; // set to TRUE when premium gating is ready

/* ---------------------------------------------------------
   HELPER — Generate a pulse-gradient sparkline path
--------------------------------------------------------- */
function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const norm = values.map((v) => ((v - min) / (max - min || 1)) * 40);

  const step = 50 / (values.length - 1);

  const path = norm
    .map((v, i) => `${i * step},${40 - v}`)
    .join(" ");

  return (
    <svg
      width="50"
      height="40"
      viewBox="0 0 50 40"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
      </defs>

      <polyline
        fill="none"
        stroke="url(#pulseGradient)"
        strokeWidth="2"
        points={path}
        className="animate-pulse-spark"
      />
    </svg>
  );
}

/* ---------------------------------------------------------
   HELPER — Confidence bar (0–100%)
--------------------------------------------------------- */
function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full bg-yellow-400 transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

/* ---------------------------------------------------------
   MOCK DATA — 10 rows
--------------------------------------------------------- */

const mockAI = Array.from({ length: 10 }).map((_, i) => {
  const base = 70 + Math.random() * 30;
  const range = (Math.random() * 6 + 4).toFixed(1);

  return {
    id: i + 1,
    name: `Player ${Math.floor(Math.random() * 60) + 1}`,
    team: ["ESS", "MELB", "CARL", "RICH", "SYD", "PORT", "ADE", "FRE", "WBD"][
      i % 9
    ],
    pos: ["MID", "DEF", "FWD", "RUC"][i % 4],
    projection: `${base.toFixed(1)} ± ${range}`,
    summary:
      i % 3 === 0
        ? "AI expects solid ball involvement with favourable usage projection and consistent midfield presence."
        : i % 3 === 1
        ? "Forecasting stable role with expected baseline scoring; matchup influence remains moderate."
        : "Projected scoring window suggests balanced opportunity; volatility indicators within normal range.",
    factors:
      i % 2 === 0
        ? ["Role stable", "Usage steady", "Neutral matchup"]
        : ["CBA lift", "Transition chains", "Volatility normal"],
    confidence: Math.floor(60 + Math.random() * 35), // 60–95%
    spark: Array.from({ length: 8 }).map(() => Math.random() * 100),
  };
});

/* ---------------------------------------------------------
   AI ROW COMPONENT
--------------------------------------------------------- */

function AIInsightRow({
  name,
  team,
  pos,
  projection,
  summary,
  factors,
  spark,
  confidence,
}: any) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-white/10 p-4 md:p-5",
        "bg-gradient-to-br from-[#0b0c0f] via-[#0d0e12] to-[#131318]",
        "shadow-[0_0_35px_rgba(0,0,0,0.5)]",
        "before:absolute before:inset-0 before:rounded-2xl before:animate-pulse-glow",
        "before:bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.08),transparent_70%)]"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white font-semibold text-sm">
            {name}{" "}
            <span className="text-white/40 text-xs font-normal">
              {team} • {pos}
            </span>
          </p>
          <p className="mt-0.5 text-yellow-300 font-medium text-sm">
            {projection}
          </p>
        </div>

        {/* Gradient pulse sparkline */}
        <div className="pt-1">
          <Sparkline values={spark} />
        </div>
      </div>

      {/* Summary */}
      <p className="mt-2 text-[13px] text-white/70 leading-relaxed">{summary}</p>

      {/* Tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {factors.map((f: string, i: number) => (
          <span
            key={i}
            className="rounded-full border border-white/10 bg-white/5 text-[11px] px-2.5 py-1 text-white/50"
          >
            {f}
          </span>
        ))}
      </div>

      {/* Confidence Bar */}
      <ConfidenceBar value={confidence} />
    </div>
  );
}

/* ---------------------------------------------------------
   PREMIUM OVERLAY
--------------------------------------------------------- */

function PremiumOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 backdrop-blur-xl bg-black/70 rounded-2xl border border-yellow-500/40 shadow-[0_0_45px_rgba(250,204,21,0.35)]">
      <Crown className="h-10 w-10 text-yellow-300 drop-shadow-[0_0_15px_rgba(250,204,21,0.9)]" />
      <p className="max-w-xs text-center text-sm text-yellow-200/90 leading-relaxed">
        Unlock full AI projections, role signals, usage forecasting and
        matchup-driven intelligence.
      </p>
      <a
        href="/sports/afl/ai-analysis"
        className="rounded-full bg-yellow-400 px-6 py-2 text-sm font-semibold text-black shadow-[0_0_25px_rgba(250,204,21,0.45)] hover:brightness-110 transition"
      >
        Unlock Neeko+ Insights
      </a>
    </div>
  );
}

/* ---------------------------------------------------------
   MAIN COMPONENT — 10 rows (3 free + blurred rest)
--------------------------------------------------------- */

export default function AIInsights() {
  const free = mockAI.slice(0, 3);
  const premium = mockAI.slice(3);

  return (
    <section
      id="ai-insights"
      className="relative mt-12 rounded-3xl border border-white/10 bg-gradient-to-br from-[#050507] via-[#08080a] to-[#111016] px-4 py-6 md:px-6 md:py-8 shadow-[0_0_90px_rgba(0,0,0,0.75)]"
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
        <p className="text-xs md:text-sm text-white/70 max-w-xl">
          Next-round expectations predicted by Neeko AI — combining role
          tendencies, matchup profiles and volatility pathways.
        </p>
      </div>

      {/* Free rows */}
      <div className="space-y-4">
        {free.map((p) => (
          <AIInsightRow key={p.id} {...p} />
        ))}
      </div>

      {/* Premium rows (blurred) */}
      <div className="relative mt-8">
        {!BLUR_ENABLED && (
          <p className="mb-2 text-[11px] text-white/30 italic">
            (Blur disabled for development preview)
          </p>
        )}

        {BLUR_ENABLED && <PremiumOverlay />}

        <div
          className={cn(
            "rounded-2xl border border-white/10 p-4 md:p-5 space-y-4 bg-black/40 backdrop-blur-xl",
            BLUR_ENABLED && "blur-sm opacity-40 select-none"
          )}
        >
          {premium.map((p) => (
            <AIInsightRow key={p.id} {...p} />
          ))}
        </div>
      </div>

      {/* Bottom link */}
      <div className="mt-6 text-center">
        <a
          href="/sports/afl/ai-analysis"
          className="text-sm font-medium text-yellow-300 hover:text-yellow-200 transition"
        >
          View full AI Analysis →
        </a>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   GLOBAL ANIMATIONS (sparkline pulse + glow)
--------------------------------------------------------- */
const styles = `
@keyframes pulse-glow {
  0% { opacity: 0.35; }
  50% { opacity: 0.55; }
  100% { opacity: 0.35; }
}

.animate-pulse-glow {
  animation: pulse-glow 4.5s ease-in-out infinite;
}

@keyframes sparkPulse {
  0% { stroke-opacity: 0.5; }
  50% { stroke-opacity: 1; }
  100% { stroke-opacity: 0.5; }
}

.animate-pulse-spark {
  animation: sparkPulse 2.4s ease-in-out infinite;
}
`;

if (typeof document !== "undefined") {
  const styleTag = document.createElement("style");
  styleTag.innerHTML = styles;
  document.head.appendChild(styleTag);
}
