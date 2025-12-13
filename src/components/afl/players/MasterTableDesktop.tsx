import React, { useMemo, useState } from "react";
import { Lock, ChevronRight, ArrowRight } from "lucide-react";
import type { PlayerRow, StatLens } from "./MasterTable";

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const ROUND_LABELS = ["OR", ...Array.from({ length: 23 }, (_, i) => `R${i + 1}`)];
const FREE_ROW_LIMIT = 8;

const LEFT_COL_W = 220;
const ROUND_COL_W = 48;
const RIGHT_COL_W = 260;

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const cx = (...c: Array<string | false | undefined>) =>
  c.filter(Boolean).join(" ");

const fakeValue = () => Math.floor(70 + Math.random() * 40);
const fakeRate = () => Math.floor(50 + Math.random() * 50);

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
  const visiblePlayers = useMemo(
    () => (isPremium ? players : players.slice(0, FREE_ROW_LIMIT)),
    [players, isPremium]
  );

  return (
    <div className="mt-10 rounded-3xl border border-neutral-800 bg-black/90 shadow-2xl overflow-hidden">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-300">
            Master Table
          </div>
          <h2 className="mt-1 text-xl font-semibold text-neutral-50">
            Full-season player trends
          </h2>
        </div>

        <div className="flex gap-2 rounded-full border border-neutral-700 bg-black/80 p-1">
          {(["Fantasy", "Disposals", "Goals"] as StatLens[]).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStat(s)}
              className={cx(
                "rounded-full px-4 py-1.5 text-xs transition",
                selectedStat === s
                  ? "bg-yellow-400 text-black shadow-[0_0_16px_rgba(250,204,21,0.6)]"
                  : "text-neutral-300 hover:bg-neutral-800"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="relative">
        <div className="overflow-x-auto scrollbar-none">
          <div
            className="flex text-[11px]"
            style={{
              minWidth:
                LEFT_COL_W +
                ROUND_LABELS.length * ROUND_COL_W +
                RIGHT_COL_W,
            }}
          >
            {/* ================= LEFT ================= */}
            <div
              className="sticky left-0 z-30 bg-black/95 border-r border-neutral-800"
              style={{ width: LEFT_COL_W }}
            >
              <div className="px-5 py-3 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                Player
              </div>

              {visiblePlayers.map((p, i) => (
                <button
                  key={p.id}
                  disabled={!isPremium && i >= FREE_ROW_LIMIT}
                  onClick={() => onSelectPlayer(p)}
                  className={cx(
                    "group flex w-full items-center justify-between px-5 py-4 text-left border-t border-neutral-800",
                    !isPremium && i >= FREE_ROW_LIMIT && "opacity-50"
                  )}
                >
                  <div>
                    <div className="text-sm font-semibold text-neutral-50">
                      {p.name}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                      {p.team} · {p.role}
                    </div>
                  </div>

                  {isPremium && (
                    <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-neutral-300" />
                  )}

                  {!isPremium && i >= FREE_ROW_LIMIT && (
                    <Lock className="h-4 w-4 text-neutral-500" />
                  )}
                </button>
              ))}
            </div>

            {/* ================= ROUNDS ================= */}
            <div className="flex">
              <div>
                <div className="flex border-b border-neutral-800">
                  {ROUND_LABELS.map((r) => (
                    <div
                      key={r}
                      className="py-3 text-center text-[10px] uppercase tracking-[0.18em] text-neutral-500"
                      style={{ width: ROUND_COL_W }}
                    >
                      {r}
                    </div>
                  ))}
                </div>

                {visiblePlayers.map((_, i) => (
                  <div
                    key={i}
                    className="flex border-t border-neutral-800"
                  >
                    {ROUND_LABELS.map((_, j) => (
                      <div
                        key={j}
                        className="py-4 text-center text-sm text-neutral-100"
                        style={{ width: ROUND_COL_W }}
                      >
                        {isPremium || i < FREE_ROW_LIMIT ? (
                          fakeValue()
                        ) : (
                          <span className="inline-block h-3 w-6 rounded bg-neutral-700/40 animate-pulse" />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* ================= RIGHT ================= */}
            <div
              className="sticky right-0 z-20 bg-black/95 border-l border-neutral-800"
              style={{ width: RIGHT_COL_W }}
            >
              <div className="px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                Summary & hit-rate
              </div>

              {visiblePlayers.map((_, i) => (
                <div
                  key={i}
                  className="px-4 py-4 border-t border-neutral-800"
                >
                  {/* SUMMARY */}
                  <div className="grid grid-cols-4 gap-2 text-[11px] text-neutral-300">
                    <div>
                      <div className="text-neutral-500">MIN</div>
                      <div>{fakeValue()}</div>
                    </div>
                    <div>
                      <div className="text-neutral-500">MAX</div>
                      <div>{fakeValue()}</div>
                    </div>
                    <div>
                      <div className="text-neutral-500">AVG</div>
                      <div className="text-yellow-300 font-semibold">
                        {fakeValue()}
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-500">GMS</div>
                      <div>23</div>
                    </div>
                  </div>

                  {/* HIT RATES */}
                  <div className="mt-3 space-y-1.5">
                    {[60, 70, 80, 90].map((t) => {
                      const r = fakeRate();
                      return (
                        <div key={t} className="flex items-center gap-2">
                          <span className="w-10 text-[10px] text-neutral-400">
                            {t}+
                          </span>
                          <div className="flex-1 rounded-full bg-neutral-800 overflow-hidden">
                            <div
                              className="h-1.5 bg-gradient-to-r from-emerald-400 via-yellow-300 to-orange-400"
                              style={{ width: `${r}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-[10px] text-neutral-300">
                            {r}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= CTA OVERLAY ================= */}
        {!isPremium && (
          <div className="absolute inset-x-0 bottom-12 z-40 flex justify-center pointer-events-none">
            <button
              onClick={() => (window.location.href = "/neeko-plus")}
              className="pointer-events-auto rounded-3xl border border-yellow-500/30
                         bg-gradient-to-r from-yellow-500/25 via-yellow-500/10 to-transparent
                         px-6 py-4 shadow-2xl max-w-lg w-full flex items-center justify-between"
            >
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-300">
                  Neeko+
                </div>
                <div className="text-sm font-semibold text-yellow-100">
                  Unlock full player table
                </div>
                <div className="text-xs text-neutral-300">
                  Hit-rates, summaries & player insights.
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-yellow-300" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
