// src/components/afl/teams/TeamMasterTable.tsx

import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Lock, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

import {
  MOCK_TEAMS,
  TeamRow,
  ROUND_LABELS
} from "./mockTeams";

import TeamInsightsPanel from "./TeamInsightsPanel";

/* -------------------------------------------------------------------------- */
/*                                MODE CONFIG                                */
/* -------------------------------------------------------------------------- */

export const MODE_CONFIG = {
  scoring: {
    label: "Scoring",
    subtitle: "Total points per game",
    hits: [60, 70, 80, 90, 100],
  },
  fantasy: {
    label: "Fantasy",
    subtitle: "Fantasy points per game",
    hits: [80, 90, 100, 110, 120],
  },
  disposals: {
    label: "Disposals",
    subtitle: "Total disposals per game",
    hits: [15, 20, 25, 30, 35],
  },
  goals: {
    label: "Goals",
    subtitle: "Goals per game",
    hits: [1, 2, 3, 4, 5],
  },
};

type Mode = keyof typeof MODE_CONFIG;

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
const avg = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0);

/* Round series getter */
function getSeries(team: TeamRow, mode: Mode): number[] {
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
}

function computeSummary(series: number[]) {
  return {
    min: Math.min(...series),
    max: Math.max(...series),
    average: +(avg(series).toFixed(1)),
    total: sum(series),
  };
}

function computeHitRate(series: number[], thresholds: number[]) {
  return thresholds.map((t) =>
    Math.round((series.filter((v) => v >= t).length / series.length) * 100)
  );
}

function rateClass(v: number) {
  if (v >= 90) return "text-lime-300";
  if (v >= 75) return "text-yellow-200";
  if (v >= 50) return "text-amber-300";
  if (v >= 15) return "text-orange-300";
  return "text-red-400";
}

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */

export default function TeamMasterTable() {
  const { isPremium } = useAuth();

  const [mode, setMode] = useState<Mode>("scoring");
  const [compactMode, setCompactMode] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamRow | null>(null);
  const [search, setSearch] = useState("");

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  /* Sort teams */
  const teams = useMemo(() => {
    const enriched = MOCK_TEAMS.map((t) => ({
      ...t,
      totalScoring: sum(t.scores),
    }));
    enriched.sort((a, b) => b.totalScoring - a.totalScoring);
    return enriched;
  }, []);

  /* Filter (premium only) */
  const filteredTeams = useMemo(() => {
    if (!isPremium || !search.trim()) return teams;
    const q = search.toLowerCase();
    return teams.filter(
      (t) => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q)
    );
  }, [search, teams, isPremium]);

  const thresholds = MODE_CONFIG[mode].hits;

  return (
    <>
      {/* SEARCH + COMPACT TOGGLE */}
      <div className="mt-6 mb-4 flex items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <input
            disabled={!isPremium}
            className="w-full rounded-md bg-neutral-900 py-2 pl-10 pr-3 text-sm text-neutral-200 placeholder-neutral-600"
            placeholder={
              isPremium ? "Search clubs..." : "Search (Neeko+ only)"
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400">Compact (hide rounds)</span>
          <Switch checked={compactMode} onCheckedChange={setCompactMode} />
        </div>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block mt-6 -mx-5 border-t border-neutral-900">
        <div className="overflow-x-auto w-full">
          <table className="min-w-[1080px] text-[11px] border-separate border-spacing-0">
            <thead className="text-neutral-500 bg-neutral-950 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Team</th>

                {!compactMode &&
                  ROUND_LABELS.map((r) => (
                    <th key={r} className="px-2 text-center font-medium">
                      {r}
                    </th>
                  ))}

                {compactMode && (
                  <>
                    <th className="px-2 text-center font-medium">Min</th>
                    <th className="px-2 text-center font-medium">Max</th>
                    <th className="px-2 text-center font-medium">Avg</th>
                    <th className="px-2 text-center font-medium">Total</th>
                    {thresholds.map((t) => (
                      <th key={t} className="px-2 text-center font-medium">
                        {t}+
                      </th>
                    ))}
                  </>
                )}
              </tr>
            </thead>

            <tbody>
              {filteredTeams.map((team, index) => {
                const series = getSeries(team, mode);
                const summary = computeSummary(series);
                const hits = computeHitRate(series, thresholds);

                /* Blur locked teams */
                const blur = !isPremium && index >= 6;

                return (
                  <tr
                    key={team.id}
                    className={`border-b border-neutral-900 hover:bg-neutral-900/50 text-neutral-200 ${
                      blur ? "blur-[3px] pointer-events-none" : ""
                    }`}
                    onClick={() => !blur && setSelectedTeam(team)}
                  >
                    {/* TEAM CELL */}
                    <td className="px-4 py-3 whitespace-nowrap font-medium flex items-center gap-2">
                      {index + 1}

                      {/* Correct colour mapping */}
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: team.colours.primary }}
                      />

                      {team.name}

                      <ChevronRight className="ml-auto h-3 w-3 opacity-40" />
                    </td>

                    {/* FULL ROUNDS */}
                    {!compactMode &&
                      series.map((v, i) => (
                        <td
                          key={i}
                          className="px-2 py-3 text-center text-neutral-300"
                        >
                          {v}
                        </td>
                      ))}

                    {/* COMPACT SUMMARY */}
                    {compactMode && (
                      <>
                        <td className="px-2 py-3 text-center">{summary.min}</td>
                        <td className="px-2 py-3 text-center">{summary.max}</td>
                        <td className="px-2 py-3 text-center">{summary.average}</td>
                        <td className="px-2 py-3 text-center">{summary.total}</td>

                        {hits.map((h, i) => (
                          <td
                            key={i}
                            className={`px-2 py-3 text-center ${rateClass(h)}`}
                          >
                            {h}%
                          </td>
                        ))}
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA (NON-PREMIUM) */}
      {!isPremium && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            className="group rounded-full border-yellow-500/60 bg-black/80 px-5 py-2 text-[11px] uppercase tracking-[0.18em] text-yellow-200 hover:bg-yellow-400 hover:text-black hover:shadow-[0_0_25px_rgba(250,204,21,0.8)]"
          >
            <span className="mr-2">Unlock full club table</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/60 bg-black/60 px-2 py-0.5 text-[9px]">
              <Lock className="h-3 w-3" /> Neeko+
            </span>
          </Button>
        </div>
      )}

      {/* INSIGHTS PANEL */}
      {isMounted &&
        selectedTeam &&
        createPortal(
          <TeamInsightsPanel
            team={selectedTeam}
            mode={mode}
            modeSeries={getSeries(selectedTeam, mode)}
            modeSummary={computeSummary(getSeries(selectedTeam, mode))}
            onClose={() => setSelectedTeam(null)}
          />,
          document.body
        )}
    </>
  );
}
