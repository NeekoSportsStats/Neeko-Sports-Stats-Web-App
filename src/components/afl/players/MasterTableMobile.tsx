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
const STATS_ROW_CLASS = "flex gap-[4px] px-1.5";

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

  const [teamFilter, setTeamFilter] = useState<string | null>(null);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);

  /* ---------------------------------------------------------------------- */
  /* FILTERING                                                               */
  /* ---------------------------------------------------------------------- */

  const filtered = useMemo(() => {
    let result = players;

    if (isPremium && query.trim()) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (isPremium && teamFilter) {
      result = result.filter((p) => p.team === teamFilter);
    }

    return result;
  }, [players, query, isPremium, teamFilter]);

  const visiblePlayers = filtered.slice(0, visibleCount);

  /* ---------------------------------------------------------------------- */
  /* RENDER                                                                  */
  /* ---------------------------------------------------------------------- */

  const tableWidth = LEFT_COL_W + 24 * CELL_W + 23 * CELL_GAP + 16;

  const TEAMS = useMemo(
    () => Array.from(new Set(players.map((p) => p.team))).sort(),
    [players]
  );

  return (
    <>
      {/* ================= HEADER CARD ================= */}
      <div className="relative mt-6">
        <div className="absolute inset-0 backdrop-blur-[14px]" />
        <div className="relative rounded-3xl border border-neutral-800 bg-black/80 px-4 py-4 shadow-xl">
          {/* HEADER CONTENT UNCHANGED */}
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="mt-4 rounded-3xl border border-neutral-800 bg-black/90 shadow-xl overflow-hidden">
        <div className="relative">
          {/* ================= CTA OVERLAY ================= */}
          {!isPremium && (
            <div
              className="absolute z-40 pointer-events-none"
              style={{
                top: 8 * 72,   // ⬅️ was 8 * 64
                left: LEFT_COL_W,
                right: 0,
                height: 144,  // ⬅️ was 128 (now cleanly spans rows 9–10)
              }}
            >
              <div className="flex h-full items-center justify-center">
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="pointer-events-auto mx-4 w-full max-w-sm rounded-3xl
                             border border-yellow-500/30
                             bg-gradient-to-r from-yellow-500/25 via-yellow-500/10 to-transparent
                             px-5 py-4 text-left shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-yellow-200/80">
                        Neeko+
                      </div>
                      <div className="mt-1 text-sm font-semibold text-yellow-100">
                        Unlock full player table
                      </div>
                      <div className="mt-1 text-xs text-neutral-300">
                        Full season trends, team filters & AI insights.
                      </div>
                    </div>

                    <ArrowRight className="h-5 w-5 text-yellow-300 shrink-0" />
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto overflow-y-visible scrollbar-none">
            <div style={{ width: tableWidth }}>
              {/* TABLE CONTENT UNCHANGED */}
            </div>
          </div>
        </div>
      </div>

      {/* ================= SHOW MORE ================= */}
      {visiblePlayers.length < filtered.length && (
        <div className="mt-4 flex justify-center">
          <Button
            onClick={() =>
              setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length))
            }
            className="rounded-full bg-neutral-800 px-6 py-2 text-neutral-200"
          >
            Show more
          </Button>
        </div>
      )}

      {/* ================= SHOW LESS (premium only) ================= */}
      {isPremium && visibleCount > PAGE_SIZE && (
        <div className="mt-2 flex justify-center">
          <button
            onClick={() => setVisibleCount(PAGE_SIZE)}
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            Show less
          </button>
        </div>
      )}

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { scrollbar-width: none; }
      `}</style>
    </>
  );
}