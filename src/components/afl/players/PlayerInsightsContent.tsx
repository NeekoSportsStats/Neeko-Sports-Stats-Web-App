import React from "react";
import { ROUND_LABELS } from "./MasterTable";
import type { PlayerRow, StatLens } from "./MasterTable";
import { computeSummary, computeHitRates, getRoundsForLens, STAT_CONFIG } from "./playerInsightsUtils";

/**
 * This assumes we move the helper functions into a utils file.
 * If you prefer NOT to move helpers, I can inline them again.
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

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Round-by-round carousel */}
      <div>
        <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Round-by-round scores
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-2 pb-1">
            {rounds.map((value, i) => (
              <div key={i} className="flex min-w-[46px] flex-col items-center">
                <span className="text-[9px] text-neutral-500">
                  {ROUND_LABELS[i]}
                </span>
                <div className="mt-1 flex h-8 w-10 items-center justify-center rounded-md bg-neutral-950/80 text-[11px] text-neutral-100">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent window summary */}
      <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/95 via-neutral-950 to-black p-5 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Recent scoring window
            </div>
            <div className="mt-1 text-xs text-neutral-300">
              Last 8 games at this stat lens.
            </div>
          </div>
          <div className="text-right text-[11px] text-neutral-200">
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Average
            </div>
            <div className="mt-1 text-sm font-semibold text-yellow-200">
              {summary.avg.toFixed(1)} {config.valueUnitShort}
            </div>
          </div>
        </div>

        {/* Sparkline placeholder */}
        <div className="h-20 rounded-xl bg-gradient-to-b from-neutral-800/70 to-black shadow-[0_0_40px_rgba(0,0,0,0.8)]" />

        <div className="mt-4 grid gap-3 text-[11px] text-neutral-300 sm:grid-cols-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Range window
            </div>
            <div className="mt-1 text-sm font-semibold text-neutral-100">
              {summary.windowMin}–{summary.windowMax} {config.valueUnitShort}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Volatility
            </div>
            <div className="mt-1 text-sm font-semibold text-teal-300">
              {volatilityLabel} ({summary.volatilityRange} range)
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Total
            </div>
            <div className="mt-1 text-sm font-semibold text-neutral-100">
              {summary.total} {config.valueUnitShort}
            </div>
          </div>
        </div>
      </div>

      {/* AI summary */}
      <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-black/96 via-neutral-950 to-black px-5 py-4 text-[11px] text-neutral-300 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
        <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-yellow-200">
          AI performance summary
        </div>
        <p>
          Usage and role suggest{" "}
          <span className="font-semibold text-neutral-50">
            stable opportunity
          </span>{" "}
          with{" "}
          <span className="font-semibold text-neutral-50">
            {volatilityLabel.toLowerCase()} volatility
          </span>{" "}
          at this lens.
        </p>
      </div>

      {/* Hit-rate profile */}
      <div className="grid gap-4 sm:grid-cols-2">
        {STAT_CONFIG[selectedStat].thresholds.map((threshold, idx) => {
          const value = hitRates[idx];
          return (
            <div key={threshold} className="rounded-xl border border-neutral-800 bg-black/80 p-4">
              <div className="text-[10px] text-neutral-400 uppercase tracking-[0.14em] mb-1">
                {threshold}+
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-900">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-400 via-yellow-300 to-lime-400"
                  style={{ width: `${value}%` }}
                />
              </div>
              <div className="mt-1 text-right text-[10px] text-neutral-300">
                {value}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}