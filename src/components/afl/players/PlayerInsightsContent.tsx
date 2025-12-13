import React from "react";
import { ROUND_LABELS } from "./MasterTable";
import type { PlayerRow, StatLens } from "./MasterTable";
import {
  computeSummary,
  computeHitRates,
  getRoundsForLens,
} from "./playerInsightsUtils";
import { STAT_CONFIG } from "./playerStatConfig";

/* -------------------------------------------------------------------------- */
/*                         PLAYER INSIGHTS CONTENT (SAFE)                     */
/* -------------------------------------------------------------------------- */

export default function PlayerInsightsContent({
  player,
  selectedStat,
}: {
  player: PlayerRow;
  selectedStat: StatLens;
}) {
  const config = STAT_CONFIG[selectedStat];
  const summary = computeSummary(player, selectedStat);

  if (!summary || !config) return null;

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

  const STROKE: Record<StatLens, string> = {
    Fantasy: "#facc15",
    Disposals: "#2dd4bf",
    Goals: "#f59e0b",
  };

  return (
    <div className="flex flex-col gap-4 text-[11px] text-neutral-200">
      {/* Rounds */}
      <div className="overflow-x-auto">
        <div className="flex gap-2">
          {rounds.map((v, i) => (
            <div key={i} className="min-w-[46px] text-center">
              <div className="text-[9px] text-neutral-500">
                {ROUND_LABELS[i]}
              </div>
              <div className="mt-1 rounded-md bg-neutral-950/80 h-8 flex items-center justify-center">
                {v}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5">
        <div className="flex justify-between mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Season summary
            </div>
            <div className="text-xs text-neutral-300">
              ▲ {summary.vsLeague.toFixed(1)} vs league avg
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-semibold text-yellow-200">
              {summary.avg.toFixed(1)}
            </div>
            <div className="text-[9px] text-neutral-400">
              Top {summary.percentile}% {player.role}
            </div>
          </div>
        </div>

        {/* Sparkline (SAFE) */}
        {summary.sparkline && (
          <svg width="120" height="40" viewBox="0 0 120 40">
            <polyline
              fill="none"
              stroke={STROKE[selectedStat]}
              strokeWidth="2"
              points={summary.sparkline}
            />
          </svg>
        )}

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div>
            <div className="text-neutral-500">Min</div>
            <div>{summary.min}</div>
          </div>
          <div>
            <div className="text-neutral-500">Max</div>
            <div>{summary.max}</div>
          </div>
          <div>
            <div className="text-neutral-500">Games</div>
            <div>{summary.games}</div>
          </div>
        </div>

        <div className="mt-3">
          <span className={volatilityColor}>
            {volatilityLabel} volatility
          </span>
        </div>
      </div>

      {/* Hit Rates */}
      <div className="rounded-2xl border border-yellow-500/30 bg-black/85 p-3">
        {config.thresholds.map((t, i) => (
          <div key={t} className="flex items-center gap-2">
            <span className="w-16 text-neutral-400">{t}+</span>
            <div className="flex-1 bg-neutral-900 rounded-full overflow-hidden">
              <div
                className="h-1.5 bg-gradient-to-r from-emerald-400 via-yellow-300 to-orange-400"
                style={{ width: `${hitRates[i]}%` }}
              />
            </div>
            <span className="w-10 text-right">{hitRates[i]}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}