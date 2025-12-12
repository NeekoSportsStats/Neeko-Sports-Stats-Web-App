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
  // Prefer round-specific arrays if you have them
  const anyP = player as any;

  if (lens === "Fantasy")
    return (
      anyP.roundsFantasy ??
      anyP.fantasyRounds ??
      anyP.fantasy ??
      ([] as number[])
    );
  if (lens === "Disposals")
    return (
      anyP.roundsDisposals ??
      anyP.disposalsRounds ??
      anyP.disposals ??
      ([] as number[])
    );
  return (
    anyP.roundsGoals ?? anyP.goalsRounds ?? anyP.goals ?? ([] as number[])
  );
}

// Ensure we always have OR + R1..R23 = 24 values.
// If the source has 23, we treat it as R1..R23 and prepend a plausible OR.
// If it has fewer, we pad with plausible values.
function normalizeRounds(values: number[], seedKey: number) {
  const r = mulberry32(seedKey);
  const v = [...values].filter((x) => typeof x === "number" && isFinite(x));

  if (v.length === 24) return v;

  if (v.length === 23) {
    const opening = clamp(Math.round(v[0] * (0.92 + r() * 0.14)), 0, 200);
    return [opening, ...v];
  }

  // pad to 24
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
    const v = Math.round(base + wave + jitter);
    arr.push(clamp(v, 0, lens === "Goals" ? 10 : 200));
  }
  return arr;
}

const ROUND_LABELS = ["OR", ...Array.from({ length: 23 }, (_, i) => `R${i + 1}`)];

const PAGE_SIZE = 10;

// Layout sizing (do NOT change scroll logic – only sizing/spacing)
const LEFT_COL_W = 124;     // player column
const RIGHT_COL_W = 86;     // insights column
const CELL_W = 56;          // round cell width
const CELL_GAP = 10;        // gap between round cells

/* -------------------------------------------------------------------------- */
/* CTA TEXT                                                                    */
/* -------------------------------------------------------------------------- */

function ctaCopy(lens: StatLens) {
  if (lens === "Disposals")
    return {
      title: "Unlock full disposals trends",
      sub: "Full season access, insights overlays & premium forecasting.",
    };
  if (lens === "Goals")
    return {
      title: "Unlock full goals trends",
      sub: "Full season access, insights overlays & premium forecasting.",
    };
  return {
    title: "Unlock full fantasy trends",
    sub: "Full season access, insights overlays & premium forecasting.",
  };
}

