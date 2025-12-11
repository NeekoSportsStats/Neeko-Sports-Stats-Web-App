import React, { useEffect, useRef, useState } from "react";
import { X, Sparkles, BarChart3 } from "lucide-react";
import type { TeamRow } from "./mockTeams";
import { ROUND_LABELS } from "./mockTeams";

/* -------------------------------------------------------------------------- */
/*                            MODE CONFIG / HELPERS                           */
/* -------------------------------------------------------------------------- */

export type Mode = "scoring" | "fantasy" | "disposals" | "goals";

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
    subtitle: "Fantasy points per game",
    unit: "pts",
    thresholds: [80, 90, 100, 110, 120],
  },
  disposals: {
    label: "Disposals",
    subtitle: "Total disposals per game",
    unit: "disp",
    thresholds: [15, 20, 25, 30, 35],
  },
  goals: {
    label: "Goals",
    subtitle: "Goals per game",
    unit: "g",
    thresholds: [1, 2, 3, 4, 5],
  },
};

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

const computeSummary = (series: number[]) => {
  if (!series.length)
    return { min: 0, max: 0, average: 0, total: 0 };

  const min = Math.min(...series);
  const max = Math.max(...series);
  const total = series.reduce((a, b) => a + b, 0);
  const average = +(total / series.length).toFixed(1);

  return { min, max, total, average };
};

const computeHitRate = (series: number[], thresholds: number[]) =>
  thresholds.map((t) =>
    Math.round((series.filter((v) => v >= t).length / series.length) * 100)
  );

/* COLORS */
const rateClass = (v: number) => {
  if (v >= 90) return "text-lime-300";
  if (v >= 75) return "text-yellow-200";
  if (v >= 50) return "text-amber-300";
  if (v >= 15) return "text-orange-300";
  return "text-red-400";
};

/* -------------------------------------------------------------------------- */
/*                     TEAM INSIGHTS CONTENT (shared mobile/desktop)          */
/* -------------------------------------------------------------------------- */

const TeamInsightsContent = ({
  team,
  mode,
}: {
  team: TeamRow;
  mode: Mode;
}) => {
  const config = MODE_CONFIG[mode];
  const series = getSeries(team, mode);
  const summary = computeSummary(series);
  const thresholds = config.thresholds;
  const hitRates = computeHitRate(series, thresholds);

  return (
    <div className="flex flex-col gap-6 text-[11px] text-neutral-200 pb-10">
      {/* ROUNDS STRIP */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 mb-2">
          Round-by-round {config.label.toLowerCase()}
        </div>
        <div className="overflow-x-auto overscroll-contain">
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

      {/* SEASON WINDOW */}
      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/90 p-5 shadow-xl">
        <div className="flex justify-between mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Season window
            </div>
            <div className="mt-1 text-xs text-neutral-300">
              Full-season {config.label.toLowerCase()}.
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-neutral-500 uppercase">Average</div>
            <div className="text-sm font-semibold text-yellow-200">
              {summary.average} {config.unit}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 text-[11px]">
          <div>
            <div className="text-[10px] text-neutral-500 uppercase">Min</div>
            <div className="text-sm text-neutral-100">{summary.min}</div>
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase">Max</div>
            <div className="text-sm text-neutral-100">{summary.max}</div>
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase">Total</div>
            <div className="text-sm text-neutral-100">{summary.total}</div>
          </div>
        </div>
      </div>

      {/* HIT RATE LADDER */}
      <div className="rounded-2xl border border-yellow-500/30 bg-black/85 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-yellow-100">
              Hit-rate ladder
            </span>
          </div>

          <span className="rounded-full border border-yellow-500/40 px-2 py-0.5 text-[9px] uppercase text-yellow-200">
            {config.label}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {thresholds.map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-black/70 px-3 py-2"
            >
              <span className="w-20 text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                {t}+
              </span>

              <div className="flex-1 rounded-full bg-neutral-900/80 overflow-hidden">
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
/*                        MAIN OVERLAY PANEL (FINAL VERSION)                  */
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
  const [mounted, setMounted] = useState(false);

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const draggingRef = useRef(false);
  const startYRef = useRef(0);

  /* --------------------------- LOCK BODY SCROLL --------------------------- */
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setMounted(true);

    return () => {
      document.body.style.overflow = prevBody;
    };
  }, []);

  /* ----------------------------- DRAG START ------------------------------ */
  const handleStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (scrollRef.current && scrollRef.current.scrollTop > 0) return;
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
      className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      {/* --------------------------- DESKTOP (RESTORED) --------------------------- */}
      <div
        className="hidden md:block fixed right-0 top-0 h-full w-[480px] z-[200]
                   bg-gradient-to-b from-neutral-950 via-black to-black
                   border-l border-yellow-500/30
                   shadow-[0_0_60px_rgba(250,204,21,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full overflow-hidden">
          
          {/* Header */}
          <div className="px-5 py-4 flex items-start justify-between border-b border-neutral-800/40">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200/80">
                Team Insights
              </div>
              <div className="text-sm font-semibold text-neutral-50 mt-1">
                {team.name}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                {team.code}
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full bg-neutral-900/90 p-1.5 text-neutral-300 hover:bg-neutral-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Selector */}
          <div className="px-5 py-3 flex items-center gap-2 border-b border-neutral-800/40 bg-black/40 text-[11px]">
            {(Object.keys(MODE_CONFIG) as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-full px-3 py-1.5 ${
                  mode === m
                    ? "bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,0.9)]"
                    : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                {MODE_CONFIG[m].label}
              </button>
            ))}
          </div>

          {/* Scroll Area */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <TeamInsightsContent team={team} mode={mode} />
          </div>
        </div>
      </div>

      {/* ------------------------------ MOBILE SHEET ------------------------------ */}
      <div
        className="flex h-full w-full items-end justify-center md:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={sheetRef}
          className="w-full rounded-t-3xl border border-yellow-500/30 bg-gradient-to-b
                     from-neutral-950/98 to-black px-4 pt-2 pb-3 shadow-[0_0_50px_rgba(250,204,21,0.7)]
                     overscroll-contain"
          style={{ height: "80vh", maxHeight: "80vh", touchAction: "none" }}
        >
          {/* Drag handle */}
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
          <div className="mt-3 mb-3 flex items-start gap-3">
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-yellow-500/50 bg-black/80"
              style={{ boxShadow: `0 0 14px ${team.colours.primary}55` }}
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
                Team Insights
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
            className="h-[calc(80vh-130px)] overflow-y-auto pb-2 overscroll-contain"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <TeamInsightsContent team={team} mode={mode} />
          </div>
        </div>
      </div>
    </div>
  );
}
