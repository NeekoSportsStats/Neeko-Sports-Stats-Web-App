import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, Lock, ChevronRight, ArrowRight, X } from "lucide-react";
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

function roundLabels() {
  // Opening Round + R1..R23
  return ["OR", ...Array.from({ length: 23 }, (_, i) => `R${i + 1}`)];
}

// Deterministic pseudo-random (so fake numbers don't “shuffle” on re-render)
function seededInt(seed: number) {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) % 1000;
}

function fakeScore(playerId: string | number, idx: number, lens: StatLens) {
  const base =
    lens === "Goals" ? 0 : lens === "Disposals" ? 10 : 35; // rough baselines
  const spread =
    lens === "Goals" ? 5 : lens === "Disposals" ? 20 : 70;

  const n = seededInt(Number(String(playerId).split("").reduce((a, c) => a + c.charCodeAt(0), 0)) + idx * 97);
  const v = base + (n % spread);
  return lens === "Goals" ? Math.max(0, Math.round(v / 10)) : v;
}

function statCTA(selectedStat: StatLens) {
  if (selectedStat === "Goals") {
    return {
      title: "Unlock full goals trends",
      body: "See every round (OR–R23), matchup context and full player insights.",
    };
  }
  if (selectedStat === "Disposals") {
    return {
      title: "Unlock full disposals trends",
      body: "Compare round-by-round output across the full player list (OR–R23).",
    };
  }
  return {
    title: "Unlock full fantasy trends",
    body: "See every round (OR–R23), hit-rate ladders and premium insights.",
  };
}

/* -------------------------------------------------------------------------- */
/* MOBILE MASTER TABLE                                                        */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 12;

