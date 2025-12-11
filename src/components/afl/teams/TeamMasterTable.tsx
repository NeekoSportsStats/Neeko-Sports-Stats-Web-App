// src/components/afl/teams/TeamMasterTable.tsx

import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Sparkles } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/lib/auth";
import { MOCK_TEAMS, TeamRow, ROUND_LABELS } from "./mockTeams";

import TeamInsightsPanel from "./TeamInsightsPanel";

/* -------------------------------------------------------------------------- */
/*                           TYPES & CONFIG                                   */
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

/* -------------------------------------------------------------------------- */
/*                         TEAM MODE HELPERS                                  */
/* -------------------------------------------------------------------------- */

function getModeSeries(team: TeamRow, mode: Mode): number[] {
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
}

function computeSummary(series: number[]) {
  if (!series.length) {
    return { min: 0, max: 0, average: 0, total: 0, games: 0 };
  }

  const clean = series.filter((v) => typeof v === "number");
  if (!clean.length) {
    return { min: 0, max: 0, average: 0, total: 0, games: 0 };
  }

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const total = clean.reduce((a, b) => a + b, 0);
  const games = clean.length;
  const average = +(total / games).toFixed(1);

  return { min, max, total, games, average };
}

function computeHitRates(series: number[], mode: Mode): number[] {
  const clean = series.filter((v) => typeof v === "number");
  const games = clean.length || 1;
  const thresholds = MODE_CONFIG[mode].hits;

  return thresholds.map((t) => {
    const hits = clean.filter((v) => v >= t).length;
    return Math.round((hits / games) * 100);
  });
}

function getHitRateColorClasses(v: number) {
  if (v === 100) return "text-lime-300";
  if (v >= 80) return "text-lime-200";
  if (v >= 60) return "text-yellow-300";
  if (v >= 40) return "text-amber-300";
  if (v >= 20) return "text-orange-300";
  return "text-red-400";
}

/* -------------------------------------------------------------------------- */
/*                         MOBILE TEAM CARD                                   */
/* -------------------------------------------------------------------------- */

