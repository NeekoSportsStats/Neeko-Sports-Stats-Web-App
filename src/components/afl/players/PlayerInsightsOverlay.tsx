import React, { useMemo, useState } from "react";
import type { PlayerRow, StatLens } from "./MasterTable";

/* -------------------------------------------------------------------------- */
/*                         PLAYER INSIGHTS CONTENT (FINAL)                     */
/* -------------------------------------------------------------------------- */

export default function InsightsContent({
  player,
  selectedStat,
}: {
  player: PlayerRow;
  selectedStat: StatLens;
}) {
  const [showFullLadder, setShowFullLadder] = useState(false);

  /* ---------------------------------------------------------------------- */
  /*                         DERIVED METRICS                                */
  /* ---------------------------------------------------------------------- */

  const scores = useMemo(() => {
    if (selectedStat === "Disposals") return player.disposals;
    if (selectedStat === "Goals") return player.goals;
    return player.fantasy;
  }, [player, selectedStat]);

  const last8 = scores.slice(-8);
  const avg = last8.reduce((a, b) => a + b, 0) / Math.max(last8.length, 1);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const volatility = max - min;

  const volatilityLabel =
    volatility > 25 ? "High" : volatility > 15 ? "Medium" : "Low";

  /* ---------------------------------------------------------------------- */
  /*                         PLAYER PROFILE SUMMARY                          */
  /* ---------------------------------------------------------------------- */

  const profileTags = [
    avg >= 95 ? "High Floor" : "Low Floor",
    max >= 110 ? "Strong Ceiling" : "Limited Ceiling",
    volatilityLabel === "High" ? "Volatile" : "Stable",
  ];

  /* ---------------------------------------------------------------------- */
  /*                         HIT RATE DATA                                   */
  /* ---------------------------------------------------------------------- */

  const hitRates = [
    { label: "60+", value: 1.0 },
    { label: "70+", value: 1.0 },
    { label: "80+", value: 1.0 },
    { label: "90+", value: 0.96 },
    { label: "100+", value: 0.75 },
  ];

  const visibleRates = showFullLadder ? hitRates : hitRates.slice(1, 3);

  /* ---------------------------------------------------------------------- */
  /*                                RENDER                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="space-y-5 pb-12">

      {/* ------------------------------------------------------------------ */}
      {/* PLAYER PROFILE                                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-yellow-500/20 bg-black/60 px-4 py-3">
        <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200/70 mb-2">
          Player Profile
        </div>
        <div className="flex flex-wrap gap-2">
          {profileTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-neutral-900 px-3 py-1 text-[11px] text-neutral-200"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* AI SUMMARY (CALLOUT)                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-black px-4 py-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400 mb-1">
          AI Performance Summary
        </div>
        <p className="text-sm text-neutral-200 leading-relaxed">
          This player shows{" "}
          <span className="text-yellow-300 font-medium">high volatility</span>{" "}
          with a{" "}
          <span className="text-yellow-300 font-medium">stable floor</span>{" "}
          and periodic ceiling performances.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RECENT FORM – MICRO BAR STRIP                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-neutral-800 bg-black/50 px-4 py-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400 mb-2">
          Recent Scoring (Last 8)
        </div>
        <div className="flex items-end gap-1 h-14">
          {last8.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-gradient-to-t from-emerald-400 via-yellow-400 to-orange-400"
              style={{
                height: `${Math.max(15, (v / max) * 100)}%`,
                opacity: 0.9,
              }}
            />
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RANGE + VOLATILITY GRID                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-neutral-800 bg-black/50 px-4 py-4 text-sm">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
            Range
          </div>
          <div className="mt-1 text-neutral-100">
            {min}–{max}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
            Average
          </div>
          <div className="mt-1 text-yellow-300 font-semibold">
            {avg.toFixed(1)} pts
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
            Volatility
          </div>
          <div className="mt-1 text-emerald-300">{volatilityLabel}</div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
            Total
          </div>
          <div className="mt-1 text-neutral-200">{scores.reduce((a, b) => a + b, 0)}</div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* HIT RATE LADDER (COLLAPSIBLE)                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-neutral-800 bg-black/60 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
            Hit Rate Ladder
          </div>
          <button
            onClick={() => setShowFullLadder((v) => !v)}
            className="text-[11px] text-yellow-300"
          >
            {showFullLadder ? "Collapse" : "Expand"}
          </button>
        </div>

        <div className="space-y-3">
          {visibleRates.map((r) => (
            <div key={r.label}>
              <div className="flex justify-between text-[11px] text-neutral-300 mb-1">
                <span>{r.label}</span>
                <span>{Math.round(r.value * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-orange-400"
                  style={{ width: `${r.value * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}