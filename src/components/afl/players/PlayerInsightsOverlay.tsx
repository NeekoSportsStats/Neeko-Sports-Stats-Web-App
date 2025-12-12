// src/components/afl/players/PlayerInsightsOverlay.tsx

import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { PlayerRow, StatLens } from "./MasterTable";
import InsightsContent from "./PlayerInsightsContent";

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

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setMounted(true);
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleStart = (e: React.TouchEvent) => {
    if (!scrollRef.current || scrollRef.current.scrollTop > 0) return;
    draggingRef.current = true;
    startYRef.current = e.touches[0].clientY;
  };

  const handleMove = (e: React.TouchEvent) => {
    if (!draggingRef.current || !sheetRef.current) return;
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy > 0) {
      sheetRef.current.style.transform = `translateY(${dy}px)`;
      e.preventDefault();
    }
  };

  const handleEnd = (e: React.TouchEvent) => {
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
      className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      {/* MOBILE SHEET */}
      <div
        className="flex h-full w-full items-end justify-center md:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={sheetRef}
          className="w-full rounded-t-3xl border border-yellow-500/30 bg-gradient-to-b from-neutral-950 to-black px-4 pt-2 pb-4 shadow-[0_0_50px_rgba(250,204,21,0.6)]"
          style={{ height: "80vh", maxHeight: "80vh", touchAction: "none" }}
        >
          {/* Drag handle */}
          <div
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            className="w-full pt-3 pb-4 flex items-center justify-center"
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
              className="rounded-full bg-neutral-900/90 p-1.5 text-neutral-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stat pills */}
          <div className="mb-3 flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1 text-[11px]">
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

          {/* Scrollable content — SAFE BOTTOM PADDING */}
          <div
            ref={scrollRef}
            className="h-[calc(80vh-140px)] overflow-y-auto overscroll-contain pb-8"
          >
            <InsightsContent
              player={player}
              selectedStat={selectedStat}
              mobilePriority
            />
          </div>
        </div>
      </div>
    </div>
  );
}