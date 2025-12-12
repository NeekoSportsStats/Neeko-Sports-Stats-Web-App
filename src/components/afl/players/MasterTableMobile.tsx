import React, { useRef } from "react";
import { ChevronRight } from "lucide-react";
import type { PlayerRow } from "./MasterTable";

/* -------------------------------------------------------------------------- */
/* CONFIG                                                                     */
/* -------------------------------------------------------------------------- */

const ROUNDS = ["OR", ...Array.from({ length: 23 }, (_, i) => `R${i + 1}`)];
const VISIBLE_ROUNDS = 6;
const CELL_WIDTH = 56; // px per round cell

/* -------------------------------------------------------------------------- */
/* MOBILE MASTER TABLE — SHARED SCROLL                                        */
/* -------------------------------------------------------------------------- */

export default function MasterTableMobile({
  players,
  onSelectPlayer,
}: {
  players: PlayerRow[];
  onSelectPlayer: (p: PlayerRow) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  return (
    <section className="mt-6 rounded-3xl border border-neutral-800 bg-black/90 shadow-xl overflow-hidden">
      {/* ================= HEADER ================= */}
      <div className="px-4 py-4 border-b border-neutral-800">
        <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-300">
          Master Table
        </div>
        <h3 className="mt-1 text-lg font-semibold text-neutral-50">
          Full-season player scores
        </h3>
        <p className="mt-1 text-xs text-neutral-400">
          Round-by-round production.
        </p>
      </div>

      {/* ================= COLUMN LABELS ================= */}
      <div className="flex border-b border-neutral-800 bg-black/80">
        {/* Player column */}
        <div className="w-[140px] shrink-0 px-4 py-2 text-[11px] text-neutral-400">
          Player
        </div>

        {/* Shared round header */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto scrollbar-none"
        >
          <div
            className="flex"
            style={{ width: ROUNDS.length * CELL_WIDTH }}
          >
            {ROUNDS.map((r) => (
              <div
                key={r}
                className="w-[56px] shrink-0 text-center text-[10px] text-neutral-500 py-2"
              >
                {r}
              </div>
            ))}
          </div>
        </div>

        {/* Insights spacer */}
        <div className="w-[44px]" />
      </div>

      {/* ================= ROWS ================= */}
      <div className="divide-y divide-neutral-800">
        {players.map((p) => (
          <div key={p.id} className="flex items-center">
            {/* Player cell */}
            <div className="w-[140px] shrink-0 px-4 py-3">
              <div className="text-sm font-semibold text-neutral-50">
                {p.name}
              </div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                {p.team} • {p.role}
              </div>
            </div>

            {/* Shared scroll body */}
            <div
              className="flex-1 overflow-hidden"
              onTouchStart={(e) => {
                if (scrollRef.current) {
                  scrollRef.current.scrollLeft =
                    (e.target as HTMLElement).scrollLeft;
                }
              }}
            >
              <div
                className="flex"
                style={{ width: ROUNDS.length * CELL_WIDTH }}
              >
                {p.roundsFantasy.map((v, i) => (
                  <div
                    key={i}
                    className={`
                      w-[56px] shrink-0 text-center py-3 text-sm
                      ${
                        v >= 100
                          ? "text-yellow-300 font-semibold"
                          : "text-neutral-300"
                      }
                    `}
                  >
                    {v}
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            <button
              onClick={() => onSelectPlayer(p)}
              className="w-[44px] flex items-center justify-center"
            >
              <ChevronRight className="h-4 w-4 text-yellow-300" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}