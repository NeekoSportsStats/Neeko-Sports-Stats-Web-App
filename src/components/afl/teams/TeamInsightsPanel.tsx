import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Sparkles, BarChart3 } from "lucide-react";
import type { TeamRow } from "./mockTeams";
import { ROUND_LABELS } from "./mockTeams";

export type Mode = "scoring" | "fantasy" | "disposals" | "goals";

type ModeSummary = {
  min: number;
  max: number;
  average: number;
  total: number;
};

/* -------------------------------------------------------------------------- */
/*                            MODE CONFIG / HELPERS                           */
/* -------------------------------------------------------------------------- */

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

const getSeriesForMode = (team: TeamRow, mode: Mode): number[] => {
  switch (mode) {
    case "fantasy":
      return team.fantasy;
    case "disposals":
      return team.disposals;
    case "goals":
      return team.goals;
    case "scoring":
    default:
      return team.scores;
  }
};

const computeSummary = (series: number[]) => {
  if (!series.length) {
    return {
      min: 0,
      max: 0,
      average: 0,
      total: 0,
      windowMin: 0,
      windowMax: 0,
      volatilityRange: 0,
    };
  }

  const min = Math.min(...series);
  const max = Math.max(...series);
  const total = series.reduce((a, b) => a + b, 0);
  const average = +(total / series.length).toFixed(1);

  const lastWindow = series.slice(-8);
  const windowMin = lastWindow.length ? Math.min(...lastWindow) : min;
  const windowMax = lastWindow.length ? Math.max(...lastWindow) : max;
  const volatilityRange = windowMax - windowMin;

  return { min, max, average, total, windowMin, windowMax, volatilityRange };
};

const computeHitRate = (series: number[], thresholds: number[]) =>
  thresholds.map((t) =>
    Math.round((series.filter((v) => v >= t).length / series.length) * 100)
  );

const rateClass = (v: number) => {
  if (v >= 90) return "text-lime-300";
  if (v >= 75) return "text-yellow-200";
  if (v >= 50) return "text-amber-300";
  if (v >= 15) return "text-orange-300";
  return "text-red-400";
};

/* -------------------------------------------------------------------------- */
/*                     INSIGHTS CONTENT (USED FOR BOTH VIEWS)                 */
/* -------------------------------------------------------------------------- */