/* -------------------------------------------------------------------------- */
/* MASTER TABLE MOBILE                                                         */
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

  // CTA modal
  const [showUpgrade, setShowUpgrade] = useState(false);

  // CTA pulse once
  const [ctaPulseOnce, setCtaPulseOnce] = useState(false);
  useEffect(() => {
    // pulse only when free user AND table is rendered
    if (!isPremium) {
      const t = window.setTimeout(() => setCtaPulseOnce(true), 250);
      const t2 = window.setTimeout(() => setCtaPulseOnce(false), 1550);
      return () => {
        window.clearTimeout(t);
        window.clearTimeout(t2);
      };
    }
  }, [isPremium, selectedStat]);

  const filtered = useMemo(() => {
    if (!isPremium) return players; // free users can’t search
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => p.name.toLowerCase().includes(q));
  }, [players, query, isPremium]);

  const visiblePlayers = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  /* ---------------------------------------------------------------------- */
  /* SCROLL SYNC (header + each row)                                         */
  /* ---------------------------------------------------------------------- */

  const headerScrollRef = useRef<HTMLDivElement | null>(null);
  const rowScrollRefs = useRef<Array<HTMLDivElement | null>>([]);

  const syncingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const syncAllTo = (left: number, sourceIndex: number) => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    // Use rAF to avoid thrash / lag
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      // header
      if (headerScrollRef.current) {
        headerScrollRef.current.scrollLeft = left;
      }
      // rows
      rowScrollRefs.current.forEach((el, idx) => {
        if (!el) return;
        if (idx === sourceIndex) return;
        el.scrollLeft = left;
      });

      // release lock next frame
      requestAnimationFrame(() => {
        syncingRef.current = false;
      });
    });
  };

  const onHeaderScroll = () => {
    const el = headerScrollRef.current;
    if (!el) return;
    syncAllTo(el.scrollLeft, -1);
  };

  const onRowScroll = (rowIdx: number) => {
    const el = rowScrollRefs.current[rowIdx];
    if (!el) return;
    syncAllTo(el.scrollLeft, rowIdx);
  };

  /* ---------------------------------------------------------------------- */
  /* CTA INSERTION POSITION                                                   */
  /* ---------------------------------------------------------------------- */
  // Insert CTA right before the first locked row (index 8 => Player 9)
  const CTA_INSERT_AT = 8;
  const showCtaInline = !isPremium && visiblePlayers.length > CTA_INSERT_AT;

  const { title: ctaTitle, sub: ctaSub } = ctaCopy(selectedStat);

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="mt-6">
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

        {/* ================= TABLE ================= */}
        <div className="mt-4 rounded-3xl border border-neutral-800 bg-black/90 shadow-xl overflow-hidden">
          {/* Column header row */}
          <div className="border-b border-neutral-800/80">
            <div className="flex items-center">
              {/* Left header */}
              <div
                className="px-4 py-3"
                style={{ width: LEFT_COL_W }}
              >
                <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  Player
                </div>
              </div>

              {/* Scroll header */}
              <div className="flex-1 min-w-0">
                <div
                  ref={headerScrollRef}
                  onScroll={onHeaderScroll}
                  className="overflow-x-auto scrollbar-none"
                  style={{
                    WebkitOverflowScrolling: "touch",
                    overscrollBehaviorX: "contain",
                  }}
                >
                  <div
                    className="flex items-center px-2"
                    style={{
                      width: 24 * CELL_W + 23 * CELL_GAP + 16,
                      gap: CELL_GAP,
                      paddingRight: 8,
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

              {/* Right header */}
              <div
                className="px-4 py-3 text-right"
                style={{ width: RIGHT_COL_W }}
              >
                <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  Insights
                </div>
              </div>
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-neutral-800/70">
            {visiblePlayers.map((p, idx) => {
              // locked rows for free users (Player 9+)
              const gated = !isPremium && idx >= 8;

              const rawRounds = getRounds(p, selectedStat);
              const rounds = normalizeRounds(rawRounds, (p as any).id ?? idx + 1);
              const fakeRounds = buildFakeRounds(((p as any).id ?? idx + 1) * 13, selectedStat);

              const roundsToRender = gated ? fakeRounds : rounds;

              const role = (p as any).role ?? (p as any).position ?? "";
              const team = (p as any).team ?? "";

              // Insert CTA card BEFORE Player 9 (idx === 8)
              const renderCtaHere = showCtaInline && idx === CTA_INSERT_AT;

              return (
                <React.Fragment key={p.id}>
                  {renderCtaHere && (
                    <div className="px-4 py-5">
                      <button
                        type="button"
                        onClick={() => setShowUpgrade(true)}
                        className={cx(
                          "w-full text-left rounded-3xl border border-yellow-500/30",
                          "bg-gradient-to-r from-yellow-500/10 via-yellow-500/0 to-transparent",
                          "px-5 py-4 shadow-[0_0_45px_rgba(0,0,0,0.85)] transition",
                          "hover:brightness-110",
                          ctaPulseOnce &&
                            "animate-[ctaPulseOnce_1.2s_ease-out_1]"
                        )}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.18em] text-yellow-200/80">
                              Neeko AI Suite
                            </div>
                            <div className="mt-1 text-sm font-semibold text-yellow-100">
                              {ctaTitle}
                            </div>
                            <div className="mt-1 text-xs text-neutral-300">
                              {ctaSub}
                            </div>
                          </div>

                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-yellow-400/50 bg-black/60 shadow-[0_0_14px_rgba(250,204,21,0.6)]">
                            <ArrowRight className="h-4 w-4 text-yellow-300" />
                          </div>
                        </div>
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    {/* Entire row layout */}
                    <div
                      className={cx(
                        "flex items-stretch",
                        gated && "select-none"
                      )}
                    >
                      {/* LEFT: Player */}
                      <div
                        className="px-4 py-4"
                        style={{ width: LEFT_COL_W }}
                      >
                        <div className={cx(gated && "opacity-70")}>
                          <div className="text-[15px] font-semibold text-neutral-50 leading-tight">
                            {p.name}
                          </div>
                          <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                            {team} • {role}
                          </div>
                        </div>
                      </div>

                      {/* MIDDLE: Scroll rounds */}
                      <div className="flex-1 min-w-0 py-3">
                        <div
                          ref={(el) => {
                            rowScrollRefs.current[idx] = el;
                          }}
                          onScroll={() => onRowScroll(idx)}
                          className="overflow-x-auto scrollbar-none"
                          style={{
                            WebkitOverflowScrolling: "touch",
                            overscrollBehaviorX: "contain",
                          }}
                        >
                          <div
                            className="flex items-center px-2"
                            style={{
                              width: 24 * CELL_W + 23 * CELL_GAP + 16,
                              gap: CELL_GAP,
                              paddingRight: 8,
                            }}
                          >
                            {roundsToRender.map((v, i) => (
                              <div
                                key={`${p.id}-r-${i}`}
                                className={cx(
                                  "shrink-0 text-center tabular-nums",
                                  "text-[15px] leading-none",
                                  gated ? "text-neutral-200/40" : "text-neutral-100"
                                )}
                                style={{ width: CELL_W }}
                              >
                                {selectedStat === "Goals" ? v : v}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* RIGHT: Insights */}
                      <div
                        className="px-4 py-3 flex items-center justify-end"
                        style={{ width: RIGHT_COL_W }}
                      >
                        <button
                          type="button"
                          disabled={gated}
                          onClick={() => onSelectPlayer(p)}
                          className={cx(
                            "inline-flex items-center gap-1.5",
                            "text-[12px] font-medium",
                            "rounded-full px-2.5 py-1.5",
                            // move left a smidge vs hugging the scroll column
                            "ml-1",
                            gated
                              ? "text-neutral-500 cursor-not-allowed"
                              : "text-yellow-200 hover:text-yellow-100 hover:bg-yellow-500/10"
                          )}
                        >
                          <span>Insights</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* GATED OVERLAY (covers the whole row: player + rounds + insights) */}
                    {gated && (
                      <div className="pointer-events-none absolute inset-0">
                        {/* dark veil */}
                        <div className="absolute inset-0 bg-black/35" />
                        {/* stronger blur so you can’t read values cleanly */}
                        <div className="absolute inset-0 backdrop-blur-[10px]" />
                        {/* subtle gold haze so it feels premium not “broken” */}
                        <div className="absolute inset-0 opacity-70 mix-blend-screen">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(250,204,21,0.18),transparent_60%),radial-gradient(circle_at_70%_80%,rgba(250,204,21,0.14),transparent_55%)]" />
                        </div>

                        {/* label */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                          <div className="rounded-full border border-yellow-500/25 bg-black/60 px-3 py-1 text-[11px] text-yellow-200/80 shadow-[0_0_20px_rgba(250,204,21,0.25)]">
                            Neeko+ only
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </React.Fragment>
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
      </div>

      {/* ================= UPGRADE MODAL (screen-level) ================= */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="relative w-full max-w-md rounded-3xl border border-yellow-500/40 bg-gradient-to-b from-neutral-950 via-black to-black px-6 py-6 shadow-[0_0_80px_rgba(0,0,0,1)]">
            <button
              onClick={() => setShowUpgrade(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700/70 bg-black/70 text-neutral-300 transition hover:border-neutral-500 hover:text-white"
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
              Unlock full AFL AI analysis
            </h3>

            <p className="mt-2 text-xs text-neutral-300">
              Neeko+ unlocks full season tables, player insights overlays, advanced
              hit-rates, trend windows and premium forecasting across the league.
            </p>

            <ul className="mt-4 space-y-2 text-xs text-neutral-200">
              <li className="flex gap-2">
                <span className="mt-[5px] h-[4px] w-[4px] rounded-full bg-yellow-400" />
                <span>Full round-by-round access for every player.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-[5px] h-[4px] w-[4px] rounded-full bg-yellow-400" />
                <span>Insights overlay + AI summaries for every lens.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-[5px] h-[4px] w-[4px] rounded-full bg-yellow-400" />
                <span>Premium features as more sports launch.</span>
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
                onClick={() => setShowUpgrade(false)}
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-neutral-700 bg-black/70 px-4 py-2.5 text-sm font-medium text-neutral-200 transition hover:border-neutral-500 hover:text-white"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyframes (pulse once) */}
      <style>{`
        @keyframes ctaPulseOnce {
          0%   { box-shadow: 0 0 0 rgba(250,204,21,0); transform: translateY(0); }
          35%  { box-shadow: 0 0 42px rgba(250,204,21,0.45); transform: translateY(-1px); }
          100% { box-shadow: 0 0 0 rgba(250,204,21,0); transform: translateY(0); }
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}