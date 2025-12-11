// src/components/afl/teams/TeamInsightsPanel.tsx
import React, { useEffect, useState } from "react";
import { X, Sparkles, BarChart3 } from "lucide-react";
import type { TeamRow } from "./mockTeams";
import { ROUND_LABELS } from "./mockTeams";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type Mode = "scoring" | "fantasy" | "disposals" | "goals";

type ModeSummary = {
  min: number;
  max: number;
  average: number;
  total: number;
};

type TeamInsightsPanelProps = {
  team: TeamRow;
  mode: Mode;
  modeSeries: number[];
  modeSummary: ModeSummary;
  onClose: () => void;
};

/* -------------------------------------------------------------------------- */
/*                              LOCAL MODE CONFIG                             */
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

const rateClass = (v: number) => {
  if (v >= 90) return "text-lime-300";
  if (v >= 75) return "text-yellow-200";
  if (v >= 50) return "text-amber-300";
  if (v >= 15) return "text-orange-300";
  return "text-red-400";
};

const computeHitRate = (series: number[], thresholds: number[]) =>
  thresholds.map((t) =>
    Math.round((series.filter((v) => v >= t).length / series.length) * 100)
  );

/* -------------------------------------------------------------------------- */
/*                             BOTTOM SHEET PANEL                             */
/* -------------------------------------------------------------------------- */

