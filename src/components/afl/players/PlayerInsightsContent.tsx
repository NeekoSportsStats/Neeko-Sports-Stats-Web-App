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

  /* ------------------------------------------------------------------ */
  /* LEAGUE COMPARISONS (SAFE FALLBACKS)                                 */
  /* ------------------------------------------------------------------ */

  // Temporary league average fallback (replace later with real data)
  const leagueAvg = config.leagueAvg ?? summary.avg * 0.95;

  const avgDiff = summary.avg - leagueAvg;
  const avgDiffPct = (avgDiff / leagueAvg) * 100;

  const percentile = Math.max(
    1,
    Math.min(99, Math.round(100 - Math.abs(avgDiffPct) * 1.4))
  );

  /* ------------------------------------------------------------------ */
  /* VOLATILITY COLOR LOGIC                                              */
  /* ------------------------------------------------------------------ */

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
  /* SPARKLINE                                                           */
  /* ------------------------------------------------------------------ */

  const sparkMin = Math.min(...rounds);
  const sparkMax = Math.max(...rounds);
  const sparkRange = Math.max(1, sparkMax - sparkMin);

  const sparkPoints = rounds
    .map((v, i) => {
      const x = (i / (rounds.length - 1)) * 100;
      const y = 100 - ((v - sparkMin) / sparkRange) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="flex h-full flex-col gap-4 text-[11px] text-neutral-200">
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

      {/* Summary Card */}
      <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/95 to-black p-5 shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Season summary
            </div>

            {/* League comparison */}
            <div
              className={`mt-1 text-xs ${
                avgDiff >= 0 ? "text-emerald-300" : "text-red-400"
              }`}
            >
              {avgDiff >= 0 ? "▲" : "▼"}{" "}
              {Math.abs(avgDiff).toFixed(1)} vs league avg
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Average
            </div>

            <div className="mt-1 text-sm font-semibold text-yellow-200">
              {summary.avg.toFixed(1)} {config.valueUnitShort}
            </div>

            {/* Percentile badge */}
            <div className="mt-1 inline-block rounded-full border border-yellow-500/40 bg-black/70 px-2 py-0.5 text-[9px] uppercase text-yellow-200">
              Top {percentile}% {player.role}
            </div>
          </div>
        </div>

        {/* Sparkline */}
        <div className="h-20 rounded-xl bg-neutral-900/60 p-2 shadow-inner">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <polyline
              points={sparkPoints}
              fill="none"
              stroke="url(#sparkGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="50%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#fb923c" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Min
            </div>
            <div className="mt-1 text-sm">{summary.min}</div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Max
            </div>
            <div className="mt-1 text-sm">{summary.max}</div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Games
            </div>
            <div className="mt-1 text-sm">{summary.games}</div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Volatility
            </div>
            <div className={`mt-1 text-sm font-semibold ${volatilityColor}`}>
              {volatilityLabel} ({summary.volatilityRange})
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Total
            </div>
            <div className="mt-1 text-sm">{summary.total}</div>
          </div>
        </div>
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

        <div className="mt-2 flex flex-col gap-1.5">
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

                <span className="w-12 text-right font-semibold">{rate}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}