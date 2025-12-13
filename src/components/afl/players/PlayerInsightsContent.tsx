import React from "react";
import { ROUND_LABELS } from "./MasterTable";
import type { PlayerRow, StatLens } from "./MasterTable";

import {
  computeSummary,
  computeHitRates,
  getRoundsForLens,
} from "./playerInsightsUtils";

import { STAT_CONFIG } from "./playerStatConfig";

/**
 * Full insights content for players — used inside PlayerInsightsOverlay.
 */
export default function PlayerInsightsContent({
  player,
  selectedStat,
}: {
  player: PlayerRow;
  selectedStat: StatLens;
}) {
  const config = STAT_CONFIG[selectedStat];
  const summary = computeSummary(player, selectedStat);
  const hitRates = computeHitRates(player, selectedStat);
  const rounds = getRoundsForLens(player, selectedStat);

  const volatilityLabel =
    summary.volatilityRange <= 8
      ? "Low"
      : summary.volatilityRange <= 14
      ? "Medium"
      : "High";

  const volatilityColor =
    summary.volatilityRange <= 8
      ? "text-teal-300"
      : summary.volatilityRange <= 14
      ? "text-amber-300"
      : "text-red-400";

  /* ------------------------------------------------------------------ */
  /* SAFE STATIC STYLE MAPS                                              */
  /* ------------------------------------------------------------------ */

  const LENS_BADGE_CLASS: Record<StatLens, string> = {
    Fantasy: "border-yellow-500/40 text-yellow-300",
    Disposals: "border-teal-500/40 text-teal-300",
    Goals: "border-amber-500/40 text-amber-300",
  };

  const LENS_STROKE_COLOR: Record<StatLens, string> = {
    Fantasy: "#facc15",
    Disposals: "#2dd4bf",
    Goals: "#f59e0b",
  };

  const AI_LENS_INSIGHT: Record<StatLens, string> = {
    Fantasy:
      "This player’s fantasy output is driven by ceiling games and matchup-sensitive scoring spikes.",
    Disposals:
      "This player delivers reliable disposal volume with consistency across game tempo and opposition.",
    Goals:
      "This player’s goal scoring is swing-based, with clear ceiling games but lower floor reliability.",
  };

  return (
    // ✅ FIX: removed h-full (this was breaking iOS scrolling)
    <div className="flex flex-col gap-4 text-[11px] text-neutral-200 pb-6">
      {/* Round-by-round strip */}
      <div>
        <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Round-by-round {config.label.toLowerCase()}
        </div>

        <div className="overflow-x-auto overscroll-contain">
          <div className="flex gap-2 pb-1">
            {rounds.map((v, i) => (
              <div key={i} className="flex min-w-[46px] flex-col items-center">
                <span className="text-[9px] text-neutral-500">
                  {ROUND_LABELS[i]}
                </span>

                <div className="mt-1 flex h-8 w-10 items-center justify-center rounded-md bg-neutral-950/80 text-[11px] text-neutral-100">
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Season Summary Card */}
      <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/95 to-black p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Season summary — {config.label}
            </div>
            <div className="mt-1 text-xs text-neutral-300">
              ▲ {summary.vsLeague.toFixed(1)} vs league avg
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Average
            </div>
            <div className="mt-1 text-sm font-semibold text-yellow-200">
              {summary.avg.toFixed(1)} {config.valueUnitShort}
            </div>

            <div
              className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[9px] uppercase ${LENS_BADGE_CLASS[selectedStat]}`}
            >
              Top {summary.percentile}% {player.role}
            </div>
          </div>
        </div>

        {/* Sparkline */}
        <div className="h-20 rounded-xl bg-neutral-950/60 shadow-inner flex items-center justify-center">
          <svg width="120" height="40" viewBox="0 0 120 40">
            <polyline
              fill="none"
              stroke={LENS_STROKE_COLOR[selectedStat]}
              strokeWidth="2"
              points={summary.sparkline}
            />
          </svg>
        </div>

        <div className="mt-4 grid gap-3 text-[11px] sm:grid-cols-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Min
            </div>
            <div className="mt-1 text-sm text-neutral-100">
              {summary.min}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Max
            </div>
            <div className="mt-1 text-sm text-neutral-100">
              {summary.max}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Games
            </div>
            <div className="mt-1 text-sm text-neutral-100">
              {summary.games}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Total
            </div>
            <div className="mt-1 text-sm text-neutral-100">
              {summary.total}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Volatility
            </div>
            <div className={`mt-1 text-sm font-semibold ${volatilityColor}`}>
              {volatilityLabel} ({summary.volatilityRange})
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/95 px-5 py-4 text-[11px] text-neutral-300 shadow-md">
        <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-yellow-200">
          AI performance summary
        </div>
        <p>
          {AI_LENS_INSIGHT[selectedStat]}{" "}
          <span className="text-neutral-50 font-semibold">
            ({volatilityLabel.toLowerCase()} volatility)
          </span>
        </p>
      </div>

      {/* Hit-Rate Ladder */}
      <div className="rounded-2xl border border-yellow-500/30 bg-black/85 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.18em] text-yellow-100">
            Hit-rate ladder
          </span>
          <span className="rounded-full border border-yellow-500/40 bg-black/70 px-2 py-0.5 text-[9px] uppercase text-yellow-200">
            {config.label}
          </span>
        </div>

        <div className="mt-2 flex flex-col gap-1.5 text-[11px]">
          {config.thresholds.map((t, i) => {
            const rate = hitRates[i];

            return (
              <div
                key={t}
                className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-black/70 px-2.5 py-1.5"
              >
                <span className="w-20 text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                  {t}+
                </span>

                <div className="flex-1 overflow-hidden rounded-full bg-neutral-900/80">
                  <div
                    className="h-1.5 bg-gradient-to-r from-emerald-400 via-yellow-300 to-orange-400"
                    style={{ width: `${rate}%` }}
                  />
                </div>

                <span className="w-12 text-right font-semibold text-neutral-200">
                  {rate}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}