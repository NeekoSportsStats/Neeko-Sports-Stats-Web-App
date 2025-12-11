import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { PlayerRow, StatLens } from "./MasterTable";
import InsightsContent from "./PlayerInsightsContent";

/* -------------------------------------------------------------------------- */
/*                          PLAYER INSIGHTS OVERLAY                            */
/* -------------------------------------------------------------------------- */

type PlayerInsightsOverlayProps = {
  player: PlayerRow;
  selectedStat: StatLens;
  onClose: () => void;
  onLensChange: (lens: StatLens) => void;
};

const PlayerInsightsOverlay: React.FC<PlayerInsightsOverlayProps> = ({
  player,
  selectedStat,
  onClose,
  onLensChange,
}) => {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const draggingRef = useRef(false);
  const startYRef = useRef(0);

  /* ---------------------------- LOCK BODY SCROLL --------------------------- */
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  /* ---------------------------- TOUCH HANDLERS (MOBILE) -------------------- */

  const handleStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const scrollable = scrollRef.current;
    if (!scrollable) return;

    // Strict iOS-style: only allow drag when at top of scroll
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

    // Threshold to close
    if (dy > 120) {
      onClose();
      return;
    }

    // Snap back
    sheetRef.current.style.transition = "transform 0.25s ease-out";
    sheetRef.current.style.transform = "translateY(0)";
    window.setTimeout(() => {
      if (sheetRef.current) sheetRef.current.style.transition = "";
    }, 250);
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      {/* DESKTOP RIGHT SIDEBAR ------------------------------------------------ */}
      <div
        className="hidden h-full w-full items-stretch justify-end md:flex"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full w-[480px] max-w-full border-l border-yellow-500/30 bg-gradient-to-b from-neutral-950 via-black to-black px-5 py-4 shadow-[0_0_60px_rgba(250,204,21,0.7)] animate-[slideInRight_0.22s_ease-out]">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200/80">
                Player insights
              </div>
              <div className="mt-1 text-sm font-semibold text-neutral-50">
                {player.name}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                {player.team} • {player.role}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-neutral-900/90 p-1.5 text-neutral-300 hover:bg-neutral-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stat lens pills */}
          <div className="mb-4 flex items-center gap-2 rounded-full border border-neutral-700/80 bg-black/80 px-2 py-1 text-[11px] text-neutral-200">
            {(["Fantasy", "Disposals", "Goals"] as StatLens[]).map((lens) => (
              <button
                key={lens}
                type="button"
                onClick={() => onLensChange(lens)}
                className={`rounded-full px-3 py-1.5 ${
                  selectedStat === lens
                    ? "bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,0.9)]"
                    : "bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                {lens}
              </button>
            ))}
          </div>

          {/* Scrollable content */}
          <div className="h-[calc(100%-120px)] overflow-y-auto pr-1">
            <InsightsContent player={player} selectedStat={selectedStat} />
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET -------------------------------------------------- */}
      <div
        className="flex h-full w-full items-end justify-center md:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={sheetRef}
          className="w-full rounded-t-3xl border border-yellow-500/25 bg-gradient-to-b from-neutral-950 to-black px-4 pb-3 pt-2 shadow-[0_0_50px_rgba(250,204,21,0.6)] overscroll-contain"
          style={{ height: "80vh", maxHeight: "80vh" }}
        >
          {/* Drag area (full width, easier to grab) */}
          <div
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            className="w-full pt-2 pb-3 flex items-center justify-center active:opacity-80"
            style={{ touchAction: "none" }}
          >
            <div className="h-1.5 w-10 rounded-full bg-yellow-200/80" />
          </div>

          {/* Header */}
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200/80">
                Player insights
              </div>
              <div className="mt-1 text-sm font-semibold text-neutral-50">
                {player.name}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                {player.team} • {player.role}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-neutral-900/90 p-1.5 text-neutral-300 hover:bg-neutral-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Lens pills */}
          <div className="mb-3 flex items-center gap-2 rounded-full border border-neutral-700/80 bg-black/80 px-2 py-1 text-[11px] text-neutral-200">
            {(["Fantasy", "Disposals", "Goals"] as StatLens[]).map((lens) => (
              <button
                key={lens}
                type="button"
                onClick={() => onLensChange(lens)}
                className={`rounded-full px-3 py-1.5 ${
                  selectedStat === lens
                    ? "bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,0.9)]"
                    : "bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                {lens}
              </button>
            ))}
          </div>

          {/* Scrollable content */}
          <div
            ref={scrollRef}
            className="h-[calc(80vh-140px)] overflow-y-auto pb-3 overscroll-contain"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <InsightsContent player={player} selectedStat={selectedStat} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerInsightsOverlay;