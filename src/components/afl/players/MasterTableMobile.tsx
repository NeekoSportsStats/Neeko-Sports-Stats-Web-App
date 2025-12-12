import React, { useState } from "react";
import { Search, Lock, ChevronRight, X } from "lucide-react";
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

function average(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function hitRate(player: PlayerRow, lens: StatLens, threshold: number) {
  const rounds = getRounds(player, lens);
  const games = rounds.length || 1;
  return Math.round(
    (rounds.filter((v) => v >= threshold).length / games) * 100
  );
}

/* -------------------------------------------------------------------------- */
/* MOBILE MASTER TABLE                                                        */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 8;

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
  const [showPaywall, setShowPaywall] = useState(false);

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
            const avg = average(rounds);
            const hit80 = hitRate(p, selectedStat, statCfg.thresholds[1]);
            const hit90 = hitRate(p, selectedStat, statCfg.thresholds[2]);
            const hit100 = hitRate(p, selectedStat, statCfg.thresholds[3]);

            const blurred = !isPremium && idx >= 8;

            return (
              <button
                key={p.id}
                onClick={() =>
                  blurred ? setShowPaywall(true) : onSelectPlayer(p)
                }
                className={cx(
                  "w-full text-left px-4 py-4",
                  blurred
                    ? "blur-[3px] brightness-[0.6]"
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

                {/* ROUND CAROUSEL */}
                <div className="mt-4 overflow-x-auto">
                  <div className="flex gap-4 min-w-max pr-4">
                    {rounds.map((v, i) => (
                      <div
                        key={i}
                        className={cx(
                          "w-12 text-center text-sm",
                          v >= statCfg.thresholds[2]
                            ? "text-yellow-300 font-semibold"
                            : "text-neutral-400"
                        )}
                      >
                        {v}
                      </div>
                    ))}
                  </div>
                </div>

                {/* SUMMARY */}
                <div className="mt-4 grid grid-cols-2 gap-y-2 text-[11px] text-neutral-400">
                  <div>AVG</div>
                  <div className="text-right text-neutral-200 font-medium">
                    {avg.toFixed(1)}
                  </div>

                  <div>80+</div>
                  <div className="text-right">{hit80}%</div>

                  <div>90+</div>
                  <div className="text-right">{hit90}%</div>

                  <div>100+</div>
                  <div className="text-right">{hit100}%</div>
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
        </div>
      </div>

      {/* ================= PAYWALL MODAL ================= */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="relative w-full max-w-sm rounded-3xl border border-yellow-500/40 bg-black px-6 py-6 text-center">
            <button
              onClick={() => setShowPaywall(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <p className="text-sm text-neutral-200">
              Unlock full player insights with Neeko+
            </p>

            <Button
              asChild
              className="mt-4 rounded-full bg-yellow-400 text-black hover:bg-yellow-300 px-6"
            >
              <a href="/neeko-plus">Upgrade to Neeko+</a>
            </Button>

            <button
              onClick={() => setShowPaywall(false)}
              className="mt-3 block w-full text-xs text-neutral-400"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}