const TeamInsightsContent = ({
  team,
  mode,
}: {
  team: TeamRow;
  mode: Mode;
}) => {
  const config = MODE_CONFIG[mode];
  const series = useMemo(() => getSeriesForMode(team, mode), [team, mode]);
  const summary = useMemo(() => computeSummary(series), [series]);
  const thresholds = config.thresholds;
  const hitRates = useMemo(
    () => computeHitRate(series, thresholds),
    [series, thresholds]
  );

  const lastIdx = series.length - 1;
  const lastValue = series[lastIdx] ?? 0;
  const prevValue = series[lastIdx - 1] ?? lastValue;
  const delta = lastValue - prevValue;

  const deltaClass =
    delta > 0 ? "text-lime-300" : delta < 0 ? "text-red-400" : "text-neutral-300";

  const volatilityLabel =
    summary.volatilityRange <= 8
      ? "Low"
      : summary.volatilityRange <= 14
      ? "Medium"
      : "High";

  const recentRounds = series.slice(-5);
  const recentLabels = ROUND_LABELS.slice(
    Math.max(0, ROUND_LABELS.length - recentRounds.length)
  );

  const mainThresholdIndex =
    thresholds.length >= 3 ? 2 : thresholds.length - 1;
  const mainThreshold = thresholds[mainThresholdIndex];
  const mainHit = hitRates[mainThresholdIndex];

  return (
    <div className="flex h-full flex-col gap-4 text-[11px] text-neutral-200">
      {/* Round strip */}
      <div>
        <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Round-by-round {config.label.toLowerCase()}
        </div>
        <div className="overflow-x-auto overscroll-contain">
          <div className="flex gap-2 pb-1">
            {series.map((v, i) => (
              <div key={i} className="flex min-w-[46px] flex-col items-center">
                <span className="text-[9px] text-neutral-500">
                  {ROUND_LABELS[i]}
                </span>
                <div className="mt-1 flex h-8 w-10 items-center justify-center rounded-md bg-neutral-950/80 text-[11px] text-neutral-100">
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Season summary */}
      <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/95 via-neutral-950 to-black p-5 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Season window
            </div>
            <div className="mt-1 text-xs text-neutral-300">
              Full-season {config.label.toLowerCase()} profile for this club.
            </div>
          </div>
          <div className="text-right text-[11px] text-neutral-200">
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Average
            </div>
            <div className="mt-1 text-sm font-semibold text-yellow-200">
              {summary.average.toFixed(1)} {config.unit}
            </div>
          </div>
        </div>

        <div className="h-20 rounded-xl bg-gradient-to-b from-neutral-800/70 to-black shadow-[0_0_40px_rgba(0,0,0,0.8)]" />

        <div className="mt-4 grid gap-3 text-[11px] text-neutral-300 sm:grid-cols-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Range window
            </div>
            <div className="mt-1 text-sm font-semibold text-neutral-100">
              {summary.windowMin}–{summary.windowMax} {config.unit}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Volatility
            </div>
            <div className="mt-1 text-sm font-semibold text-teal-300">
              {volatilityLabel} ({summary.volatilityRange} range)
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Last round
            </div>
            <div className="mt-1 text-sm font-semibold text-neutral-100">
              {lastValue} {config.unit}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              vs previous
            </div>
            <div className={`mt-1 text-sm font-semibold ${deltaClass}`}>
              {delta > 0 ? "+" : ""}
              {delta.toFixed(1)} {config.unit}
            </div>
          </div>
        </div>
      </div>

      {/* Recent snapshot */}
      <div className="flex flex-col gap-2 rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-950/95 via-black to-black/95 px-3 py-3 sm:px-4 sm:py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-yellow-300" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
              Recent rounds snapshot
            </span>
          </div>
          <span className="rounded-full bg-neutral-900/90 px-2 py-0.5 text-[9px] text-neutral-400">
            Last {recentRounds.length} rounds
          </span>
        </div>

        <div className="mt-1 grid grid-cols-5 gap-1.5 text-center text-[10px]">
          {recentRounds.map((v, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-0.5 rounded-xl border border-neutral-800 bg-black/70 px-1.5 py-1.5"
            >
              <span className="text-[9px] uppercase tracking-[0.14em] text-neutral-500">
                {recentLabels[i]}
              </span>
              <span className="text-[11px] text-neutral-50">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI summary */}
      <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-black/96 via-neutral-950 to-black px-5 py-4 text-[11px] text-neutral-300 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
        <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-yellow-200">
          AI performance summary (placeholder)
        </div>
        <p>
          This club shows{" "}
          <span className="font-semibold text-neutral-50">
            {volatilityLabel.toLowerCase()} volatility
          </span>{" "}
          at this lens with{" "}
          <span className="font-semibold text-neutral-50">
            {config.label.toLowerCase()} windows
          </span>{" "}
          clustered around the season average. Hit-rate distribution hints at a{" "}
          <span className="font-semibold text-neutral-50">
            stable production band
          </span>{" "}
          with periodic ceiling spikes in favourable conditions.
        </p>
      </div>

      {/* Hit-rate ladder */}
      <div className="flex flex-col gap-2 rounded-2xl border border-yellow-500/30 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.18),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(24,24,27,0.9),_#020617)] px-3 py-3 sm:px-4 sm:py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-yellow-100/90">
              Hit-rate ladder
            </span>
          </div>
          <span className="rounded-full border border-yellow-500/50 bg-black/70 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-yellow-200">
            {config.label}
          </span>
        </div>

        <div className="mt-2 flex flex-col gap-1.5 text-[11px]">
          {thresholds.map((t, i) => {
            const rate = hitRates[i];
            const isPrimary = t === mainThreshold;

            return (
              <div
                key={t}
                className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 ${
                  isPrimary
                    ? "border-yellow-400/80 bg-black/80 shadow-[0_0_18px_rgba(250,204,21,0.4)]"
                    : "border-neutral-800 bg-black/70"
                }`}
              >
                <span className="w-20 text-[10px] text-neutral-400 uppercase tracking-[0.16em]">
                  {t}+
                </span>

                <div className="relative flex-1 overflow-hidden rounded-full bg-neutral-900/90">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 via-yellow-300 to-amber-400"
                    style={{ width: `${Math.min(rate, 100)}%` }}
                  />
                </div>

                <span className={`w-12 text-right font-semibold ${rateClass(rate)}`}>
                  {rate}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                  MAIN PANEL (DESKTOP SIDEBAR + MOBILE SHEET)               */
/* -------------------------------------------------------------------------- */

const TeamInsightsPanel = ({
  team,
  mode: initialMode,
  modeSeries, // optional, for compatibility
  modeSummary, // optional, not strictly needed
  onClose,
}: {
  team: TeamRow;
  mode: Mode;
  modeSeries?: number[];
  modeSummary?: ModeSummary;
  onClose: () => void;
}) => {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [mounted, setMounted] = useState(false);

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const draggingRef = useRef(false);
  const startYRef = useRef(0);

  /* --------------------------- LOCK SCROLL ON MOUNT ----------------------- */
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    setMounted(true);
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  /* ---------------------------- TOUCH HANDLERS (MOBILE) ------------------- */

  const handleStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const scrollable = scrollRef.current;
    if (!scrollable) return;

    // Strict iOS-style — only drag when scrolled to top
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
    window.setTimeout(() => {
      if (sheetRef.current) sheetRef.current.style.transition = "";
    }, 250);
  };

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      {/* DESKTOP RIGHT SIDEBAR ---------------------------------------------- */}
      <div
        className="hidden h-full w-full items-stretch justify-end md:flex"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full w-[480px] max-w-full border-l border-yellow-500/30 bg-gradient-to-b from-neutral-950 via-black to-black px-5 py-4 shadow-[0_0_60px_rgba(250,204,21,0.7)] animate-[slideInRight_0.22s_ease-out]">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between gap-3">
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
              type="button"
              onClick={onClose}
              className="rounded-full bg-neutral-900 p-1.5 text-neutral-300 hover:bg-neutral-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode pills */}
          <div className="mb-4 flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1 text-[11px] text-neutral-200">
            {(Object.keys(MODE_CONFIG) as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
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

          {/* Scrollable content */}
          <div className="h-[calc(100%-120px)] overflow-y-auto pr-1 overscroll-contain">
            <TeamInsightsContent team={team} mode={mode} />
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET ------------------------------------------------- */}
      <div
        className="flex h-full w-full items-end justify-center md:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={sheetRef}
          className="w-full rounded-t-3xl border border-yellow-500/30 bg-gradient-to-b from-neutral-950/98 to-black px-4 pt-2 pb-3 shadow-[0_0_50px_rgba(250,204,21,0.7)] overscroll-contain"
          style={{
            height: "80vh",
            maxHeight: "80vh",
          }}
        >
          {/* Drag area (full width) */}
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
          <div className="mt-1 mb-3 flex items-start gap-3">
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
              type="button"
              onClick={onClose}
              className="ml-auto rounded-full bg-neutral-900/90 p-1.5 text-neutral-300 hover:bg-neutral-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode pills */}
          <div className="mb-3 flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1 text-[11px]">
            {(Object.keys(MODE_CONFIG) as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
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

          {/* Scrollable content */}
          <div
            ref={scrollRef}
            className="h-[calc(80vh-140px)] overflow-y-auto pb-2 overscroll-contain"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <TeamInsightsContent team={team} mode={mode} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamInsightsPanel;