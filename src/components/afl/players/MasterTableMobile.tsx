// src/components/afl/players/MasterTableMobile.tsx

import React, { useState } from "react";
import { Search, Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerRow, StatLens } from "./MasterTable";

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function getRounds(player: PlayerRow, lens: StatLens) {
  if (lens === "Fantasy") return player.roundsFantasy;
  if (lens === "Disposals") return player.roundsDisposals;
  return player.roundsGoals;
}

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 10;
const ROUNDS_VISIBLE = 6;

/* -------------------------------------------------------------------------- */
/* MOBILE MASTER TABLE                                                        */
/* -------------------------------------------------------------------------- */

export default function MasterTableMobile({
  players,
  selectedStat,
  setSelectedStat,
  isPremium,
  query,
  setQuery,
  onSelectPlayer,
}: {
  players: PlayerRow[];
  selectedStat: StatLens;
  setSelectedStat: (s: StatLens) => void;
  isPremium: boolean;
  query: string;
  setQuery: (v: string) => void;
  onSelectPlayer: (p: PlayerRow) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = isPremium
    ? players.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      )
    : players;

  const visiblePlayers = filtered.slice(0, visibleCount);

  return (
    <div className="mt-6">

      {/* ================= HEADER ================= */}
      <div className="rounded-3xl border border-neutral-800 bg-black/90 px-4 py-4 shadow-xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-yellow-200">
            Master Table
          </span>
        </div>

        <h3 className="mt-3 text-lg font-semibold text-neutral-50">
          Full-season player tape
        </h3>

        <p className="mt-1 text-xs text-neutral-400">
          Opening Round → Round 23
        </p>

        {/* Lens selector */}
        <div className="mt-4 flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1 text-[11px]">
          {(["Fantasy", "Disposals", "Goals"] as StatLens[]).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStat(s)}
              className={cx(
                "rounded-full px-3 py-1.5",
                selectedStat === s
                  ? "bg-yellow-400 text-black shadow-[0_0_16px_rgba(250,204,21,0.6)]"
                  : "bg-neutral-900 text-neutral-300"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mt-3">
          {isPremium ? (
            <div className="flex items-center gap-2 rounded-2xl border border-neutral-800 bg-black/70 px-3 py-2">
              <Search className="h-4 w-4 text-neutral-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search players…"
                className="w-full bg-transparent text-[12px] text-neutral-200 placeholder:text-neutral-500 outline-none"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-neutral-800 bg-black/60 px-3 py-2">
              <Lock className="h-4 w-4 text-neutral-500" />
              <span className="text-[12px] text-neutral-500">
                Search is Neeko+ only
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ================= PLAYER LIST ================= */}
      <div className="mt-4 rounded-3xl border border-neutral-800 bg-black/90 shadow-xl overflow-hidden">
        <div className="divide-y divide-neutral-800/80">

          {visiblePlayers.map((p, idx) => {
            const rounds = getRounds(p, selectedStat);
            const blurred = !isPremium && idx >= 8;

            return (
              <div
                key={p.id}
                className={cx(
                  "px-4 py-4",
                  blurred && "blur-[3px] brightness-[0.6] pointer-events-none"
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[14px] font-semibold text-neutral-50">
                      {p.name}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                      {p.team} · {p.role}
                    </div>
                  </div>

                  <button
                    onClick={() => !blurred && onSelectPlayer(p)}
                    className="flex items-center gap-1 rounded-full border border-neutral-700 px-2.5 py-1 text-[11px] text-neutral-200 hover:border-yellow-400 hover:text-yellow-300"
                  >
                    Insights
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* ROUND CAROUSEL */}
                <div className="mt-4 overflow-x-auto">
                  <div
                    className="grid auto-cols-[48px] grid-flow-col gap-2"
                    style={{
                      scrollSnapType: "x mandatory",
                    }}
                  >
                    {rounds.map((r, i) => (
                      <div
                        key={i}
                        className="snap-start text-center text-sm font-medium text-neutral-200"
                      >
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* SHOW MORE */}
          {visibleCount < filtered.length && (
            <div className="px-4 py-5 text-center">
              <Button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="rounded-full bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
              >
                Show more players
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}