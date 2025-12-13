import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { PlayerRow, StatLens } from "./MasterTable";
import InsightsContent from "./PlayerInsightsContent";

/* -------------------------------------------------------------------------- */
/*                         PLAYER INSIGHTS OVERLAY (PATCHED)                  */
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

  /* MOBILE DRAG-TO-CLOSE REFS */
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const startYRef = useRef(0);

  /* ---------------------------------------------------------------------- */
  /* SCROLL LOCK                                                            */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    setMounted(true);
    return () => {
      document.body.style.overflow = prevBody;
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /* MOBILE DRAG HANDLERS (HANDLE ONLY)                                      */
  /* ---------------------------------------------------------------------- */

  const handleStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const scrollable = scrollRef.current;
    if (!scrollable) return;

    // Only allow drag if content is scrolled to top
    if (scrollable.scrollTop > 0) return;

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
      className="fixed inset-0 z-[150]"
      onClick={(e) => {
        // close ONLY if backdrop clicked
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* ✅ PATCH: SOLID BACKDROP (no blur, no bleed-through) */}
      <div className="absolute inset-0 bg-black/90" />

      {/* ------------------------------------------------------------------ */}
      {/* DESKTOP PANEL                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="
          hidden md:block fixed right-0 top-0 h-full w-[480px] z-[200]
          bg-black
          border-l border-yellow-500/30
          shadow-[0_0_60px_rgba(250,204,21,0.5)]
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <div className="px-5 py-4 flex items-start justify-between border-b border-neutral-800/40">
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
              className="rounded-full bg-neutral-900 p-1.5 text-neutral-300 hover:bg-neutral-800"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 py-3 flex items-center gap-2 border-b border-neutral-800/40 bg-black text-[11px]">
            {(["Fantasy", "Disposals", "Goals"] as StatLens[]).map((lens) => (
              <button
                key={lens}
                onClick={() => onLensChange(lens)}
                className={`rounded-full px-3 py-1.5 ${
                  selectedStat === lens
                    ? "bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,0.9)]"
                    : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                {lens}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 pb-10">
            <InsightsContent player={player} selectedStat={selectedStat} />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MOBILE BOTTOM SHEET                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="fixed inset-0 z-[200] flex items-end justify-center md:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={sheetRef}
          className="
            w-full rounded-t-3xl border border-yellow-500/30
            bg-black
            px-4 pt-2 pb-3 shadow-[0_0_50px_rgba(250,204,21,0.7)]
            flex flex-col
          "
          style={{ height: "86vh", maxHeight: "86vh" }}
        >
          {/* Drag Handle */}
          <div
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            className="w-full pt-3 pb-4 flex items-center justify-center"
            style={{ touchAction: "none" }}
          >
            <div className="h-1.5 w-10 rounded-full bg-yellow-200/80" />
          </div>

          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200">
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
              className="rounded-full bg-neutral-900 p-1.5 text-neutral-300"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stat Pills */}
          <div className="mb-3 flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px]">
            {(["Fantasy", "Disposals", "Goals"] as StatLens[]).map((lens) => (
              <button
                key={lens}
                onClick={() => onLensChange(lens)}
                className={`rounded-full px-3 py-1.5 ${
                  selectedStat === lens
                    ? "bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,0.9)]"
                    : "bg-neutral-900 text-neutral-300"
                }`}
              >
                {lens}
              </button>
            ))}
          </div>

          {/* Scrollable Content */}
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
            style={{
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-y",
              paddingBottom: "max(6rem, env(safe-area-inset-bottom))",
            }}
          >
            <InsightsContent player={player} selectedStat={selectedStat} />
          </div>
        </div>
      </div>
    </div>
  );
}