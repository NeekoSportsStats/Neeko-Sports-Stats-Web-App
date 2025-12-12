// src/components/afl/players/MasterTableMobile.tsx

import React, { useMemo } from "react";
import { Search, Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlayerRow, StatLens } from "./MasterTable";

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

function computeSummary(player: PlayerRow, lens: StatLens) {
  const v = getRounds(player, lens);
  const total = v.reduce((a, b) => a + b, 0);
  const min = Math.min(...v);
  const max = Math.max(...v);
  const avg = total / v.length;
  return { total, min, max, avg, games: v.length };
}

function computeRate(player: PlayerRow, lens: StatLens, threshold: number) {
  const v = getRounds(player, lens);
  return Math.round((v.filter((x) => x >= threshold).length / v.length) * 100);
}

/* -------------------------------------------------------------------------- */
/* MOBILE COMPONENT                                                           */
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
  /* ---------------------------------------------------------------------- */
  /* SORT + FILTER                                                          */
  /* ---------------------------------------------------------------------- */

  const processedPlayers = useMemo(() => {
    let list = [...players];

    // Search (premium only)
    if (isPremium && query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) =>
        `${p.name} ${p.team} ${p.role}`.toLowerCase().includes(q)
      );
    }

    // Sort by TOTAL (descending)
    return list.sort((a, b) => {
      const ta = getRounds(a, selectedStat).reduce((x, y) => x + y, 0);
      const tb = getRounds(b, selectedStat).reduce((x, y) => x + y, 0);
      return tb - ta;
    });
  }, [players, selectedStat, isPremium, query]);

  return (
    <div className="mt-6">
      {/* ================= HEADER ================= */}
      <div className="rounded-3xl border border-neutral-800 bg-black/90 px-4 py-4 shadow-xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-yellow-200">
            Master Table
          </span>
        </div>

        <h3 className="mt-3 text-lg font-semibold text-neutral-50">
          Full-season player trends
        </h3>

        <p className="mt-1 text-xs text-neutral-400">
          Season-wide output and consistency.
        </p>

        {/* Lens selector */}
        <div className="mt-4 flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1 text-[11px]">
          {(["Fantasy", "Disposals", "Goals"] as StatLens[]).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStat(s)}
              className={cx(
                "rounded-full px-3 py-1.5 transition",
                selectedStat === s
                  ? "bg-yellow-400 text-black"
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
        <div className="max-h-[560px] overflow-y-auto divide-y divide-neutral-800/80">
          {processedPlayers.map((p, idx) => {
            const s = computeSummary(p, selectedStat);
            const consistency =
              selectedStat === "Goals"
                ? computeRate(p, selectedStat, 2)
                : computeRate(p, selectedStat, 70);
            const ceiling =
              selectedStat === "Goals"
                ? computeRate(p, selectedStat, 5)
                : computeRate(p, selectedStat, 100);

            const blurred = !isPremium && idx >= 20;

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
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[14px] font-semibold text-neutral-50">
                      {p.name}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                      {p.team} • {p.role}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-[12px] font-semibold text-yellow-200">
                        AVG {s.avg.toFixed(1)}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {s.min}–{s.max} • {s.games} gms
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-yellow-300" />
                  </div>
                </div>

                {/* Bars */}
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="mb-1 text-[11px] text-neutral-400">
                      Consistency
                    </div>
                    <div className="h-2 rounded-full bg-neutral-800">
                      <div
                        className="h-2 rounded-full bg-emerald-400"
                        style={{ width: `${consistency}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 text-[11px] text-neutral-400">
                      Ceiling
                    </div>
                    <div className="h-2 rounded-full bg-neutral-800">
                      <div
                        className="h-2 rounded-full bg-lime-400"
                        style={{ width: `${ceiling}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {/* CTA */}
          {!isPremium && (
            <div className="px-4 py-6 bg-black/85">
              <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 px-5 py-5 text-center">
                <p className="text-sm text-neutral-200">
                  Unlock the full player list and filters with Neeko+
                </p>
                <div className="mt-4 flex justify-center">
                  <Button
                    asChild
                    className="rounded-full bg-yellow-400 text-black hover:bg-yellow-300 px-8"
                  >
                    <a href="/neeko-plus">Get Neeko+</a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}