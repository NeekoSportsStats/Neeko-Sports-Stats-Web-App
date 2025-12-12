import React, { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { PlayerRow, StatLens } from "./MasterTable";

/* -------------------------------------------------------------------------- */
/* CONFIG                                                                     */
/* -------------------------------------------------------------------------- */

const ROUND_LABELS = [
  "OR",
  "R1","R2","R3","R4","R5","R6","R7","R8","R9","R10","R11",
  "R12","R13","R14","R15","R16","R17","R18","R19","R20","R21","R22","R23",
];

const VISIBLE_ROUNDS = 6;
const CELL_WIDTH = 44; // px

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function getRounds(player: PlayerRow, lens: StatLens) {
  if (lens === "Fantasy") return player.roundsFantasy;
  if (lens === "Disposals") return player.roundsDisposals;
  return player.roundsGoals;
}

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

/* -------------------------------------------------------------------------- */
/* MOBILE MASTER TABLE                                                        */
/* -------------------------------------------------------------------------- */

export default function MasterTableMobile({
  players,
  selectedStat,
  onSelectPlayer,
}: {
  players: PlayerRow[];
  selectedStat: StatLens;
  onSelectPlayer: (p: PlayerRow) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<HTMLDivElement[]>([]);
  const [windowStart, setWindowStart] = useState(0);

  /* ---------------------------------------------------------------------- */
  /* SYNC SCROLL                                                             */
  /* ---------------------------------------------------------------------- */

  const onScroll = () => {
    if (!scrollRef.current) return;

    const scrollLeft = scrollRef.current.scrollLeft;
    const index = Math.round(scrollLeft / CELL_WIDTH);

    setWindowStart(index);

    rowRefs.current.forEach((row) => {
      if (row && row !== scrollRef.current) {
        row.scrollLeft = scrollLeft;
      }
    });
  };

  const windowEnd = Math.min(
    windowStart + VISIBLE_ROUNDS - 1,
    ROUND_LABELS.length - 1
  );

  /* ---------------------------------------------------------------------- */
  /* RENDER                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="mt-6">

      {/* ================= HEADER ================= */}
      <div className="rounded-3xl border border-neutral-800 bg-black/90 px-4 py-4 shadow-xl">
        <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200">
          Master Table
        </div>

        <h3 className="mt-2 text-lg font-semibold text-neutral-50">
          Full-season player scores
        </h3>

        <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Player</span>
          <span>
            Rounds {ROUND_LABELS[windowStart]}–{ROUND_LABELS[windowEnd]}
          </span>
          <span>Insights</span>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="mt-4 rounded-3xl border border-neutral-800 bg-black/90 shadow-xl overflow-hidden">

        {/* ---------- ROUND LABEL STRIP (SYNCED) ---------- */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="sticky top-0 z-20 flex overflow-x-auto border-b border-neutral-800 bg-black/95"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="flex ml-[150px]">
            {ROUND_LABELS.map((r) => (
              <div
                key={r}
                className="flex items-center justify-center text-[10px] text-neutral-500"
                style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }}
              >
                {r}
              </div>
            ))}
          </div>
        </div>

        {/* ---------- PLAYER ROWS ---------- */}
        <div className="divide-y divide-neutral-800">
          {players.map((p, idx) => {
            const rounds = getRounds(p, selectedStat);

            return (
              <div
                key={p.id}
                className="flex items-center px-3 py-3"
              >
                {/* LEFT: PLAYER */}
                <div className="w-[140px] pr-2">
                  <div className="text-[13px] font-semibold text-neutral-50 leading-tight">
                    {p.name}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    {p.team} • {p.role}
                  </div>
                </div>

                {/* MIDDLE: ROUNDS CAROUSEL */}
                <div
                  ref={(el) => {
                    if (el) rowRefs.current[idx] = el;
                  }}
                  className="flex overflow-x-auto"
                  style={{ scrollbarWidth: "none" }}
                >
                  {rounds.map((v, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center text-[11px] text-neutral-200 tabular-nums"
                      style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }}
                    >
                      {v}
                    </div>
                  ))}
                </div>

                {/* RIGHT: INSIGHTS */}
                <button
                  onClick={() => onSelectPlayer(p)}
                  className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 hover:bg-neutral-800"
                >
                  <ChevronRight className="h-4 w-4 text-yellow-300" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}