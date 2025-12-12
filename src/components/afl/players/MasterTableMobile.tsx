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

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function roundLabels(count: number) {
  // Expect OR + R1..R23 (24). If your data length differs, this still adapts safely.
  const labels: string[] = [];
  for (let i = 0; i < count; i++) {
    if (i === 0) labels.push("OR");
    else labels.push(`R${i}`);
  }
  return labels;
}

function statNoun(lens: StatLens) {
  if (lens === "Fantasy") return "fantasy";
  if (lens === "Disposals") return "disposal";
  return "goal";
}

function statPlural(lens: StatLens) {
  if (lens === "Fantasy") return "fantasy";
  if (lens === "Disposals") return "disposals";
  return "goals";
}

function genFakeSeries(seed: number, len: number) {
  // deterministic-ish fake numbers (so it feels “real”, but still fake)
  const out: number[] = [];
  let x = (seed * 9301 + 49297) % 233280;
  for (let i = 0; i < len; i++) {
    x = (x * 9301 + 49297) % 233280;
    const r = x / 233280;
    // fantasy-like distribution (50–130). Works fine visually for disposals/goals too.
    out.push(Math.round(50 + r * 80));
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 12; // show more button increments
const FREE_BLUR_START_INDEX = 8; // blur rows from index 8 onwards for free users
const CTA_SHOW_AFTER_INDEX = 6; // show CTA once user has scrolled into list a bit

/* -------------------------------------------------------------------------- */
/* MOBILE MASTER TABLE                                                        */
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

  // Upgrade modal + CTA pop
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [ctaPulse, setCtaPulse] = useState(false);

  // Shared horizontal scroll refs (KEEP THIS — this is what makes sync feel “perfect”)
  const headerScrollRef = useRef<HTMLDivElement | null>(null);
  const bodyScrollRef = useRef<HTMLDivElement | null>(null);
  const isSyncingRef = useRef(false);

  // Marker for when to show sticky CTA (so it doesn’t bounce / reflow)
  const ctaMarkerRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    if (!isPremium) return players;
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => p.name.toLowerCase().includes(q));
  }, [players, isPremium, query]);

  const visiblePlayers = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  // Determine rounds count (use first row as canonical; fall back to 24)
  const roundsCount = useMemo(() => {
    const base = filtered[0] ? getRounds(filtered[0], selectedStat) : [];
    return base?.length ? base.length : 24;
  }, [filtered, selectedStat]);

  const labels = useMemo(() => roundLabels(roundsCount), [roundsCount]);

  /* ---------------------------------------------------------------------- */
  /* SCROLL SYNC (DON'T CHANGE THE FEEL)                                    */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const headerEl = headerScrollRef.current;
    const bodyEl = bodyScrollRef.current;
    if (!headerEl || !bodyEl) return;

    const onHeader = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      bodyEl.scrollLeft = headerEl.scrollLeft;
      requestAnimationFrame(() => (isSyncingRef.current = false));
    };

    const onBody = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      headerEl.scrollLeft = bodyEl.scrollLeft;
      requestAnimationFrame(() => (isSyncingRef.current = false));
    };

    headerEl.addEventListener("scroll", onHeader, { passive: true });
    bodyEl.addEventListener("scroll", onBody, { passive: true });

    return () => {
      headerEl.removeEventListener("scroll", onHeader);
      bodyEl.removeEventListener("scroll", onBody);
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /* CTA SHOW/HIDE WITHOUT BOUNCE                                           */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    // Only relevant for free users
    if (isPremium) {
      setShowStickyCta(false);
      return;
    }

    const marker = ctaMarkerRef.current;
    if (!marker) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        // When marker is NOT visible, we’ve scrolled past it → show CTA
        const shouldShow = !e.isIntersecting;
        setShowStickyCta(shouldShow);

        // pulse once on first show
        if (shouldShow) {
          setCtaPulse(true);
          const t = window.setTimeout(() => setCtaPulse(false), 950);
          return () => window.clearTimeout(t);
        }
      },
      { threshold: 0.1 }
    );

    obs.observe(marker);
    return () => obs.disconnect();
  }, [isPremium]);

  const ctaText = useMemo(() => {
    // "Unlock full fantasy trends" / "Unlock full goals trends"
    return `Unlock full ${statPlural(selectedStat)} trends`;
  }, [selectedStat]);

  const openUpgrade = () => setShowUpgradeModal(true);

  /* ---------------------------------------------------------------------- */
  /* RENDER                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="mt-6">
      {/* ================= HEADER CARD ================= */}
      <div className="rounded-3xl border border-neutral-800 bg-black/90 px-4 py-4 shadow-xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
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
                placeholder={`Search players…`}
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

      {/* ================= TABLE WRAP ================= */}
      <div className="mt-4 rounded-3xl border border-neutral-800 bg-black/90 shadow-xl overflow-hidden">
        {/* Column headers row */}
        <div className="border-b border-neutral-800/80 bg-black/70">
          <div className="grid grid-cols-[140px_1fr_92px] items-center">
            {/* Left header */}
            <div className="px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                Player
              </div>
            </div>

            {/* Middle header (shared scroller) */}
            <div
              ref={headerScrollRef}
              className="overflow-x-auto scrollbar-none"
            >
              <div
                className="grid gap-0"
                style={{
                  gridTemplateColumns: `repeat(${roundsCount}, minmax(44px, 44px))`,
                }}
              >
                {labels.map((lab) => (
                  <div
                    key={lab}
                    className="py-3 text-center text-[10px] uppercase tracking-[0.16em] text-neutral-500"
                  >
                    {lab}
                  </div>
                ))}
              </div>
            </div>

            {/* Right header */}
            <div className="px-4 py-3 text-right">
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                Insights
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="divide-y divide-neutral-800/70">
          {/* marker used to show sticky CTA after user scrolls down a bit */}
          <div ref={ctaMarkerRef} />

          <div className="grid grid-cols-[140px_1fr_92px]">
            {/* Left column (players) */}
            <div>
              {visiblePlayers.map((p, idx) => {
                const blurred = !isPremium && idx >= FREE_BLUR_START_INDEX;

                return (
                  <div
                    key={p.id}
                    className={cx(
                      "px-4 py-4",
                      blurred ? "opacity-100" : "opacity-100"
                    )}
                  >
                    <div className="text-[14px] font-semibold text-neutral-50 leading-tight">
                      {p.name}
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                      {p.team} • {p.role}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Middle column (shared scroller for ALL rows) */}
            <div
              ref={bodyScrollRef}
              className="overflow-x-auto scrollbar-none"
            >
              <div className="relative">
                {visiblePlayers.map((p, idx) => {
                  const series = getRounds(p, selectedStat);
                  const blurred = !isPremium && idx >= FREE_BLUR_START_INDEX;

                  const real = series.slice(0, roundsCount);
                  const fake = blurred
                    ? genFakeSeries(Number(p.id) || idx + 1, roundsCount)
                    : [];

                  return (
                    <div
                      key={`${p.id}-row`}
                      className="relative"
                      style={{ height: 64 }} // keep rows aligned across all 3 columns
                    >
                      {/* real numbers row */}
                      <div
                        className={cx(
                          "grid items-center h-full",
                          blurred && "opacity-0" // hide real values for free/blurred rows
                        )}
                        style={{
                          gridTemplateColumns: `repeat(${roundsCount}, minmax(44px, 44px))`,
                        }}
                      >
                        {real.map((v, i) => (
                          <div
                            key={`${p.id}-v-${i}`}
                            className="text-center text-[14px] text-neutral-200"
                          >
                            {v}
                          </div>
                        ))}
                      </div>

                      {/* blurred overlay for free users */}
                      {blurred && (
                        <div className="absolute inset-0">
                          {/* faint fake numbers behind blur */}
                          <div
                            className="grid items-center h-full opacity-[0.55]"
                            style={{
                              gridTemplateColumns: `repeat(${roundsCount}, minmax(44px, 44px))`,
                            }}
                          >
                            {fake.map((v, i) => (
                              <div
                                key={`${p.id}-fake-${i}`}
                                className="text-center text-[14px] text-yellow-200/60"
                              >
                                {v}
                              </div>
                            ))}
                          </div>

                          {/* blur plane */}
                          <div className="absolute inset-0 bg-black/35 backdrop-blur-[10px]" />

                          {/* subtle gold haze so it looks premium-locked */}
                          <div className="pointer-events-none absolute inset-0 opacity-70 mix-blend-screen">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(250,204,21,0.20),transparent_55%),radial-gradient(circle_at_85%_100%,rgba(250,204,21,0.14),transparent_60%)]" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right column (Insights button) */}
            <div>
              {visiblePlayers.map((p, idx) => {
                const blurred = !isPremium && idx >= FREE_BLUR_START_INDEX;

                return (
                  <div
                    key={`${p.id}-insights`}
                    className="px-4 py-4 flex items-center justify-end"
                    style={{ height: 64 }}
                  >
                    <button
                      onClick={() => {
                        if (blurred) {
                          openUpgrade();
                          return;
                        }
                        onSelectPlayer(p);
                      }}
                      className={cx(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] transition",
                        blurred
                          ? "text-neutral-500"
                          : "text-yellow-200 hover:text-yellow-100"
                      )}
                    >
                      <span>Insights</span>
                      <ChevronRight
                        className={cx(
                          "h-4 w-4",
                          blurred ? "text-neutral-600" : "text-yellow-300"
                        )}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

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

      {/* ================= STICKY UPGRADE CTA (ON SCREEN) ================= */}
      {!isPremium && showStickyCta && (
        <div className="fixed left-0 right-0 bottom-0 z-50 px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={openUpgrade}
            className={cx(
              "w-full rounded-[999px] border border-yellow-400/40",
              "bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300",
              "px-5 py-4 text-[15px] font-semibold text-black",
              "shadow-[0_0_35px_rgba(250,204,21,0.65)]",
              "transition active:scale-[0.99]",
              ctaPulse && "animate-[ctaPulse_0.9s_ease-out_1]"
            )}
          >
            {ctaText}
          </button>
        </div>
      )}

      {/* ================= UPGRADE MODAL (LIKE AI INSIGHTS) ================= */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="relative w-full max-w-md rounded-3xl border border-yellow-500/40 bg-gradient-to-b from-neutral-950 via-black to-black px-6 py-6 shadow-[0_0_80px_rgba(0,0,0,1)]">
            <button
              onClick={() => setShowUpgradeModal(false)}
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
              Unlock full {statNoun(selectedStat)} analysis
            </h3>

            <p className="mt-2 text-xs text-neutral-300">
              Neeko+ unlocks the full season table, player insights overlays,
              advanced hit-rates, trend windows and premium forecasting across the
              league.
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

            <div className="mt-6 flex flex-col gap-3">
              <a
                href="/neeko-plus"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-yellow-400/70 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 px-4 py-3 text-sm font-semibold text-black shadow-[0_0_30px_rgba(250,204,21,0.85)] transition hover:brightness-110"
              >
                Upgrade to Neeko+
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>

              <button
                onClick={() => setShowUpgradeModal(false)}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-neutral-700 bg-black/70 px-4 py-3 text-sm font-medium text-neutral-200 transition hover:border-neutral-500 hover:text-white"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyframes for CTA pulse (one-time) */}
      <style>{`
        @keyframes ctaPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 rgba(250,204,21,0); }
          35% { transform: scale(1.02); box-shadow: 0 0 55px rgba(250,204,21,0.85); }
          100% { transform: scale(1); box-shadow: 0 0 35px rgba(250,204,21,0.65); }
        }
        /* hide scrollbar but keep scroll */
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}