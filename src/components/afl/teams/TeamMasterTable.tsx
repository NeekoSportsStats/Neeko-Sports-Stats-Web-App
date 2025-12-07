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

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
const avg = (arr: number[]) =>
  arr.length ? sum(arr) / arr.length : 0;

const HIT_THRESHOLDS = [60, 70, 80, 90, 100];

function computeSummary(team: TeamRow) {
  const scores = team.scores;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const total = sum(scores);
  const average = +(avg(scores).toFixed(1));
  return { min, max, total, average };
}

function computeHitRates(team: TeamRow) {
  const scores = team.scores;
  return HIT_THRESHOLDS.map((t) =>
    Math.round((scores.filter((s) => s >= t).length / scores.length) * 100)
  );
}

function getHitRateColorClasses(value: number) {
  if (value >= 90) return "text-lime-300";
  if (value >= 75) return "text-yellow-200";
  if (value >= 50) return "text-amber-300";
  if (value >= 15) return "text-orange-300";
  return "text-red-400";
}

function HeaderCell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`border-b border-neutral-800/80 bg-gradient-to-b from-black/98 to-black/94 px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400 ${className}`}
    >
      {children}
    </th>
  );
}

function BodyCell({
  value,
  compact,
  className = "",
  blurClass = "",
}: {
  value: React.ReactNode;
  compact?: boolean;
  className?: string;
  blurClass?: string;
}) {
  return (
    <td
      className={`border-b border-neutral-900/80 bg-black/80 px-2.5 ${
        compact ? "py-2" : "py-2.5"
      } text-[11px] text-neutral-200 ${blurClass} ${className}`}
    >
      {value}
    </td>
  );
}

/* -------------------------------------------------------------------------- */
/*                            MAIN COMPONENT                                   */
/* -------------------------------------------------------------------------- */

