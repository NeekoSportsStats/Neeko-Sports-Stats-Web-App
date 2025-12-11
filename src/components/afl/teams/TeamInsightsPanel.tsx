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
  const windowMin = Math.min(...lastWindow);
  const windowMax = Math.max(...lastWindow);
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
/*                         SCROLL LOCK HELPERS                                */
/* -------------------------------------------------------------------------- */

const lockScroll = () => {
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
};

const unlockScroll = () => {
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
};

/* -------------------------------------------------------------------------- */
/*                     INSIGHTS CONTENT (REUSED BOTH MODES)                   */
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
  const recentLabels = ROUND_LABELS.slice(ROUND_LABELS.length - recentRounds.length);

  const mainThresholdIndex = thresholds.length >= 3 ? 2 : thresholds.length - 1;
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
                <span className="text-[9px] text-neutral-500">{ROUND_LABELS[i]}</span>
                <div className="mt-1 flex h-8 w-10 items-center justify-center rounded-md bg-neutral-950/80 text-[11px] text-neutral-100">
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Season summary */}
      <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/95 to-black p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Season window
            </div>
            <div className="mt-1 text-xs text-neutral-300">
              Full-season {config.label.toLowerCase()} for this club.
            </div>
          </div>
          <div className="text-right text-[11px]">
            <div className="text-[10px] text-neutral-500 uppercase">
              Average
            </div>
            <div className="mt-1 text-sm font-semibold text-yellow-200">
              {summary.average} {config.unit}
            </div>
          </div>
        </div>

        <div className="h-20 rounded-xl bg-neutral-800/40 shadow-inner" />

        <div className="mt-4 grid gap-3 text-[11px] sm:grid-cols-4">
          <div>
            <div className="text-[10px] text-neutral-500 uppercase">Range</div>
            <div className="mt-1 text-sm text-neutral-100">
              {summary.windowMin}–{summary.windowMax} {config.unit}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase">Volatility</div>
            <div className="mt-1 text-sm font-semibold text-teal-300">
              {volatilityLabel} ({summary.volatilityRange})
            </div>
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase">Last</div>
            <div className="mt-1 text-sm text-neutral-100">
              {lastValue} {config.unit}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase">vs Prev</div>
            <div className={`mt-1 text-sm ${deltaClass}`}>
              {delta > 0 ? "+" : ""}
              {delta.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Recent snapshot */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/90 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-yellow-300" />
            <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">
              Recent rounds snapshot
            </span>
          </div>
          <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[9px] text-neutral-500">
            Last {recentRounds.length} rounds
          </span>
        </div>

        <div className="mt-2 grid grid-cols-5 gap-1.5 text-center text-[10px]">
          {recentRounds.map((v, i) => (
            <div
              key={i}
              className="rounded-xl border border-neutral-800 bg-black/70 px-1.5 py-1.5"
            >
              <div className="text-[9px] text-neutral-500 uppercase tracking-[0.14em]">
                {recentLabels[i]}
              </div>
              <div className="text-[11px] text-neutral-50">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI summary */}
      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/95 px-5 py-4 text-[11px] text-neutral-300 shadow-md">
        <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-yellow-200">
          AI performance summary
        </div>
        <p>
          This club shows{" "}
          <span className="text-neutral-50 font-semibold">
            {volatilityLabel.toLowerCase()} volatility
          </span>{" "}
          with stable production windows and periodic ceiling moments.
        </p>
      </div>

      {/* Hit-rate ladder */}
      <div className="rounded-2xl border border-yellow-500/30 bg-black/85 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-yellow-100">
              Hit-rate ladder
            </span>
          </div>

          <span className="rounded-full border border-yellow-500/40 bg-black/70 px-2 py-0.5 text-[9px] uppercase text-yellow-200">
            {config.label}
          </span>
        </div>

        <div className="mt-2 flex flex-col gap-1.5 text-[11px]">
          {thresholds.map((t, i) => {
            const val = hitRates[i];
            const primary = i === mainThresholdIndex;
            return (
              <div
                key={t}
                className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 ${
                  primary
                    ? "border-yellow-400/80 bg-black/80 shadow-[0_0_14px_rgba(250,204,21,0.4)]"
                    : "border-neutral-800 bg-black/70"
                }`}
              >
                <span className="w-20 text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                  {t}+
                </span>

                <div className="flex-1 overflow-hidden rounded-full bg-neutral-900/80">
                  <div
                    className="h-1.5 bg-gradient-to-r from-emerald-400 via-yellow-300 to-orange-400"
                    style={{ width: `${val}%` }}
                  />
                </div>

                <span className={`w-12 text-right font-semibold ${rateClass(val)}`}>
                  {val}%
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
/*                      MAIN PANEL (WITH STRICT iOS DRAG)                     */
/* -------------------------------------------------------------------------- */

const TeamInsightsPanel = ({
  team,
  mode: initialMode,
  modeSeries,
  modeSummary,
  onClose,
}: {
  team: TeamRow;
  mode: Mode;
  modeSeries: number[];
  modeSummary: ModeSummary;
  onClose: () => void;
}) => {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [mounted, setMounted] = useState(false);

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const draggingRef = useRef(false);
  const startYRef = useRef(0);

  /* ------------------------------ LOCK SCROLL ------------------------------ */
  useEffect(() => {
    lockScroll();
    setMounted(true);
    return () => unlockScroll();
  }, []);

  /* ---------------------------- TOUCH HANDLERS ----------------------------- */

  const handleStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    const scrollable = scrollRef.current;
    if (!scrollable) return;

    // Strict iOS — cannot drag unless scroll is at top
    if (scrollable.scrollTop > 0) return;

    draggingRef.current = true;
    startYRef.current = e.touches[0].clientY;
  };

  const handleMove = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (!draggingRef.current || !sheetRef.current) return;

    const dy = e.touches[0].clientY - startYRef.current;
    if (dy > 0) {
      sheetRef.current.style.transform = `translateY(${dy}px)`;
      e.preventDefault();
    }
  };

  const handleEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
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
        className="hidden h-full w-full items-stretch justify-end md:flex"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full w-[480px] max-w-full border-l border-yellow-500/30 bg-gradient-to-b from-neutral-950 to-black px-5 py-4 shadow-xl">
          {/* Head */}
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

          <div className="h-[calc(100%-120px)] overflow-y-auto pr-1 overscroll-contain">
            <TeamInsightsContent team={team} mode={mode} />
          </div>
        </div>
      </div>

      {/* ---------------------- MOBILE BOTTOM SHEET ---------------------- */}
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
          {/* Handle */}
          <button
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            className="mx-auto flex h-1.5 w-10 items-center justify-center rounded-full bg-yellow-200/80"
          />

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
            className="h-[calc(80vh-130px)] overflow-y-auto pb-2 overscroll-contain"
          >
            <TeamInsightsContent team={team} mode={mode} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamInsightsPanel;