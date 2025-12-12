import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, Lock, ChevronRight, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlayerRow, StatLens } from "./MasterTable";

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const ROUND_LABELS = ["OR", ...Array.from({ length: 23 }, (_, i) => `R${i + 1}`)];
const PAGE_SIZE = 10;

const LEFT_COL_W = 124;
const RIGHT_COL_W = 86;
const CELL_W = 56;
const CELL_GAP = 10;

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
  const [ctaPulseOnce, setCtaPulseOnce] = useState(false);

  useEffect(() => {
    if (!isPremium) {
      const t1 = setTimeout(() => setCtaPulseOnce(true), 300);
      const t2 = setTimeout(() => setCtaPulseOnce(false), 1500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isPremium, selectedStat]);

  const filtered = useMemo(() => {
    if (!isPremium) return players;
    if (!query.trim()) return players;
    return players.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [players, query, isPremium]);

  const visiblePlayers = filtered.slice(0, visibleCount);

  /* ---------------------------------------------------------------------- */
  /* SCROLL SYNC — DO NOT TOUCH                                              */
  /* ---------------------------------------------------------------------- */

  const headerScrollRef = useRef<HTMLDivElement | null>(null);
  const rowScrollRefs = useRef<Array<HTMLDivElement | null>>([]);
  const syncingRef = useRef(false);

  const syncAllTo = (left: number, sourceIdx: number) => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    requestAnimationFrame(() => {
      headerScrollRef.current!.scrollLeft = left;
      rowScrollRefs.current.forEach((el, i) => {
        if (i !== sourceIdx && el) el.scrollLeft = left;
      });
      requestAnimationFrame(() => {
        syncingRef.current = false;
      });
    });
  };

  /* ---------------------------------------------------------------------- */

  return (
    <>
      {/* ================= HEADER (BLUR RESTORED) ================= */}
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
        {/* Header row */}
        <div className="border-b border-neutral-800/80 flex items-center">
          <div className="px-4 py-3" style={{ width: LEFT_COL_W }}>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Player
            </div>
          </div>

          <div className="flex-1">
            <div
              ref={headerScrollRef}
              onScroll={(e) =>
                syncAllTo(e.currentTarget.scrollLeft, -1)
              }
              className="overflow-x-auto scrollbar-none"
            >
              <div
                className="flex px-2"
                style={{
                  width: 24 * CELL_W + 23 * CELL_GAP + 16,
                  gap: CELL_GAP,
                }}
              >
                {ROUND_LABELS.map((r) => (
                  <div
                    key={r}
                    className="text-center text-[10px] uppercase tracking-[0.18em] text-neutral-500"
                    style={{ width: CELL_W }}
                  >
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="px-4 py-3 text-right"
            style={{ width: RIGHT_COL_W }}
          >
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Insights
            </div>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-neutral-800/70">
          {visiblePlayers.map((p, idx) => {
            const gated = !isPremium && idx >= 8;

            return (
              <div key={p.id} className="relative flex items-stretch">
                {/* Player */}
                <div
                  className="px-4 py-4"
                  style={{ width: LEFT_COL_W }}
                >
                  <div className="text-[15px] font-semibold text-neutral-50">
                    {p.name}
                  </div>
                </div>

                {/* Scroll */}
                <div className="flex-1 py-3">
                  <div
                    ref={(el) => (rowScrollRefs.current[idx] = el)}
                    onScroll={(e) =>
                      syncAllTo(e.currentTarget.scrollLeft, idx)
                    }
                    className="overflow-x-auto scrollbar-none"
                  >
                    <div
                      className="flex px-2"
                      style={{
                        width:
                          24 * CELL_W + 23 * CELL_GAP + 16,
                        gap: CELL_GAP,
                      }}
                    >
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
                  </div>
                </div>

                {/* Insights — micro spacing FIXED */}
                <div
                  className="px-4 py-3 flex items-center justify-end"
                  style={{ width: RIGHT_COL_W }}
                >
                  <button
                    onClick={() => onSelectPlayer(p)}
                    disabled={gated}
                    className={cx(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px]",
                      "ml-3",
                      gated
                        ? "text-neutral-500"
                        : "text-yellow-200 hover:bg-yellow-500/10"
                    )}
                  >
                    Insights
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {visibleCount < filtered.length && (
            <div className="px-4 py-5 text-center">
              <Button
                onClick={() =>
                  setVisibleCount((c) => c + PAGE_SIZE)
                }
                className="rounded-full bg-neutral-800 text-neutral-200"
              >
                Show more players
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ================= CTA MODAL ================= */}
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
    </>
  );
}