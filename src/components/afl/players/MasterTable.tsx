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
  orScore: number;
  rounds: number[]; // R1–R23
  min: number;
  max: number;
  avg: number;
  total: number;
  hitRates: HitRates;
};

const ROUND_LABELS = Array.from({ length: 23 }, (_, i) => `R${i + 1}`);

const MOCK_PLAYERS: PlayerRow[] = Array.from({ length: 40 }).map((_, index) => {
  const base = 85 + (index % 10);
  const rounds = ROUND_LABELS.map(() => base + Math.round(Math.random() * 20 - 10));
  const min = Math.min(...rounds);
  const max = Math.max(...rounds);
  const total = rounds.reduce((a, b) => a + b, 0);
  const avg = Math.round((total / rounds.length) * 10) / 10;

  const hit = (t: number) =>
    Math.round((rounds.filter((r) => r >= t).length / rounds.length) * 100);

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
      band90: hit(90),
      band95: hit(95),
      band100: hit(100),
      band105: hit(105),
      band110: hit(110),
    },
  };
});

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

export const MasterTable: React.FC = () => {
  const [compactMode, setCompactMode] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedStat, setSelectedStat] = useState<"Fantasy" | "Disposals" | "Goals">("Fantasy");

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="master-table"
      className="relative mt-16 mb-24 rounded-[32px] border border-yellow-500/18 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-black px-4 py-8 shadow-[0_40px_160px_rgba(0,0,0,0.9)] sm:px-8"
    >
      {/* HEADER */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-gradient-to-r from-yellow-500/25 via-yellow-400/10 to-transparent px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
            <Sparkles className="h-3 w-3" />
            <span>Master Table</span>
          </div>

          <div>
            <h2 className="text-balance text-2xl font-semibold text-neutral-50 sm:text-3xl">
              Full-season player ledger &amp; hit-rate grid
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-neutral-300/90">
              Every player&apos;s round-by-round{" "}
              <span className="font-semibold text-yellow-200/90">
                {selectedStat.toLowerCase()}
              </span>{" "}
              output, totals and hit-rates across key thresholds — ordered by total output.
            </p>
            <p className="mt-1 max-w-xl text-[11px] text-neutral-400">
              Hit-rate bands (90+, 95+, 100+, 105+, 110+) automatically adjust to the selected stat
              lens. Fantasy, Disposals &amp; Goals are free. Team &amp; Round filters are Neeko+ only.
            </p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col gap-4 md:items-end">
          {/* Stat selector */}
          <div className="flex items-center gap-2 rounded-full border border-neutral-700/70 bg-black/80 px-2 py-1 text-xs text-neutral-200">
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

          {/* Locked filters */}
          <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] text-neutral-300">
            <LockedFilter label="Team" value="All teams" />
            <LockedFilter label="Round" value="All rounds" />
          </div>

          {/* Full / Compact toggle */}
          <div className="flex items-center gap-3 rounded-full border border-neutral-700/70 bg-black/80 px-3 py-1.5 text-[11px] text-neutral-300">
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

      {/* DESKTOP TABLES */}
      <div className="mt-8 hidden md:block">
        {compactMode ? (
          <DesktopCompactTable
            players={MOCK_PLAYERS}
            expandedId={expandedId}
            onToggleExpand={toggleExpand}
          />
        ) : (
          <DesktopFullTable
            players={MOCK_PLAYERS}
            expandedId={expandedId}
            onToggleExpand={toggleExpand}
          />
        )}
      </div>

      {/* MOBILE */}
      <div className="mt-6 space-y-3 md:hidden">
        <MobileTable players={MOCK_PLAYERS} expandedId={expandedId} onToggleExpand={toggleExpand} />
      </div>

      {/* BOTTOM CTA */}
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/60 bg-black/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
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

const LockedFilter: React.FC<LockedFilterProps> = ({ label, value }) => (
  <div className="flex items-center gap-2 rounded-full border border-neutral-700/80 bg-black/80 px-3 py-1">
    <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">{label}</span>
    <span className="text-[11px] text-neutral-100">{value}</span>
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900/90 px-2 py-0.5 text-[10px] text-neutral-300">
      <Lock className="h-3 w-3 text-yellow-300" />
      Neeko+
    </span>
  </div>
);

// -----------------------------------------------------------------------------
// Desktop Full Table (T1 widths + Option A dropdown)
// -----------------------------------------------------------------------------

type DesktopTableProps = {
  players: PlayerRow[];
  expandedId: number | null;
  onToggleExpand: (id: number) => void;
};

