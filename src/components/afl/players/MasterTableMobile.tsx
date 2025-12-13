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
const ROW_H = 56; // ✅ FIX — this was missing and crashing the page

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

  return (
    <>
      {/* ================= HEADER CARD ================= */}
      <div className="relative mt-6">
        <div className="absolute inset-0 backdrop-blur-[14px]" />
        <div className="relative rounded-3xl border border-neutral-800 bg-black/80 px-4 py-4 shadow-xl">
          {/* header unchanged */}
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
                top: 8 * ROW_H,
                left: LEFT_COL_W,
                right: 0,
                height: ROW_H * 2,
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

          {/* table body unchanged */}
        </div>
      </div>

      {/* footer unchanged */}
    </>
  );
}