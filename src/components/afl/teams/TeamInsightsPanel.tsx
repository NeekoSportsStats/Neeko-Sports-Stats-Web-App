// src/components/afl/teams/TeamInsightsPanel.tsx

import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { MODE_CONFIG } from "./TeamMasterTable";

interface Props {
  team: any;
  mode: any;
  modeSeries: number[];
  modeSummary: { min: number; max: number; average: number; total: number };
  onClose: () => void;
}

export default function TeamInsightsPanel({
  team,
  mode,
  modeSeries,
  modeSummary,
  onClose,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const dragging = useRef(false);

  const [sheetY, setSheetY] = useState(0); // transform offset
  const [isMobile, setIsMobile] = useState(false);

  /* Detect mobile layout */
  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  /* ---------------------- DRAG HANDLERS (MOBILE) ---------------------- */

  function onTouchStart(e: React.TouchEvent) {
    dragging.current = true;
    startY.current = e.touches[0].clientY;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return;

    currentY.current = e.touches[0].clientY;
    const delta = currentY.current - startY.current;

    if (delta > 0) {
      // allow drag down only
      setSheetY(delta * 0.6); // softer feel
    }
  }

  function onTouchEnd() {
    dragging.current = false;

    if (sheetY > 120) {
      // snap closed
      setSheetY(500);
      setTimeout(onClose, 180);
    } else {
      // snap back
      setSheetY(0);
    }
  }

  /* ------------------------ DESKTOP PANEL ------------------------ */

  if (!isMobile) {
    return (
      <>
        {/* BACKDROP */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
          onClick={onClose}
        />

        {/* SIDE PANEL */}
        <div className="fixed right-0 top-0 h-full w-[380px] bg-neutral-950 border-l border-neutral-800 z-[100] p-6 overflow-y-auto no-scrollbar">
          <button
            className="absolute right-4 top-4 text-neutral-400 hover:text-white"
            onClick={onClose}
          >
            <X size={20} />
          </button>

          {/* CONTENT */}
          <InsightsContent
            team={team}
            mode={mode}
            modeSeries={modeSeries}
            modeSummary={modeSummary}
          />
        </div>
      </>
    );
  }

  /* -------------------------- MOBILE SHEET -------------------------- */

  return (
    <>
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
        onClick={onClose}
      />

      {/* SHEET */}
      <div
        ref={sheetRef}
        className="fixed left-0 right-0 bottom-0 z-[100] bg-neutral-950 rounded-t-2xl border-t border-neutral-800 shadow-xl"
        style={{
          transform: `translateY(${sheetY}px)`,
          transition: dragging.current ? "none" : "transform 0.18s ease-out",
          maxHeight: "92vh",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* DRAG HANDLE */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-neutral-600/60" />
        </div>

        {/* CLOSE BUTTON */}
        <button
          className="absolute right-4 top-4 text-neutral-400 hover:text-white"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {/* CONTENT SCROLL */}
        <div className="overflow-y-auto max-h-[80vh] px-6 pb-10 no-scrollbar">
          <InsightsContent
            team={team}
            mode={mode}
            modeSeries={modeSeries}
            modeSummary={modeSummary}
          />
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                        CONTENT (SHARED DESKTOP + MOBILE)                   */
/* -------------------------------------------------------------------------- */

function InsightsContent({ team, mode, modeSeries, modeSummary }: any) {
  const config = MODE_CONFIG[mode];

  return (
    <>
      <h2 className="text-xl font-semibold text-white mt-6">{team.name}</h2>
      <p className="text-neutral-400 text-xs mt-1">{team.code}</p>

      {/* WINDOW BOX */}
      <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
        <div className="text-xs text-neutral-400 uppercase tracking-wide">
          {config.label} Window
        </div>
        <div className="text-2xl font-semibold text-yellow-300 mt-1">
          {modeSummary.average}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {modeSeries.slice(-8).map((v: number, i: number) => (
            <div
              key={i}
              className="px-2 py-1 bg-neutral-800 rounded-md text-[11px] text-neutral-200"
            >
              {v}
            </div>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
        <div className="text-xs text-neutral-400 uppercase tracking-wide">
          {config.label} Stats
        </div>

        <div className="grid grid-cols-2 gap-y-2 mt-3 text-sm">
          <div className="text-neutral-400">Average</div>
          <div className="text-white font-medium">{modeSummary.average}</div>

          <div className="text-neutral-400">Total</div>
          <div className="text-white font-medium">{modeSummary.total}</div>

          <div className="text-neutral-400">Min</div>
          <div className="text-white font-medium">{modeSummary.min}</div>

          <div className="text-neutral-400">Max</div>
          <div className="text-white font-medium">{modeSummary.max}</div>
        </div>

        <div className="text-xs text-neutral-400 uppercase tracking-wide mt-4">
          Last 5 Rounds
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {modeSeries.slice(-5).map((v: number, i: number) => (
            <div
              key={i}
              className="px-2 py-1 bg-neutral-800 rounded-md text-[11px] text-neutral-200"
            >
              {v}
            </div>
          ))}
        </div>
      </div>

      {/* AI SUMMARY */}
      <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 mb-10">
        <div className="text-xs text-neutral-400 uppercase tracking-wide">
          AI Summary
        </div>

        <p className="text-neutral-300 text-sm leading-relaxed mt-2">
          {team.name} is showing{" "}
          <span className="text-yellow-300 font-medium">neutral–positive</span>{" "}
          momentum in {config.label.toLowerCase()} over the last block. Values
          are stabilising around{" "}
          <span className="text-yellow-300 font-medium">
            {modeSummary.average}
          </span>{" "}
          per game with moderate volatility.
        </p>
      </div>
    </>
  );
}
