import React, { useRef, useState, useEffect } from "react";
import { Search, Lock, ChevronRight } from "lucide-react";
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

const ROUND_LABELS = [
  "OR","R1","R2","R3","R4","R5","R6","R7","R8","R9","R10","R11",
  "R12","R13","R14","R15","R16","R17","R18","R19","R20","R21","R22","R23"
];

/* -------------------------------------------------------------------------- */
/* MOBILE MASTER TABLE                                                        */
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showCTA, setShowCTA] = useState(false);

  /* ---------------------------------------------------------------------- */
  /* CTA VISIBILITY (ONCE BLUR IS SEEN)                                      */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!isPremium) {
      setTimeout(() => setShowCTA(true), 600);
    }
  }, [isPremium]);

  const ctaText =
    selectedStat === "Goals"
      ? "Unlock full goal trends"
      : selectedStat === "Disposals"
      ? "Unlock full disposal trends"
      : "Unlock full fantasy trends";

  /* ---------------------------------------------------------------------- */
  /* FILTERED PLAYERS                                                        */
  /* ---------------------------------------------------------------------- */

  const filtered = isPremium
    ? players.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      )
    : players;

  /* ---------------------------------------------------------------------- */
  /* SHARED SCROLL HANDLER                                                   */
  /* ---------------------------------------------------------------------- */

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
  };

  /* ---------------------------------------------------------------------- */
  /* RENDER                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="mt-6 relative">

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

        {/* Lens */}
        <div className="mt-4 flex gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1 text-[11px]">
          {(["Fantasy","Disposals","Goals"] as StatLens[]).map((s) => (
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

      {/* ================= ROUND HEADER ================= */}
      <div className="sticky top-0 z-20 bg-black/95 border-b border-neutral-800">
        <div
          ref={scrollRef}
          className="flex gap-4 px-4 py-2 overflow-x-auto no-scrollbar"
        >
          {ROUND_LABELS.map((r) => (
            <div
              key={r}
              className="min-w-[44px] text-center text-[10px] uppercase tracking-[0.14em] text-neutral-400"
            >
              {r}
            </div>
          ))}
        </div>
      </div>

      {/* ================= PLAYER ROWS ================= */}
      <div className="divide-y divide-neutral-800">
        {filtered.map((p, idx) => {
          const rounds = getRounds(p, selectedStat);
          const blurred = !isPremium && idx >= 8;

          return (
            <div
              key={p.id}
              className={cx(
                "relative px-4 py-4",
                blurred && "pointer-events-none"
              )}
            >
              {/* Player header */}
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="text-[14px] font-semibold text-neutral-50">
                    {p.name}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    {p.team} • {p.role}
                  </div>
                </div>

                <button
                  onClick={() => onSelectPlayer(p)}
                  disabled={blurred}
                  className="text-[11px] text-yellow-300 flex items-center gap-1"
                >
                  Insights <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {/* Rounds carousel */}
              <div
                onScroll={onScroll}
                className="flex gap-4 overflow-x-auto no-scrollbar"
              >
                {rounds.map((v, i) => (
                  <div
                    key={i}
                    className="min-w-[44px] text-center text-[12px] text-neutral-200 tabular-nums"
                  >
                    {blurred ? Math.floor(Math.random() * 100) : v}
                  </div>
                ))}
              </div>

              {/* Blur overlay */}
              {blurred && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[6px]" />
              )}
            </div>
          );
        })}
      </div>

      {/* ================= FLOATING CTA ================= */}
      {!isPremium && showCTA && (
        <div className="fixed bottom-6 left-4 right-4 z-50 animate-[pulse_1.4s_ease-out_1]">
          <Button
            asChild
            className="w-full rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-300 text-black shadow-[0_0_30px_rgba(250,204,21,0.8)]"
          >
            <a href="/neeko-plus">{ctaText}</a>
          </Button>
        </div>
      )}
    </div>
  );
}