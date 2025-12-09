// src/components/afl/teams/TeamInsightsPanel.tsx

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AFLTeam } from "./mockTeams";

type Props = {
  team: AFLTeam;
  mode: "scoring" | "fantasy" | "disposals" | "goals";
  modeSummary: {
    min: number;
    max: number;
    total: number;
    average: number;
  } | null;
  modeSeries: number[];
  onClose: () => void;
};

const MODE_LABELS: Record<Props["mode"], string> = {
  scoring: "Scoring",
  fantasy: "Fantasy Points",
  disposals: "Disposals",
  goals: "Goals",
};

// For scoring window — last 8 rounds
function getLastWindow(series: number[], n = 8) {
  return series.slice(-n);
}

export default function TeamInsightsPanel({
  team,
  mode,
  modeSummary,
  modeSeries,
  onClose,
}: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const scoringWindow = getLastWindow(modeSeries, 8);

  return (
    <>
      {/* BACKDROP */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md transition-opacity"
      />

      {/* PANEL — desktop (right-side) / mobile (bottom sheet) */}
      <div
        className={`
          fixed z-[201] bg-gradient-to-b from-black/95 via-neutral-950 to-black
          border border-neutral-800/80 shadow-[0_0_80px_rgba(250,204,21,0.3)]
          transition-all duration-300 ease-out

          ${isMobile
            ? "left-0 right-0 bottom-0 h-[85vh] rounded-t-3xl"
            : "right-0 top-0 h-full w-[420px] rounded-none"}
        `}
      >
        {/* HANDLE (mobile) */}
        {isMobile && (
          <div className="flex justify-center pt-3">
            <div className="h-1.5 w-16 rounded-full bg-neutral-700" />
          </div>
        )}

        {/* HEADER */}
        <div
          className={`
            flex items-start justify-between 
            ${isMobile ? "px-6 pt-4 pb-2" : "px-8 pt-8 pb-4"}
          `}
        >
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-300">
              Team Insights
            </h2>
            <div className="mt-1 text-2xl font-semibold text-neutral-50">
              {team.name}
            </div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">
              {team.code}
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 hover:text-yellow-300 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* SCROLL AREA */}
        <div
          className={`
            overflow-y-auto
            ${isMobile ? "px-6 pb-20" : "px-8 pb-10"}
            scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent
          `}
        >
          {/* SCORING WINDOW */}
          <div className="mt-4 rounded-2xl border border-neutral-800/70 bg-gradient-to-b from-black/80 to-neutral-950 px-4 py-4 shadow-inner">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  {MODE_LABELS[mode]} Window
                </div>
                <div className="mt-1 text-xs text-neutral-300">
                  Last 8 rounds – form line & stability.
                </div>
              </div>
              <div className="text-xl font-semibold text-yellow-200">
                {modeSummary?.average.toFixed(1)}
              </div>
            </div>

            {/* WINDOW VALUES */}
            <div className="mt-4 flex flex-wrap gap-2">
              {scoringWindow.map((v, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-neutral-800/70 bg-neutral-900/50 px-2 py-1.5 text-xs text-neutral-200"
                >
                  {v}
                </div>
              ))}
            </div>
          </div>

          {/* MODE STATS */}
          <div className="mt-6 rounded-2xl border border-neutral-800/70 bg-gradient-to-b from-black/90 to-neutral-950 px-4 py-4 shadow-[0_0_30px_rgba(250,204,21,0.1)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              {MODE_LABELS[mode]} Stats
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                  Average
                </div>
                <div className="text-neutral-100 font-semibold">
                  {modeSummary?.average.toFixed(1)}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                  Total
                </div>
                <div className="text-neutral-100 font-semibold">
                  {modeSummary?.total}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                  Min
                </div>
                <div className="text-neutral-100 font-semibold">
                  {modeSummary?.min}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                  Max
                </div>
                <div className="text-neutral-100 font-semibold">
                  {modeSummary?.max}
                </div>
              </div>

              {/* Last 5 rounds */}
              <div className="col-span-2 mt-2">
                <div className="text-[10px] uppercase text-neutral-500">
                  Last 5 rounds
                </div>
                <div className="mt-1 flex gap-2">
                  {modeSeries.slice(-5).map((v, i) => (
                    <span
                      key={i}
                      className="rounded-md border border-neutral-800 bg-neutral-900/70 px-2 py-1 text-xs text-neutral-100"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI SUMMARY (unchanged but enhanced visuals) */}
          <div className="mt-6 rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-black/90 to-black px-4 py-4 shadow-[0_0_40px_rgba(250,204,21,0.15)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-yellow-300">
              AI Summary
            </div>

            <p className="mt-3 text-sm leading-relaxed text-neutral-300">
              {team.name} is showing{" "}
              <span className="font-semibold text-neutral-100">
                high volatility
              </span>{" "}
              in <span className="font-semibold text-neutral-100">{MODE_LABELS[mode].toLowerCase()}</span>{" "}
              over the last few rounds. Current output stabilises around{" "}
              <span className="font-semibold text-neutral-100">
                {modeSummary?.average.toFixed(1)}
              </span>{" "}
              per game. Trend suggests{" "}
              <span className="font-semibold text-neutral-100">neutral–positive territory</span>{" "}
              approaching the next block of fixtures.
            </p>
          </div>

          <div className="h-10" />
        </div>
      </div>
    </>
  );
}
