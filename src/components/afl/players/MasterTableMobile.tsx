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
const COLS = 6;

/* -------------------------------------------------------------------------- */
/* MOBILE MASTER TABLE                                                        */
/* -------------------------------------------------------------------------- */

export default function MasterTableMobile({
  players,
  statCfg,
  selectedStat,
  setSelectedStat,
  isPremium,
  query,
  setQuery,
  onSelectPlayer,
}: {
  players: PlayerRow[];
  statCfg: {
    thresholds: readonly number[];
    valueUnitShort: string;
  };
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
          Full-season player trends
        </h3>

        <p className="mt-1 text-xs text-neutral-400">
          Round-by-round production.
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

            const sorted = [...rounds].sort((a, b) => a - b);
            const lowCut = sorted[Math.floor(sorted.length * 0.2)];
            const highCut = sorted[Math.floor(sorted.length * 0.8)];

            const labeled = rounds.map((value, i) => ({
              label: statCfg.thresholds ? i : i, // label not shown, kept stable
              value,
              isLow: value <= lowCut,
              isHigh: value >= highCut,
              isRecent: i >= rounds.length - 5,
            }));

            const rows: typeof labeled[] = [];
            for (let i = 0; i < labeled.length; i += COLS) {
              rows.push(labeled.slice(i, i + COLS));
            }

            const blurred = !isPremium && idx >= 8;

            return (
              <button
                key={p.id}
                onClick={() => !blurred && onSelectPlayer(p)}
                className={cx(
                  "w-full text-left px-4 py-4",
                  blurred
                    ? "blur-[3px] brightness-[0.6] pointer-events-none"
                    : "active:bg-neutral-900/40"
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[14px] font-semibold text-neutral-50">
                      {p.name}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                      {p.team} • {p.role}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-yellow-300 mt-1" />
                </div>

                {/* ROUND GRID */}
                <div className="mt-4 space-y-2">
                  {rows.map((row, rIdx) => (
                    <div key={rIdx} className="grid grid-cols-6 gap-2 text-center">
                      {row.map((cell, cIdx) => (
                        <div
                          key={cIdx}
                          className={cx(
                            "text-[12px] tabular-nums",
                            cell.isHigh && "text-yellow-300",
                            cell.isLow && "text-neutral-500",
                            cell.isRecent && "font-semibold",
                            !cell.isHigh &&
                              !cell.isLow &&
                              "text-neutral-200"
                          )}
                        >
                          {cell.value}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </button>
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

          {/* PAYWALL CTA (unchanged, modal handled elsewhere) */}
          {!isPremium && (
            <div className="px-4 py-6">
              <div className="rounded-3xl border border-yellow-500/30 bg-yellow-500/5 px-6 py-6 text-center">
                <p className="text-sm text-neutral-200">
                  Unlock full player insights with Neeko+
                </p>
                <Button
                  asChild
                  className="mt-4 rounded-full bg-yellow-400 text-black hover:bg-yellow-300 px-6"
                >
                  <a href="/neeko-plus">Get Neeko+</a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}