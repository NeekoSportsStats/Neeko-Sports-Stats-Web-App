import React, { useRef } from "react";
import { ChevronRight, Lock } from "lucide-react";
import type { PlayerRow } from "./MasterTable";

const ROUNDS = ["OR", ...Array.from({ length: 23 }, (_, i) => `R${i + 1}`)];
const CELL_WIDTH = 56;
const SNAP_SIZE = 6 * CELL_WIDTH;

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function fakeScore() {
  return 70 + Math.floor(Math.random() * 40);
}

/* -------------------------------------------------------------------------- */
/* MOBILE MASTER TABLE                                                        */
/* -------------------------------------------------------------------------- */

export default function MasterTableMobile({
  players,
  isPremium,
  onSelectPlayer,
}: {
  players: PlayerRow[];
  isPremium: boolean;
  onSelectPlayer: (p: PlayerRow) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  return (
    <section className="mt-6 rounded-3xl border border-neutral-800 bg-black/90 shadow-xl overflow-hidden">
      {/* HEADER */}
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

      {/* COLUMN LABELS */}
      <div className="flex border-b border-neutral-800 bg-black/80">
        <div className="w-[140px] shrink-0 px-4 py-2 text-[11px] text-neutral-400">
          Player
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto scrollbar-none scroll-smooth"
          style={{ scrollSnapType: "x mandatory" }}
        >
          <div
            className="flex"
            style={{ width: ROUNDS.length * CELL_WIDTH }}
          >
            {ROUNDS.map((r) => (
              <div
                key={r}
                className="w-[56px] shrink-0 text-center text-[10px] text-neutral-500 py-2"
                style={{ scrollSnapAlign: "start" }}
              >
                {r}
              </div>
            ))}
          </div>
        </div>

        <div className="w-[44px] text-center text-[11px] text-neutral-400 py-2">
          Info
        </div>
      </div>

      {/* ROWS */}
      <div className="divide-y divide-neutral-800">
        {players.map((p, idx) => {
          const locked = !isPremium && idx >= 8;

          return (
            <div key={p.id} className="relative flex items-center">
              {/* PLAYER */}
              <div className="w-[140px] shrink-0 px-4 py-3">
                <div className="text-sm font-semibold text-neutral-50">
                  {p.name}
                </div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                  {p.team} • {p.role}
                </div>
              </div>

              {/* SCROLL AREA */}
              <div className="relative flex-1 overflow-hidden">
                {/* FAKE BLUR LAYER */}
                {locked && (
                  <div className="absolute inset-0 z-10 backdrop-blur-xl bg-black/60">
                    <div className="flex">
                      {ROUNDS.map((_, i) => (
                        <div
                          key={i}
                          className="w-[56px] shrink-0 text-center py-3 text-sm text-neutral-400 opacity-60"
                        >
                          {fakeScore()}
                        </div>
                      ))}
                    </div>

                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-yellow-300 text-xs">
                      <Lock className="h-3 w-3" />
                    </div>
                  </div>
                )}

                {/* REAL DATA */}
                <div
                  className="flex"
                  style={{ width: ROUNDS.length * CELL_WIDTH }}
                >
                  {p.roundsFantasy.map((v, i) => (
                    <div
                      key={i}
                      className={`
                        w-[56px] shrink-0 text-center py-3 text-sm
                        ${v >= 100 ? "text-yellow-300 font-semibold" : "text-neutral-300"}
                      `}
                    >
                      {v}
                    </div>
                  ))}
                </div>
              </div>

              {/* INSIGHTS */}
              <button
                onClick={() => !locked && onSelectPlayer(p)}
                className="w-[44px] flex items-center justify-center"
              >
                <ChevronRight className="h-4 w-4 text-yellow-300" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}