import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Sparkles, BarChart3 } from "lucide-react";
import type { TeamRow } from "./mockTeams";
import { ROUND_LABELS } from "./mockTeams";

/* -------------------------------------------------------------------------- */
/* CONFIG                                                                      */
/* -------------------------------------------------------------------------- */

export type Mode = "scoring" | "fantasy" | "disposals" | "goals";

const MODE_CONFIG = {
  scoring: {
    label: "Scoring",
    unit: "pts",
    thresholds: [60, 70, 80, 90, 100],
  },
  fantasy: {
    label: "Fantasy",
    unit: "pts",
    thresholds: [80, 90, 100, 110, 120],
  },
  disposals: {
    label: "Disposals",
    unit: "disp",
    thresholds: [15, 20, 25, 30, 35],
  },
  goals: {
    label: "Goals",
    unit: "g",
    thresholds: [1, 2, 3, 4, 5],
  },
} as const;

/* HELPERS */

const getSeriesFor = (team: TeamRow, mode: Mode) => {
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
  if (!arr.length) return { min: 0, max: 0, avg: 0 };
  return {
    min: Math.min(...arr),
    max: Math.max(...arr),
    avg: +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1),
  };
};

const rateClass = (v: number) => {
  if (v >= 90) return "text-lime-300";
  if (v >= 75) return "text-yellow-200";
  if (v >= 50) return "text-amber-300";
  return "text-red-400";
};

/* -------------------------------------------------------------------------- */
/* CONTENT BLOCK                                                              */
/* -------------------------------------------------------------------------- */

const InsightsContent = ({ team, mode }: { team: TeamRow; mode: Mode }) => {
  const cfg = MODE_CONFIG[mode];
  const series = getSeriesFor(team, mode);
  const summary = computeSummary(series);
  const thresholds = cfg.thresholds;

  const hitRates = thresholds.map((t) =>
    Math.round((series.filter((v) => v >= t).length / series.length) * 100)
  );

  return (
    <div className="flex flex-col gap-4 text-[11px] text-neutral-200">
      {/* Round strip */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 mb-1">
          Round-by-round
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-2 pb-1">
            {series.map((v, i) => (
              <div key={i} className="flex min-w-[46px] flex-col items-center">
                <span className="text-[9px] text-neutral-500">
                  {ROUND_LABELS[i]}
                </span>
                <div className="mt-1 flex h-8 w-10 items-center justify-center rounded-md bg-neutral-950 text-[11px] text-neutral-100">
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Season summary */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/90 p-4">
        <div className="flex justify-between mb-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Season window
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Full-season {cfg.label.toLowerCase()}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase text-neutral-500">
              Average
            </div>
            <div className="text-yellow-200 text-sm font-semibold mt-1">
              {summary.avg} {cfg.unit}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div>
            <div className="text-[10px] uppercase text-neutral-500">Min</div>
            <div className="text-neutral-100 text-sm mt-1">{summary.min}</div>
          </div>

          <div>
            <div className="text-[10px] uppercase text-neutral-500">Max</div>
            <div className="text-neutral-100 text-sm mt-1">{summary.max}</div>
          </div>

          <div>
            <div className="text-[10px] uppercase text-neutral-500">Range</div>
            <div className="text-neutral-100 text-sm mt-1">
              {summary.min}–{summary.max}
            </div>
          </div>
        </div>
      </div>

      {/* Hit-rate ladder */}
      <div className="rounded-2xl border border-yellow-500/30 bg-black/80 p-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-yellow-200">
              Hit-rate ladder
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mt-2">
          {thresholds.map((t, i) => (
            <div
              key={t}
              className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-black/70 px-2.5 py-1.5"
            >
              <span className="w-20 text-[10px] text-neutral-400">{t}+</span>

              <div className="flex-1 overflow-hidden rounded-full bg-neutral-900/80">
                <div
                  className="h-1.5 bg-gradient-to-r from-emerald-400 via-yellow-300 to-orange-400"
                  style={{ width: `${hitRates[i]}%` }}
                />
              </div>

              <span className={`w-12 text-right font-semibold ${rateClass(hitRates[i])}`}>
                {hitRates[i]}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* PANEL WRAPPER                                                              */
/* -------------------------------------------------------------------------- */

const TeamInsightsPanel = ({
  team,
  mode: initialMode,
  onClose,
}: {
  team: TeamRow;
  mode: Mode;
  onClose: () => void;
}) => {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [mounted, setMounted] = useState(false);

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const draggingRef = useRef(false);
  const startYRef = useRef(0);

  /* Scroll lock */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setMounted(true);
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* DRAG logic (mobile) */
  const start = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    if (scrollRef.current.scrollTop > 0) return;
    draggingRef.current = true;
    startYRef.current = e.touches[0].clientY;
  };

  const move = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !sheetRef.current) return;
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy > 0) {
      sheetRef.current.style.transform = `translateY(${dy}px)`;
      e.preventDefault();
    }
  };

  const end = (e: React.TouchEvent<HTMLDivElement>) => {
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
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      {/* DESKTOP PANEL */}
      <div
        className="hidden h-full w-full md:flex items-stretch justify-end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full w-[480px] border-l border-yellow-500/30 bg-gradient-to-b from-neutral-950 via-black to-black p-4 shadow-[0_0_50px_rgba(250,204,21,0.6)]">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200/80">
                Team insights
              </div>
              <div className="text-neutral-50 text-sm font-semibold mt-1">
                {team.name}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                {team.code}
              </div>
            </div>

            <button
              className="rounded-full bg-neutral-900/90 p-1.5 text-neutral-300"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode pills */}
          <div className="flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1 text-[11px] text-neutral-200 mb-4">
            {(Object.keys(MODE_CONFIG) as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-full px-3 py-1.5 ${
                  mode === m
                    ? "bg-yellow-400 text-black"
                    : "bg-neutral-900 text-neutral-300"
                }`}
              >
                {MODE_CONFIG[m].label}
              </button>
            ))}
          </div>

          <div className="h-[calc(100%-120px)] overflow-y-auto">
            <InsightsContent team={team} mode={mode} />
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
          className="w-full rounded-t-3xl border border-yellow-500/30 bg-gradient-to-b from-neutral-950 to-black px-4 pb-3 pt-2"
          style={{ height: "80vh", maxHeight: "80vh" }}
        >
          {/* Drag handle */}
          <div
            onTouchStart={start}
            onTouchMove={move}
            onTouchEnd={end}
            className="w-full flex justify-center py-3"
            style={{ touchAction: "none" }}
          >
            <div className="h-1.5 w-10 rounded-full bg-yellow-200/80" />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200/80">
                Team insights
              </div>
              <div className="text-neutral-50 font-semibold text-sm mt-1">
                {team.name}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                {team.code}
              </div>
            </div>

            <button
              className="rounded-full bg-neutral-900/90 p-1.5 text-neutral-300"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode pills */}
          <div className="mb-3 flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1 text-[11px] text-neutral-300">
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

          {/* Scrollable */}
          <div
            ref={scrollRef}
            className="h-[calc(80vh-140px)] overflow-y-auto pb-2"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <InsightsContent team={team} mode={mode} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamInsightsPanel;