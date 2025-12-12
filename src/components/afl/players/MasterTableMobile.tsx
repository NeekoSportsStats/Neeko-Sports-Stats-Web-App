import React, { useEffect, useRef, useState } from "react";
import { Lock, ChevronRight } from "lucide-react";
import { PlayerRow, StatLens } from "./MasterTable";

/* -------------------------------------------------------------------------- */
/* CONFIG                                                                     */
/* -------------------------------------------------------------------------- */

const ROUNDS_VISIBLE = 6;
const CELL_WIDTH = 48;

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function getRounds(player: PlayerRow, lens: StatLens) {
  if (lens === "Disposals") return player.roundsDisposals;
  if (lens === "Goals") return player.roundsGoals;
  return player.roundsFantasy;
}

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

export default function MasterTableMobile({
  players,
  selectedStat,
  setSelectedStat,
  isPremium,
  onSelectPlayer,
}: {
  players: PlayerRow[];
  selectedStat: StatLens;
  setSelectedStat: (s: StatLens) => void;
  isPremium: boolean;
  onSelectPlayer: (p: PlayerRow) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [pulseCTA, setPulseCTA] = useState(true);

  /* ---------------------------------------------------------------------- */
  /* SYNC HEADER SCROLL                                                      */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const sync = () => {
      if (headerRef.current) {
        headerRef.current.scrollLeft = el.scrollLeft;
      }
    };

    el.addEventListener("scroll", sync);
    return () => el.removeEventListener("scroll", sync);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setPulseCTA(false), 1600);
    return () => clearTimeout(t);
  }, []);

  /* ---------------------------------------------------------------------- */
  /* CTA TEXT                                                                */
  /* ---------------------------------------------------------------------- */

  const ctaText =
    selectedStat === "Goals"
      ? "Unlock full goal scoring trends"
      : selectedStat === "Disposals"
      ? "Unlock full disposal trends"
      : "Unlock full fantasy trends";

  /* ---------------------------------------------------------------------- */
  /* RENDER                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="relative mt-6">

      {/* ================= HEADER ================= */}
      <div className="rounded-3xl border border-neutral-800 bg-black/90 px-4 py-4">
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

        {/* Filters */}
        <div className="mt-4 flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1 text-[11px]">
          {(["Fantasy", "Disposals", "Goals"] as StatLens[]).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStat(s)}
              className={
                selectedStat === s
                  ? "rounded-full bg-yellow-400 px-3 py-1.5 text-black shadow-[0_0_14px_rgba(250,204,21,0.6)]"
                  : "rounded-full bg-neutral-900 px-3 py-1.5 text-neutral-300"
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ================= ROUND HEADER ================= */}
      <div className="mt-4 rounded-t-3xl border border-neutral-800 bg-black/90 px-4 pt-3">
        <div className="flex text-[10px] uppercase tracking-wider text-neutral-500">
          <div className="w-[120px]">Player</div>

          <div
            ref={headerRef}
            className="flex-1 overflow-hidden"
          >
            <div
              className="flex"
              style={{ width: CELL_WIDTH * 23 }}
            >
              {Array.from({ length: 23 }).map((_, i) => (
                <div
                  key={i}
                  className="text-center"
                  style={{ width: CELL_WIDTH }}
                >
                  {i === 0 ? "OR" : `R${i}`}
                </div>
              ))}
            </div>
          </div>

          <div className="w-[64px] text-right">Insights</div>
        </div>
      </div>

      {/* ================= TABLE BODY ================= */}
      <div className="rounded-b-3xl border border-neutral-800 bg-black/90 overflow-hidden">
        <div
          ref={scrollRef}
          className="overflow-x-auto overscroll-x-contain"
        >
          <div style={{ minWidth: 120 + CELL_WIDTH * 23 + 64 }}>
            {players.map((p, idx) => {
              const rounds = getRounds(p, selectedStat);
              const locked = !isPremium && idx >= 8;

              return (
                <div
                  key={p.id}
                  className="relative flex items-center border-t border-neutral-800 px-4 py-3"
                >
                  {/* Player */}
                  <div className="w-[120px]">
                    <div className="text-sm font-semibold text-neutral-50">
                      {p.name}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                      {p.team} • {p.role}
                    </div>
                  </div>

                  {/* Rounds */}
                  <div className="flex-1 flex">
                    {rounds.map((v, i) => (
                      <div
                        key={i}
                        className="text-center text-sm text-neutral-200"
                        style={{ width: CELL_WIDTH }}
                      >
                        {v}
                      </div>
                    ))}
                  </div>

                  {/* Insights */}
                  <button
                    onClick={() => !locked && onSelectPlayer(p)}
                    className="w-[64px] text-right text-yellow-300 text-sm"
                  >
                    Insights <ChevronRight className="inline h-4 w-4" />
                  </button>

                  {/* LOCK OVERLAY */}
                  {locked && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl flex items-center justify-center">
                      <Lock className="h-5 w-5 text-yellow-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= FLOATING CTA ================= */}
      {!isPremium && (
        <div className="fixed bottom-20 left-4 right-4 z-50">
          <a
            href="/neeko-plus"
            className={`
              flex items-center justify-center rounded-full
              bg-yellow-400 text-black font-semibold py-3
              shadow-[0_0_28px_rgba(250,204,21,0.8)]
              ${pulseCTA ? "animate-pulse" : ""}
            `}
          >
            {ctaText}
          </a>
        </div>
      )}
    </div>
  );
}