// src/components/afl/teams/TeamMasterTable.tsx
import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Lock, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import { MOCK_TEAMS, TeamRow, ROUND_LABELS } from "./mockTeams";
import TeamInsightsPanel from "./TeamInsightsPanel";

/* -------------------------------------------------------------------------- */
/*                                 HELPERS                                    */
/* -------------------------------------------------------------------------- */

type Mode = "scoring" | "fantasy" | "disposals" | "goals";

const MODE_CONFIG = {
  scoring: { label: "Scoring", subtitle: "Total points per game", hits: [60, 70, 80, 90, 100] },
  fantasy: { label: "Fantasy", subtitle: "Fantasy points per game", hits: [80, 90, 100, 110, 120] },
  disposals: { label: "Disposals", subtitle: "Total disposals per game", hits: [15, 20, 25, 30, 35] },
  goals: { label: "Goals", subtitle: "Goals per game", hits: [1, 2, 3, 4, 5] },
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
  return thresholds.map(
    (t) => Math.round((series.filter((v) => v >= t).length / series.length) * 100)
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
/*                                COMPONENT                                   */
/* -------------------------------------------------------------------------- */

export default function TeamMasterTable() {
  const { isPremium } = useAuth();

  const [mode, setMode] = useState<Mode>("scoring");
  const [compactMode, setCompactMode] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamRow | null>(null);
  const [search, setSearch] = useState("");

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  /* ---------------- BODY SCROLL LOCK (panel open) ---------------- */
  useEffect(() => {
    if (selectedTeam) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedTeam]);

  /* ---------------- COMPUTED TEAMS ---------------- */
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
      <section className="mt-14 rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-950 via-black to-black px-5 py-5 shadow-[0_0_80px_rgba(0,0,0,0.8)]">

        {/* ---------------- HEADER ---------------- */}
        <div className="flex flex-col gap-4 md:flex-row md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-yellow-200">
                Team Master Table
              </span>
            </div>

            <h1 className="mt-3 text-xl font-semibold text-neutral-50 md:text-2xl">
              Season {MODE_CONFIG[mode].label.toLowerCase()} ledger & hit-rate grid
            </h1>

            <p className="mt-2 text-xs text-neutral-400 max-w-xl">
              Full AFL club dataset with round-by-round output, summary statistics and hit-rate milestones. Mode:{" "}
              <b>{MODE_CONFIG[mode].label}</b> – {MODE_CONFIG[mode].subtitle}.
            </p>
          </div>

          {/* MODE SELECTOR + COMPACT SWITCH */}
          <div className="flex flex-col gap-3 md:items-end">
            <div className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-black/70 px-1.5 py-1">
              {(["scoring", "fantasy", "disposals", "goals"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.16em] ${
                    m === mode
                      ? "bg-yellow-400 text-black shadow-[0_0_20px_rgba(250,204,21,0.5)]"
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
              <span className="text-[11px] text-neutral-100">Compact (hide rounds)</span>
            </div>
          </div>
        </div>

        {/* ---------------- SEARCH ---------------- */}
        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              disabled={!isPremium}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isPremium ? "Search clubs…" : "Search clubs (Neeko+ only)"}
              className={`w-full h-9 rounded-full border bg-black/70 pl-9 pr-16 text-xs text-neutral-100 ${
                isPremium ? "border-neutral-700" : "border-neutral-800 cursor-not-allowed"
              }`}
            />
            {!isPremium && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-yellow-300 uppercase flex items-center gap-1 border border-yellow-500/50 bg-black/80 px-2 py-0.5 rounded-full">
                <Lock className="h-3 w-3" /> Neeko+
              </div>
            )}
          </div>

          <button className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-black/70 px-3 py-1.5 text-[10px] uppercase text-neutral-300">
            Round <span className="text-neutral-100">All rounds</span>
            <Lock className="h-3 w-3 text-yellow-400" />
          </button>
        </div>

        {/* ---------------- TABLE (DESKTOP) ---------------- */}
        <div className="hidden md:block mt-6 -mx-5 border-t border-neutral-900">
          <div className="overflow-x-auto w-full">
            <table className="min-w-[1080px] text-[11px] border-separate border-spacing-0">
              <thead>
                <tr className="sticky top-0 bg-black/85 backdrop-blur-sm">
                  <th className="sticky left-0 z-40 w-64 px-4 py-3 text-left text-neutral-300 bg-black/90 border-r border-neutral-900">
                    TEAM
                  </th>

                  {!compactMode &&
                    ROUND_LABELS.map((r) => (
                      <th
                        key={r}
                        className="border-b border-neutral-800 px-2 py-3 text-[10px] text-neutral-400 min-w-[48px]"
                      >
                        {r}
                      </th>
                    ))}

                  <th className="w-14 text-right px-2 py-3">MIN</th>
                  <th className="w-14 text-right px-2 py-3">MAX</th>
                  <th className="w-14 text-right px-2 py-3">AVG</th>
                  <th className="w-16 text-right px-2 py-3">TOTAL</th>

                  {thresholds.map((t) => (
                    <th key={t} className="w-14 text-right px-2 py-3">
                      {t}+
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredTeams.map((team, index) => {
                  const series = getSeries(team, mode);
                  const summary = computeSummary(series);
                  const hit = computeHitRate(series, thresholds);
                  const blur = !isPremium && index >= 6;

                  return (
                    <tr
                      key={team.id}
                      className="border-b border-neutral-900 hover:bg-neutral-900/50 text-neutral-200"
                    >
                      <td
                        className={`sticky left-0 z-20 w-64 bg-black/90 border-r border-neutral-900 px-4 ${
                          compactMode ? "py-1.5" : "py-3"
                        }`}
                      >
                        <button
                          onClick={() => setSelectedTeam(team)}
                          className="group flex w-full items-center gap-3"
                        >
                          <div className="h-7 w-7 flex items-center justify-center rounded-full border border-neutral-700 bg-black/70 text-xs">
                            {index + 1}
                          </div>

                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{
                                  backgroundColor: team.colours.primary,
                                  boxShadow: `0 0 10px ${team.colours.primary}`,
                                }}
                              />
                              <span className="text-[13px] font-medium">{team.name}</span>
                            </div>
                            <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                              {team.code}
                            </span>
                          </div>

                          <ChevronRight className="ml-auto h-4 w-4 text-neutral-500 group-hover:text-yellow-300" />
                        </button>

                        {blur && (
                          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-lg">
                            <div className="absolute bottom-2 right-2 text-[9px] text-yellow-200 flex items-center gap-1 border border-yellow-500/50 px-2 py-0.5 rounded-full bg-black/80">
                              <Lock className="h-3 w-3" /> Neeko+
                            </div>
                          </div>
                        )}
                      </td>

                      {!compactMode &&
                        series.map((v, i) => (
                          <td
                            key={i}
                            className={`px-2 py-3 text-center ${
                              blur ? "blur-[2px] brightness-[0.8]" : ""
                            }`}
                          >
                            {v}
                          </td>
                        ))}

                      <td className="px-2 py-3 text-right">{summary.min}</td>
                      <td className="px-2 py-3 text-right">{summary.max}</td>
                      <td className="px-2 py-3 text-right text-yellow-200">
                        {summary.average}
                      </td>
                      <td className="px-2 py-3 text-right">{summary.total}</td>

                      {hit.map((v, i) => (
                        <td key={i} className={`px-2 py-3 text-right ${rateClass(v)}`}>
                          {v}%
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---------------- MOBILE LIST ---------------- */}
        <div className="md:hidden mt-6 flex flex-col gap-3">
          {filteredTeams.map((team, index) => {
            const series = getSeries(team, mode);
            const summary = computeSummary(series);
            const hit = computeHitRate(series, thresholds);
            const blur = !isPremium && index >= 6;

            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className="relative flex items-center justify-between px-4 py-4 rounded-xl bg-black/80 border border-neutral-800 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 flex items-center justify-center rounded-full border border-neutral-700 text-xs">
                    {index + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: team.colours.primary,
                          boxShadow: `0 0 10px ${team.colours.primary}`,
                        }}
                      />
                      <span className="text-[13px] text-neutral-50">{team.name}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                      {team.code} • Avg {summary.average} • Max {summary.max}
                    </span>
                  </div>
                </div>

                <div className="text-right mr-2">
                  <span className="block text-[10px] text-neutral-500 uppercase tracking-wider">
                    {thresholds[2]}+ hit
                  </span>
                  <span className={`text-xs font-semibold ${rateClass(hit[2])}`}>
                    {hit[2]}%
                  </span>
                </div>

                <ChevronRight className="h-4 w-4 text-neutral-500" />

                {blur && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-xl" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------------- PANEL PORTAL ---------------- */}
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
