// src/components/afl/players/MasterTable.tsx

import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Lock, Search, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

// -----------------------------------------------------------------------------
// Types & config
// -----------------------------------------------------------------------------

type StatLens = "Fantasy" | "Disposals" | "Goals";

type PlayerRow = {
  id: number;
  name: string;
  team: string;
  role: string;
  orScore: number;
  rounds: number[]; // OR + R1–R23 (24 values)
};

const ROUND_LABELS = [
  "OR",
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

const STAT_CONFIG: Record<
  StatLens,
  {
    label: string;
    hitRateLabels: string[];
    thresholds: number[];
    valueUnitShort: string;
  }
> = {
  Fantasy: {
    label: "fantasy",
    hitRateLabels: ["90+", "100+", "110+", "120+", "130+"],
    thresholds: [90, 100, 110, 120, 130],
    valueUnitShort: "pts",
  },
  Disposals: {
    label: "disposals",
    hitRateLabels: ["15+", "20+", "25+", "30+", "35+"],
    thresholds: [15, 20, 25, 30, 35],
    valueUnitShort: "disp",
  },
  Goals: {
    label: "goals",
    hitRateLabels: ["1+", "2+", "3+", "4+", "5+"],
    thresholds: [1, 2, 3, 4, 5],
    valueUnitShort: "g",
  },
};

// -----------------------------------------------------------------------------
// Mock data – SQL-friendly shape to swap for Supabase later
// -----------------------------------------------------------------------------

const buildMockPlayers = (): PlayerRow[] =>
  Array.from({ length: 40 }).map((_, index) => {
    const base =
      index < 10 ? 80 : index < 20 ? 85 : index < 30 ? 90 : 95; // tiers

    const rounds = ROUND_LABELS.map(() => {
      const jitter = Math.round(Math.random() * 18 - 9);
      return base + jitter;
    });

    return {
      id: index + 1,
      name: `Player ${index + 1}`,
      team: ["GEEL", "CARL", "ESS", "COLL", "RICH", "NMFC"][index % 6],
      role: ["MID", "RUC", "FWD", "DEF"][index % 4],
      orScore: base + 10,
      rounds,
    };
  });

const MOCK_PLAYERS: PlayerRow[] = buildMockPlayers();

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function computeSummary(player: PlayerRow) {
  const rounds = player.rounds;
  const min = Math.min(...rounds);
  const max = Math.max(...rounds);
  const total = rounds.reduce((sum, v) => sum + v, 0);
  const avg = Math.round((total / rounds.length) * 10) / 10;

  const lastWindow = rounds.slice(-8);
  const l5 = rounds.slice(-5);
  const l5Avg =
    l5.length > 0
      ? Math.round((l5.reduce((a, b) => a + b, 0) / l5.length) * 10) / 10
      : 0;

  const windowMin = lastWindow.length ? Math.min(...lastWindow) : min;
  const windowMax = lastWindow.length ? Math.max(...lastWindow) : max;
  const volatilityRange = windowMax - windowMin;

  return { min, max, total, avg, lastWindow, l5Avg, windowMin, windowMax, volatilityRange };
}

function computeHitRates(player: PlayerRow, lens: StatLens): number[] {
  const { thresholds } = STAT_CONFIG[lens];
  const rounds = player.rounds;
  return thresholds.map((t) => {
    const count = rounds.filter((v) => v >= t).length;
    return Math.round((count / rounds.length) * 100);
  });
}

// Simple confidence score – blend of floor/ceiling hit-rates & volatility
function computeConfidenceScore(player: PlayerRow, lens: StatLens): number {
  const hitRates = computeHitRates(player, lens);
  const { volatilityRange } = computeSummary(player);

  const floorRate = hitRates[0] ?? 0;
  const ceilingRate = hitRates[hitRates.length - 1] ?? 0;
  const volatilityPenalty = Math.min(volatilityRange * 3, 45);

  const raw =
    0.45 * floorRate + 0.35 * ceilingRate + 0.2 * (100 - volatilityPenalty);

  return Math.max(0, Math.min(100, Math.round(raw)));
}

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

export const MasterTable: React.FC = () => {
  const [selectedStat, setSelectedStat] = useState<StatLens>("Fantasy");
  const [compactMode, setCompactMode] = useState(false);
  const [expandedPlayerId, setExpandedPlayerId] = useState<number | null>(1);
  const [visibleCount, setVisibleCount] = useState(20);
  const [search, setSearch] = useState("");

  const players = MOCK_PLAYERS;

  const filteredPlayers = useMemo(() => {
    if (!search.trim()) return players;
    return players.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [players, search]);

  const visiblePlayers = useMemo(
    () => filteredPlayers.slice(0, visibleCount),
    [filteredPlayers, visibleCount]
  );

  const hasMoreRows = visibleCount < filteredPlayers.length;
  const config = STAT_CONFIG[selectedStat];

  // Reset paging / expansion when lens or search changes
  useEffect(() => {
    setVisibleCount(20);
    setExpandedPlayerId(filteredPlayers[0]?.id ?? null);
  }, [selectedStat, search, filteredPlayers]);

  const handleToggleExpand = (id: number) => {
    setExpandedPlayerId((prev) => (prev === id ? null : id));
  };

  const handleShowMore = () => {
    if (!hasMoreRows) return;
    setVisibleCount((prev) =>
      Math.min(prev + 20, filteredPlayers.length)
    );
  };

  return (
    <section
      id="master-table"
      className="relative mt-16 mb-24 rounded-[32px] border border-yellow-500/15 bg-gradient-to-b from-neutral-950 via-neutral-950/90 to-black px-4 py-8 shadow-[0_40px_160px_rgba(0,0,0,0.9)] sm:px-6 lg:px-8"
    >
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-gradient-to-r from-yellow-500/25 via-yellow-400/10 to-transparent px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
          <Sparkles className="h-3 w-3" />
          <span>Master Table</span>
        </div>
        <div>
          <h2 className="text-balance text-2xl font-semibold text-neutral-50 sm:text-3xl">
            Full-season player ledger &amp; hit-rate grid
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-neutral-300/90">
            Every player&apos;s{" "}
            <span className="font-semibold text-yellow-200/90">
              {config.label}
            </span>{" "}
            round-by-round output, totals and hit-rates — ordered by total
            production.
          </p>
          <p className="mt-1 max-w-xl text-[11px] text-neutral-400">
            Hit-rate bands automatically adjust by stat lens. Fantasy,
            Disposals &amp; Goals are free. Team &amp; Round filters and
            advanced search will be Neeko+ only.
          </p>
        </div>
      </div>

      {/* Stat lens + controls */}
      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Stat selector – always full width on mobile */}
        <div className="flex w-full flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700/70 bg-black/70 px-2 py-1 text-xs text-neutral-200">
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
        </div>

        {/* Compact toggle – desktop only */}
        <div className="hidden items-center gap-3 rounded-full border border-neutral-700/70 bg-black/70 px-3 py-1.5 text-[11px] text-neutral-300 sm:flex">
          <span className="font-medium text-neutral-100">Full grid</span>
          <Switch
            checked={compactMode}
            onCheckedChange={setCompactMode}
            className="data-[state=checked]:bg-yellow-400"
          />
          <span className="font-medium text-neutral-100">Compact</span>
        </div>
      </div>

      {/* Search + locked filters */}
      <div className="mt-4 space-y-3">
        {/* Search bar */}
        <div className="flex w-full items-center gap-2 rounded-full border border-neutral-700/70 bg-black/70 px-3 py-1.5 text-[11px] text-neutral-300">
          <Search className="h-3.5 w-3.5 text-yellow-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players (Neeko+ only)"
            className="flex-1 bg-transparent text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
          />
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900/90 px-2 py-0.5 text-[10px] text-neutral-300">
            <Lock className="h-3 w-3 text-yellow-300" />
            Neeko+
          </span>
        </div>

        {/* Team / Round locked chips */}
        <div className="flex flex-wrap gap-3 text-[11px] text-neutral-300">
          <LockedFilter label="Team" value="All teams" />
          <LockedFilter label="Round" value="All rounds" />
        </div>
      </div>

      {/* Desktop table */}
      <div className="mt-8 hidden md:block">
        {compactMode ? (
          <DesktopCompactTable
            players={visiblePlayers}
            selectedStat={selectedStat}
            expandedPlayerId={expandedPlayerId}
            onToggleExpand={handleToggleExpand}
          />
        ) : (
          <DesktopFullTable
            players={visiblePlayers}
            selectedStat={selectedStat}
            expandedPlayerId={expandedPlayerId}
            onToggleExpand={handleToggleExpand}
          />
        )}

        {/* Show more rows (desktop) */}
        {hasMoreRows && (
          <div className="border-t border-neutral-900/80 bg-black/90 py-4 text-center">
            <Button
              variant="outline"
              onClick={handleShowMore}
              className="rounded-full border-neutral-700 bg-neutral-950/90 px-5 py-1.5 text-xs text-neutral-200 hover:border-yellow-400 hover:bg-neutral-900"
            >
              {visibleCount + 20 >= filteredPlayers.length
                ? "Show remaining rows"
                : "Show 20 more rows"}
            </Button>
          </div>
        )}
      </div>

      {/* Mobile stacked layout */}
      <div className="mt-8 space-y-4 md:hidden">
        <MobileTable
          players={visiblePlayers}
          selectedStat={selectedStat}
          expandedPlayerId={expandedPlayerId}
          onToggleExpand={handleToggleExpand}
        />

        {hasMoreRows && (
          <div className="mt-2 text-center">
            <Button
              variant="outline"
              onClick={handleShowMore}
              className="rounded-full border-neutral-700 bg-neutral-950/90 px-5 py-1.5 text-[11px] text-neutral-200 hover:border-yellow-400 hover:bg-neutral-900"
            >
              {visibleCount + 20 >= filteredPlayers.length
                ? "Show remaining rows"
                : "Show 20 more rows"}
            </Button>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/60 bg-black/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
          <Sparkles className="h-3 w-3" />
          <span>Neeko+ Master Grid</span>
        </div>
        <p className="max-w-xl text-xs text-neutral-300/90">
          Unlock full-season ledgers, deeper hit-rate bands and advanced role
          filters for every player.
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
  <div className="flex items-center gap-2 rounded-full border border-neutral-700/70 bg-black/75 px-3 py-1">
    <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
      {label}
    </span>
    <span className="text-[11px] text-neutral-100">{value}</span>
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900/90 px-2 py-0.5 text-[10px] text-neutral-300">
      <Lock className="h-3 w-3 text-yellow-300" />
      Neeko+
    </span>
  </div>
);

// -----------------------------------------------------------------------------
// Desktop tables
// -----------------------------------------------------------------------------

type DesktopTableProps = {
  players: PlayerRow[];
  selectedStat: StatLens;
  expandedPlayerId: number | null;
  onToggleExpand: (id: number) => void;
};

const DesktopFullTable: React.FC<DesktopTableProps> = ({
  players,
  selectedStat,
  expandedPlayerId,
  onToggleExpand,
}) => {
  const config = STAT_CONFIG[selectedStat];

  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-800/80 bg-neutral-950/90">
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Sticky header */}
          <div className="sticky top-0 z-30 flex bg-black/95 backdrop-blur-sm">
            {/* Player header */}
            <div className="sticky left-0 z-40 flex w-64 flex-shrink-0 items-center gap-3 border-b border-neutral-800/80 bg-black px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
              <span className="w-6 text-[10px] text-neutral-500">#</span>
              <span>Player</span>
            </div>

            {/* Rounds + summary + hit-rate headers */}
            <div className="flex flex-1 border-b border-neutral-800/80 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              <HeaderCell label="OR" />
              {ROUND_LABELS.slice(1).map((label) => (
                <HeaderCell key={label} label={label} />
              ))}
              <HeaderCell label="Min" />
              <HeaderCell label="Max" />
              <HeaderCell label="Avg" />
              <HeaderCell label="Total" wide />
              {config.hitRateLabels.map((label) => (
                <HeaderCell key={label} label={label} accent />
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="divide-y divide-neutral-900/80">
            {players.map((player, index) => {
              const isExpanded = expandedPlayerId === player.id;
              const isPremiumBlurred = index >= 20;
              const summary = computeSummary(player);
              const hitRates = computeHitRates(player, selectedStat);

              return (
                <div key={player.id} className="relative">
                  {/* Blur wrapper */}
                  <div
                    className={
                      isPremiumBlurred
                        ? "pointer-events-none blur-[1.5px] brightness-[0.7]"
                        : ""
                    }
                  >
                    {/* Main row */}
                    <div
                      className={`group flex text-xs text-neutral-100 transition-colors duration-150 ${
                        isExpanded
                          ? "bg-neutral-900/75"
                          : "hover:bg-neutral-900/55"
                      }`}
                    >
                      {/* Sticky player cell */}
                      <button
                        type="button"
                        onClick={() => onToggleExpand(player.id)}
                        className="sticky left-0 z-20 flex w-64 flex-shrink-0 items-center gap-3 border-r border-neutral-900/80 bg-gradient-to-r from-black/98 via-black/94 to-black/80 px-4 py-2.5 text-left"
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

                      {/* Number cells */}
                      <div className="flex flex-1 items-center text-center text-[11px]">
                        <BodyCell value={player.orScore} />
                        {player.rounds.slice(1).map((score, idx) => (
                          <BodyCell key={idx} value={score} />
                        ))}
                        <BodyCell value={summary.min} dim />
                        <BodyCell value={summary.max} />
                        <BodyCell value={summary.avg.toFixed(1)} />
                        <BodyCell value={summary.total} strong wide />
                        {hitRates.map((value, idx) => (
                          <HitRateCell key={idx} value={value} />
                        ))}
                      </div>
                    </div>

                    {/* Expanded analytics */}
                    {isExpanded && (
                      <DesktopExpandedRow
                        player={player}
                        selectedStat={selectedStat}
                      />
                    )}
                  </div>

                  {/* Premium overlay */}
                  {isPremiumBlurred && (
                    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-b from-black/80 via-black/85 to-black/95">
                      <div className="space-y-3 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-black/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200">
                          <Sparkles className="h-3 w-3" />
                          <span>Neeko+ Master Grid</span>
                        </div>
                        <p className="mx-auto max-w-sm text-xs text-neutral-200">
                          Additional players beyond the top 20 are blurred here
                          and will be fully unlocked for Neeko+ members.
                        </p>
                        <Button className="rounded-full bg-yellow-400 px-6 py-1.5 text-xs font-semibold text-black shadow-[0_0_30px_rgba(250,204,21,0.9)] hover:bg-yellow-300">
                          Unlock Neeko+ Insights
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const DesktopCompactTable: React.FC<DesktopTableProps> = ({
  players,
  selectedStat,
  expandedPlayerId,
  onToggleExpand,
}) => {
  const config = STAT_CONFIG[selectedStat];

  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-800/80 bg-neutral-950/90">
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Sticky header */}
          <div className="sticky top-0 z-30 flex bg-black/95 backdrop-blur-sm">
            <div className="sticky left-0 z-40 flex w-64 flex-shrink-0 items-center gap-3 border-b border-neutral-800/80 bg-black px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
              <span className="w-6 text-[10px] text-neutral-500">#</span>
              <span>Player</span>
            </div>

            <div className="flex flex-1 border-b border-neutral-800/80 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              <HeaderCell label="Min" />
              <HeaderCell label="Max" />
              <HeaderCell label="Avg" />
              <HeaderCell label="Total" wide />
              {config.hitRateLabels.map((label) => (
                <HeaderCell key={label} label={label} accent />
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="divide-y divide-neutral-900/80">
            {players.map((player, index) => {
              const isExpanded = expandedPlayerId === player.id;
              const isPremiumBlurred = index >= 20;
              const summary = computeSummary(player);
              const hitRates = computeHitRates(player, selectedStat);

              return (
                <div key={player.id} className="relative">
                  <div
                    className={
                      isPremiumBlurred
                        ? "pointer-events-none blur-[1.5px] brightness-[0.7]"
                        : ""
                    }
                  >
                    <div
                      className={`group flex text-xs text-neutral-100 transition-colors duration-150 ${
                        isExpanded
                          ? "bg-neutral-900/75"
                          : "hover:bg-neutral-900/55"
                      }`}
                    >
                      {/* Player cell */}
                      <button
                        type="button"
                        onClick={() => onToggleExpand(player.id)}
                        className="sticky left-0 z-20 flex w-64 flex-shrink-0 items-center gap-3 border-r border-neutral-900/80 bg-gradient-to-r from-black/98 via-black/94 to-black/80 px-4 py-2.5 text-left"
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

                      {/* Summary cols */}
                      <div className="flex flex-1 items-center text-center text-[11px]">
                        <BodyCell value={summary.min} dim />
                        <BodyCell value={summary.max} />
                        <BodyCell value={summary.avg.toFixed(1)} />
                        <BodyCell value={summary.total} strong wide />
                        {hitRates.map((value, idx) => (
                          <HitRateCell key={idx} value={value} />
                        ))}
                      </div>
                    </div>

                    {isExpanded && (
                      <DesktopExpandedRow
                        player={player}
                        selectedStat={selectedStat}
                      />
                    )}
                  </div>

                  {isPremiumBlurred && (
                    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-b from-black/80 via-black/85 to-black/95">
                      <div className="space-y-3 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-black/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200">
                          <Sparkles className="h-3 w-3" />
                          <span>Neeko+ Master Grid</span>
                        </div>
                        <p className="mx-auto max-w-sm text-xs text-neutral-200">
                          Unlock full compact grid and AI-driven summaries for
                          every player beyond the top 20.
                        </p>
                        <Button className="rounded-full bg-yellow-400 px-6 py-1.5 text-xs font-semibold text-black shadow-[0_0_30px_rgba(250,204,21,0.9)] hover:bg-yellow-300">
                          Unlock Neeko+ Insights
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Desktop expanded row (sparkline + CI + hit-rate profile + AI text)
// -----------------------------------------------------------------------------

type ExpandedRowProps = {
  player: PlayerRow;
  selectedStat: StatLens;
};

const DesktopExpandedRow: React.FC<ExpandedRowProps> = ({
  player,
  selectedStat,
}) => {
  const config = STAT_CONFIG[selectedStat];
  const summary = computeSummary(player);
  const confidence = computeConfidenceScore(player, selectedStat);
  const hitRates = computeHitRates(player, selectedStat);

  const volatilityLabel =
    summary.volatilityRange <= 8
      ? "Low"
      : summary.volatilityRange <= 14
      ? "Medium"
      : "High";

  return (
    <div className="border-t border-neutral-900/80 bg-gradient-to-b from-neutral-950 via-neutral-950 to-black px-6 pb-6 pt-4 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)]">
        {/* Left – recent window + sparkline + AI blurb */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/90 via-neutral-950 to-black p-5 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
            <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-neutral-400">
              <span>Recent scoring window</span>
              <span className="text-neutral-500">
                Last {summary.lastWindow.length} •{" "}
                <span className="text-yellow-200">
                  {summary.l5Avg.toFixed(1)} {config.valueUnitShort} L5 avg
                </span>
              </span>
            </div>

            <div className="mb-4 grid gap-3 text-[11px] text-neutral-300 sm:grid-cols-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  L5 avg
                </div>
                <div className="mt-1 text-sm font-semibold text-yellow-200">
                  {summary.l5Avg.toFixed(1)} {config.valueUnitShort}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  Best / Worst
                </div>
                <div className="mt-1 text-sm font-semibold text-neutral-100">
                  {summary.windowMax} / {summary.windowMin}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  Volatility
                </div>
                <div className="mt-1 text-sm font-semibold text-emerald-300">
                  {volatilityLabel}{" "}
                  <span className="text-[11px] font-normal text-neutral-400">
                    ({summary.volatilityRange} range)
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-yellow-500/20 bg-gradient-to-b from-yellow-500/10 via-neutral-950 to-black px-4 py-3">
              <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                <span>Recent form sparkline</span>
                <span className="text-neutral-500">
                  Range {summary.windowMin}–{summary.windowMax}{" "}
                  {config.valueUnitShort}
                </span>
              </div>
              <MiniSparkline values={summary.lastWindow} />
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/80 px-5 py-4 text-[11px] text-neutral-300 shadow-inner">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200">
              AI Performance Summary
            </div>
            <p className="leading-snug">
              Usage and role suggest{" "}
              <span className="font-semibold text-neutral-50">
                stable opportunity with moderate volatility
              </span>{" "}
              in this scoring lens. Hit-rate distribution indicates a secure
              floor with periodic ceiling spikes in favourable matchups.
            </p>
          </div>
        </div>

        {/* Right – Confidence index + hit-rate bars */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-yellow-400/35 bg-gradient-to-b from-yellow-500/18 via-black to-black p-5 shadow-[0_0_30px_rgba(250,204,21,0.75)]">
            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-yellow-100">
              <span>Confidence Index</span>
              <span>{confidence}%</span>
            </div>
            <p className="text-[11px] text-neutral-200">
              Blends floor/ceiling hit-rates, recent window stability and the
              spread of outcomes at this stat lens.
            </p>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-900">
              <div
                className="h-full rounded-full bg-lime-400"
                style={{ width: `${confidence}%` }}
              />
            </div>

            <div className="mt-2 flex justify-between text-[10px] text-neutral-400">
              <span>Floor security</span>
              <span>Ceiling access</span>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/80 px-5 py-4 text-[11px] text-neutral-200">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Hit-rate profile
            </div>
            <div className="space-y-2.5">
              {hitRates.map((value, idx) => (
                <HitRateProfileBar
                  key={STAT_CONFIG[selectedStat].hitRateLabels[idx]}
                  label={STAT_CONFIG[selectedStat].hitRateLabels[idx]}
                  value={value}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Mobile layout – stacked cards
// -----------------------------------------------------------------------------

type MobileTableProps = {
  players: PlayerRow[];
  selectedStat: StatLens;
  expandedPlayerId: number | null;
  onToggleExpand: (id: number) => void;
};

const MobileTable: React.FC<MobileTableProps> = ({
  players,
  selectedStat,
  expandedPlayerId,
  onToggleExpand,
}) => {
  const config = STAT_CONFIG[selectedStat];

  return (
    <>
      {players.map((player, index) => {
        const isExpanded = expandedPlayerId === player.id;
        const isPremiumBlurred = index >= 20;
        const summary = computeSummary(player);
        const hitRates = computeHitRates(player, selectedStat);

        return (
          <div key={player.id} className="relative">
            <div
              className={
                isPremiumBlurred
                  ? "pointer-events-none blur-[1.5px] brightness-[0.7]"
                  : ""
              }
            >
              <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/95 p-4 text-xs text-neutral-100">
                {/* Header row */}
                <button
                  type="button"
                  onClick={() => onToggleExpand(player.id)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700/80 bg-neutral-950/90 text-[10px] text-neutral-300">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-neutral-50">
                        {player.name}
                      </span>
                      <span className="text-[11px] text-yellow-200">
                        {summary.avg.toFixed(1)} {config.valueUnitShort} avg
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-400">
                      <span className="uppercase tracking-[0.16em]">
                        {player.team} • {player.role}
                      </span>
                      <span>
                        {summary.min}–{summary.max} • {summary.total} total
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-yellow-300" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-neutral-500" />
                  )}
                </button>

                {/* Hit-rate row */}
                <div className="mt-3 grid grid-cols-5 gap-1 text-[10px]">
                  {config.hitRateLabels.map((label, idx) => (
                    <HitRatePill key={label} label={label} value={hitRates[idx]} />
                  ))}
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="mt-4 space-y-3">
                    {/* Round ledger */}
                    <div>
                      <div className="mb-1 flex items-center justify-between text-[10px] text-neutral-400">
                        <span className="uppercase tracking-[0.16em]">
                          Round ledger
                        </span>
                        <span>
                          L5: {summary.l5Avg.toFixed(1)} {config.valueUnitShort}
                        </span>
                      </div>
                      <div className="flex gap-1 overflow-x-auto pb-1">
                        {player.rounds.map((score, idx) => (
                          <div
                            key={idx}
                            className="min-w-[46px] rounded-md bg-neutral-900/90 px-2 py-1 text-center text-[10px]"
                          >
                            <div className="text-[9px] text-neutral-500">
                              {ROUND_LABELS[idx]}
                            </div>
                            <div className="mt-0.5 text-[11px] text-neutral-100">
                              {score}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mini sparkline */}
                    <div className="rounded-xl border border-yellow-500/20 bg-gradient-to-b from-yellow-500/10 via-neutral-950 to-black px-3 py-2">
                      <div className="mb-1 flex items-center justify-between text-[9px] uppercase tracking-[0.16em] text-neutral-400">
                        <span>Recent form sparkline</span>
                        <span className="text-neutral-500">
                          Range {summary.lastWindow.length > 0
                            ? `${summary.windowMin}–${summary.windowMax}`
                            : "-"}{" "}
                          {config.valueUnitShort}
                        </span>
                      </div>
                      <MiniSparkline values={summary.lastWindow} />
                    </div>

                    {/* AI summary + compact confidence */}
                    <div className="space-y-3">
                      <div className="rounded-lg border border-neutral-800/70 bg-neutral-900/80 px-3 py-2 text-[11px] text-neutral-300">
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-yellow-200">
                          AI Performance Summary
                        </div>
                        <p className="leading-snug">
                          Quick AI read on role, form stability and scoring
                          outlook at this lens.
                        </p>
                      </div>

                      <div className="rounded-lg border border-yellow-400/35 bg-gradient-to-b from-yellow-500/15 via-black to-black px-3 py-2 text-[11px] text-neutral-200">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-yellow-100">
                          <span>Confidence Index</span>
                          <span>{computeConfidenceScore(player, selectedStat)}%</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-900">
                          <div
                            className="h-full rounded-full bg-lime-400"
                            style={{
                              width: `${computeConfidenceScore(
                                player,
                                selectedStat
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isPremiumBlurred && (
              <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-b from-black/80 via-black/85 to-black/95">
                <div className="space-y-3 text-center">
                  <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-black/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200">
                    <Sparkles className="h-3 w-3" />
                    <span>Neeko+ Master Grid</span>
                  </div>
                  <p className="mx-auto max-w-xs text-[11px] text-neutral-200">
                    Additional players beyond the top 20 are blurred here and
                    will be fully unlocked for Neeko+ members.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

// -----------------------------------------------------------------------------
// Shared cells + sparkline
// -----------------------------------------------------------------------------

type HeaderCellProps = {
  label: string;
  wide?: boolean;
  accent?: boolean;
};

const HeaderCell: React.FC<HeaderCellProps> = ({ label, wide, accent }) => (
  <div
    className={`flex items-center justify-center border-l border-neutral-900/85 px-2 py-3 ${
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
  wide?: boolean;
};

const BodyCell: React.FC<BodyCellProps> = ({ value, dim, strong, wide }) => (
  <div
    className={`flex items-center justify-center border-l border-neutral-900/85 px-2 py-2.5 text-[11px] ${
      wide ? "min-w-[72px]" : "min-w-[52px]"
    } ${dim ? "text-neutral-400" : "text-neutral-100"} ${
      strong ? "font-semibold text-neutral-50" : ""
    }`}
  >
    {value}
  </div>
);

type HitRateCellProps = {
  value: number;
};

const HitRateCell: React.FC<HitRateCellProps> = ({ value }) => {
  let color = "";
  let bg = "";

  if (value < 15) {
    color = "text-red-400";
    bg = "bg-red-500/12";
  } else if (value < 30) {
    color = "text-orange-400";
    bg = "bg-orange-500/12";
  } else if (value < 60) {
    color = "text-yellow-300";
    bg = "bg-yellow-500/12";
  } else if (value < 90) {
    color = "text-green-400";
    bg = "bg-green-500/12";
  } else {
    color = "text-lime-300";
    bg = "bg-lime-400/12";
  }

  return (
    <div className="flex min-w-[52px] items-center justify-center border-l border-neutral-900/85 px-2 py-2.5">
      <span
        className={`inline-flex min-w-[44px] items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${bg} ${color}`}
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

const HitRatePill: React.FC<HitRatePillProps> = ({ label, value }) => {
  let color = "";
  if (value < 15) color = "text-red-400";
  else if (value < 30) color = "text-orange-400";
  else if (value < 60) color = "text-yellow-300";
  else if (value < 90) color = "text-green-400";
  else color = "text-lime-300";

  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-neutral-900/90 px-2 py-1 text-[10px]">
      <span className="text-[9px] text-neutral-500">{label}</span>
      <span className={`mt-0.5 text-[11px] font-semibold ${color}`}>
        {isNaN(value) ? "-" : `${value}%`}
      </span>
    </div>
  );
};

type HitRateProfileBarProps = {
  label: string;
  value: number;
};

const HitRateProfileBar: React.FC<HitRateProfileBarProps> = ({
  label,
  value,
}) => {
  let barColor = "bg-red-500/70";
  if (value >= 90) barColor = "bg-lime-400";
  else if (value >= 60) barColor = "bg-green-400/80";
  else if (value >= 30) barColor = "bg-yellow-400/80";
  else if (value >= 15) barColor = "bg-orange-400/80";

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 text-[10px] text-neutral-400">{label}</div>
      <div className="flex-1 rounded-full bg-neutral-800/90">
        <div
          className={`h-2 rounded-full ${barColor}`}
          style={{ width: `${Math.max(value, 3)}%` }}
        />
      </div>
      <div className="w-10 text-right text-[10px] text-neutral-300">
        {value}%
      </div>
    </div>
  );
};

type MiniSparklineProps = {
  values: number[];
};

const MiniSparkline: React.FC<MiniSparklineProps> = ({ values }) => {
  if (!values || values.length === 0) {
    return (
      <div className="h-16 rounded-md bg-neutral-950/80" aria-hidden="true" />
    );
  }

  const width = 260;
  const height = 90;
  const paddingX = 8;
  const paddingY = 8;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x =
      paddingX +
      (i / Math.max(values.length - 1, 1)) * (width - paddingX * 2);
    const y =
      paddingY +
      (1 - (v - min) / range) * (height - paddingY * 2);
    return { x, y };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-20 w-full text-yellow-300"
      preserveAspectRatio="none"
    >
      <line
        x1={paddingX}
        x2={width - paddingX}
        y1={height - paddingY}
        y2={height - paddingY}
        stroke="rgba(148,163,184,0.35)"
        strokeWidth={0.75}
      />
      <path
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      {last && (
        <>
          <line
            x1={last.x}
            x2={last.x}
            y1={paddingY}
            y2={height - paddingY}
            stroke="rgba(148,163,184,0.45)"
            strokeWidth={0.8}
            strokeDasharray="3 3"
          />
          <circle
            cx={last.x}
            cy={last.y}
            r={3}
            fill="#ffffff"
            stroke="currentColor"
            strokeWidth={1}
          />
        </>
      )}
    </svg>
  );
};

export default MasterTable;