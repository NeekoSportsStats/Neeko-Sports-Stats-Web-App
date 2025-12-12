import React, { useMemo } from "react";
import { Search, Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerRow, StatLens } from "./MasterTable";

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function hitColour(pct: number) {
  if (pct < 30) return "bg-red-500";
  if (pct < 60) return "bg-yellow-400";
  return "bg-green-500";
}

function getRounds(player: PlayerRow, lens: StatLens) {
  if (lens === "Fantasy") return player.roundsFantasy;
  if (lens === "Disposals") return player.roundsDisposals;
  return player.roundsGoals;
}

function computeSummary(player: PlayerRow, lens: StatLens) {
  const v = getRounds(player, lens);
  const min = Math.min(...v);
  const max = Math.max(...v);
  const total = v.reduce((a, b) => a + b, 0);
  const games = v.length;
  const avg = total / games;
  return { min, max, total, games, avg };
}

function computeHitRate(player: PlayerRow, lens: StatLens, threshold: number) {
  const v = getRounds(player, lens);
  const games = v.length || 1;
  return Math.round((v.filter((x) => x >= threshold).length / games) * 100);
}

/* -------------------------------------------------------------------------- */
/* MOBILE COMPONENT                                                           */
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
  /* ------------------------------------------------------------------------ */
  /* FILTER + SORT (mobile-specific)                                           */
  /* ------------------------------------------------------------------------ */

  const filteredPlayers = useMemo(() => {
    let list = players;

    if (isPremium && query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) =>
        `${p.name} ${p.team} ${p.role}`.toLowerCase().includes(q)
      );
    }

    // Sort by TOTAL (desc)
    return [...list].sort((a, b) => {
      const ta = getRounds(a, selectedStat).reduce((x, y) => x + y, 0);
      const tb = getRounds(b, selectedStat).reduce((x, y) => x + y, 0);
      return tb - ta;
    });
  }, [players, selectedStat, query, isPremium]);

  // Define mobile floor + ceiling thresholds
  const floorThreshold = statCfg.thresholds[1]; // e.g. 70+
  const ceilingThreshold =
    statCfg.thresholds[statCfg.thresholds.length - 1]; // e.g. 100+

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
        <div className="mt-4 inline-flex gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1 text-[11px]">
          {(["Fantasy", "Disposals", "Goals"] as StatLens[]).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStat(s)}
              className={cx(
                "rounded-full px-3 py-1.5",
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
        <div className="divide-y divide-neutral-800/80">
          {filteredPlayers.map((p, idx) => {
            const s = computeSummary(p, selectedStat);
            const blurred = !isPremium && idx >= 20;

            const floorPct = computeHitRate(
              p,
              selectedStat,
              floorThreshold
            );
            const ceilingPct = computeHitRate(
              p,
              selectedStat,
              ceilingThreshold
            );

            return (
              <button
                key={p.id}
                onClick={() => !blurred && onSelectPlayer(p)}
                className={cx(
                  "w-full text-left px-4 py-3",
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
                        AVG {s.avg.toFixed(1)} {statCfg.valueUnitShort}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {s.min}–{s.max} • {s.games} gms
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-yellow-300" />
                  </div>
                </div>

                {/* Mobile signal bars */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[9px] text-neutral-500">
                      {floorThreshold}+ consistency
                    </div>
                    <div className="mt-1 h-1.5 rounded bg-neutral-800">
                      <div
                        className={cx(
                          "h-1.5 rounded",
                          hitColour(floorPct)
                        )}
                        style={{ width: `${floorPct}%` }}
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-neutral-300">
                      {floorPct}%
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] text-neutral-500">
                      {ceilingThreshold}+ ceiling
                    </div>
                    <div className="mt-1 h-1.5 rounded bg-neutral-800">
                      <div
                        className={cx(
                          "h-1.5 rounded",
                          hitColour(ceilingPct)
                        )}
                        style={{ width: `${ceilingPct}%` }}
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-neutral-300">
                      {ceilingPct}%
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {!isPremium && (
            <div className="px-4 py-5 bg-black/80">
              <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 px-5 py-4 text-center">
                <p className="text-sm text-neutral-200">
                  Unlock the full player list with Neeko+
                </p>
                <div className="mt-4 flex justify-center">
                  <Button className="rounded-full bg-yellow-400 text-black hover:bg-yellow-300">
                    Get Neeko+
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