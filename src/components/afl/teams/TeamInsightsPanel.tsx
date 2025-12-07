// src/components/afl/teams/TeamInsightsPanel.tsx

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { AFLTeam } from "./mockTeams";
import { ROUND_LABELS } from "./TeamMasterTable"; // now exported correctly

/* -------------------------------------------------------------------------- */
/*                 Sparkline placeholder (drop your real one later)           */
/* -------------------------------------------------------------------------- */

function Sparkline({ values }: { values: number[] }) {
  return (
    <div className="h-20 rounded-xl bg-gradient-to-b from-neutral-800/60 to-black shadow-inner" />
  );
}

/* -------------------------------------------------------------------------- */
/*                           INSIGHTS PANEL (FULL)                             */
/* -------------------------------------------------------------------------- */

export default function TeamInsightsPanel({
  team,
  onClose,
}: {
  team: AFLTeam;
  onClose: () => void;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-[420px] bg-black border-l border-yellow-500/40 shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200/90">
              Team Insights
            </div>
            <div className="mt-1 text-lg font-semibold text-neutral-50">
              {team.name}
            </div>
            <div className="text-[11px] text-neutral-500">
              {team.code}
            </div>
          </div>

          <button
            className="rounded-full bg-neutral-900 p-2 text-neutral-300 hover:bg-neutral-800"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sparkline */}
        <div className="mb-5">
          <Sparkline values={team.scores.slice(-12)} />
        </div>

        {/* Round-by-round */}
        <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500 mb-2">
          Last 8 Rounds
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {team.scores.slice(-8).map((value, i) => (
            <div key={i} className="flex flex-col items-center min-w-[42px]">
              <span className="text-[9px] text-neutral-500">{ROUND_LABELS[ROUND_LABELS.length - 8 + i]}</span>
              <div className="mt-1 h-8 w-10 flex items-center justify-center bg-neutral-900 rounded text-[11px] text-neutral-200">
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* AI Section */}
        <div className="mt-6">
          <div className="text-[10px] uppercase tracking-[0.16em] text-yellow-200 mb-2">
            AI Summary
          </div>

          <p className="text-[13px] text-neutral-300 leading-relaxed">
            {team.name} is showing dynamic scoring trends with shifts in clearance
            dominance, defensive cohesion and round-to-round stability indicators.
          </p>
        </div>
      </div>
    </div>
  );
}