// Layout constants (tuned for “~6 rounds visible” on mobile)
const PLAYER_COL_W = 148; // px
const INSIGHT_COL_W = 92; // px
const CELL_W = 46; // px (6 cells ~ 276px)

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

  // CTA modal + “pulse once”
  const [showCtaModal, setShowCtaModal] = useState(false);
  const [ctaPulse, setCtaPulse] = useState(!isPremium);

  useEffect(() => {
    // whenever user changes lens, do a gentle single pulse again (optional feel-good)
    if (!isPremium) setCtaPulse(true);
  }, [selectedStat, isPremium]);

  const labels = useMemo(() => roundLabels(), []);
  const fullFiltered = useMemo(() => {
    if (!isPremium) return players;
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => p.name.toLowerCase().includes(q));
  }, [players, isPremium, query]);

  const visiblePlayers = fullFiltered.slice(0, visibleCount);

  // Single shared horizontal scroll container ref (for potential future syncing / snapping)
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const ctaCopy = statCTA(selectedStat);

  return (
    <div className="mt-6">
      {/* ------------------------------ KEYFRAMES ------------------------------ */}
      <style>{`
        @keyframes neekoPulseOnce {
          0%   { transform: translateY(10px) scale(0.98); opacity: 0; box-shadow: 0 0 0 rgba(250,204,21,0); }
          40%  { transform: translateY(0px)  scale(1.00); opacity: 1; box-shadow: 0 0 34px rgba(250,204,21,0.55); }
          100% { transform: translateY(0px)  scale(1.00); opacity: 1; box-shadow: 0 0 18px rgba(250,204,21,0.25); }
        }
      `}</style>

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

      {/* ================= TABLE (ONE shared horizontal scroll) ================= */}
      <div className="mt-4 rounded-3xl border border-neutral-800 bg-black/90 shadow-xl overflow-hidden">
        {/* ONE horizontal scroll container for header + ALL rows */}
        <div
          ref={scrollRef}
          className="relative overflow-x-auto overscroll-x-contain"
          style={{ WebkitOverflowScrolling: "touch" as any }}
        >
          {/* grid width: player col + 24 round cols + insight col */}
          <div
            className="min-w-full"
            style={{
              width: PLAYER_COL_W + labels.length * CELL_W + INSIGHT_COL_W,
            }}
          >
            {/* ---------- Column header row (sticky top optional; kept simple) ---------- */}
            <div
              className="grid items-center border-b border-neutral-800/80 bg-black/95"
              style={{
                gridTemplateColumns: `${PLAYER_COL_W}px repeat(${labels.length}, ${CELL_W}px) ${INSIGHT_COL_W}px`,
              }}
            >
              {/* Sticky Player header */}
              <div
                className="sticky left-0 z-20 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-neutral-400 bg-black/95"
                style={{ width: PLAYER_COL_W }}
              >
                Player
              </div>

              {/* Round labels */}
              {labels.map((lab) => (
                <div
                  key={lab}
                  className="px-1 py-3 text-center text-[11px] uppercase tracking-[0.14em] text-neutral-500"
                >
                  {lab}
                </div>
              ))}

              {/* Sticky Insights header */}
              <div
                className="sticky right-0 z-20 px-3 py-3 text-right text-[11px] uppercase tracking-[0.18em] text-neutral-400 bg-black/95"
                style={{ width: INSIGHT_COL_W }}
              >
                Insights
              </div>
            </div>

            {/* ---------- Rows ---------- */}
            <div className="divide-y divide-neutral-800/70">
              {visiblePlayers.map((p, idx) => {
                const rounds = getRounds(p, selectedStat);
                const blurred = !isPremium && idx >= 8;

                return (
                  <div
                    key={p.id}
                    className={cx(
                      "relative grid items-stretch",
                      "bg-black/90"
                    )}
                    style={{
                      gridTemplateColumns: `${PLAYER_COL_W}px repeat(${labels.length}, ${CELL_W}px) ${INSIGHT_COL_W}px`,
                    }}
                  >
                    {/* Sticky Player cell */}
                    <div
                      className={cx(
                        "sticky left-0 z-10 bg-black/90 px-4 py-4",
                        blurred && "opacity-90"
                      )}
                      style={{ width: PLAYER_COL_W }}
                    >
                      <div className="text-[14px] font-semibold text-neutral-50 leading-tight">
                        {p.name}
                      </div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                        {p.team} • {p.role}
                      </div>
                    </div>

                    {/* Round cells */}
                    {labels.map((_, rIdx) => {
                      const real = rounds?.[rIdx] ?? 0;
                      const display = blurred
                        ? fakeScore(p.id, rIdx, selectedStat)
                        : real;

                      return (
                        <div
                          key={`${p.id}-r-${rIdx}`}
                          className={cx(
                            "flex items-center justify-center px-1 py-4",
                            "text-[14px] tabular-nums",
                            blurred ? "text-neutral-400/70" : "text-neutral-200"
                          )}
                        >
                          <span
                            className={cx(
                              blurred &&
                                "blur-[10px] brightness-[0.45] contrast-[0.85] select-none"
                            )}
                          >
                            {display}
                          </span>
                        </div>
                      );
                    })}

                    {/* Sticky Insights cell */}
                    <div
                      className="sticky right-0 z-10 bg-black/90 px-3 py-4 flex items-center justify-end"
                      style={{ width: INSIGHT_COL_W }}
                    >
                      <button
                        onClick={() => {
                          if (blurred) return;
                          onSelectPlayer(p);
                        }}
                        className={cx(
                          "inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] transition",
                          blurred
                            ? "text-neutral-600 cursor-not-allowed"
                            : "text-yellow-300 hover:text-yellow-200 hover:bg-yellow-500/10"
                        )}
                      >
                        <span>Insights</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Strong premium blur overlay (free users only, after index 8) */}
                    {blurred && (
                      <>
                        {/* darken + blur the whole row slightly */}
                        <div className="pointer-events-none absolute inset-0 z-[5] bg-black/40 backdrop-blur-[10px]" />
                        {/* faint fake text texture so it feels “there”, but unreadable */}
                        <div className="pointer-events-none absolute inset-0 z-[6] opacity-30 mix-blend-screen">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(250,204,21,0.10),transparent_60%),radial-gradient(circle_at_80%_100%,rgba(250,204,21,0.08),transparent_55%)]" />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {/* SHOW MORE */}
              {visibleCount < fullFiltered.length && (
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
      </div>

      {/* ================= FLOATING CTA (FREE USERS ONLY) ================= */}
      {!isPremium && (
        <>
          <div className="fixed left-0 right-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+14px)]">
            <button
              type="button"
              onClick={() => setShowCtaModal(true)}
              onAnimationEnd={() => setCtaPulse(false)}
              className={cx(
                "w-full rounded-full border border-yellow-500/35",
                "bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-300",
                "text-black font-semibold py-3.5 shadow-[0_0_22px_rgba(250,204,21,0.35)]",
                "active:scale-[0.99] transition",
                ctaPulse && "will-change-transform"
              )}
              style={
                ctaPulse
                  ? {
                      animation: "neekoPulseOnce 1.25s ease-out 1",
                    }
                  : undefined
              }
            >
              {ctaCopy.title}
            </button>
          </div>

          {/* CTA MODAL (AI-insights style) */}
          {showCtaModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
              <div className="relative w-full max-w-md rounded-3xl border border-yellow-500/40 bg-gradient-to-b from-neutral-950 via-black to-black px-6 py-6 shadow-[0_0_80px_rgba(0,0,0,1)]">
                <button
                  onClick={() => setShowCtaModal(false)}
                  className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700/70 bg-black/70 text-neutral-300 transition hover:border-neutral-500 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-gradient-to-r from-yellow-500/25 via-yellow-500/5 to-transparent px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.9)]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-100">
                    Neeko+ Upgrade
                  </span>
                </div>

                <h3 className="mt-3 text-xl font-semibold text-neutral-50">
                  {ctaCopy.title}
                </h3>

                <p className="mt-2 text-xs text-neutral-300">
                  {ctaCopy.body}
                </p>

                <ul className="mt-4 space-y-2 text-xs text-neutral-200">
                  <li className="flex gap-2">
                    <span className="mt-[5px] h-[4px] w-[4px] rounded-full bg-yellow-400" />
                    <span>Full player list unlocked (no blur).</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-[5px] h-[4px] w-[4px] rounded-full bg-yellow-400" />
                    <span>Search + filters for faster comparison.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-[5px] h-[4px] w-[4px] rounded-full bg-yellow-400" />
                    <span>Insights overlay with deeper breakdowns.</span>
                  </li>
                </ul>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a
                    href="/neeko-plus"
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border border-yellow-400/70 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 px-4 py-2.5 text-sm font-semibold text-black shadow-[0_0_30px_rgba(250,204,21,0.65)] transition hover:brightness-110"
                  >
                    Upgrade to Neeko+
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>

                  <button
                    onClick={() => setShowCtaModal(false)}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border border-neutral-700 bg-black/70 px-4 py-2.5 text-sm font-medium text-neutral-200 transition hover:border-neutral-500 hover:text-white"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}