import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { PlayerRow, StatLens } from "./MasterTable";
import InsightsContent from "./PlayerInsightsContent";

/* -------------------------------------------------------------------------- */
/*                        STRICT iOS-SHEET BEHAVIOUR                          */
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
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const draggingRef = useRef(false);
  const startYRef = useRef(0);

  /* ---------------------------- LOCK BODY SCROLL --------------------------- */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* ---------------------------- DRAG HANDLERS ------------------------------ */

  const handleStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const scrollBox = scrollRef.current;
    if (!scrollBox) return;

    // strict: can only drag down if at top
    if (scrollBox.scrollTop > 0) return;

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

    // Close threshold
    if (dy > 120) {
      onClose();
      return;
    }

    // Snap back
    sheetRef.current.style.transition = "transform 0.25s ease-out";
    sheetRef.current.style.transform = "translateY(0)";
    setTimeout(() => {
      if (sheetRef.current) sheetRef.current.style.transition = "";
    }, 250);
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      {/* MOBILE SHEET */}
      <div
        className="flex h-full w-full items-end justify-center md:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={sheetRef}
          className="w-full rounded-t-3xl border border-yellow-500/30 bg-gradient-to-b from-neutral-950 to-black px-4 pt-2 pb-3 shadow-[0_0_50px_rgba(250,204,21,0.7)] overscroll-contain"
          style={{ height: "80vh", maxHeight: "80vh" }}
        >
          {/* DRAG HANDLE — FIXED HITBOX */}
          <div
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            className="mx-auto mt-1 mb-3 flex h-6 w-full max-w-[120px] items-center justify-center"
            style={{ touchAction: "none" }}
          >
            <div className="h-1.5 w-10 rounded-full bg-yellow-200/80" />
          </div>

          {/* HEADER */}
          <div className="mb-4 flex items-start justify-between">
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
              onClick={onClose}
              className="rounded-full bg-neutral-900/90 p-1.5 text-neutral-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* LENS PILLS */}
          <div className="mb-3 flex items-center gap-2 rounded-full border border-neutral-700/80 bg-black/80 px-2 py-1 text-[11px]">
            {(["Fantasy", "Disposals", "Goals"] as StatLens[]).map((lens) => (
              <button
                key={lens}
                onClick={() => onLensChange(lens)}
                className={`rounded-full px-3 py-1.5 ${
                  selectedStat === lens
                    ? "bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,0.9)]"
                    : "bg-neutral-900/80 text-neutral-300"
                }`}
              >
                {lens}
              </button>
            ))}
          </div>

          {/* SCROLLABLE CONTENT */}
          <div
            ref={scrollRef}
            className="h-[calc(80vh-130px)] overflow-y-auto pb-3 overscroll-contain"
          >
            <InsightsContent player={player} selectedStat={selectedStat} />
          </div>
        </div>
      </div>

      {/* DESKTOP PANEL */}
      <div
        className="hidden h-full w-full items-stretch justify-end md:flex"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full w-[480px] border-l border-yellow-500/25 bg-gradient-to-b from-neutral-950 to-black px-5 py-4 shadow-xl">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-300">
                Player Insights
              </div>
              <div className="text-sm font-semibold text-neutral-50">
                {player.name}
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full bg-neutral-900 p-1.5 text-neutral-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-4 flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1">
            {(["Fantasy", "Disposals", "Goals"] as StatLens[]).map((lens) => (
              <button
                key={lens}
                onClick={() => onLensChange(lens)}
                className={`rounded-full px-3 py-1.5 ${
                  selectedStat === lens
                    ? "bg-yellow-400 text-black"
                    : "bg-neutral-900 text-neutral-300"
                }`}
              >
                {lens}
              </button>
            ))}
          </div>

          <div className="h-[calc(100%-120px)] overflow-y-auto pr-1 overscroll-contain">
            <InsightsContent player={player} selectedStat={selectedStat} />
          </div>
        </div>
      </div>
    </div>
  );
}