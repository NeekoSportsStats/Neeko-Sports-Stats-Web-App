import React, { useMemo, useState } from "react";
import { Search, Lock, X, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlayerRow, StatLens } from "./MasterTable";

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

const ROUND_LABELS = ["OR", ...Array.from({ length: 23 }, (_, i) => `R${i + 1}`)];
const PAGE_SIZE = 10;

const LEFT_COL_W = 124;
const CELL_W = 52;
const CELL_GAP = 4;

// Shared stats row layout (header + body must match exactly)
const STATS_ROW_CLASS = "flex gap-[6px] px-1.5";

/* -------------------------------------------------------------------------- */
/* MASTER TABLE MOBILE                                                         */
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
  const [showUpgrade, setShowUpgrade] = useState(false);

  /* ---------------------------------------------------------------------- */
  /* FILTERING                                                               */
  /* ---------------------------------------------------------------------- */

  const filtered = useMemo(() => {
    if (!isPremium) return players;
    if (!query.trim()) return players;
    return players.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [players, query, isPremium]);

  const visiblePlayers = filtered.slice(0, visibleCount);

  /* ---------------------------------------------------------------------- */
  /* RENDER                                                                  */
  /* ---------------------------------------------------------------------- */

  const tableWidth = LEFT_COL_W + 24 * CELL_W + 23 * CELL_GAP + 16;

  return (
    <>
      {/* ================= HEADER CARD ================= */}
      <div className="relative mt-6">
        <div className="absolute inset-0 backdrop-blur-[14px]" />
        <div className="relative rounded-3xl border border-neutral-800 bg-black/80 px-4 py-4 shadow-xl">
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
          <div className="mt-4 flex gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1 text-[11px]">
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

          {/* Search */}
          <div className="mt-3">
            {isPremium ? (
              <div className="flex items-center gap-2 rounded-2xl border border-neutral-800 bg-black/70 px-3 py-2">
                <Search className="h-4 w-4 text-neutral-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search players…"
                  className="w-full bg-transparent text-[12px] text-neutral-200 outline-none"
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
      </div>

      {/* ================= TABLE ================= */}
      <div className="mt-4 rounded-3xl border border-neutral-800 bg-black/90 shadow-xl overflow-hidden">
        {/* SINGLE HORIZONTAL SCROLLER */}
        <div className="overflow-x-auto overflow-y-visible scrollbar-none">
          <div style={{ width: tableWidth }}>
            {/* Header row */}
            <div className="flex border-b border-neutral-800/80">
              <div className="px-4 py-4" style={{ width: LEFT_COL_W }}>
                <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  Player
                </div>
              </div>

              <div className={`${STATS_ROW_CLASS} py-4`}>
                {ROUND_LABELS.map((r) => (
                  <div
                    key={r}
                    className="text-center text-[10px] uppercase tracking-[0.18em] text-neutral-500 translate-y-[1px]"
                    style={{ width: CELL_W }}
                  >
                    {r}
                  </div>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-neutral-800/70">
              {visiblePlayers.map((p, idx) => {
                const gated = !isPremium && idx >= 8;

                return (
                  <div
                    key={p.id}
                    className="relative flex"
                    style={{ width: tableWidth }}
                  >
                    {/* Player cell */}
                    <button
                      disabled={gated}
                      onClick={() => onSelectPlayer(p)}
                      className="px-4 py-4 flex items-center justify-between text-left"
                      style={{ width: LEFT_COL_W }}
                    >
                      <span className="text-[15px] font-semibold text-neutral-50">
                        {p.name}
                      </span>
                      {!gated && (
                        <ChevronRight className="h-4 w-4 text-neutral-500" />
                      )}
                    </button>

                    {/* Stats */}
                    <div className={`${STATS_ROW_CLASS} py-4`}>
                      {ROUND_LABELS.map((_, i) => (
                        <div
                          key={i}
                          className="text-center text-[15px] text-neutral-100"
                          style={{ width: CELL_W }}
                        >
                          {gated ? "—" : Math.floor(70 + Math.random() * 40)}
                        </div>
                      ))}
                    </div>

                    {/* Blur gate */}
                    {gated && (
                      <div className="pointer-events-none absolute inset-0">
                        <div className="absolute inset-0 backdrop-blur-[16px]" />
                        <div className="absolute inset-0 bg-black/45" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA */}
        {!isPremium && visiblePlayers.length >= 8 && (
          <div className="px-4 py-5">
            <button
              onClick={() => setShowUpgrade(true)}
              className="w-full rounded-3xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/15 via-yellow-500/5 to-transparent px-5 py-4 text-left"
            >
              <div className="text-[11px] uppercase tracking-[0.18em] text-yellow-200/80">
                Master Table
              </div>
              <div className="mt-1 text-sm font-semibold text-yellow-100">
                Unlock full fantasy trends
              </div>
              <div className="mt-1 text-xs text-neutral-300">
                Full season access, insights overlays & premium forecasting.
              </div>
            </button>
          </div>
        )}

        {/* Show more */}
        {visibleCount < filtered.length && (
          <div className="px-4 py-5 text-center">
            <Button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="rounded-full bg-neutral-800 text-neutral-200"
            >
              Show more players
            </Button>
          </div>
        )}
      </div>

      {/* ================= UPGRADE MODAL ================= */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center px-4">
          <div className="relative w-full max-w-md rounded-3xl border border-yellow-500/40 bg-black px-6 py-6">
            <button
              onClick={() => setShowUpgrade(false)}
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4 text-neutral-400" />
            </button>

            <h3 className="text-xl font-semibold text-white">
              Unlock full AFL AI analysis
            </h3>

            <p className="mt-2 text-xs text-neutral-300">
              Full season tables, player insights & premium forecasting.
            </p>

            <a
              href="/neeko-plus"
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-yellow-400 px-4 py-3 font-semibold text-black"
            >
              Upgrade to Neeko+
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { scrollbar-width: none; }
      `}</style>
    </>
  );
}