const DesktopFullTable: React.FC<DesktopTableProps> = ({
  players,
  expandedId,
  onToggleExpand,
}) => {
  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-800/80 bg-neutral-950/95">
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          <table className="w-full table-fixed border-separate border-spacing-0">
            {/* HEADER */}
            <thead className="sticky top-0 z-30 bg-black/95 backdrop-blur-sm">
              <tr>
                <th className="sticky left-0 z-40 w-64 border-b border-neutral-800/80 bg-black/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
                  Player
                </th>

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
              </tr>
            </thead>

            {/* BODY */}
            <tbody className="divide-y divide-neutral-900/80">
              {players.map((player, index) => {
                const isExpanded = expandedId === player.id;

                return (
                  <>
                    <tr
                      key={player.id}
                      className={`cursor-pointer text-xs text-neutral-100 transition-colors duration-150 ${
                        isExpanded ? "bg-neutral-900/75" : "hover:bg-neutral-900/55"
                      }`}
                    >
                      {/* Player sticky cell */}
                      <td
                        onClick={() => onToggleExpand(player.id)}
                        className="sticky left-0 z-20 w-64 border-r border-neutral-900/80 bg-gradient-to-r from-black/98 via-black/94 to-black/80 px-4 py-2.5"
                      >
                        <div className="flex items-center gap-3">
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
                        </div>
                      </td>

                      {/* Row numbers */}
                      <BodyCell value={player.orScore} />
                      {player.rounds.map((score, idx) => (
                        <BodyCell key={idx} value={score} />
                      ))}
                      <BodyCell value={player.min} dim />
                      <BodyCell value={player.max} />
                      <BodyCell value={player.avg.toFixed(1)} />
                      <BodyCell value={player.total} strong wide />
                      <HitRateCell value={player.hitRates.band90} />
                      <HitRateCell value={player.hitRates.band95} />
                      <HitRateCell value={player.hitRates.band100} />
                      <HitRateCell value={player.hitRates.band105} />
                      <HitRateCell value={player.hitRates.band110} />
                    </tr>

                    {/* INLINE DROPDOWN ROW */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={100} className="bg-neutral-950/95 px-6 pb-4 pt-3">
                          <InlineDropdown player={player} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Show more rows CTA */}
      <div className="border-t border-neutral-900/80 bg-black/90 py-4 text-center">
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
// Desktop Compact Table (summary view + same dropdown)
// -----------------------------------------------------------------------------

const DesktopCompactTable: React.FC<DesktopTableProps> = ({
  players,
  expandedId,
  onToggleExpand,
}) => {
  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-800/80 bg-neutral-950/95">
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <table className="w-full table-fixed border-separate border-spacing-0">
            {/* HEADER */}
            <thead className="sticky top-0 z-30 bg-black/95 backdrop-blur-sm">
              <tr>
                <th className="sticky left-0 z-40 w-64 border-b border-neutral-800/80 bg-black/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
                  Player
                </th>
                <HeaderCell label="Min" />
                <HeaderCell label="Max" />
                <HeaderCell label="Avg" />
                <HeaderCell label="Total" wide />
                <HeaderCell label="90+" accent />
                <HeaderCell label="95+" accent />
                <HeaderCell label="100+" accent />
                <HeaderCell label="105+" accent />
                <HeaderCell label="110+" accent />
              </tr>
            </thead>

            {/* BODY */}
            <tbody className="divide-y divide-neutral-900/80">
              {players.map((player, index) => {
                const isExpanded = expandedId === player.id;

                return (
                  <>
                    <tr
                      key={player.id}
                      className={`cursor-pointer text-xs text-neutral-100 transition-colors duration-150 ${
                        isExpanded ? "bg-neutral-900/75" : "hover:bg-neutral-900/55"
                      }`}
                    >
                      <td
                        onClick={() => onToggleExpand(player.id)}
                        className="sticky left-0 z-20 w-64 border-r border-neutral-900/80 bg-gradient-to-r from-black/98 via-black/94 to-black/80 px-4 py-2.5"
                      >
                        <div className="flex items-center gap-3">
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
                        </div>
                      </td>

                      <BodyCell value={player.min} dim />
                      <BodyCell value={player.max} />
                      <BodyCell value={player.avg.toFixed(1)} />
                      <BodyCell value={player.total} strong wide />
                      <HitRateCell value={player.hitRates.band90} />
                      <HitRateCell value={player.hitRates.band95} />
                      <HitRateCell value={player.hitRates.band100} />
                      <HitRateCell value={player.hitRates.band105} />
                      <HitRateCell value={player.hitRates.band110} />
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={100} className="bg-neutral-950/95 px-6 pb-4 pt-3">
                          <InlineDropdown player={player} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-neutral-900/80 bg-black/90 py-4 text-center">
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
// Mobile Table (card per player + same dropdown content)
// -----------------------------------------------------------------------------

type MobileTableProps = {
  players: PlayerRow[];
  expandedId: number | null;
  onToggleExpand: (id: number) => void;
};

const MobileTable: React.FC<MobileTableProps> = ({ players, expandedId, onToggleExpand }) => {
  return (
    <>
      {players.map((player, index) => {
        const isExpanded = expandedId === player.id;
        const last5 = player.rounds.slice(-5);
        const last5Avg =
          last5.length > 0
            ? Math.round((last5.reduce((a, b) => a + b, 0) / last5.length) * 10) / 10
            : 0;

        return (
          <div
            key={player.id}
            className="rounded-2xl border border-neutral-800/85 bg-neutral-950/95 p-4 text-xs text-neutral-100"
          >
            {/* Header row */}
            <button
              type="button"
              onClick={() => onToggleExpand(player.id)}
              className="flex w-full items-center gap-3"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700/80 bg-neutral-950/90 text-[10px] text-neutral-300">
                {index + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-neutral-50">{player.name}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-yellow-300" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-neutral-400" />
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-400">
                  <span className="uppercase tracking-[0.16em]">
                    {player.team} • {player.role}
                  </span>
                  <span>
                    {player.min}–{player.max} • L5 {last5Avg.toFixed(1)}
                  </span>
                </div>
              </div>
            </button>

            {/* Inline dropdown */}
            {isExpanded && (
              <div className="mt-3">
                <InlineDropdown player={player} mobile />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

// -----------------------------------------------------------------------------
// Inline dropdown (Option A: CI top-right, sparkline + AI summary)
// -----------------------------------------------------------------------------

const InlineDropdown: React.FC<{ player: PlayerRow; mobile?: boolean }> = ({
  player,
  mobile = false,
}) => {
  return (
    <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/95 p-4 shadow-[0_0_40px_rgba(0,0,0,0.65)]">
      {/* Main analysis card */}
      <div className="relative overflow-hidden rounded-xl border border-neutral-800/80 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-4">
        <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.12),_transparent_60%)]" />
        <div className="relative flex flex-col gap-4">
          {/* Top row: text left, CI top-right */}
          <div
            className={`flex ${
              mobile ? "flex-col gap-3" : "flex-row items-start justify-between gap-6"
            }`}
          >
            <div className="max-w-md">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Recent scoring window
              </div>
              <p className="mt-1 text-[11px] text-neutral-300 leading-snug">
                Snapshot of consistency and ceiling across the most recent rounds in this lens.
              </p>
            </div>

            {/* Confidence index card (top-right) */}
            <div className="w-full max-w-[260px] rounded-lg border border-yellow-400/35 bg-gradient-to-b from-yellow-500/22 via-black to-black p-4 shadow-[0_0_24px_rgba(250,204,21,0.35)]">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-yellow-100">
                <span>Confidence Index</span>
                <span>{Math.max(player.hitRates.band100, 78)}%</span>
              </div>
              <p className="mt-2 text-[10.5px] text-neutral-100 leading-snug">
                Measures scoring consistency & volatility distribution across the season.
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-900">
                <div
                  className="h-full rounded-full bg-lime-400"
                  style={{ width: `${Math.max(player.hitRates.band100, 78)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sparkline */}
          <div className="rounded-lg border border-neutral-800/80 bg-neutral-950/95 p-3">
            <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-neutral-400">
              Recent form sparkline
            </div>
            <div className="flex h-20 w-full items-end gap-1 rounded-md border border-neutral-800/70 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_70%)] px-2">
              {player.rounds.slice(-10).map((v, i) => (
                <div
                  key={i}
                  className="h-full flex-1 rounded-sm bg-yellow-400/40"
                  style={{ height: `${40 + (v % 40)}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI summary */}
      <div className="mt-4 rounded-xl border border-neutral-800/80 bg-neutral-900/85 px-4 py-3">
        <div className="mb-1 text-[11px] font-semibold text-yellow-200">AI Performance Summary</div>
        <p className="text-[11px] text-neutral-300 leading-snug">
          Role expectations and scoring trends indicate stable usage with moderate volatility over
          the upcoming rounds.
        </p>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Shared header & body cells (T1 widths)
// -----------------------------------------------------------------------------

type HeaderCellProps = {
  label: string;
  wide?: boolean;
  accent?: boolean;
};

const HeaderCell: React.FC<HeaderCellProps> = ({ label, wide, accent }) => (
  <th
    className={`border-b border-neutral-800/80 px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] ${
      accent ? "text-emerald-300" : "text-neutral-400"
    } ${wide ? "min-w-[60px]" : "min-w-[46px]"}`}
  >
    {label}
  </th>
);

type BodyCellProps = {
  value: number | string;
  dim?: boolean;
  strong?: boolean;
  wide?: boolean;
};

const BodyCell: React.FC<BodyCellProps> = ({ value, dim, strong, wide }) => (
  <td
    className={`border-l border-neutral-900/80 px-2 py-2.5 text-center text-[11px] ${
      dim ? "text-neutral-400" : "text-neutral-100"
    } ${strong ? "font-semibold text-neutral-50" : ""} ${
      wide ? "min-w-[60px]" : "min-w-[46px]"
    }`}
  >
    {value}
  </td>
);

type HitRateCellProps = {
  value: number;
};

const HitRateCell: React.FC<HitRateCellProps> = ({ value }) => {
  const bg =
    value >= 90
      ? "bg-emerald-500/18"
      : value >= 70
      ? "bg-emerald-500/10"
      : "bg-emerald-500/6";
  const text =
    value >= 90
      ? "text-emerald-300"
      : value >= 70
      ? "text-emerald-200"
      : "text-emerald-100";

  return (
    <td className="border-l border-neutral-900/80 px-2 py-2.5 text-center text-[11px] min-w-[52px]">
      <span
        className={`inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${bg} ${text}`}
      >
        {value}%
      </span>
    </td>
  );
};

export default MasterTable;
