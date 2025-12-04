// src/components/afl/players/MasterTable.tsx

import React, { useState } from "react";
import { ChevronRight, ChevronDown, Lock, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

// -----------------------------------------------------------------------------
// Types & mock data
// -----------------------------------------------------------------------------

type HitRates = {
  band90: number;
  band95: number;
  band100: number;
  band105: number;
  band110: number;
};

type PlayerRow = {
  id: number;
  name: string;
  team: string;
  role: string;
  orScore: number; // "OR" opening rating
  rounds: number[]; // R1–R23
  min: number;
  max: number;
  avg: number;
  total: number;
  hitRates: HitRates;
};

const ROUND_LABELS = [
  "R1",
  "R2",
  "R3",
  "R4",
  "R5",
  "R6",
  "R7",
  "R8",
  "R9",
  "R10",
  "R11",
  "R12",
  "R13",
  "R14",
  "R15",
  "R16",
  "R17",
  "R18",
  "R19",
  "R20",
  "R21",
  "R22",
  "R23",
];

// Simple mock players; swap for Supabase results later
const MOCK_PLAYERS: PlayerRow[] = Array.from({ length: 40 }).map((_, index) => {
  const base = 85 + (index % 10);
  const rounds = ROUND_LABELS.map(() => base + Math.round(Math.random() * 20 - 10));
  const min = Math.min(...rounds);
  const max = Math.max(...rounds);
  const total = rounds.reduce((sum, v) => sum + v, 0);
  const avg = Math.round((total / rounds.length) * 10) / 10;

  const above = (threshold: number) =>
    Math.round((rounds.filter((v) => v >= threshold).length / rounds.length) * 100);

  return {
    id: index + 1,
    name: `Player ${index + 1}`,
    team: ["GEEL", "CARL", "RICH", "ESS", "COLL", "NMFC"][index % 6],
    role: ["MID", "RUC", "FWD", "DEF"][index % 4],
    orScore: base + 10,
    rounds,
    min,
    max,
    avg,
    total,
    hitRates: {
      band90: above(90),
      band95: above(95),
      band100: above(100),
      band105: above(105),
      band110: above(110),
    },
  };
});

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

export const MasterTable: React.FC = () => {
  const [compactMode, setCompactMode] = useState(false);
  const [expandedPlayerId, setExpandedPlayerId] = useState<number | null>(null);
  const [selectedStat, setSelectedStat] = useState<"Fantasy" | "Disposals" | "Goals">("Fantasy");

  const toggleExpand = (id: number) => {
    setExpandedPlayerId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="master-table"
      className="relative mt-16 mb-24 rounded-[32px] border border-yellow-500/10 bg-gradient-to-b from-neutral-950/90 via-neutral-950/80 to-black/90 px-4 py-8 shadow-[0_40px_160px_rgba(0,0,0,0.9)] sm:px-8"
    >
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-gradient-to-r from-yellow-500/20 via-yellow-400/10 to-transparent px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
            <Sparkles className="h-3 w-3" />
            <span>Master Table</span>
          </div>
          <div>
            <h2 className="text-balance text-2xl font-semibold text-neutral-50 sm:text-3xl">
              Full-season player ledger &amp; hit-rate grid
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-neutral-300/80">
              Every player&apos;s round-by-round{" "}
              <span className="font-semibold text-yellow-200/90">{selectedStat.toLowerCase()}</span>{" "}
              output, totals and hit rates across key thresholds — ordered by total output.
            </p>
            <p className="mt-1 max-w-xl text-[11px] text-neutral-400">
              Hit-rate bands (90+, 95+, 100+, 105+, 110+) automatically adjust to the selected stat
              lens. Fantasy, Disposals &amp; Goals are free. Team &amp; Round filters are Neeko+ only.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 md:items-end">
          {/* Stat selector */}
          <div className="flex items-center gap-2 rounded-full border border-neutral-700/60 bg-black/60 px-2 py-1 text-xs text-neutral-200">
            {(["Fantasy", "Disposals", "Goals"] as const).map((stat) => (
              <button
                key={stat}
                type="button"
                onClick={() => setSelectedStat(stat)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                  selectedStat === stat
                    ? "bg-yellow-400 text-black shadow-[0_0_16px_rgba(250,204,21,0.6)]"
                    : "text-neutral-300 hover:bg-neutral-800/80"
                }`}
              >
                {stat}
              </button>
            ))}
          </div>

          {/* Team / Round filters (locked) */}
          <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] text-neutral-300">
            <LockedFilter label="Team" value="All teams" />
            <LockedFilter label="Round" value="All rounds" />
          </div>

          {/* Compact mode toggle */}
          <div className="flex items-center gap-3 rounded-full border border-neutral-700/70 bg-black/70 px-3 py-1.5 text-[11px] text-neutral-300">
            <span className="hidden text-neutral-400 sm:inline">View</span>
            <span className="font-medium text-neutral-100">Full grid</span>
            <Switch
              checked={compactMode}
              onCheckedChange={setCompactMode}
              className="data-[state=checked]:bg-yellow-400"
            />
            <span className="font-medium text-neutral-100">Compact</span>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="mt-8 hidden md:block">
        {compactMode ? (
          <DesktopCompactTable
            players={MOCK_PLAYERS}
            expandedPlayerId={expandedPlayerId}
            onToggleExpand={toggleExpand}
          />
        ) : (
          <DesktopFullTable
            players={MOCK_PLAYERS}
            expandedPlayerId={expandedPlayerId}
            onToggleExpand={toggleExpand}
          />
        )}
      </div>

      {/* Mobile layout */}
      <div className="mt-6 space-y-3 md:hidden">
        <MobileTable players={MOCK_PLAYERS} />
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/60 bg-black/70 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
          <Sparkles className="h-3 w-3" />
          <span>Neeko+ Master Grid</span>
        </div>
        <p className="max-w-xl text-xs text-neutral-300/90">
          Unlock full-season fantasy ledgers, advanced hit-rate bands and deep role filters for
          every player.
        </p>
        <Button
          size="lg"
          className="mt-1 rounded-full bg-yellow-400 px-7 py-2 text-sm font-semibold text-black shadow-[0_0_40px_rgba(250,204,21,0.9)] hover:bg-yellow-300"
        >
          Unlock Neeko+ Insights
        </Button>
        <button
          type="button"
          className="mt-1 text-xs font-medium text-yellow-200/90 underline-offset-4 hover:underline"
        >
          View full AI analysis →
        </button>
      </div>
    </section>
  );
};

// -----------------------------------------------------------------------------
// Locked filter chip
// -----------------------------------------------------------------------------

type LockedFilterProps = {
  label: string;
  value: string;
};

const LockedFilter: React.FC<LockedFilterProps> = ({ label, value }) => {
  return (
    <div className="flex items-center gap-2 rounded-full border border-neutral-700/70 bg-black/70 px-3 py-1">
      <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">{label}</span>
      <span className="text-[11px] text-neutral-100">{value}</span>
      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900/90 px-2 py-0.5 text-[10px] text-neutral-300">
        <Lock className="h-3 w-3 text-yellow-300" />
        Neeko+
      </span>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Desktop Full Table
// -----------------------------------------------------------------------------

type DesktopTableProps = {
  players: PlayerRow[];
  expandedPlayerId: number | null;
  onToggleExpand: (id: number) => void;
};

const DesktopFullTable: React.FC<DesktopTableProps> = ({
  players,
  expandedPlayerId,
  onToggleExpand,
}) => {
  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-800/80 bg-neutral-950/80">
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Sticky columns header */}
          <div className="sticky top-0 z-30 flex bg-black/85 backdrop-blur-sm">
            {/* Player header (sticky left) */}
            <div className="sticky left-0 z-40 flex w-64 flex-shrink-0 items-center gap-3 border-b border-neutral-800/80 bg-black/90 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
              <span className="w-6 text-[10px] text-neutral-500">#</span>
              <span>Player</span>
            </div>

            {/* Round headers */}
            <div className="flex flex-1 border-b border-neutral-800/80 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              <HeaderCell label="OR" />
              {ROUND_LABELS.map((label) => (
                <HeaderCell key={label} label={label} />
              ))}
              <HeaderCell label="Min" />
              <HeaderCell label="Max" />
              <HeaderCell label="Avg" />
              <HeaderCell label="Total" wide />
              <HeaderCell label="90+" accent />
              <HeaderCell label="95+" accent />
              <HeaderCell label="100+" accent />
              <HeaderCell label="105+" accent />
              <HeaderCell label="110+" accent />
            </div>
          </div>

          {/* Body rows */}
          <div className="divide-y divide-neutral-900/80">
            {players.map((player, index) => {
              const isExpanded = expandedPlayerId === player.id;
              return (
                <React.Fragment key={player.id}>
                  <div
                    className={`group flex text-xs text-neutral-100 transition-colors duration-150 ${
                      isExpanded ? "bg-yellow-500/5" : "hover:bg-neutral-900/80"
                    }`}
                  >
                    {/* Player cell (sticky) */}
                    <button
                      type="button"
                      onClick={() => onToggleExpand(player.id)}
                      className="sticky left-0 z-20 flex w-64 flex-shrink-0 items-center gap-3 border-r border-neutral-900/80 bg-gradient-to-r from-black/95 via-black/90 to-black/70 px-4 py-2.5 text-left"
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700/80 bg-neutral-950/80 text-[10px] text-neutral-300">
                        {index + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-neutral-50">
                          {player.name}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                          {player.team} • {player.role}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="ml-auto h-4 w-4 text-yellow-300" />
                      ) : (
                        <ChevronRight className="ml-auto h-4 w-4 text-neutral-500 group-hover:text-yellow-300" />
                      )}
                    </button>

                    {/* Rounds & metrics */}
                    <div className="flex flex-1 items-center text-center text-[11px]">
                      <BodyCell value={player.orScore} />
                      {player.rounds.map((score, idx) => (
                        <BodyCell key={idx} value={score} />
                      ))}
                      <BodyCell value={player.min} dim />
                      <BodyCell value={player.max} />
                      <BodyCell value={player.avg.toFixed(1)} />
                      <BodyCell value={player.total} strong />
                      <HitRateCell value={player.hitRates.band90} />
                      <HitRateCell value={player.hitRates.band95} />
                      <HitRateCell value={player.hitRates.band100} />
                      <HitRateCell value={player.hitRates.band105} />
                      <HitRateCell value={player.hitRates.band110} />
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="border-t border-neutral-800/80 bg-gradient-to-r from-yellow-500/5 via-transparent to-transparent px-4 py-4">
                      <div className="flex gap-4">
                        {/* Confidence index card */}
                        <div className="w-full max-w-sm rounded-2xl border border-yellow-500/30 bg-gradient-to-b from-yellow-500/25 via-black to-black px-4 py-4 text-xs text-neutral-50 shadow-[0_0_32px_rgba(250,204,21,0.7)]">
                          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-100">
                            <span>Confidence Index</span>
                            <span>{Math.max(player.hitRates.band100, 78)}%</span>
                          </div>
                          <p className="mt-2 text-[11px] text-neutral-100/90">
                            Confidence blends hit-rate bands, volatility spread and number of games
                            played in this lens.
                          </p>
                          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/40">
                            <div
                              className="h-full rounded-full bg-lime-400"
                              style={{
                                width: `${Math.max(player.hitRates.band100, 78)}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* L5 trajectory mini sparkline placeholder */}
                        <div className="hidden flex-1 rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/90 via-black to-black px-4 py-4 text-xs text-neutral-200 md:flex">
                          <div className="flex w-full flex-col justify-between">
                            <div className="flex items-center justify-between text-[11px] text-neutral-300">
                              <span className="uppercase tracking-[0.18em] text-neutral-500">
                                L5 Trajectory
                              </span>
                              <span className="text-neutral-200">
                                Avg{" "}
                                <span className="font-semibold text-yellow-200">
                                  {player.rounds.slice(-5).reduce((a, b) => a + b, 0) / 5 || 0}
                                </span>
                              </span>
                            </div>
                            <div className="mt-3 h-20 w-full rounded-xl bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.2),_transparent_55%),_linear-gradient(to_bottom,_rgba(24,24,27,1),_rgba(0,0,0,1))]">
                              {/* simple sparkline using CSS border; real chart can replace */}
                              <div className="relative h-full w-full">
                                <div className="absolute inset-3 rounded-lg border border-yellow-500/20" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Show 20 more rows */}
      <div className="border-t border-neutral-900/80 bg-black/80 py-4 text-center">
        <Button
          variant="outline"
          className="rounded-full border-neutral-700 bg-neutral-950/90 px-5 py-1.5 text-xs text-neutral-200 hover:border-yellow-400 hover:bg-neutral-900"
        >
          Show 20 more rows
        </Button>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Desktop Compact Table
// -----------------------------------------------------------------------------

const DesktopCompactTable: React.FC<DesktopTableProps> = ({
  players,
  expandedPlayerId,
  onToggleExpand,
}) => {
  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-800/80 bg-neutral-950/80">
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Sticky header */}
          <div className="sticky top-0 z-30 flex bg-black/85 backdrop-blur-sm">
            {/* Player header */}
            <div className="sticky left-0 z-40 flex w-64 flex-shrink-0 items-center gap-3 border-b border-neutral-800/80 bg-black/90 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
              <span className="w-6 text-[10px] text-neutral-500">#</span>
              <span>Player</span>
            </div>

            {/* Summary headers */}
            <div className="flex flex-1 border-b border-neutral-800/80 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              <HeaderCell label="Min" />
              <HeaderCell label="Max" />
              <HeaderCell label="Avg" />
              <HeaderCell label="Total" wide />
              <HeaderCell label="90+" accent />
              <HeaderCell label="95+" accent />
              <HeaderCell label="100+" accent />
              <HeaderCell label="105+" accent />
              <HeaderCell label="110+" accent />
              <HeaderCell label="L5" wide />
            </div>
          </div>

          {/* Body */}
          <div className="divide-y divide-neutral-900/80">
            {players.map((player, index) => {
              const isExpanded = expandedPlayerId === player.id;
              const last5 = player.rounds.slice(-5);
              const last5Avg =
                last5.length > 0
                  ? Math.round((last5.reduce((a, b) => a + b, 0) / last5.length) * 10) / 10
                  : 0;

              return (
                <React.Fragment key={player.id}>
                  <div
                    className={`group flex text-xs text-neutral-100 transition-colors duration-150 ${
                      isExpanded ? "bg-yellow-500/5" : "hover:bg-neutral-900/80"
                    }`}
                  >
                    {/* Player cell (sticky) */}
                    <button
                      type="button"
                      onClick={() => onToggleExpand(player.id)}
                      className="sticky left-0 z-20 flex w-64 flex-shrink-0 items-center gap-3 border-r border-neutral-900/80 bg-gradient-to-r from-black/95 via-black/90 to-black/70 px-4 py-2.5 text-left"
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700/80 bg-neutral-950/80 text-[10px] text-neutral-300">
                        {index + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-neutral-50">
                          {player.name}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                          {player.team} • {player.role}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="ml-auto h-4 w-4 text-yellow-300" />
                      ) : (
                        <ChevronRight className="ml-auto h-4 w-4 text-neutral-500 group-hover:text-yellow-300" />
                      )}
                    </button>

                    {/* Summary metrics */}
                    <div className="flex flex-1 items-center text-center text-[11px]">
                      <BodyCell value={player.min} dim />
                      <BodyCell value={player.max} />
                      <BodyCell value={player.avg.toFixed(1)} />
                      <BodyCell value={player.total} strong />
                      <HitRateCell value={player.hitRates.band90} />
                      <HitRateCell value={player.hitRates.band95} />
                      <HitRateCell value={player.hitRates.band100} />
                      <HitRateCell value={player.hitRates.band105} />
                      <HitRateCell value={player.hitRates.band110} />
                      <BodyCell value={last5Avg.toFixed(1)} highlight />
                    </div>
                  </div>

                  {/* Expanded panel – reuse same confidence card */}
                  {isExpanded && (
                    <div className="border-t border-neutral-800/80 bg-gradient-to-r from-yellow-500/5 via-transparent to-transparent px-4 py-4">
                      <div className="w-full max-w-sm rounded-2xl border border-yellow-500/30 bg-gradient-to-b from-yellow-500/25 via-black to-black px-4 py-4 text-xs text-neutral-50 shadow-[0_0_32px_rgba(250,204,21,0.7)]">
                        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-100">
                          <span>Confidence Index</span>
                          <span>{Math.max(player.hitRates.band100, 78)}%</span>
                        </div>
                        <p className="mt-2 text-[11px] text-neutral-100/90">
                          Confidence blends hit-rate bands, volatility spread and number of games
                          played in this lens.
                        </p>
                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/40">
                          <div
                            className="h-full rounded-full bg-lime-400"
                            style={{
                              width: `${Math.max(player.hitRates.band100, 78)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-900/80 bg-black/80 py-4 text-center">
        <Button
          variant="outline"
          className="rounded-full border-neutral-700 bg-neutral-950/90 px-5 py-1.5 text-xs text-neutral-200 hover:border-yellow-400 hover:bg-neutral-900"
        >
          Show 20 more rows
        </Button>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Mobile layout
// -----------------------------------------------------------------------------

type MobileTableProps = {
  players: PlayerRow[];
};

const MobileTable: React.FC<MobileTableProps> = ({ players }) => {
  return (
    <>
      {players.map((player, index) => {
        const rounds = player.rounds;
        const last5 = rounds.slice(-5);
        const last5Avg =
          last5.length > 0
            ? Math.round((last5.reduce((a, b) => a + b, 0) / last5.length) * 10) / 10
            : 0;

        return (
          <div
            key={player.id}
            className="rounded-2xl border border-neutral-800/80 bg-neutral-950/90 p-4 text-xs text-neutral-100"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700/80 bg-neutral-950/80 text-[10px] text-neutral-300">
                {index + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-neutral-50">{player.name}</span>
                  <span className="text-[11px] text-yellow-200">
                    {player.avg.toFixed(1)} avg
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-400">
                  <span className="uppercase tracking-[0.16em]">
                    {player.team} • {player.role}
                  </span>
                  <span>
                    {player.min}–{player.max} • {player.total} total
                  </span>
                </div>
              </div>
            </div>

            {/* Hit-rate bands */}
            <div className="mt-3 grid grid-cols-5 gap-1 text-[10px]">
              <HitRatePill label="90+" value={player.hitRates.band90} />
              <HitRatePill label="95+" value={player.hitRates.band95} />
              <HitRatePill label="100+" value={player.hitRates.band100} />
              <HitRatePill label="105+" value={player.hitRates.band105} />
              <HitRatePill label="110+" value={player.hitRates.band110} />
            </div>

            {/* Rounds scroller */}
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[10px] text-neutral-400">
                <span className="uppercase tracking-[0.16em]">Round ledger</span>
                <span>L5: {last5Avg.toFixed(1)}</span>
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {rounds.map((score, idx) => (
                  <div
                    key={idx}
                    className="min-w-[46px] rounded-md bg-neutral-900/90 px-2 py-1 text-center text-[10px]"
                  >
                    <div className="text-[9px] text-neutral-500">{ROUND_LABELS[idx]}</div>
                    <div className="mt-0.5 text-[11px] text-neutral-100">{score}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      <div className="mt-4 text-center">
        <Button
          variant="outline"
          className="rounded-full border-neutral-700 bg-neutral-950/90 px-5 py-1.5 text-[11px] text-neutral-200 hover:border-yellow-400 hover:bg-neutral-900"
        >
          Show 20 more rows
        </Button>
      </div>
    </>
  );
};

// -----------------------------------------------------------------------------
// Shared cell components
// -----------------------------------------------------------------------------

type HeaderCellProps = {
  label: string;
  wide?: boolean;
  accent?: boolean;
};

const HeaderCell: React.FC<HeaderCellProps> = ({ label, wide, accent }) => (
  <div
    className={`flex items-center justify-center border-l border-neutral-900/80 px-2 py-3 ${
      wide ? "min-w-[72px]" : "min-w-[52px]"
    } ${accent ? "text-emerald-300" : ""}`}
  >
    {label}
  </div>
);

type BodyCellProps = {
  value: number | string;
  dim?: boolean;
  strong?: boolean;
  highlight?: boolean;
};

const BodyCell: React.FC<BodyCellProps> = ({ value, dim, strong, highlight }) => (
  <div
    className={`flex min-w-[52px] items-center justify-center border-l border-neutral-900/80 px-2 py-2.5 text-[11px] ${
      dim ? "text-neutral-400" : "text-neutral-100"
    } ${strong ? "font-semibold text-neutral-50" : ""} ${
      highlight ? "font-semibold text-yellow-200" : ""
    }`}
  >
    {value}
  </div>
);

type HitRateCellProps = {
  value: number;
};

const HitRateCell: React.FC<HitRateCellProps> = ({ value }) => {
  const intensity = value >= 90 ? "text-emerald-300" : value >= 70 ? "text-emerald-200" : "text-emerald-100/80";
  const bg =
    value >= 90
      ? "bg-emerald-500/15"
      : value >= 70
      ? "bg-emerald-500/10"
      : "bg-emerald-500/5";

  return (
    <div className="flex min-w-[52px] items-center justify-center border-l border-neutral-900/80 px-2 py-2.5">
      <span
        className={`inline-flex min-w-[44px] items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${bg} ${intensity}`}
      >
        {value}%
      </span>
    </div>
  );
};

type HitRatePillProps = {
  label: string;
  value: number;
};

const HitRatePill: React.FC<HitRatePillProps> = ({ label, value }) => (
  <div className="flex flex-col items-center justify-center rounded-lg bg-neutral-900/90 px-2 py-1 text-[10px]">
    <span className="text-[9px] text-neutral-500">{label}</span>
    <span className="mt-0.5 text-[11px] font-semibold text-emerald-300">{value}%</span>
  </div>
);

export default MasterTable;