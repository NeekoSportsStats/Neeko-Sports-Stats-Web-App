import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { PlayerRow, StatLens } from "./MasterTable";
import InsightsContent from "./PlayerInsightsContent";

/* -------------------------------------------------------------------------- */
/*                         PLAYER INSIGHTS OVERLAY (STABLE)                   */
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
  const draggingRef = useRef(false);
  const startYRef = useRef(0);

  /* ---------------------------------------------------------------------- */
  /* SCROLL LOCK                                                            */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setMounted(true);

    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /* DRAG TO CLOSE                                                          */
  /* ---------------------------------------------------------------------- */

  const handleStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!scrollRef.current || scrollRef.current.scrollTop > 0) return;
    draggingRef.current = true;
    startYRef.current = e.touches[0].clientY;
  };

  const handleMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !sheetRef.current) return;
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy > 0) {
      sheetRef.current.style.transform = `translateY(${dy}px)`;
      e.preventDefault();
    }
  };

  const handleEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !sheetRef.current) return;
    draggingRef.current = false;
    const dy = e.changedTouches[0].clientY - startYRef.current;

    if (dy > 120) {
      onClose();
      return;
    }

    sheetRef.current.style.transition = "transform 0.25s ease-out";
    sheetRef.current.style.transform = "translateY(0)";
    setTimeout(() => {
      if (sheetRef.current) sheetRef.current.style.transition = "";
    }, 250);
  };

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* ------------------------------ DESKTOP ----------------------------- */}
      <div
        className="
          hidden md:block fixed right-0 top-0 h-full w-[480px] z-[200]
          bg-gradient-to-b from-neutral-950 via-black to-black
          border-l border-yellow-500/30
          shadow-[0_0_60px_rgba(250,204,21,0.5)]
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <div className="px-5 py-4 flex justify-between border-b border-neutral-800/40">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200/80">
                Player Insights
              </div>
              <div className="mt-1 text-sm font-semibold text-neutral-50">
                {player.name}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                {player.team} • {player.role}
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full bg-neutral-900/90 p-1.5 text-neutral-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 pb-10">
            <InsightsContent player={player} selectedStat={selectedStat} />
          </div>
        </div>
      </div>

      {/* ------------------------------- MOBILE ------------------------------ */}
      <div
        className="flex h-full w-full items-end justify-center md:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={sheetRef}
          className="
            w-full rounded-t-3xl border border-yellow-500/30
            bg-gradient-to-b from-neutral-950/98 to-black
            px-4 pt-2 pb-3 shadow-[0_0_50px_rgba(250,204,21,0.7)]
            flex flex-col
          "
          style={{ height: "80vh" }}
        >
          <div
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            className="w-full pt-3 pb-4 flex justify-center"
          >
            <div className="h-1.5 w-10 rounded-full bg-yellow-200/80" />
          </div>

          <div className="mb-4 flex justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200">
                Player Insights
              </div>
              <div className="mt-1 text-sm font-semibold text-neutral-50">
                {player.name}
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full bg-neutral-900/90 p-1.5 text-neutral-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto"
            style={{ WebkitOverflowScrolling: "touch", paddingBottom: "5rem" }}
          >
            <InsightsContent player={player} selectedStat={selectedStat} />
          </div>
        </div>
      </div>
    </div>
  );
}