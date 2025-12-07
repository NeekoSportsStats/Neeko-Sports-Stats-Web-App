// src/components/afl/teams/TeamMasterTable.tsx

import React, { useMemo, useState, useEffect } from "react";
import { ChevronRight, Lock, Search, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

import TeamInsightsPanel from "./TeamInsightsPanel";
import { MOCK_TEAMS, AFLTeam } from "./mockTeams";

// AFL uses 23 rounds + OR
export const ROUND_LABELS = [
  "OR","R1","R2","R3","R4","R5","R6","R7","R8","R9",
  "R10","R11","R12","R13","R14","R15","R16","R17","R18",
  "R19","R20","R21","R22","R23",
];

/* -------------------------------------------------------------------------- */
/*                                CONFIG                                      */
/* -------------------------------------------------------------------------- */

const HIT_THRESHOLDS = [60, 70, 80, 90, 100];

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function computeSummary(team: AFLTeam) {
  const scores = team.scores;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const total = scores.reduce((a, b) => a + b, 0);
  const avg = +(total / scores.length).toFixed(1);
  return { min, max, total, avg };
}

function computeHitRates(team: AFLTeam) {
  const scores = team.scores;
  return HIT_THRESHOLDS.map((t) => {
    const count = scores.filter((s) => s >= t).length;
    return Math.round((count / scores.length) * 100);
  });
}

// Green → Yellow → Red mapping
function getHitRateColor(value: number) {
  if (value >= 100) return "text-emerald-300";
  if (value >= 90) return "text-lime-300";
  if (value >= 75) return "text-lime-200";
  if (value >= 60) return "text-yellow-300";
  if (value >= 30) return "text-amber-300";
  if (value >= 15) return "text-orange-300";
  return "text-red-400";
}

/* -------------------------------------------------------------------------- */
/*                              TABLE CELLS                                    */
/* -------------------------------------------------------------------------- */

function HeaderCell({ children, className }: any) {
  return (
    <th
      className={`border-b border-neutral-800/80 bg-gradient-to-b from-black/98 to-black/94
      px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.16em]
      text-neutral-400 ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function BodyCell({ value, className, compact, blurClass }: any) {
  return (
    <td
      className={`border-b border-neutral-900/80 bg-black/80 px-2.5
      ${compact ? "py-2" : "py-2.5"} text-[11px] text-neutral-200
      ${blurClass ?? ""} ${className ?? ""}`}
    >
      {value}
    </td>
  );
}

/* -------------------------------------------------------------------------- */
/*                            MOBILE TEAM CARD                                 */
/* -------------------------------------------------------------------------- */

function MobileTeamCard({ team, index, blurClass, onOpen }: any) {
  const summary = computeSummary(team);
  const last = team.scores.slice(-6);

  return (
    <div
      className={`relative rounded-2xl border border-neutral-800/80
      bg-gradient-to-b from-black/95 via-black/90 to-black px-4 py-3
      shadow-[0_0_40px_rgba(0,0,0,0.7)] ${blurClass}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full
          border border-neutral-700/80 bg-black/80 text-[11px] text-neutral-200">
            {index + 1}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: team.colours.primary }}
              />
              <span className="text-[13px] font-medium text-neutral-50">
                {team.name}
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
              {team.code}
            </span>
          </div>
        </div>

        <div className="text-right text-[11px] text-neutral-200">
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            Avg score
          </div>
          <div className="mt-0.5 text-sm font-semibold text-yellow-200">
            {summary.avg}
          </div>
        </div>
      </div>

      {/* Last rounds spark blocks */}
      <div className="mt-3 overflow-x-auto">
        <div className="flex gap-2 pb-1">
          {last.map((value, i) => {
            const labelIndex = ROUND_LABELS.length - last.length + i;
            return (
              <div key={i} className="flex min-w-[46px] flex-col items-center">
                <span className="text-[9px] text-neutral-500">
                  {ROUND_LABELS[labelIndex]}
                </span>
                <div
                  className="mt-1 flex h-8 w-10 items-center justify-center
                rounded-md bg-neutral-950/80 text-[11px] text-neutral-100"
                >
                  {value}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-[10px] text-neutral-400">
          Tap insights for full trend analysis.
        </div>

        <Button
          size="sm"
          onClick={onOpen}
          className="rounded-full bg-yellow-400 px-3 py-1 text-[11px]
          font-semibold text-black shadow-[0_0_24px_rgba(250,204,21,0.9)]
          hover:bg-yellow-300"
        >
          View insights
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               MAIN TABLE                                    */
/* -------------------------------------------------------------------------- */

export default function TeamMasterTable() {
  const { isPremium } = useAuth();
  const [compactMode, setCompactMode] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<AFLTeam | null>(null);

  // Sort by total points scored
  const teams = useMemo(() => {
    return [...MOCK_TEAMS].sort((a, b) => {
      const A = a.scores.reduce((x, y) => x + y, 0);
      const B = b.scores.reduce((x, y) => x + y, 0);
      return B - A;
    });
  }, []);

  return (
    <>
      {/* HEADER */}
      <div className="rounded-3xl border border-neutral-800/80 bg-gradient-to-b from-neutral-950/95 via-black/96 to-black px-5 py-4 shadow-[0_0_60px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-gradient-to-r from-yellow-500/15 via-yellow-500/5 to-transparent px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.9)]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
                Team Master Table
              </span>
            </div>
            <h3 className="mt-3 text-xl font-semibold text-neutral-50 md:text-2xl">
              Season scoring ledger & hit-rate grid
            </h3>
            <p className="mt-2 max-w-2xl text-xs text-neutral-400">
              Full AFL club scoring dataset with round-by-round output, summary statistics
              and hit-rate milestones. Sorted by total points scored this season.
            </p>
          </div>

          {/* Desktop compact toggle */}
          <div className="hidden items-center gap-2 rounded-full border border-neutral-700/80 bg-black/80 px-3 py-1.5 md:flex">
            <Switch
              checked={compactMode}
              onCheckedChange={setCompactMode}
              className="data-[state=checked]:bg-yellow-400"
            />
            <span className="text-[11px] font-medium text-neutral-100">
              Compact (hide rounds)
            </span>
          </div>
        </div>

        {/* Search + filters */}
        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="flex flex-1 items-center gap-2 rounded-full border border-neutral-700/80 bg-black/80 px-3 py-1.5 text-[11px] text-neutral-300">
            <Search className="h-3.5 w-3.5 text-yellow-300" />
            <input
              type="text"
              disabled
              placeholder="Search clubs (Neeko+ only)"
              className="w-full bg-transparent text-xs text-neutral-500 placeholder:text-neutral-500 focus:outline-none"
            />
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] text-neutral-300">
              <Lock className="h-3 w-3 text-yellow-300" />
              Neeko+
            </span>
          </div>

          {/* Round filter */}
          <div className="flex items-center gap-2 rounded-full border border-neutral-700/80 bg-black/80 px-3 py-1.5 text-[11px] text-neutral-300">
            <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">
              Round
            </span>
            <button
              type="button"
              disabled
              className="rounded-full bg-neutral-900/80 px-2 py-0.5 text-[11px] text-neutral-100"
            >
              All rounds
            </button>
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] text-neutral-300">
              <Lock className="h-3 w-3 text-yellow-300" />
              Neeko+
            </span>
          </div>
        </div>
      </div>

      {/* DESKTOP TABLE */}
      <div className="mt-8 hidden rounded-3xl border border-neutral-800/80 bg-neutral-950/95 md:block">
        <div className="w-full overflow-x-auto">
          <table className="border-separate border-spacing-0 text-[11px] text-neutral-100 min-w-[1200px]">
            <thead>
              <tr className="sticky top-0 z-20 bg-black/95 backdrop-blur-sm">
                {/* Sticky left team header */}
                <HeaderCell className="sticky left-0 z-30 w-64 border-r border-neutral-900/80 bg-gradient-to-r from-black/98 via-black/94 to-black/80">
                  Team
                </HeaderCell>

                {/* Rounds */}
                {!compactMode &&
                  ROUND_LABELS.map((round) => (
                    <HeaderCell key={round}>{round}</HeaderCell>
                  ))}

                {/* Summary */}
                <HeaderCell className="w-16 text-right">Min</HeaderCell>
                <HeaderCell className="w-16 text-right">Max</HeaderCell>
                <HeaderCell className="w-20 text-right">Avg</HeaderCell>
                <HeaderCell className="w-20 text-right">Total</HeaderCell>

                {/* Hit-rates */}
                {HIT_THRESHOLDS.map((t) => (
                  <HeaderCell className="w-16 text-right" key={t}>
                    {t}+
                  </HeaderCell>
                ))}
              </tr>
            </thead>

            <tbody>
              {teams.map((team, index) => {
                const summary = computeSummary(team);
                const hitRates = computeHitRates(team);

                const blurClass =
                  !isPremium && index >= 3
                    ? "blur-[3px] brightness-[0.65]"
                    : "";

                return (
                  <tr
                    key={team.id}
                    className="hover:bg-neutral-900/55 transition-colors"
                  >
                    {/* Sticky Team Cell */}
                    <td
                      className={`sticky left-0 z-10 w-64 border-b border-neutral-900/80 border-r border-r-neutral-900/80 bg-gradient-to-r from-black/98 via-black/94 to-black/80 px-4 ${
                        compactMode ? "py-2" : "py-2.5"
                      } ${blurClass}`}
                    >
                      <button
                        className="group flex w-full items-center gap-3 text-left"
                        onClick={() => setSelectedTeam(team)}
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700/80 bg-black/80 text-[11px] text-neutral-200">
                          {index + 1}
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: team.colours.primary }}
                          />
                          <div className="flex flex-col">
                            <span className="text-[13px] font-medium text-neutral-50">
                              {team.name}
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                              {team.code}
                            </span>
                          </div>
                        </div>

                        <ChevronRight className="ml-auto h-4 w-4 text-neutral-500 group-hover:text-yellow-300" />
                      </button>
                    </td>

                    {/* Rounds */}
                    {!compactMode &&
                      team.scores.map((v, i) => (
                        <BodyCell key={i} value={v} blurClass={blurClass} compact={compactMode} />
                      ))}

                    {/* Summary */}
                    <BodyCell
                      value={summary.min}
                      className="text-right text-neutral-300"
                      blurClass={blurClass}
                    />
                    <BodyCell
                      value={summary.max}
                      className="text-right text-neutral-300"
                      blurClass={blurClass}
                    />
                    <BodyCell
                      value={summary.avg}
                      className="text-right text-yellow-200"
                      blurClass={blurClass}
                    />
                    <BodyCell
                      value={summary.total}
                      className="text-right text-neutral-300"
                      blurClass={blurClass}
                    />

                    {/* Hit rates */}
                    {hitRates.map((rate, i) => (
                      <BodyCell
                        key={i}
                        value={`${rate}%`}
                        className={`text-right ${getHitRateColor(rate)}`}
                        blurClass={blurClass}
                      />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE LIST */}
      <div className="mt-8 md:hidden">
        <div className="space-y-3">
          {teams.map((team, index) => {
            const blurClass =
              !isPremium && index >= 3
                ? "blur-[3px] brightness-[0.65]"
                : "";

            return (
              <MobileTeamCard
                key={team.id}
                team={team}
                index={index}
                blurClass={blurClass}
                onOpen={() => setSelectedTeam(team)}
              />
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-16 text-center flex flex-col items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-transparent px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
          <Sparkles className="h-3 w-3" />
          <span>Neeko+ Team Grid</span>
        </div>

        <p className="max-w-xl text-xs text-neutral-300/90">
          Unlock deeper hit-rates, fixture difficulty modelling and predictive windows.
        </p>

        <Button
          size="lg"
          className="rounded-full bg-yellow-400 px-7 py-2 text-sm font-semibold text-black shadow-[0_0_40px_rgba(250,204,21,0.9)] hover:bg-yellow-300"
        >
          Get Neeko+
        </Button>
      </div>

      {/* INSIGHTS OVERLAY */}
      {selectedTeam && (
        <TeamInsightsPanel team={selectedTeam} onClose={() => setSelectedTeam(null)} />
      )}
    </>
  );
}
