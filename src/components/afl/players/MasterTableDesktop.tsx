import React, { useMemo, useState } from "react";
import { ChevronRight, ArrowRight } from "lucide-react";
import type { PlayerRow, StatLens } from "./MasterTable";
import { STAT_CONFIG } from "./playerStatConfig";
import {
  computeSummary,
  computeHitRates,
} from "./playerInsightsUtils";

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const FREE_VISIBLE_ROWS = 8;

const COL_PLAYER_W = 220;
const COL_ROUND_W = 56;
const COL_HIT_W = 72;
const COL_SUMMARY_W = 72;

const ROUND_LABELS = ["OR", ...Array.from({ length: 23 }, (_, i) => `R${i + 1}`)];

/* simple placeholder (same idea as mobile skeletons) */
const skeletonValue = () => Math.floor(70 + Math.random() * 40);

/* -------------------------------------------------------------------------- */
/* MASTER TABLE DESKTOP                                                       */
/* -------------------------------------------------------------------------- */

export default function MasterTableDesktop({
  players,
  selectedStat,
  setSelectedStat,
  isPremium,
  onSelectPlayer,
}: {
  players: PlayerRow[];
  selectedStat: StatLens;
  setSelectedStat: (s: StatLens) => void;
  isPremium: boolean;
  onSelectPlayer: (p: PlayerRow) => void;
}) {
  const [compact, setCompact] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const config = STAT_CONFIG[selectedStat];

  /* ---------------------------------------------------------------------- */
  /* DERIVED DATA                                                            */
  /* ---------------------------------------------------------------------- */

  const rows = useMemo(() => {
    return players.map((p) => {
      const summary = computeSummary(p, selectedStat);
      const hitRates = computeHitRates(p, selectedStat) ?? [];

      const games =
        summary.avg > 0 ? Math.round(summary.total / summary.avg) : 0;

      return {
        player: p,
        summary,
        hitRates,
        games,
      };
    });
  }, [players, selectedStat]);

  /* ---------------------------------------------------------------------- */
  /* RENDER                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="mt-8">
      {/* ================= HEADER ================= */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-yellow-200">
            Master Table
          </div>
          <h3 className="mt-1 text-lg font-semibold text-neutral-50">
            Full-season player trends
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-full border border-neutral-700 bg-black/80 p-1 text-xs">
            {(["Fantasy", "Disposals", "Goals"] as StatLens[]).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStat(s)}
                className={
                  selectedStat === s
                    ? "rounded-full bg-yellow-400 px-3 py-1 text-black"
                    : "rounded-full px-3 py-1 text-neutral-300"
                }
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCompact((v) => !v)}
            className="rounded-full border border-neutral-700 bg-black/80 px-3 py-1 text-xs text-neutral-300"
          >
            {compact ? "Full View" : "Compact"}
          </button>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="relative overflow-x-auto rounded-3xl border border-neutral-800 bg-black/90 shadow-xl">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-20 bg-black/95">
            <tr>
              <th
                className="sticky left-0 z-30 bg-black/95 px-4 py-3 text-left text-xs uppercase tracking-[0.18em] text-neutral-500"
                style={{ width: COL_PLAYER_W }}
              >
                Player
              </th>

              {!compact &&
                ROUND_LABELS.map((r) => (
                  <th
                    key={r}
                    className="px-2 py-3 text-center text-xs uppercase tracking-[0.18em] text-neutral-500"
                    style={{ width: COL_ROUND_W }}
                  >
                    {r}
                  </th>
                ))}

              {config.thresholds.map((t) => (
                <th
                  key={t}
                  className="px-2 py-3 text-center text-xs uppercase tracking-[0.18em] text-neutral-500"
                  style={{ width: COL_HIT_W }}
                >
                  {t}+
                </th>
              ))}

              {["Min", "Max", "Avg", "Total", "GP"].map((h) => (
                <th
                  key={h}
                  className="px-2 py-3 text-center text-xs uppercase tracking-[0.18em] text-neutral-500"
                  style={{ width: COL_SUMMARY_W }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map(({ player, summary, hitRates, games }, idx) => {
              const gated = !isPremium && idx >= FREE_VISIBLE_ROWS;

              return (
                <tr key={player.id} className="relative border-t border-neutral-800/70">
                  <td
                    className="sticky left-0 z-10 bg-black/95 px-4 py-3"
                    style={{ width: COL_PLAYER_W }}
                  >
                    <button
                      disabled={gated}
                      onClick={() => onSelectPlayer(player)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <span className="font-semibold text-neutral-50">
                        {player.name}
                      </span>
                      {!gated && (
                        <ChevronRight className="h-4 w-4 text-neutral-500" />
                      )}
                    </button>
                  </td>

                  {!compact &&
                    ROUND_LABELS.map((_, i) => (
                      <td
                        key={i}
                        className="px-2 py-3 text-center text-neutral-100"
                        style={{ width: COL_ROUND_W }}
                      >
                        {gated ? (
                          <span className="inline-block h-4 w-6 rounded bg-neutral-700/40 animate-pulse" />
                        ) : (
                          skeletonValue()
                        )}
                      </td>
                    ))}

                  {config.thresholds.map((_, i) => (
                    <td
                      key={i}
                      className="px-2 py-3 text-center text-neutral-200"
                      style={{ width: COL_HIT_W }}
                    >
                      {gated ? "—" : `${hitRates[i] ?? 0}%`}
                    </td>
                  ))}

                  <td className="px-2 py-3 text-center">{gated ? "—" : summary.min}</td>
                  <td className="px-2 py-3 text-center">{gated ? "—" : summary.max}</td>
                  <td className="px-2 py-3 text-center">
                    {gated ? "—" : summary.avg.toFixed(1)}
                  </td>
                  <td className="px-2 py-3 text-center">{gated ? "—" : summary.total}</td>
                  <td className="px-2 py-3 text-center">{gated ? "—" : games}</td>

                  {gated && (
                    <td className="absolute inset-0 z-10 pointer-events-none" colSpan={999}>
                      <div className="absolute inset-0 backdrop-blur-[12px]" />
                      <div className="absolute inset-0 bg-black/40" />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {!isPremium && (
          <div className="pointer-events-none absolute inset-x-0 top-[520px] z-40 flex justify-center">
            <button
              onClick={() => setShowUpgrade(true)}
              className="pointer-events-auto mx-4 w-full max-w-lg rounded-3xl
                         border border-yellow-500/30
                         bg-gradient-to-r from-yellow-500/25 via-yellow-500/10 to-transparent
                         px-6 py-4 text-left shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-yellow-200">
                    Neeko+
                  </div>
                  <div className="mt-1 text-sm font-semibold text-yellow-100">
                    Unlock full player table
                  </div>
                  <div className="mt-1 text-xs text-neutral-300">
                    Hit rates, summaries & AI insights.
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-yellow-300" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
