import React, { useEffect, useMemo, useRef, useState } from "react";
import { Lock, ChevronRight, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlayerRow, StatLens } from "./MasterTable";

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function getRounds(player: PlayerRow, lens: StatLens): number[] {
  if (lens === "Fantasy") return player.roundsFantasy ?? [];
  if (lens === "Disposals") return player.roundsDisposals ?? [];
  return player.roundsGoals ?? [];
}

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                   */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 10;

// “6 at a time” carousel feel
const CELL_W = 44; // px per round cell
const VISIBLE_CELLS = 6;
const ROUNDS_VIEW_W = CELL_W * VISIBLE_CELLS; // 264px

const ROUND_LABELS: string[] = ["OR", ...Array.from({ length: 23 }, (_, i) => `R${i + 1}`)];
const TOTAL_COLS = ROUND_LABELS.length;

/* -------------------------------------------------------------------------- */
/* NEEKO+ MODAL (CTA POPUP)                                                    */
/* -------------------------------------------------------------------------- */

function NeekoPlusModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-yellow-500/40 bg-gradient-to-b from-neutral-950 via-black to-black px-6 py-6 shadow-[0_0_80px_rgba(0,0,0,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700/70 bg-black/70 text-neutral-300 transition hover:border-neutral-500 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-gradient-to-r from-yellow-500/25 via-yellow-500/5 to-transparent px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.9)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-100">
            Neeko+ Upgrade
          </span>
        </div>

        <h3 className="mt-3 text-xl font-semibold text-neutral-50">
          Unlock full player insights
        </h3>

        <p className="mt-2 text-xs leading-relaxed text-neutral-300">
          Get full search, full player list, and deeper insights per lens — including full-season
          round-by-round comparisons.
        </p>

        <ul className="mt-4 space-y-2 text-xs text-neutral-200">
          <li className="flex gap-2">
            <span className="mt-[5px] h-[4px] w-[4px] rounded-full bg-yellow-400" />
            <span>Unlock the full player list (no blur).</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-[5px] h-[4px] w-[4px] rounded-full bg-yellow-400" />
            <span>Search + filters for every lens.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-[5px] h-[4px] w-[4px] rounded-full bg-yellow-400" />
            <span>Player Insights panel with profile + hit-rate ladder.</span>
          </li>
        </ul>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="/neeko-plus"
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-yellow-400/70 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 px-4 py-2.5 text-sm font-semibold text-black shadow-[0_0_30px_rgba(250,204,21,0.85)] transition hover:brightness-110"
          >
            Upgrade to Neeko+
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>

          <button
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-neutral-700 bg-black/70 px-4 py-2.5 text-sm font-medium text-neutral-200 transition hover:border-neutral-500 hover:text-white"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MOBILE MASTER TABLE (ROUND CAROUSEL + SYNC)                                 */
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
  const [showModal, setShowModal] = useState(false);

  // Shared scrollLeft for syncing header + all rows
  const [roundsScrollLeft, setRoundsScrollLeft] = useState(0);
  const syncingRef = useRef(false);

  const headerScrollRef = useRef<HTMLDivElement | null>(null);
  const rowScrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const filtered = useMemo(() => {
    if (isPremium) {
      const q = query.trim().toLowerCase();
      return players.filter((p) => p.name.toLowerCase().includes(q));
    }
    return players;
  }, [players, isPremium, query]);

  const visiblePlayers = filtered.slice(0, visibleCount);

  // Ensure we never exceed available players after filtering
  useEffect(() => {
    if (visibleCount > filtered.length) setVisibleCount(Math.min(PAGE_SIZE, filtered.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.length]);

  const onAnyRoundsScroll = (el: HTMLDivElement) => {
    if (syncingRef.current) return;

    syncingRef.current = true;
    const next = el.scrollLeft;

    // rAF keeps it smooth and avoids “fight” between scrollers
    requestAnimationFrame(() => {
      setRoundsScrollLeft(next);

      // Sync header
      if (headerScrollRef.current && headerScrollRef.current !== el) {
        headerScrollRef.current.scrollLeft = next;
      }
      // Sync all rows
      Object.values(rowScrollRefs.current).forEach((node) => {
        if (!node || node === el) return;
        node.scrollLeft = next;
      });

      syncingRef.current = false;
    });
  };

  // When lens changes, reset horizontal scroll so you start at OR
  useEffect(() => {
    setRoundsScrollLeft(0);
    requestAnimationFrame(() => {
      if (headerScrollRef.current) headerScrollRef.current.scrollLeft = 0;
      Object.values(rowScrollRefs.current).forEach((n) => {
        if (n) n.scrollLeft = 0;
      });
    });
  }, [selectedStat]);

  return (
    <>
      <div className="mt-6">
        {/* ================= HEADER CARD ================= */}
        <div className="rounded-3xl border border-neutral-800 bg-black/90 px-4 py-4 shadow-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-yellow-200">
              Master Table
            </span>
          </div>

          <h3 className="mt-3 text-lg font-semibold text-neutral-50">
            Full-season player scores
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
                  "rounded-full px-3 py-1.5 transition",
                  selectedStat === s
                    ? "bg-yellow-400 text-black shadow-[0_0_16px_rgba(250,204,21,0.6)]"
                    : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search (locked for free) */}
          <div className="mt-3">
            {isPremium ? (
              <div className="flex items-center gap-2 rounded-2xl border border-neutral-800 bg-black/70 px-3 py-2">
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

        {/* ================= TABLE SHELL ================= */}
        <div className="mt-4 rounded-3xl border border-neutral-800 bg-black/90 shadow-xl overflow-hidden">
          {/* Top column labels (sticky within this card) */}
          <div className="sticky top-0 z-20 border-b border-neutral-800/80 bg-black/90">
            <div
              className="grid items-center"
              style={{
                gridTemplateColumns: `140px ${ROUNDS_VIEW_W}px 48px`,
              }}
            >
              <div className="px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                Player
              </div>

              {/* Sticky Rounds header carousel */}
              <div className="py-2">
                <div
                  ref={headerScrollRef}
                  onScroll={(e) => onAnyRoundsScroll(e.currentTarget)}
                  className="no-scrollbar overflow-x-auto"
                  style={{
                    width: `${ROUNDS_VIEW_W}px`,
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <div style={{ width: `${TOTAL_COLS * CELL_W}px` }} className="flex">
                    {ROUND_LABELS.map((lab) => (
                      <div
                        key={lab}
                        className="shrink-0 text-center text-[10px] uppercase tracking-[0.16em] text-neutral-500"
                        style={{ width: `${CELL_W}px` }}
                      >
                        {lab}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 text-center text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                Insights
              </div>
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-neutral-800/80">
            {visiblePlayers.map((p, idx) => {
              const blurred = !isPremium && idx >= 8;
              const rounds = getRounds(p, selectedStat);

              return (
                <div
                  key={p.id}
                  className={cx(
                    "relative",
                    blurred && "opacity-40"
                  )}
                >
                  <div
                    className="grid items-center"
                    style={{
                      gridTemplateColumns: `140px ${ROUNDS_VIEW_W}px 48px`,
                    }}
                  >
                    {/* Player cell */}
                    <div className="px-4 py-4">
                      <div className="text-[14px] font-semibold text-neutral-50 leading-tight truncate">
                        {p.name}
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500 truncate">
                        {p.team} • {p.role}
                      </div>
                    </div>

                    {/* Rounds carousel */}
                    <div className="py-3">
                      <div
                        ref={(node) => {
                          rowScrollRefs.current[p.id] = node;
                        }}
                        onScroll={(e) => onAnyRoundsScroll(e.currentTarget)}
                        className="no-scrollbar overflow-x-auto"
                        style={{
                          width: `${ROUNDS_VIEW_W}px`,
                          WebkitOverflowScrolling: "touch",
                        }}
                      >
                        <div
                          className="flex"
                          style={{ width: `${TOTAL_COLS * CELL_W}px` }}
                        >
                          {Array.from({ length: TOTAL_COLS }).map((_, i) => {
                            const v = rounds[i] ?? null;

                            // subtle emphasis for higher values
                            const isHi =
                              typeof v === "number" &&
                              (selectedStat === "Goals"
                                ? v >= 3
                                : selectedStat === "Disposals"
                                ? v >= 25
                                : v >= statCfg.thresholds[2]);

                            return (
                              <div
                                key={`${p.id}-r-${i}`}
                                className={cx(
                                  "shrink-0 text-center text-[13px] tabular-nums",
                                  v == null ? "text-neutral-700" : "text-neutral-200",
                                  isHi && "text-yellow-200"
                                )}
                                style={{ width: `${CELL_W}px` }}
                              >
                                {v == null ? "—" : v}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Insights button */}
                    <div className="px-2 py-3 flex justify-center">
                      <button
                        type="button"
                        disabled={blurred}
                        onClick={() => {
                          if (blurred) return;
                          onSelectPlayer(p);
                        }}
                        className={cx(
                          "flex h-9 w-9 items-center justify-center rounded-full border transition",
                          blurred
                            ? "border-neutral-800 bg-black/40 text-neutral-700"
                            : "border-yellow-500/30 bg-black/60 text-yellow-300 shadow-[0_0_14px_rgba(250,204,21,0.25)] active:scale-[0.98]"
                        )}
                        aria-label="Open insights"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Click-block overlay for blurred rows to prevent weird taps */}
                  {blurred && (
                    <div className="absolute inset-0 pointer-events-auto" />
                  )}
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

            {/* PAYWALL CTA (POPUP trigger, not embedded big block) */}
            {!isPremium && (
              <div className="px-4 py-5">
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="group w-full rounded-3xl border border-yellow-500/25 bg-gradient-to-r from-yellow-500/10 via-yellow-500/0 to-transparent px-5 py-4 text-left transition hover:brightness-110"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-yellow-200/80">
                        Neeko+ Upgrade
                      </div>
                      <div className="mt-1 text-sm font-semibold text-yellow-100">
                        Unlock the full player list + insights
                      </div>
                      <p className="mt-1 text-xs text-neutral-300">
                        Get full access to search, all players, and insights for every lens.
                      </p>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-yellow-400/40 bg-black/60 shadow-[0_0_14px_rgba(250,204,21,0.35)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                      <ArrowRight className="h-4 w-4 text-yellow-300" />
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <NeekoPlusModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}