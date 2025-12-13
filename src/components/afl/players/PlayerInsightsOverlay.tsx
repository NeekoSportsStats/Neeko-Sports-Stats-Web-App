import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { PlayerRow, StatLens } from "./MasterTable";
import InsightsContent from "./PlayerInsightsContent";

/* -------------------------------------------------------------------------- */
/*                         PLAYER INSIGHTS OVERLAY (FINAL FIX)                */
/* -------------------------------------------------------------------------- */

export default function PlayerInsightsOverlay({
  player,
  selectedStat,
  onClose,
  onLensChange,
}: {
  player: PlayerRow;
  selectedStat: StatLens;
  onClose: () => void;
  onLensChange: (lens: StatLens) => void;
}) {
  const [mounted, setMounted] = useState(false);

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  /* ---------------------------------------------------------------------- */
  /* LOCK BACKGROUND SCROLL                                                  */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setMounted(true);

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (!mounted) return null;

  return (
    /* ------------------------------------------------------------------ */
    /* BACKDROP — pointer-events disabled so it NEVER steals scroll        */
    /* ------------------------------------------------------------------ */
    <div
      className="
        fixed inset-0 z-[999]
        isolate
        bg-black/80
        backdrop-blur-md
        pointer-events-none
      "
    >
      {/* ============================== */}
      {/* DESKTOP RIGHT PANEL            */}
      {/* ============================== */}
      <div
        className="
          hidden md:block
          fixed right-0 top-0 h-full w-[480px]
          bg-black
          border-l border-yellow-500/30
          shadow-[0_0_80px_rgba(250,204,21,0.45)]
          z-[1000]
          pointer-events-auto
        "
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="px-5 py-4 flex justify-between border-b border-neutral-800">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200/80">
                Player Insights
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                {player.name}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                {player.team} • {player.role}
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full bg-neutral-900 p-1.5 text-neutral-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Lens Pills */}
          <div className="px-5 py-3 flex gap-2 border-b border-neutral-800">
            {(["Fantasy", "Disposals", "Goals"] as StatLens[]).map((lens) => (
              <button
                key={lens}
                onClick={() => onLensChange(lens)}
                className={
                  selectedStat === lens
                    ? "rounded-full px-3 py-1.5 bg-yellow-400 text-black shadow-lg"
                    : "rounded-full px-3 py-1.5 bg-neutral-900 text-neutral-300"
                }
              >
                {lens}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 pb-12">
            <InsightsContent player={player} selectedStat={selectedStat} />
          </div>
        </div>
      </div>

      {/* ============================== */}
      {/* MOBILE BOTTOM SHEET            */}
      {/* ============================== */}
      <div
        className="
          md:hidden fixed inset-0
          flex items-end justify-center
          z-[1000]
          pointer-events-auto
        "
        onClick={onClose} // tap outside sheet closes
      >
        <div
          ref={sheetRef}
          onClick={(e) => e.stopPropagation()}
          className="
            w-full h-[85vh]
            rounded-t-3xl
            bg-black
            border-t border-yellow-500/30
            shadow-[0_0_80px_rgba(250,204,21,0.45)]
            flex flex-col
            pointer-events-auto
          "
        >
          {/* Handle */}
          <div className="py-4 flex justify-center">
            <div className="h-1.5 w-10 rounded-full bg-yellow-200/80" />
          </div>

          {/* Header */}
          <div className="px-4 pb-3 flex justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200">
                Player Insights
              </div>
              <div className="text-sm font-semibold text-white">
                {player.name}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                {player.team} • {player.role}
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full bg-neutral-900 p-1.5 text-neutral-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Pills */}
          <div className="px-4 pb-3 flex gap-2">
            {(["Fantasy", "Disposals", "Goals"] as StatLens[]).map((lens) => (
              <button
                key={lens}
                onClick={() => onLensChange(lens)}
                className={
                  selectedStat === lens
                    ? "rounded-full px-3 py-1.5 bg-yellow-400 text-black"
                    : "rounded-full px-3 py-1.5 bg-neutral-900 text-neutral-300"
                }
              >
                {lens}
              </button>
            ))}
          </div>

          {/* ✅ TRUE SCROLL CONTAINER */}
          <div
            ref={scrollRef}
            className="
              flex-1
              min-h-0
              overflow-y-auto
              px-4
              pb-[max(5rem,env(safe-area-inset-bottom))]
            "
          >
            <InsightsContent player={player} selectedStat={selectedStat} />
          </div>
        </div>
      </div>
    </div>
  );
}