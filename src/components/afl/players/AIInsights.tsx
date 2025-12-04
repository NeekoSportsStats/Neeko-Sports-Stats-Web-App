// src/components/afl/players/AIInsights.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { Crown, BrainCircuit } from "lucide-react";

/* ---------------------------------------------------------
   CONFIG — Blur OFF for dev preview
--------------------------------------------------------- */
const BLUR_ENABLED = false; // turn to true when gating goes live

/* ---------------------------------------------------------
   MOCK PLAYERS + AI INSIGHTS (10 rows)
   These are lightweight — teaser style (not full deep dives)
--------------------------------------------------------- */

const mockAI = [
  {
    id: 1,
    name: "Player 51",
    team: "ESS",
    pos: "MID",
    projection: "84.3 ± 7.2",
    summary:
      "AI expects a strong midfield presence with elevated stoppage involvement. Usage profile suggests stable opportunity with minor upside.",
    factors: ["Role stable", "High TOG", "Neutral matchup"],
  },
  {
    id: 2,
    name: "Player 12",
    team: "MELB",
    pos: "DEF",
    projection: "76.1 ± 6.4",
    summary:
      "Projected to see consistent half-back distribution. AI notes reliable kick-start involvement with moderate uncontested load.",
    factors: ["Rebound role", "Favourable matchup"],
  },
  {
    id: 3,
    name: "Player 33",
    team: "CARL",
    pos: "FWD",
    projection: "69.8 ± 8.8",
    summary:
      "Expected to benefit from forward-half time, though scoring volatility remains elevated. AI flags minor ceiling potential.",
    factors: ["High variance", "Strong inside-50 rate"],
  },
  // premium rows from here ↓
  {
    id: 4,
    name: "Player 22",
    team: "WBD",
    pos: "MID",
    projection: "91.4 ± 5.9",
    summary:
      "AI identifies strong contested trend and favourable CBA trajectory. Projection confidence improving week-to-week.",
    factors: ["Rising workload", "CBA lift"],
  },
  {
    id: 5,
    name: "Player 7",
    team: "RICH",
    pos: "RUC",
    projection: "92.7 ± 6.1",
    summary:
      "Ruck contests expected to remain high. AI notes opponent leakage to rucks, boosting scoring expectation.",
    factors: ["Ruck advantage", "Favourable matchup"],
  },
  {
    id: 6,
    name: "Player 18",
    team: "SYD",
    pos: "MID",
    projection: "88.2 ± 7.0",
    summary:
      "AI predicts strong centre-bounce involvement with solid disposal expectation. Role consistency drives projection.",
    factors: ["Stable role", "High TOG"],
  },
  {
    id: 7,
    name: "Player 29",
    team: "ADE",
    pos: "MID",
    projection: "73.4 ± 8.2",
    summary:
      "Projected midfield load slightly reduced due to wing rotation drift. AI flags mild scoring compression.",
    factors: ["Role shift", "Wing usage"],
  },
  {
    id: 8,
    name: "Player 10",
    team: "PORT",
    pos: "DEF",
    projection: "79.1 ± 6.7",
    summary:
      "Expected interception opportunities favourable, though disposal load remains matchup-dependent.",
    factors: ["Intercept role", "Ball-movement dependent"],
  },
  {
    id: 9,
    name: "Player 3",
    team: "FRE",
    pos: "FWD",
    projection: "67.9 ± 9.5",
    summary:
      "Volatile forward role expected to continue with inconsistent opportunities inside 50.",
    factors: ["High variance", "Forward role"],
  },
  {
    id: 10,
    name: "Player 41",
    team: "BRIS",
    pos: "MID",
    projection: "86.6 ± 7.4",
    summary:
      "AI expects balanced scoring from stoppage work and transition chains. Projection confidence remains moderate.",
    factors: ["Balanced usage", "Stoppage involvement"],
  },
];

/* ---------------------------------------------------------
   Row component (clean, premium, teaser-style)
--------------------------------------------------------- */

function AIInsightRow({
  name,
  team,
  pos,
  projection,
  summary,
  factors,
}: {
  name: string;
  team: string;
  pos: string;
  projection: string;
  summary: string;
  factors: string[];
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 p-4 md:p-5",
        "bg-gradient-to-br from-[#0A0A0D] via-[#0C0C10] to-[#101016]",
        "shadow-[0_0_25px_rgba(0,0,0,0.4)]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">
          {name}{" "}
          <span className="text-xs text-white/50">
            {team} • {pos}
          </span>
        </p>
        <p className="text-sm font-medium text-yellow-300">{projection}</p>
      </div>

      {/* Summary sentence */}
      <p className="mt-2 text-[13px] text-white/70 leading-relaxed">{summary}</p>

      {/* Factors */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {factors.map((f, i) => (
          <span
            key={i}
            className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/50 border border-white/10"
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Premium overlay (inside blurred block)
--------------------------------------------------------- */

function PremiumOverlay() {
  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex flex-col items-center justify-center gap-4",
        "backdrop-blur-xl bg-black/70",
        "rounded-2xl border border-yellow-500/40",
        "shadow-[0_0_50px_rgba(250,204,21,0.25)]"
      )}
    >
      <Crown className="h-9 w-9 text-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />

      <p className="max-w-xs text-center text-sm text-yellow-200/90 leading-relaxed">
        Unlock full next-round projections, role signals, usage forecasting and matchup-based AI insights.
      </p>

      <a
        href="/sports/afl/ai-analysis"
        className="rounded-full bg-yellow-400 px-6 py-2 text-sm font-semibold text-black shadow-[0_0_20px_rgba(250,204,21,0.5)] hover:brightness-110 transition"
      >
        Unlock Neeko+ Insights
      </a>
    </div>
  );
}

/* ---------------------------------------------------------
   MAIN COMPONENT (Strategy 2 — Teaser Module)
--------------------------------------------------------- */

export default function AIInsights() {
  const freeRows = mockAI.slice(0, 3);
  const premiumRows = mockAI.slice(3); // rows 4–10

  return (
    <section
      className={cn(
        "relative mt-10 rounded-3xl border border-white/10",
        "bg-gradient-to-br from-[#050507] via-[#08080A] to-[#111016]",
        "px-4 py-6 md:px-6 md:py-8",
        "shadow-[0_0_80px_rgba(0,0,0,0.7)]"
      )}
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
          A fast AI-powered snapshot of next-round expectations — role stability, usage load,
          matchup forecasting and volatility direction.
        </p>
      </div>

      {/* Free rows */}
      <div className="space-y-4">
        {freeRows.map((p) => (
          <AIInsightRow key={p.id} {...p} />
        ))}
      </div>

      {/* Premium blurred block */}
      <div className="relative mt-6">
        {!BLUR_ENABLED && (
          <div className="mb-3 text-[12px] text-white/35 italic">
            (Blur disabled for development preview)
          </div>
        )}

        {/* Blur overlay */}
        {BLUR_ENABLED && <PremiumOverlay />}

        <div
          className={cn(
            "rounded-2xl border border-white/10 p-4 md:p-5 space-y-4 bg-black/40 backdrop-blur-xl",
            BLUR_ENABLED && "blur-sm opacity-40 select-none"
          )}
        >
          {premiumRows.map((p) => (
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