const TeamCardMobile = ({
  team,
  mode,
  index,
  onOpenInsights,
  blurClass = "",
}: {
  team: TeamRow;
  mode: Mode;
  index: number;
  blurClass?: string;
  onOpenInsights: () => void;
}) => {
  const series = getModeSeries(team, mode);
  const summary = computeSummary(series);

  return (
    <div
      className={`relative rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-black/95 to-black px-4 py-3 shadow-[0_0_30px_#000] ${blurClass}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700/80 bg-black/80"
            style={{ boxShadow: `0 0 10px ${team.colours.primary}60` }}
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: team.colours.primary,
                boxShadow: `0 0 8px ${team.colours.primary}`,
              }}
            />
          </div>

          <div>
            <div className="text-[13px] font-medium text-neutral-50">
              {team.name}
            </div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">
              {team.code}
            </div>
          </div>
        </div>

        <div className="text-right text-[11px]">
          <div className="text-[10px] text-neutral-500 uppercase tracking-[0.14em]">
            {MODE_CONFIG[mode].label} avg
          </div>
          <div className="text-sm font-semibold text-yellow-200">
            {summary.average}{" "}
            {MODE_CONFIG[mode].subtitle.includes("points") ? "pts" : ""}
          </div>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
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

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-neutral-400">
          Tap for detailed team insights.
        </span>

        <Button
          onClick={onOpenInsights}
          size="sm"
          className="rounded-full bg-yellow-400 text-black px-3 py-1 text-[11px] font-semibold shadow-[0_0_18px_rgba(250,204,21,0.8)]"
        >
          Insights
        </Button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                MAIN TABLE                                  */
/* -------------------------------------------------------------------------- */

export default function TeamMasterTable() {
  const { isPremium } = useAuth();

  const [selectedMode, setSelectedMode] = useState<Mode>("scoring");
  const [compactMode, setCompactMode] = useState(false);
  const [search, setSearch] = useState("");

  const [selectedTeam, setSelectedTeam] = useState<TeamRow | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const teams = useMemo(() => MOCK_TEAMS, []);

  const filteredTeams = useMemo(() => {
    let list = [...teams];
    if (search.trim()) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.code.toLowerCase().includes(search.toLowerCase())
      );
    }
    return list;
  }, [teams, search]);

  return (
    <>
      {/* HEADER */}
      <div className="rounded-3xl border border-neutral-800 bg-black/90 px-5 py-4 shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-yellow-200">
                Team Master Table
              </span>
            </div>

            <h3 className="mt-3 text-xl font-semibold text-neutral-50 md:text-2xl">
              Full-season team ledger &amp; hit-rate engine
            </h3>

            <p className="mt-2 max-w-lg text-xs text-neutral-400">
              Complete club-level trends, hit-rates, volatility and AI metrics.
            </p>
          </div>

          {/* Mode pills + controls */}
          <div className="flex flex-1 flex-col gap-3 md:items-end">
            <div className="flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1 text-[11px]">
              {(Object.keys(MODE_CONFIG) as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMode(m)}
                  className={`rounded-full px-3 py-1.5 ${
                    selectedMode === m
                      ? "bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,0.8)]"
                      : "bg-neutral-900 text-neutral-300"
                  }`}
                >
                  {MODE_CONFIG[m].label}
                </button>
              ))}
            </div>

            {/* Compact toggle (desktop only) */}
            <div className="hidden items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-3 py-1.5 md:flex">
              <Switch
                checked={compactMode}
                onCheckedChange={setCompactMode}
                className="data-[state=checked]:bg-yellow-400"
              />
              <span className="text-[11px] text-neutral-100">
                Compact row height &amp; summary-only
              </span>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px]">
              <Search className="h-3.5 w-3.5 text-neutral-500" />
              <input
                type="text"
                value={search}
                placeholder="Search teams…"
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-neutral-200 placeholder:text-neutral-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE GRID */}
      <div className="mt-8 md:hidden">
        <div className="space-y-3">
          {filteredTeams.map((team, index) => {
            const blur =
              !isPremium && index >= 8
                ? "blur-[3px] brightness-[0.6] pointer-events-none"
                : "";

            return (
              <TeamCardMobile
                key={team.id}
                team={team}
                index={index}
                mode={selectedMode}
                blurClass={blur}
                onOpenInsights={() => setSelectedTeam(team)}
              />
            );
          })}
        </div>
      </div>

      {/* DESKTOP TABLE – 3-ZONE FREEZE */}
      <div className="mt-8 hidden md:block">
        <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-black/90 shadow-xl">
          <div className="relative max-h-[520px] overflow-y-auto">
            <div className="overflow-x-auto">
              <table className="min-w-full text-[11px]">
                <thead className="sticky top-0 z-20 bg-neutral-950/95 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  <tr>
                    {/* ZONE 1: Sticky left identity */}
                    <th
                      className="sticky left-0 z-30 border-r border-neutral-800 bg-neutral-950/95 px-4 py-3 text-left"
                      style={{ minWidth: 220 }}
                    >
                      Team
                    </th>

                    {/* ZONE 2: Rounds (scrollable middle) */}
                    {!compactMode &&
                      ROUND_LABELS.map((label) => (
                        <th
                          key={label}
                          className="border-r border-neutral-900 px-2 py-3 text-center text-[9px]"
                        >
                          {label}
                        </th>
                      ))}

                    {/* ZONE 3: Sticky right summary + hit-rates + CTA */}
                    <th
                      className="sticky right-0 z-30 border-l border-neutral-800 bg-neutral-950/95 px-4 py-3 text-right"
                      style={{ minWidth: 260 }}
                    >
                      <span className="text-[9px] tracking-[0.18em] text-neutral-400">
                        SUMMARY &amp; HIT-RATE
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((team, index) => {
                    const series = getModeSeries(team, selectedMode);
                    const { min, max, total, games, average } =
                      computeSummary(series);
                    const hitRates = computeHitRates(series, selectedMode);

                    const rowPad = compactMode ? "py-2" : "py-3";
                    const isBlurred = !isPremium && index >= 8;

                    return (
                      <tr
                        key={team.id}
                        onClick={() =>
                          !isBlurred ? setSelectedTeam(team) : null
                        }
                        className={`border-t border-neutral-800/70 hover:bg-neutral-900/60 ${rowPad} ${
                          isBlurred
                            ? "blur-[3px] brightness-[0.6] pointer-events-none"
                            : "cursor-pointer"
                        }`}
                      >
                        {/* ZONE 1: Sticky left identity cell */}
                        <td
                          className="sticky left-0 z-10 border-r border-neutral-800 bg-black/95 px-4 align-middle"
                          style={{ minWidth: 220 }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700/80 bg-black/80"
                              style={{
                                boxShadow: `0 0 10px ${team.colours.primary}60`,
                              }}
                            >
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor: team.colours.primary,
                                  boxShadow: `0 0 8px ${team.colours.primary}`,
                                }}
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[12px] font-medium text-neutral-50">
                                {team.name}
                              </span>
                              <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                                {team.code}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* ZONE 2: Rounds (raw ledger) */}
                        {!compactMode &&
                          ROUND_LABELS.map((label, roundIndex) => (
                            <td
                              key={label}
                              className="border-r border-neutral-900 px-2 text-center align-middle text-[10px] text-neutral-100"
                            >
                              {series[roundIndex] ?? "-"}
                            </td>
                          ))}

                        {/* ZONE 3: Sticky right summary + hit-rates + CTA */}
                        <td
                          className="sticky right-0 z-10 border-l border-neutral-800 bg-black/95 px-4 align-middle"
                          style={{ minWidth: 260 }}
                        >
                          <div className="flex flex-col items-end gap-1">
                            {/* Summary row */}
                            <div className="flex gap-3 text-[10px] text-neutral-400">
                              <span>MIN</span>
                              <span>MAX</span>
                              <span>AVG</span>
                              <span>TOTAL</span>
                              <span>GMS</span>
                            </div>
                            <div className="flex gap-3 text-[11px]">
                              <span className="text-neutral-100">{min}</span>
                              <span className="text-neutral-100">{max}</span>
                              <span className="text-yellow-200">
                                {average}{" "}
                                {MODE_CONFIG[
                                  selectedMode
                                ].subtitle.includes("points")
                                  ? "pts"
                                  : ""}
                              </span>
                              <span className="text-neutral-100">{total}</span>
                              <span className="text-neutral-100">{games}</span>
                            </div>

                            {/* Hit-rate row */}
                            <div className="mt-1 flex flex-wrap items-center justify-end gap-2">
                              {MODE_CONFIG[selectedMode].hits.map(
                                (threshold, i) => {
                                  const hit = hitRates[i] ?? 0;
                                  return (
                                    <div
                                      key={threshold}
                                      className="flex flex-col items-center"
                                    >
                                      <span className="text-[9px] text-neutral-500">
                                        {threshold}+
                                      </span>
                                      <span
                                        className={`text-[11px] font-semibold ${getHitRateColorClasses(
                                          hit
                                        )}`}
                                      >
                                        {hit}%
                                      </span>
                                    </div>
                                  );
                                }
                              )}

                              <button className="ml-2 rounded-full bg-yellow-400/90 px-3 py-1 text-[10px] font-semibold text-black shadow-[0_0_16px_rgba(250,204,21,0.7)] hover:bg-yellow-300">
                                View
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-neutral-800 px-4 py-2 text-[10px] text-neutral-500">
            <span>
              Showing {filteredTeams.length} clubs • Mode:{" "}
              <span className="text-yellow-200">
                {MODE_CONFIG[selectedMode].label}
              </span>
            </span>
            {isPremium ? (
              <span>Click any row for full team insights.</span>
            ) : (
              <span>Neeko+ unlocks deeper hit-rate &amp; volatility tools.</span>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-yellow-200">
          <Sparkles className="h-3 w-3" />
          <span>Neeko+ Team Engine</span>
        </div>

        <p className="max-w-lg text-xs text-neutral-300">
          Unlock deeper club analytics, advanced volatility models and AI
          analysis.
        </p>

        <Button
          size="lg"
          className="rounded-full bg-yellow-400 text-black px-7 py-2 text-sm font-semibold shadow-[0_0_30px_rgba(250,204,21,0.8)] hover:bg-yellow-300"
        >
          Get Neeko+
        </Button>
      </div>

      {/* INSIGHTS PANEL */}
      {mounted &&
        selectedTeam &&
        createPortal(
          <TeamInsightsPanel
            team={selectedTeam}
            mode={selectedMode}
            onClose={() => setSelectedTeam(null)}
          />,
          document.body
        )}
    </>
  );
}