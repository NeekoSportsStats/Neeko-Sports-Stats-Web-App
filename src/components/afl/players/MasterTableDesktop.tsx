import React, { useMemo, useState } from "react";
import { ChevronRight, Lock, ArrowRight } from "lucide-react";
import type { PlayerRow, StatLens } from "./MasterTable";
import { Button } from "@/components/ui/button";

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 20;

const SUMMARY_COLS = ["AVG", "MIN", "MAX", "VOL", "GP"];
const HIT_RATE_COLS = ["60+", "70+", "80+", "90+"];

const ROUND_LABELS = ["OR", ...Array.from({ length: 23 }, (_, i) => `R${i + 1}`)];

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function cx(...c: Array<string | false | undefined>) {
  return c.filter(Boolean).join(" ");
}

// TEMP SAFE FALLBACKS (until wired to real calc utils)
const safe = (v: any, d = 0) => (Number.isFinite(v) ? v : d);

/* -------------------------------------------------------------------------- */
/* DESKTOP MASTER TABLE                                                       */
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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visiblePlayers = players.slice(0, visibleCount);

  /* ---------------------------------------------------------------------- */
  /* RENDER                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="mt-10">
      {/* ================= HEADER ================= */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-yellow-300/80">
            Master Table
          </div>
          <h2 className="mt-1 text-xl font-semibold text-neutral-50">
            Full-season player trends
          </h2>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1 text-[11px]">
          {(["Fantasy", "Disposals", "Goals"] as StatLens[]).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStat(s)}
              className={cx(
                "rounded-full px-3 py-1.5 transition",
                selectedStat === s
                  ? "bg-yellow-400 text-black shadow-[0_0_16px_rgba(250,204,21,0.6)]"
                  : "bg-neutral-900 text-neutral-300"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="relative rounded-3xl border border-neutral-800 bg-black/90 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full border-collapse text-sm">
            {/* ================= GROUP HEADERS ================= */}
            <thead>
              <tr className="bg-black/90">
                <th className="sticky left-0 z-30 bg-black/90 px-4 py-3 text-left text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  Player
                </th>

                <th colSpan={SUMMARY_COLS.length} className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.2em] text-yellow-300/70">
                  Summary
                </th>

                <th colSpan={HIT_RATE_COLS.length} className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.2em] text-yellow-300/70">
                  Hit Rates
                </th>

                <th colSpan={ROUND_LABELS.length} className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  Round by round
                </th>
              </tr>

              {/* ================= COLUMN HEADERS ================= */}
              <tr className="border-t border-neutral-800/80">
                <th className="sticky left-0 z-30 bg-black/90 px-4 py-2 text-left text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  Player
                </th>

                {SUMMARY_COLS.map((c) => (
                  <th key={c} className="px-3 py-2 text-center text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    {c}
                  </th>
                ))}

                {HIT_RATE_COLS.map((c) => (
                  <th key={c} className="px-3 py-2 text-center text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    {c}
                  </th>
                ))}

                {ROUND_LABELS.map((r) => (
                  <th key={r} className="px-2 py-2 text-center text-[10px] uppercase tracking-[0.16em] text-neutral-600">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>

            {/* ================= BODY ================= */}
            <tbody className="divide-y divide-neutral-800/70">
              {visiblePlayers.map((p, idx) => {
                const gated = !isPremium && idx >= 8;

                return (
                  <tr key={p.id} className="relative">
                    {/* PLAYER CELL */}
                    <td
                      className="sticky left-0 z-20 bg-black/90 px-4 py-4"
                    >
                      <button
                        disabled={gated}
                        onClick={() => onSelectPlayer(p)}
                        className="flex w-full items-center justify-between text-left"
                      >
                        <div>
                          <div className="text-[15px] font-semibold text-neutral-50">
                            {p.name}
                          </div>
                          <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                            {p.team} · {p.role}
                          </div>
                        </div>

                        {!gated && (
                          <ChevronRight className="h-4 w-4 text-neutral-500" />
                        )}
                      </button>
                    </td>

                    {/* SUMMARY */}
                    {SUMMARY_COLS.map((c) => (
                      <td key={c} className="px-3 py-4 text-center text-neutral-100">
                        —
                      </td>
                    ))}

                    {/* HIT RATES */}
                    {HIT_RATE_COLS.map((c) => (
                      <td key={c} className="px-3 py-4">
                        <div className="h-1.5 w-full rounded-full bg-neutral-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-yellow-300 to-orange-400"
                            style={{ width: gated ? "0%" : "70%" }}
                          />
                        </div>
                      </td>
                    ))}

                    {/* ROUNDS */}
                    {ROUND_LABELS.map((_, i) => (
                      <td
                        key={i}
                        className="px-2 py-4 text-center text-neutral-100"
                      >
                        {gated ? (
                          <span className="inline-block h-4 w-6 rounded bg-neutral-700/40 animate-pulse" />
                        ) : (
                          Math.floor(70 + Math.random() * 40)
                        )}
                      </td>
                    ))}

                    {/* GATE OVERLAY */}
                    {gated && (
                      <td colSpan={SUMMARY_COLS.length + HIT_RATE_COLS.length + ROUND_LABELS.length + 1}>
                        <div className="absolute inset-0 z-10">
                          <div className="absolute inset-0 backdrop-blur-[14px]" />
                          <div className="absolute inset-0 bg-black/50" />
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ================= CTA ================= */}
        {!isPremium && (
          <div className="absolute inset-x-0 bottom-0 z-40 flex justify-center pb-6 pointer-events-none">
            <button
              onClick={() => (window.location.href = "/neeko-plus")}
              className="pointer-events-auto rounded-3xl border border-yellow-500/30
                         bg-gradient-to-r from-yellow-500/25 via-yellow-500/10 to-transparent
                         px-6 py-4 shadow-2xl"
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-yellow-200/80">
                    Neeko+
                  </div>
                  <div className="text-sm font-semibold text-yellow-100">
                    Unlock full player table
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-yellow-300" />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* ================= SHOW MORE ================= */}
      {visiblePlayers.length < players.length && (
        <div className="mt-6 flex justify-center">
          <Button
            onClick={() =>
              setVisibleCount((c) => Math.min(c + PAGE_SIZE, players.length))
            }
            className="rounded-full bg-neutral-800 px-6 py-2 text-neutral-200"
          >
            Show more
          </Button>
        </div>
      )}
    </div>
  );
}
