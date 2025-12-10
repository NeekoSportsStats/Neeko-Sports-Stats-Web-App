// src/components/afl/teams/TeamMasterTable.tsx
import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Lock, Search, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { MOCK_TEAMS, TeamRow, ROUND_LABELS } from "./mockTeams";
import TeamInsightsPanel from "./TeamInsightsPanel";

/* -------------------------------------------------------------------------- */
/*                                HELPERS                                     */
/* -------------------------------------------------------------------------- */

export type Mode = "scoring" | "fantasy" | "disposals" | "goals";

export const MODE_CONFIG: Record<
  Mode,
  { label: string; subtitle: string; hits: number[] }
> = {
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

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
const avg = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0);

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

  const teams = useMemo(() => {
    const enriched = MOCK_TEAMS.map((t) => ({
      ...t,
      totalScoring: sum(t.scores),
    }));
    enriched.sort((a, b) => b.totalScoring - a.totalScoring);
    return enriched;
  }, []);

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
      <section className="mt-10 rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-950/90 via-black to-black px-4 py-6 shadow-[0_0_70px_rgba(0,0,0,0.85)] md:px-6">
        {/* --------------------- HEADER --------------------- */}
        <div className="flex flex-col gap-4 md:flex-row md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-yellow-200">
                Team Master Table
              </span>
            </div>

            <h1 className="mt-3 text-xl font-semibold text-neutral-50 md:text-2xl">
              Season {MODE_CONFIG[mode].label.toLowerCase()} ledger &amp; hit-rate grid
            </h1>

            <p className="mt-2 max-w-xl text-xs text-neutral-400">
              Full AFL club dataset with round-by-round output, summary statistics and
              hit-rate milestones. Mode:{" "}
              <span className="font-semibold text-neutral-100">
                {MODE_CONFIG[mode].label}
              </span>{" "}
              – {MODE_CONFIG[mode].subtitle}.
            </p>
          </div>

          {/* Mode filter pills + compact toggle */}
          <div className="flex flex-col gap-3 md:items-end">
            <div className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-black/70 px-1.5 py-1">
              {(Object.keys(MODE_CONFIG) as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.16em] transition ${
                    mode === m
                      ? "bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,0.6)]"
                      : "text-neutral-300 hover:bg-neutral-800"
                  }`}
                >
                  {MODE_CONFIG[m].label}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-black/70 px-3 py-1.5">
              <Switch
                checked={compactMode}
                onCheckedChange={setCompactMode}
                className="data-[state=checked]:bg-yellow-400"
              />
              <span className="text-[11px] text-neutral-100">
                Compact (hide rounds)
              </span>
            </div>
          </div>
        </div>

        {/* --------------------- SEARCH + ROUND FILTER --------------------- */}
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              disabled={!isPremium}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isPremium ? "Search clubs…" : "Search clubs (Neeko+ only)"
              }
              className={`w-full rounded-full border bg-black/80 py-2.5 pl-9 pr-20 text-xs text-neutral-100 placeholder-neutral-500 ${
                isPremium
                  ? "border-neutral-700 focus:border-yellow-400 focus:outline-none"
                  : "border-neutral-800 cursor-not-allowed"
              }`}
            />
            {!isPremium && (
              <div className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full border border-yellow-500/60 bg-black/90 px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-yellow-200">
                <Lock className="h-3 w-3" />
                Neeko+
              </div>
            )}
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-neutral-300"
          >
            Round
            <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-neutral-100">
              All rounds
            </span>
            <Lock className="h-3 w-3 text-yellow-400" />
          </button>
        </div>

        {/* --------------------- DESKTOP TABLE --------------------- */}
        <div className="mt-6 hidden w-full overflow-x-auto border-t border-neutral-900 md:block">
          <table className="min-w-[1120px] border-separate border-spacing-0 text-[11px]">
            <thead>
              <tr className="sticky top-0 z-20 bg-gradient-to-b from-black/95 to-black/90">
                <th className="sticky left-0 z-30 w-64 border-r border-neutral-900 bg-black/95 px-4 py-2 text-left text-[11px] font-medium tracking-[0.16em] text-neutral-400">
                  TEAM
                </th>

                {/* Rounds when not compact */}
                {!compactMode &&
                  ROUND_LABELS.map((round) => (
                    <th
                      key={round}
                      className="border-b border-neutral-900 px-2 py-2 text-center text-[10px] font-medium tracking-[0.14em] text-neutral-500"
                    >
                      {round}
                    </th>
                  ))}

                {/* Summary & hits when compact */}
                {compactMode && (
                  <>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-neutral-500">
                      MIN
                    </th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-neutral-500">
                      MAX
                    </th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-neutral-500">
                      AVG
                    </th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-neutral-500">
                      TOTAL
                    </th>
                    {thresholds.map((t) => (
                      <th
                        key={t}
                        className="px-2 py-2 text-center text-[10px] font-medium text-neutral-500"
                      >
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
                const blurLocked = !isPremium && index >= 6;

                return (
                  <tr
                    key={team.id}
                    className={`border-b border-neutral-900 text-neutral-200 transition-colors hover:bg-neutral-900/60 ${
                      blurLocked ? "pointer-events-none opacity-60 blur-[2px]" : ""
                    }`}
                    onClick={() => !blurLocked && setSelectedTeam(team)}
                  >
                    {/* TEAM CELL */}
                    <td className="sticky left-0 z-10 flex w-64 items-center gap-3 border-r border-neutral-900 bg-black/95 px-4 py-2.5">
                      <span className="text-[11px] text-neutral-500">
                        {index + 1}
                      </span>
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          background: team.colours.primary,
                          boxShadow: `0 0 10px ${team.colours.primary}`,
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium">
                          {team.name}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                          {team.code}
                        </span>
                      </div>
                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-neutral-500" />
                    </td>

                    {/* FULL ROUNDS */}
                    {!compactMode &&
                      series.map((v, i) => (
                        <td
                          key={i}
                          className="px-2 py-2.5 text-center text-[11px] text-neutral-200"
                        >
                          {v}
                        </td>
                      ))}

                    {/* COMPACT SUMMARY */}
                    {compactMode && (
                      <>
                        <td className="px-2 py-2 text-center text-neutral-200">
                          {summary.min}
                        </td>
                        <td className="px-2 py-2 text-center text-neutral-200">
                          {summary.max}
                        </td>
                        <td className="px-2 py-2 text-center text-yellow-200">
                          {summary.average}
                        </td>
                        <td className="px-2 py-2 text-center text-neutral-200">
                          {summary.total}
                        </td>
                        {hits.map((h, i) => (
                          <td
                            key={i}
                            className={`px-2 py-2 text-center font-medium ${rateClass(
                              h
                            )}`}
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

        {/* ------------------------- MOBILE VIEWS -------------------------- */}
        <div className="mt-6 md:hidden">
          {/* COMPACT ON → summary / hit-rate table, horizontal scroll */}
          {compactMode ? (
            <div className="-mx-3 overflow-x-auto px-1 pb-1">
              <table className="min-w-[640px] w-full border-separate border-spacing-0 text-[11px]">
                <thead>
                  <tr className="bg-black/90">
                    <th className="w-32 px-3 py-2 text-left text-[10px] font-medium tracking-[0.16em] text-neutral-400">
                      TEAM
                    </th>
                    <th className="px-2 py-2 text-right text-[10px] text-neutral-500">
                      MIN
                    </th>
                    <th className="px-2 py-2 text-right text-[10px] text-neutral-500">
                      MAX
                    </th>
                    <th className="px-2 py-2 text-right text-[10px] text-neutral-500">
                      AVG
                    </th>
                    <th className="px-2 py-2 text-right text-[10px] text-neutral-500">
                      TOTAL
                    </th>
                    {thresholds.map((t) => (
                      <th
                        key={t}
                        className="px-2 py-2 text-right text-[10px] text-neutral-500"
                      >
                        {t}+
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((team, index) => {
                    const series = getSeries(team, mode);
                    const summary = computeSummary(series);
                    const hits = computeHitRate(series, thresholds);
                    const blurLocked = !isPremium && index >= 6;

                    return (
                      <tr
                        key={team.id}
                        className={`border-b border-neutral-900 text-neutral-200 ${
                          blurLocked ? "opacity-60 blur-[2px]" : ""
                        }`}
                        onClick={() => !blurLocked && setSelectedTeam(team)}
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-neutral-500">
                              {index + 1}
                            </span>
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: team.colours.primary }}
                            />
                            <span className="text-[12px]">{team.name}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-right">{summary.min}</td>
                        <td className="px-2 py-2 text-right">{summary.max}</td>
                        <td className="px-2 py-2 text-right text-yellow-200">
                          {summary.average}
                        </td>
                        <td className="px-2 py-2 text-right">{summary.total}</td>
                        {hits.map((h, i) => (
                          <td
                            key={i}
                            className={`px-2 py-2 text-right font-medium ${rateClass(
                              h
                            )}`}
                          >
                            {h}%
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* COMPACT OFF → card list (screenshot version) */
            <div className="flex flex-col gap-3">
              {filteredTeams.map((team, index) => {
                const series = getSeries(team, mode);
                const summary = computeSummary(series);
                const hits = computeHitRate(series, thresholds);
                const blurLocked = !isPremium && index >= 6;

                const mainThresholdIndex =
                  thresholds.length >= 3 ? 2 : thresholds.length - 1;
                const mainThreshold = thresholds[mainThresholdIndex];
                const mainHit = hits[mainThresholdIndex];

                return (
                  <button
                    key={team.id}
                    onClick={() => !blurLocked && setSelectedTeam(team)}
                    className="relative flex items-center justify-between rounded-xl border border-neutral-800 bg-black/80 px-3 py-3 shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700 text-[11px] text-neutral-200">
                        {index + 1}
                      </div>
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: team.colours.primary,
                              boxShadow: `0 0 10px ${team.colours.primary}`,
                            }}
                          />
                          <span className="text-[13px] text-neutral-50">
                            {team.name}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                          {team.code} • Avg {summary.average.toFixed(1)} • Max{" "}
                          {summary.max}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="block text-[10px] text-neutral-500 uppercase tracking-[0.16em]">
                          {mainThreshold}+ hit
                        </span>
                        <span
                          className={`text-xs font-semibold ${rateClass(
                            mainHit
                          )}`}
                        >
                          {mainHit}%
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-neutral-500" />
                    </div>

                    {blurLocked && (
                      <div className="pointer-events-none absolute inset-0 rounded-xl bg-black/80 backdrop-blur-sm" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* --------------------- BOTTOM CTA (NON-PREMIUM) --------------------- */}
        {!isPremium && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              className="group rounded-full border-yellow-500/60 bg-black/80 px-5 py-2 text-[11px] uppercase tracking-[0.18em] text-yellow-200 hover:bg-yellow-400 hover:text-black hover:shadow-[0_0_25px_rgba(250,204,21,0.8)]"
            >
              <span className="mr-2">Unlock full club table</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/60 bg-black/60 px-2 py-0.5 text-[9px]">
                <Lock className="h-3 w-3" />
                Neeko+
              </span>
            </Button>
          </div>
        )}
      </section>

      {/* ------------------------ INSIGHTS PANEL PORTAL ------------------------ */}
      {isMounted && selectedTeam &&
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