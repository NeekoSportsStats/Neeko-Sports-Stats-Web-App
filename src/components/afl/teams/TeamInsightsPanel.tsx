import React, { useEffect, useRef, useState } from "react";
import { X, Sparkles, BarChart3 } from "lucide-react";
import type { TeamRow } from "./mockTeams";
import { ROUND_LABELS } from "./mockTeams";

export type Mode = "scoring" | "fantasy" | "disposals" | "goals";

/* ------------------------- MODE CONFIG ------------------------- */

const MODE_CONFIG: Record<
  Mode,
  { label: string; subtitle: string; unit: string; thresholds: number[] }
> = {
  scoring: {
    label: "Scoring",
    subtitle: "Total points per game",
    unit: "pts",
    thresholds: [60, 70, 80, 90, 100],
  },
  fantasy: {
    label: "Fantasy",
    subtitle: "Fantasy points",
    unit: "pts",
    thresholds: [80, 90, 100, 110, 120],
  },
  disposals: {
    label: "Disposals",
    subtitle: "Total disposals",
    unit: "disp",
    thresholds: [15, 20, 25, 30, 35],
  },
  goals: {
    label: "Goals",
    subtitle: "Goals scored",
    unit: "g",
    thresholds: [1, 2, 3, 4, 5],
  },
};

/* ----------------------- UTILS --------------------------------- */

const getSeries = (team: TeamRow, mode: Mode): number[] => {
  switch (mode) {
    case "fantasy":
      return team.fantasy;
    case "disposals":
      return team.disposals;
    case "goals":
      return team.goals;
    default:
      return team.scores;
  }
};

const computeSummary = (arr: number[]) => {
  if (!arr.length)
    return {
      min: 0,
      max: 0,
      average: 0,
      total: 0,
      windowMin: 0,
      windowMax: 0,
      volatilityRange: 0,
    };

  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const total = arr.reduce((a, b) => a + b, 0);
  const average = +(total / arr.length).toFixed(1);

  const last8 = arr.slice(-8);
  const windowMin = Math.min(...last8);
  const windowMax = Math.max(...last8);
  const volatilityRange = windowMax - windowMin;

  return { min, max, average, total, windowMin, windowMax, volatilityRange };
};

const computeHitRates = (arr: number[], thresholds: number[]) =>
  thresholds.map((t) =>
    Math.round((arr.filter((v) => v >= t).length / arr.length) * 100)
  );

/* -------------------------------------------------------------------------- */
/*                                PANEL                                       */
/* -------------------------------------------------------------------------- */

export default function TeamInsightsPanel({
  team,
  mode: initialMode,
  onClose,
}: {
  team: TeamRow;
  mode: Mode;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const draggingRef = useRef(false);
  const startYRef = useRef(0);

  /* LOCK SCROLL */
  useEffect(() => {
    const oldHtml = document.documentElement.style.overflow;
    const oldBody = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = oldHtml;
      document.body.style.overflow = oldBody;
    };
  }, []);

  /* DRAG HANDLERS */

  const handleStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const s = scrollRef.current;
    if (!s) return;
    if (s.scrollTop > 0) return;

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

  /* --------------------------- MOBILE SHEET ------------------------------ */

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      {/* DESKTOP */}
      <div
        className="hidden h-full w-full items-stretch justify-end md:flex"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full w-[480px] bg-gradient-to-b from-neutral-950 to-black border-l border-yellow-500/25 px-5 py-4 shadow-xl">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200/80">
                Team insights
              </div>
              <div className="mt-1 text-sm font-semibold text-neutral-50">
                {team.name}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                {team.code}
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full bg-neutral-900/90 p-1.5 text-neutral-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode pills */}
          <div className="mb-4 flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1 text-[11px]">
            {(Object.keys(MODE_CONFIG) as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-full px-3 py-1.5 ${
                  mode === m
                    ? "bg-yellow-400 text-black shadow-[0_0_14px_rgba(250,204,21,0.7)]"
                    : "bg-neutral-900 text-neutral-300"
                }`}
              >
                {MODE_CONFIG[m].label}
              </button>
            ))}
          </div>

          {/* Scroll content */}
          <div className="h-[calc(100%-120px)] overflow-y-auto pr-1 overscroll-contain">
            <TeamInsightsContent team={team} mode={mode} />
          </div>
        </div>
      </div>

      {/* MOBILE SHEET */}
      <div
        className="flex h-full w-full items-end justify-center md:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={sheetRef}
          className="w-full rounded-t-3xl border border-yellow-500/30 bg-gradient-to-b from-neutral-950 to-black px-4 pt-2 pb-3 shadow-[0_0_50px_rgba(250,204,21,0.8)] overscroll-contain"
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
          <div className="mt-1 mb-3 flex items-start gap-3">
            <div
              className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-yellow-500/50 bg-black/80"
              style={{ boxShadow: `0 0 12px ${team.colours.primary}66` }}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor: team.colours.primary,
                  boxShadow: `0 0 10px ${team.colours.primary}`,
                }}
              />
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200/80">
                Team insights
              </div>
              <div className="mt-1 text-sm font-semibold text-neutral-50">
                {team.name}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                {team.code}
              </div>
            </div>

            <button
              onClick={onClose}
              className="ml-auto rounded-full bg-neutral-900/90 p-1.5 text-neutral-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode pills */}
          <div className="mb-3 flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1 text-[11px]">
            {(Object.keys(MODE_CONFIG) as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-full px-3 py-1.5 ${
                  mode === m
                    ? "bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,0.9)]"
                    : "bg-neutral-900 text-neutral-300"
                }`}
              >
                {MODE_CONFIG[m].label}
              </button>
            ))}
          </div>

          {/* Scrollable content */}
          <div
            ref={scrollRef}
            className="h-[calc(80vh-130px)] overflow-y-auto overscroll-contain pb-2"
          >
            <TeamInsightsContent team={team} mode={mode} />
          </div>
        </div>
      </div>
    </div>
  );
}