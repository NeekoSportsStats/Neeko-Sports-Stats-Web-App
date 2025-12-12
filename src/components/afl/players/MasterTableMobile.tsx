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

function getRounds(player: PlayerRow, lens: StatLens) {
  const anyP = player as any;
  if (lens === "Fantasy") return anyP.roundsFantasy ?? anyP.fantasy ?? [];
  if (lens === "Disposals") return anyP.roundsDisposals ?? anyP.disposals ?? [];
  return anyP.roundsGoals ?? anyP.goals ?? [];
}

function normalizeRounds(values: number[], seedKey: number) {
  const r = mulberry32(seedKey);
  const v = [...values].filter((x) => typeof x === "number" && isFinite(x));
  if (v.length === 24) return v;
  if (v.length === 23) {
    const opening = clamp(Math.round(v[0] * (0.92 + r() * 0.14)), 0, 200);
    return [opening, ...v];
  }
  const base = v.length ? v[Math.min(2, v.length - 1)] : 80;
  const padded = v.slice(0, 24);
  while (padded.length < 24) {
    padded.push(clamp(Math.round(base + (r() - 0.5) * 28), 0, 200));
  }
  return padded;
}

function buildFakeRounds(seedKey: number, lens: StatLens) {
  const r = mulberry32(seedKey * 9973 + lens.length * 123);
  const base =
    lens === "Goals" ? 2 + r() * 3 : lens === "Disposals" ? 18 + r() * 10 : 78 + r() * 18;
  const arr: number[] = [];
  for (let i = 0; i < 24; i++) {
    const wave = Math.sin((i / 24) * Math.PI * 2) * (lens === "Goals" ? 1.2 : 9);
    const jitter = (r() - 0.5) * (lens === "Goals" ? 2 : 22);
    arr.push(clamp(Math.round(base + wave + jitter), 0, lens === "Goals" ? 10 : 200));
  }
  return arr;
}

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

  const filtered = useMemo(() => {
    if (!isPremium) return players;
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => p.name.toLowerCase().includes(q));
  }, [players, query, isPremium]);

  const visiblePlayers = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  /* ---------------- SCROLL SYNC (DO NOT TOUCH) ---------------- */

  const headerScrollRef = useRef<HTMLDivElement | null>(null);
  const rowScrollRefs = useRef<Array<HTMLDivElement | null>>([]);
  const syncingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const syncAllTo = (left: number, sourceIndex: number) => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (headerScrollRef.current) headerScrollRef.current.scrollLeft = left;
      rowScrollRefs.current.forEach((el, idx) => {
        if (!el || idx === sourceIndex) return;
        el.scrollLeft = left;
      });
      requestAnimationFrame(() => {
        syncingRef.current = false;
      });
    });
  };

  const onHeaderScroll = () => {
    if (headerScrollRef.current) syncAllTo(headerScrollRef.current.scrollLeft, -1);
  };

  const onRowScroll = (rowIdx: number) => {
    const el = rowScrollRefs.current[rowIdx];
    if (el) syncAllTo(el.scrollLeft, rowIdx);
  };

  return (
    <>
      <div className="mt-4 rounded-3xl border border-neutral-800 bg-black/90 shadow-xl overflow-hidden">
        {/* HEADER */}
        <div className="border-b border-neutral-800/80 flex">
          <div className="px-4 py-3" style={{ width: LEFT_COL_W }}>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Player
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div
              ref={headerScrollRef}
              onScroll={onHeaderScroll}
              className="overflow-x-auto scrollbar-none"
            >
              <div
                className="flex items-center px-2"
                style={{
                  width: 24 * CELL_W + 23 * CELL_GAP + 16,
                  gap: CELL_GAP,
                }}
              >
                {ROUND_LABELS.map((lab) => (
                  <div
                    key={lab}
                    className="shrink-0 text-center text-[10px] uppercase tracking-[0.18em] text-neutral-500"
                    style={{ width: CELL_W }}
                  >
                    {lab}
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

        {/* ROWS */}
        <div className="divide-y divide-neutral-800/70">
          {visiblePlayers.map((p, idx) => {
            const gated = !isPremium && idx >= 8;
            const rounds = normalizeRounds(getRounds(p, selectedStat), idx + 1);
            const fakeRounds = buildFakeRounds(idx + 1, selectedStat);
            const data = gated ? fakeRounds : rounds;

            return (
              <div key={p.id} className="relative">
                <div className="flex items-stretch">
                  <div className="px-4 py-4" style={{ width: LEFT_COL_W }}>
                    <div className="text-[15px] font-semibold text-neutral-50">
                      {p.name}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 py-3">
                    <div
                      ref={(el) => (rowScrollRefs.current[idx] = el)}
                      onScroll={() => onRowScroll(idx)}
                      className="overflow-x-auto scrollbar-none"
                    >
                      <div
                        className="flex items-center px-2"
                        style={{
                          width: 24 * CELL_W + 23 * CELL_GAP + 16,
                          gap: CELL_GAP,
                        }}
                      >
                        {data.map((v, i) => (
                          <div
                            key={i}
                            className="shrink-0 text-center text-[15px] tabular-nums text-neutral-100"
                            style={{ width: CELL_W }}
                          >
                            {v}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 🔧 ONLY CHANGE IS HERE */}
                  <div
                    className="px-4 py-3 flex items-center justify-end"
                    style={{ width: RIGHT_COL_W }}
                  >
                    <button
                      onClick={() => onSelectPlayer(p)}
                      className={cx(
                        "inline-flex items-center gap-1.5 text-[12px] font-medium rounded-full px-2.5 py-1.5",
                        "ml-3", // ← moved right a smidge (ONLY CHANGE)
                        gated
                          ? "text-neutral-500"
                          : "text-yellow-200 hover:text-yellow-100 hover:bg-yellow-500/10"
                      )}
                    >
                      Insights <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}