const TeamInsightsPanel: React.FC<TeamInsightsPanelProps> = ({
  team,
  mode,
  modeSeries,
  modeSummary,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Lock background scroll + animate in
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // small delay so transition runs
    const t = window.setTimeout(() => setIsVisible(true), 10);

    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // wait for animation to finish
    window.setTimeout(onClose, 220);
  };

  const modeConfig = MODE_CONFIG[mode];
  const hitRates = computeHitRate(modeSeries, modeConfig.thresholds);

  const lastIndex = modeSeries.length - 1;
  const lastValue = lastIndex >= 0 ? modeSeries[lastIndex] : 0;
  const prevValue = lastIndex >= 1 ? modeSeries[lastIndex - 1] : lastValue;
  const delta = lastValue - prevValue;
  const deltaSign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  const deltaClass =
    delta > 0
      ? "text-lime-300"
      : delta < 0
      ? "text-red-400"
      : "text-neutral-300";

  // choose up to last 5 rounds for small spark row / chips
  const recentRounds = modeSeries.slice(-5);
  const recentLabels = ROUND_LABELS.slice(
    Math.max(0, ROUND_LABELS.length - recentRounds.length)
  );

  const mainThresholdIndex =
    modeConfig.thresholds.length >= 3 ? 2 : modeConfig.thresholds.length - 1;
  const mainThreshold = modeConfig.thresholds[mainThresholdIndex];
  const mainHit = hitRates[mainThresholdIndex];

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-end justify-center sm:items-center ${
        isVisible ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close team insights"
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Bottom sheet */}
      <div
        className={`relative w-full max-w-xl transform rounded-t-3xl border border-yellow-500/30 bg-gradient-to-b from-black/95 via-neutral-950/95 to-black shadow-[0_-30px_120px_rgba(0,0,0,0.9),0_0_40px_rgba(250,204,21,0.18)] transition-transform duration-220 ease-out sm:rounded-3xl sm:border-yellow-500/40 sm:shadow-[0_24px_120px_rgba(0,0,0,0.9),0_0_40px_rgba(250,204,21,0.18)] ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          maxHeight: "88vh",
        }}
      >
        {/* Drag handle */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1 sm:px-5 sm:pt-4">
          <div className="flex-1">
            <div className="mx-auto h-1 w-10 rounded-full bg-neutral-700/80 sm:hidden" />
          </div>
          <button
            type="button"
            className="ml-auto rounded-full p-1.5 text-neutral-400 hover:bg-neutral-800/80 hover:text-neutral-100"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative z-10 flex flex-col gap-4 px-4 pb-5 pt-1 sm:px-6 sm:pb-6">
          {/* Gold side glow strip */}
          <div className="pointer-events-none absolute inset-y-6 left-0 w-[2px] rounded-r-full bg-gradient-to-b from-yellow-400 via-amber-300 to-yellow-500 opacity-70 sm:inset-y-7" />

          {/* Header: team + mode */}
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 h-8 w-8 shrink-0 rounded-full border border-yellow-500/50 bg-black/80 shadow-[0_0_18px_rgba(250,204,21,0.45)] flex items-center justify-center"
              style={{
                boxShadow: `0 0 18px ${team.colours.primary}55`,
              }}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor: team.colours.primary,
                  boxShadow: `0 0 10px ${team.colours.primary}`,
                }}
              />
            </div>

            <div className="flex flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold text-neutral-50">
                  {team.name}
                </span>
                <span className="rounded-full border border-neutral-700 bg-black/70 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-neutral-400">
                  {team.code} • {modeConfig.label}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {modeConfig.subtitle}. Quick view of{" "}
                <span className="font-medium text-neutral-100">
                  recent trend, consistency &amp; hit-rates
                </span>{" "}
                for this club.
              </p>
            </div>
          </div>

          {/* Key stats row */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-neutral-800 bg-black/80 px-3 py-3 text-[11px] sm:grid-cols-4 sm:px-4 sm:py-3.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                Avg this season
              </span>
              <span className="text-sm font-semibold text-yellow-200">
                {modeSummary.average.toFixed(1)}{" "}
                <span className="text-[11px] text-neutral-400">
                  {modeConfig.unit}
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                High watermark
              </span>
              <span className="text-sm font-semibold text-neutral-100">
                {modeSummary.max}{" "}
                <span className="text-[11px] text-neutral-400">
                  {modeConfig.unit}
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                Last round
              </span>
              <span className="text-sm font-semibold text-neutral-100">
                {lastValue}{" "}
                <span className="text-[11px] text-neutral-400">
                  {modeConfig.unit}
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                vs prev
              </span>
              <span className={`text-sm font-semibold ${deltaClass}`}>
                {deltaSign}
                {Math.abs(delta).toFixed(1)}{" "}
                <span className="text-[11px] text-neutral-400">
                  {modeConfig.unit}
                </span>
              </span>
            </div>
          </div>

          {/* Recent rounds mini grid */}
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
              {recentRounds.map((value, i) => (
                <div
                  key={`${recentLabels[i]}-${i}`}
                  className="flex flex-col items-center gap-0.5 rounded-xl border border-neutral-800/80 bg-black/70 px-1.5 py-1.5"
                >
                  <span className="text-[9px] uppercase tracking-[0.14em] text-neutral-500">
                    {recentLabels[i]}
                  </span>
                  <span className="text-[11px] text-neutral-50">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hit-rate lanes */}
          <div className="flex flex-col gap-2 rounded-2xl border border-yellow-500/30 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.18),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(24,24,27,0.9),_#020617)] px-3 py-3 sm:px-4 sm:py-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                <span className="text-[10px] uppercase tracking-[0.18em] text-yellow-100/90">
                  Hit-rate ladder
                </span>
              </div>
              <span className="rounded-full border border-yellow-500/50 bg-black/70 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-yellow-200">
                {modeConfig.label}
              </span>
            </div>

            <div className="mt-2 flex flex-col gap-1.5 text-[11px]">
              {modeConfig.thresholds.map((t, i) => {
                const rate = hitRates[i] ?? 0;
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
                    <div className="flex w-20 items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                        {t}+
                      </span>
                    </div>

                    <div className="relative flex-1 overflow-hidden rounded-full bg-neutral-900/90">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 via-yellow-300 to-amber-400"
                        style={{ width: `${Math.min(rate, 100)}%` }}
                      />
                    </div>

                    <span
                      className={`w-12 text-right text-[11px] font-semibold ${rateClass(
                        rate
                      )}`}
                    >
                      {rate}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer helper text */}
          <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">
            These are{" "}
            <span className="text-neutral-300">
              structural consistency signals
            </span>{" "}
            only – tap other clubs in the table to compare profiles. Full Neeko+
            will later add{" "}
            <span className="text-neutral-300">
              AI matchup overlays &amp; usage trends
            </span>{" "}
            on top of this base grid.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeamInsightsPanel;