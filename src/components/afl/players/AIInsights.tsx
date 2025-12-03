// src/components/afl/players/AIInsights.tsx
import React from "react";
import { cn } from "@/lib/utils";
import {
  Crown,
  TrendingUp,
  TrendingDown,
  BrainCircuit,
  Zap,
} from "lucide-react";

/* ---------------------------------------------------------
   CONFIG — Mock premium flag for visual testing
--------------------------------------------------------- */
const IS_PREMIUM = true; // set true for full section, false for blur preview

/* ---------------------------------------------------------
   MOCK INSIGHTS (6 total)
--------------------------------------------------------- */

const mockInsights = [
  {
    id: 1,
    title: "High-Confidence Projection",
    score: "82.4 ± 8.1",
    highlight: "Strong upside with stable usage",
    color: "emerald",
    icon: TrendingUp,
  },
  {
    id: 2,
    title: "Hot Probability Trend",
    score: "53% hot chance",
    highlight: "L5 form improving vs baseline",
    color: "yellow",
    icon: Zap,
  },
  {
    id: 3,
    title: "Role-Based Expected Spike",
    score: "+12% usage shift",
    highlight: "Midfield rotations trending up",
    color: "blue",
    icon: TrendingUp,
  },
  // PREMIUM ONLY FROM HERE ↓
  {
    id: 4,
    title: "AI Risk Radar",
    score: "47% cold chance",
    highlight: "Downside linked to role volatility",
    color: "red",
    icon: TrendingDown,
  },
  {
    id: 5,
    title: "Stability Regression Signal",
    score: "61% stability",
    highlight: "Volatility curve showing early spread",
    color: "yellow",
    icon: Zap,
  },
  {
    id: 6,
    title: "AI Projection Spread",
    score: "71 → 90",
    highlight: "Moderate ceiling with consistent floor",
    color: "purple",
    icon: BrainCircuit,
  },
];

/* ---------------------------------------------------------
   Insight Card
--------------------------------------------------------- */

function InsightCard({
  title,
  score,
  highlight,
  color,
  icon: Icon,
}: {
  title: string;
  score: string;
  highlight: string;
  color: string;
  icon: any;
}) {
  const colorMap: Record<string, string> = {
    emerald: "from-emerald-600/20 via-emerald-500/10 to-emerald-600/20 border-emerald-400/30",
    yellow: "from-yellow-600/20 via-yellow-500/10 to-yellow-600/20 border-yellow-400/30",
    red: "from-red-600/20 via-red-500/10 to-red-600/20 border-red-400/30",
    blue: "from-sky-600/20 via-sky-500/10 to-sky-600/20 border-sky-400/30",
    purple: "from-purple-600/20 via-purple-500/10 to-purple-600/20 border-purple-400/30",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        "bg-gradient-to-br",
        colorMap[color],
        "shadow-[0_0_20px_rgba(0,0,0,0.25)] hover:brightness-110 transition-all"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-white/70">
            {title}
          </p>
          <p className="mt-1 text-lg font-semibold">{score}</p>
          <p className="mt-1 text-[11px] text-white/55">{highlight}</p>
        </div>

        <Icon className="h-5 w-5 text-white/75" />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Premium Overlay
--------------------------------------------------------- */

function PremiumOverlay() {
  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex flex-col items-center justify-center gap-4",
        "backdrop-blur-xl bg-black/70 rounded-2xl border border-yellow-500/40",
        "shadow-[0_0_30px_rgba(250,204,21,0.35)]"
      )}
    >
      <Crown className="h-8 w-8 text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]" />

      <p className="max-w-xs text-center text-sm text-yellow-200">
        Unlock the full Neeko+ AI suite — projections, probabilities, role
        signals and advanced risk radar.
      </p>

      <a
        href="/sports/afl/ai-analysis"
        className="rounded-full bg-yellow-400 px-5 py-2 text-sm font-semibold text-black shadow-[0_0_20px_rgba(250,204,21,0.45)] hover:brightness-110 transition"
      >
        View Full AI Insights →
      </a>
    </div>
  );
}

/* ---------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */

export default function AIInsights() {
  const freeInsights = mockInsights.slice(0, 3);
  const premiumInsights = mockInsights.slice(3);

  return (
    <section
      className={cn(
        "relative mt-10 rounded-3xl border border-white/10",
        "bg-gradient-to-br from-[#050507] via-[#08080a] to-[#101016]",
        "px-4 py-6 md:px-6 md:py-8 shadow-[0_0_80px_rgba(0,0,0,0.75)]"
      )}
    >
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
          AI-powered probabilities, role-driven context and volatility modelling.
        </p>
      </div>

      {/* Free Insights */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {freeInsights.map((insight) => (
          <InsightCard key={insight.id} {...insight} />
        ))}
      </div>

      {/* Premium Block */}
      <div className="relative mt-6">
        {/* Blur overlay */}
        {!IS_PREMIUM && <PremiumOverlay />}

        <div
          className={cn(
            "grid gap-4 md:grid-cols-3 rounded-2xl border border-white/10 p-4 bg-black/40 backdrop-blur-xl",
            !IS_PREMIUM && "blur-sm opacity-40 select-none"
          )}
        >
          {premiumInsights.map((insight) => (
            <InsightCard key={insight.id} {...insight} />
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
