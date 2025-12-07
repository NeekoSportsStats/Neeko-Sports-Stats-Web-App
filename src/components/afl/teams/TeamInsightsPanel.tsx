// src/components/afl/teams/TeamInsightsPanel.tsx

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AFLTeam, ROUND_LABELS } from "./mockTeams";

/* -------------------------------------------------------------------------- */
/*                               HELPER FUNCS                                 */
/* -------------------------------------------------------------------------- */

const avg = (arr: number[]): number =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const lastN = (arr: number[], n: number) => arr.slice(-n);

const volatility = (arr: number[]): number => {
  if (arr.length < 2) return 0;
  return Math.max(...arr) - Math.min(...arr);
};

type Props = {
  team: AFLTeam;
  onClose: () => void;
};

/* -------------------------------------------------------------------------- */
/*                      SIMPLE SPARKLINE PLACEHOLDER                          */
/* -------------------------------------------------------------------------- */

function Sparkline() {
  return (
    <div className="h-20 rounded-xl bg-gradient-to-b from-neutral-800/60 to-black shadow-[0_0_40px_rgba(0,0,0,0.8)]" />
  );
}

/* -------------------------------------------------------------------------- */
/*                            INSIGHTS PANEL UI                               */
/* -------------------------------------------------------------------------- */

export default function TeamInsightsPanel({ team, onClose }: Props) {
  // body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // trigger slide-in transition
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Snap sheet for mobile
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const last8Scores = lastN(team.scores, 8);
  const last8Labels = ROUND_LABELS.slice(-8);
  const last8Margins = lastN(team.margins, 8);

  const avgScore = avg(last8Scores);
  const vol = volatility(last8Margins);

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="flex h-full w-full items-stretch justify-end">
        {/* DESKTOP RIGHT PANEL */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`hidden h-full w-[440px] max-w-full border-l border-yellow-500/40 bg-gradient-to-b from-neutral-950 via-black to-black px-5 py-4 shadow-[0_0_80px_rgba(250,204,21,0.9)] md:block transition-transform duration-300 ${
            mounted ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200/80">
                Team Insights
              </div>
              <div className="mt-1 text-sm font-semibold text-neutral-50">
                {team.name}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                {team.code}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-neutral-900/90 p-1.5 text-neutral-300 hover:bg-neutral-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content scroll */}
          <div className="h-[calc(100%-80px)] space-y-4 overflow-y-auto pr-1">
            {/* Sparkline + last 8 rounds */}
            <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-black/96 via-neutral-950 to-black px-4 py-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                    Scoring window
                  </div>
                  <div className="mt-1 text-xs text-neutral-300">
                    Last 8 rounds – total score trend and stability.
                  </div>
                </div>
                <div className="text-right text-[11px] text-neutral-200">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                    Avg score
                  </div>
                  <div className="mt-1 text-sm font-semibold text-yellow-200">
                    {avgScore.toFixed(1)}
                  </div>
                </div>
              </div>

              <Sparkline />

              <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-neutral-400">
                {last8Labels.map((label, i) => (
                  <div
                    key={label}
                    className="flex min-w-[36px] flex-col items-center rounded-lg bg-neutral-950/80 px-1.5 py-1"
                  >
                    <span className="text-[9px] text-neutral-500">{label}</span>
                    <span className="mt-0.5 text-[11px] text-neutral-100">
                      {last8Scores[i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Volatility + summary */}
            <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 via-black to-black px-4 py-4 shadow-[0_0_40px_rgba(250,204,21,0.7)]">
              <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-yellow-200">
                AI Summary
              </div>
              <p className="text-[11px] text-neutral-200">
                {team.name} is showing{" "}
                <span className="font-semibold text-neutral-50">
                  {vol < 20
                    ? "tight, controlled round-to-round scoring"
                    : vol < 35
                    ? "moderate scoring variability"
                    : "high volatility in scoring output"}
                </span>{" "}
                over the last 8 rounds, with total production anchored around{" "}
                <span className="font-semibold text-neutral-50">
                  {avgScore.toFixed(1)} points
                </span>{" "}
                per game. Margins suggest{" "}
                <span className="font-semibold text-neutral-50">
                  {avg(last8Margins) >= 0 ? "positive" : "negative"} territory
                </span>{" "}
                in recent weeks.
              </p>
            </div>
          </div>
        </div>

        {/* MOBILE SNAP BOTTOM SHEET */}
        <div
          className="flex w-full items-end justify-center md:hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`w-full rounded-t-3xl border border-yellow-500/25 bg-gradient-to-b from-neutral-950 to-black px-4 py-3 shadow-[0_0_60px_rgba(250,204,21,0.9)] transition-transform duration-250 ${
              mounted ? "translate-y-0" : "translate-y-full"
            }`}
            style={{
              transform: mounted
                ? `translateY(${dragOffset}px)`
                : "translateY(100%)",
            }}
            onTouchStart={(e) => {
              setDragStartY(e.touches[0].clientY);
              setDragOffset(0);
            }}
            onTouchMove={(e) => {
              if (dragStartY == null) return;
              const dy = e.touches[0].clientY - dragStartY;
              if (dy > 0) setDragOffset(Math.min(dy, 260));
            }}
            onTouchEnd={() => {
              if (dragOffset > 120) {
                onClose();
              }
              setDragStartY(null);
              setDragOffset(0);
            }}
          >
            {/* Drag handle */}
            <button
              type="button"
              onClick={onClose}
              className="mx-auto mb-3 mt-1 flex h-1.5 w-10 items-center justify-center rounded-full bg-yellow-200/70"
            >
              <span className="sr-only">Close</span>
            </button>

            {/* Header */}
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200/80">
                  Team Insights
                </div>
                <div className="mt-1 text-sm font-semibold text-neutral-50">
                  {team.name}
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                  {team.code}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-neutral-900/90 p-1.5 text-neutral-300 hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[65vh] space-y-4 overflow-y-auto pb-2">
              <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-black/96 via-neutral-950 to-black px-4 py-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                      Scoring window
                    </div>
                    <div className="mt-1 text-[11px] text-neutral-300">
                      Last 8 rounds score trend.
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-neutral-200">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                      Avg score
                    </div>
                    <div className="mt-1 text-sm font-semibold text-yellow-200">
                      {avgScore.toFixed(1)}
                    </div>
                  </div>
                </div>
                <Sparkline />
              </div>

              <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 via-black to-black px-4 py-4 text-[11px] text-neutral-200 shadow-[0_0_40px_rgba(250,204,21,0.7)]">
                <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-yellow-200">
                  AI Summary
                </div>
                <p>
                  {team.name} is showing{" "}
                  <span className="font-semibold text-neutral-50">
                    {vol < 20
                      ? "tight scoring bands"
                      : vol < 35
                      ? "moderate scoring swing"
                      : "large round-to-round swings"}
                  </span>{" "}
                  across the most recent 8 rounds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