export default function TeamMasterTable() {
  const { isPremium } = useAuth();

  const [compactMode, setCompactMode] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamRow | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => setIsMounted(true), []);

  const teams = useMemo(() => {
    const enriched = MOCK_TEAMS.map((t) => ({
      ...t,
      total: sum(t.scores),
    }));
    enriched.sort((a, b) => b.total - a.total);
    return enriched;
  }, []);

  const filteredTeams = useMemo(() => {
    if (!isPremium || !search.trim()) return teams;
    const q = search.toLowerCase();
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q)
    );
  }, [teams, search, isPremium]);

  return (
    <>
      {/* HEADER CARD */}
      <section className="mt-14 rounded-3xl border border-neutral-800/80 bg-gradient-to-b from-neutral-950/95 via-black/96 to-black px-5 py-5 shadow-[0_0_60px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-transparent px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.9)]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
                Team Master Table
              </span>
            </div>
            <h3 className="mt-3 text-xl font-semibold text-neutral-50 md:text-2xl">
              Season scoring ledger &amp; hit-rate grid
            </h3>
            <p className="mt-2 max-w-2xl text-xs text-neutral-400">
              Full AFL club scoring dataset with round-by-round output, summary
              statistics and hit-rate milestones. Sorted by total points scored
              this season.
            </p>
          </div>

          {/* Right controls */}
          <div className="flex flex-col items-stretch gap-3 md:items-end">
            {/* Compact toggle */}
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700/80 bg-black/80 px-3 py-1.5">
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
        </div>

        {/* Search + round filter row */}
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search (Neeko+ only) */}
          <div className="flex-1">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-neutral-500" />
              <input
                type="text"
                disabled={!isPremium}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  isPremium
                    ? "Search clubs…"
                    : "Search clubs (Neeko+ only)"
                }
                className={`h-9 w-full rounded-full border bg-black/80 pl-8 pr-16 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/70 ${
                  isPremium
                    ? "border-neutral-700/80"
                    : "border-neutral-800/80 cursor-not-allowed"
                }`}
              />
              {!isPremium && (
                <div className="pointer-events-none absolute right-2 inline-flex items-center gap-1 rounded-full border border-yellow-500/50 bg-black/90 px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-yellow-200/90">
                  <Lock className="h-3 w-3" />
                  <span>Neeko+</span>
                </div>
              )}
            </div>
          </div>

          {/* Round filter pill - visual only for now */}
          <div className="flex items-center gap-2 md:w-auto">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-neutral-700/80 bg-black/80 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-200"
            >
              <span className="text-neutral-500">Round</span>
              <span className="text-neutral-100">All rounds</span>
              <Lock className="ml-1 h-3 w-3 text-yellow-400" />
            </button>
          </div>
        </div>
      </section>

      {/* DESKTOP TABLE */}
      <div className="mt-8 hidden rounded-3xl border border-neutral-800/80 bg-neutral-950/95 md:block">
        <div className="w-full overflow-x-auto">
          <table className="min-w-[1040px] border-separate border-spacing-0 text-[11px] text-neutral-100">
            <thead>
              <tr className="sticky top-0 z-20 bg-black/95 backdrop-blur-sm">
                {/* Sticky Team header */}
                <HeaderCell className="sticky left-0 z-30 w-64 border-r border-neutral-900/80 bg-gradient-to-r from-black/98 via-black/94 to-black/80">
                  <span className="text-xs font-semibold text-neutral-200">
                    Team
                  </span>
                </HeaderCell>

                {!compactMode &&
                  ROUND_LABELS.map((round) => (
                    <HeaderCell key={round}>{round}</HeaderCell>
                  ))}

                <HeaderCell className="w-16 text-right">Min</HeaderCell>
                <HeaderCell className="w-16 text-right">Max</HeaderCell>
                <HeaderCell className="w-20 text-right">Avg</HeaderCell>
                <HeaderCell className="w-20 text-right">Total</HeaderCell>

                {HIT_THRESHOLDS.map((t) => (
                  <HeaderCell key={t} className="w-16 text-right">
                    {t}+
                  </HeaderCell>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredTeams.map((team, index) => {
                const summary = computeSummary(team);
                const hitRates = computeHitRates(team);

                const blur =
                  !isPremium && index >= 6
                    ? "blur-[3px] brightness-[0.7]"
                    : "";

                return (
                  <tr
                    key={team.id}
                    className="border-b border-neutral-900/80 text-[11px] text-neutral-200 hover:bg-neutral-900/55"
                  >
                    {/* Sticky Team cell */}
                    <td
                      className={`sticky left-0 z-10 w-64 border-b border-neutral-900/80 border-r border-r-neutral-900/80 bg-gradient-to-r from-black/98 via-black/94 to-black/80 px-4 ${
                        compactMode ? "py-2" : "py-2.5"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedTeam(team)}
                        className="group flex w-full items-center gap-3 text-left"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700/80 bg-black/80 text-[11px] text-neutral-200">
                          {index + 1}
                        </div>

                        {/* Badge + name */}
                        <div className="flex flex-col">
                          <div className="inline-flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor: team.colours.primary,
                                boxShadow: `0 0 10px ${team.colours.primary}`,
                              }}
                            />
                            <span className="text-[13px] font-medium text-neutral-50">
                              {team.name}
                            </span>
                          </div>
                          <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                            {team.code}
                          </span>
                        </div>

                        <ChevronRight className="ml-auto h-4 w-4 text-neutral-500 group-hover:text-yellow-300" />
                      </button>
                    </td>

                    {/* Round scores */}
                    {!compactMode &&
                      team.scores.map((score, i) => (
                        <BodyCell
                          key={i}
                          value={score}
                          compact={compactMode}
                          blurClass={blur}
                        />
                      ))}

                    {/* Summary */}
                    <BodyCell
                      value={summary.min}
                      className="text-right text-neutral-300"
                      compact={compactMode}
                      blurClass={blur}
                    />
                    <BodyCell
                      value={summary.max}
                      className="text-right text-neutral-300"
                      compact={compactMode}
                      blurClass={blur}
                    />
                    <BodyCell
                      value={summary.average.toFixed(1)}
                      className="text-right text-yellow-200"
                      compact={compactMode}
                      blurClass={blur}
                    />
                    <BodyCell
                      value={summary.total}
                      className="text-right text-neutral-300"
                      compact={compactMode}
                      blurClass={blur}
                    />

                    {/* Hit rates */}
                    {hitRates.map((value, idx) => (
                      <BodyCell
                        key={HIT_THRESHOLDS[idx]}
                        value={`${value}%`}
                        className={`text-right ${getHitRateColorClasses(value)}`}
                        compact={compactMode}
                        blurClass={blur}
                      />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom CTA (Neeko+ upsell) */}
        {!isPremium && (
          <div className="border-t border-neutral-900/80 bg-black/95 px-5 py-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-transparent px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
              <Sparkles className="h-3 w-3" />
              <span>Neeko+ Team Grid</span>
            </div>
            <p className="mt-2 text-xs text-neutral-300/90">
              Unlock deeper hit-rate bands, fixture difficulty modelling and
              predictive windows for every club.
            </p>
            <Button
              size="lg"
              className="mt-3 rounded-full bg-yellow-400 px-7 py-2 text-sm font-semibold text-black shadow-[0_0_40px_rgba(250,204,21,0.9)] hover:bg-yellow-300"
            >
              Get Neeko+
            </Button>
          </div>
        )}
      </div>

      {/* MOBILE NOTE (for now just a message; you can add mobile table later if you want) */}
      <div className="mt-8 rounded-3xl border border-neutral-800/80 bg-gradient-to-b from-black/95 via-black to-black px-4 py-5 text-xs text-neutral-300 md:hidden">
        Mobile team grid coming – for now, use desktop for the full ledger
        experience.
      </div>

      {/* INSIGHTS PANEL PORTAL */}
      {isMounted && selectedTeam &&
        createPortal(
          <TeamInsightsPanel team={selectedTeam} onClose={() => setSelectedTeam(null)} />,
          document.body
        )}
    </>
  );
}
