import React, { useEffect, useState } from "react";
import { Search, Lock, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerRow, StatLens } from "./MasterTable";

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

/* -------------------------------------------------------------------------- */
/* MOBILE MASTER TABLE                                                        */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 10;

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

  /* ---------------- FLOATING CTA STATE ---------------- */

  const [showCTA, setShowCTA] = useState(false);
  const [pulseCTA, setPulseCTA] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 350) setShowCTA(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!showCTA) return;
    const t = setTimeout(() => setPulseCTA(false), 1600);
    return () => clearTimeout(t);
  }, [showCTA]);

  /* ---------------- FILTERING ---------------- */

  const filtered = isPremium
    ? players.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      )
    : players;

  const visiblePlayers = filtered.slice(0, visibleCount);

  /* ---------------- CTA COPY ---------------- */

  const ctaCopy: Record<StatLens, { title: string; body: string }> = {
    Fantasy: {
      title: "Unlock full fantasy intelligence",
      body:
        "Round-by-round scores, hit rates, volatility and AI projections.",
    },
    Disposals: {
      title: "Unlock disposal trends",
      body:
        "Usage consistency, role stability and possession ceilings.",
    },
    Goals: {
      title: "Unlock goal scoring insights",
      body:
        "Forward roles, scoring volatility and matchup signals.",
    },
  };

  /* ---------------------------------------------------------------------- */
  /* RENDER                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="relative mt-6">
      {/* ================= HEADER ================= */}
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
                "rounded-full px-3 py-1.5",
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
        {visiblePlayers.map((p, idx) => {
          const rounds = getRounds(p, selectedStat);
          const blurred = !isPremium && idx >= 8;

          return (
            <button
              key={p.id}
              onClick={() => !blurred && onSelectPlayer(p)}
              className={cx(
                "w-full text-left px-4 py-4 border-b border-neutral-800",
                blurred
                  ? "relative overflow-hidden"
                  : "active:bg-neutral-900/40"
              )}
            >
              {/* Fake data blur */}
              {blurred && (
                <div className="absolute inset-0 backdrop-blur-xl bg-black/70" />
              )}

              <div className={cx(blurred && "blur-sm brightness-[0.7]")}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-semibold text-neutral-50">
                      {p.name}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                      {p.team} • {p.role}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-yellow-300" />
                </div>

                {/* Rounds carousel */}
                <div className="mt-3 overflow-x-auto">
                  <div className="flex gap-4 min-w-max">
                    {rounds.map((v, i) => (
                      <div
                        key={i}
                        className="w-10 text-center text-[13px] text-neutral-200"
                      >
                        {v}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}

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

      {/* ================= FLOATING CTA ================= */}
      {!isPremium && showCTA && (
        <div className="fixed bottom-4 right-4 z-50 max-w-[260px]">
          <div
            className={cx(
              "relative rounded-3xl border bg-gradient-to-br from-yellow-500/25 via-black to-black px-4 py-4 backdrop-blur-xl",
              pulseCTA
                ? "border-yellow-400/70 shadow-[0_0_45px_rgba(250,204,21,0.95)] animate-pulse"
                : "border-yellow-400/40 shadow-[0_0_30px_rgba(250,204,21,0.6)]"
            )}
          >
            <button
              onClick={() => setShowCTA(false)}
              className="absolute right-3 top-3 text-neutral-400 hover:text-white"
            >
              <X size={14} />
            </button>

            <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-300">
              Neeko+
            </div>

            <div className="mt-1 text-sm font-semibold text-neutral-50">
              {ctaCopy[selectedStat].title}
            </div>

            <p className="mt-1 text-xs text-neutral-300 leading-relaxed">
              {ctaCopy[selectedStat].body}
            </p>

            <a
              href="/neeko-plus"
              className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-yellow-400 px-4 py-2 text-sm font-semibold text-black shadow-[0_0_25px_rgba(250,204,21,0.85)] hover:bg-yellow-300 transition"
            >
              Get Neeko+
            </a>
          </div>
        </div>
      )}
    </div>
  );
}