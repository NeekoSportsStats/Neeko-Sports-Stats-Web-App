// src/components/afl/players/MasterTable.tsx

import React, { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Lock,
  Search,
  Sparkles,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// -----------------------------------------------------------------------------
// Types & config
// -----------------------------------------------------------------------------

type StatLens = "Fantasy" | "Disposals" | "Goals";

type PlayerRow = {
  id: number;
  name: string;
  team: string;
  role: string;
  roundsFantasy: number[];
  roundsDisposals: number[];
  roundsGoals: number[];
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

const INITIAL_VISIBLE = 20;
const PAGE_SIZE = 20;

// -----------------------------------------------------------------------------
// Mock data – SQL-friendly shape to swap for Supabase later
// -----------------------------------------------------------------------------

const getRoundsForLens = (player: PlayerRow, lens: StatLens) => {
  if (lens === "Fantasy") return player.roundsFantasy;
  if (lens === "Disposals") return player.roundsDisposals;
  return player.roundsGoals;
};

const buildMockPlayers = (): PlayerRow[] =>
  Array.from({ length: 60 }).map((_, index) => {
    const fantasyBase =
      index < 10 ? 80 : index < 20 ? 85 : index < 40 ? 90 : 95;

    const makeSeries = (base: number, jitterRange: number) =>
      ROUND_LABELS.map(() => {
        const jitter = Math.round(Math.random() * jitterRange * 2 - jitterRange);
        return base + jitter;
      });

    const roundsFantasy = makeSeries(fantasyBase, 9);
    const roundsDisposals = makeSeries(
      Math.max(18, fantasyBase - 30 + (index % 5)),
      5
    );

    const roundsGoals = ROUND_LABELS.map(() => {
      const raw =
        Math.round((fantasyBase - 70) / 12) + Math.round(Math.random() * 2) - 1;
      return Math.min(Math.max(raw, 0), 6);
    });

    return {
      id: index + 1,
      name: `Player ${index + 1}`,
      team: ["GEEL", "CARL", "ESS", "COLL", "RICH", "NMFC"][index % 6],
      role: ["MID", "RUC", "FWD", "DEF"][index % 4],
      roundsFantasy,
      roundsDisposals,
      roundsGoals,
    };
  });

const MOCK_PLAYERS: PlayerRow[] = buildMockPlayers();

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function computeSummary(player: PlayerRow, lens: StatLens) {
  const rounds = getRoundsForLens(player, lens);
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

  return {
    min,
    max,
    total,
    avg,
    lastWindow,
    l5Avg,
    windowMin,
    windowMax,
    volatilityRange,
  };
}

function computeHitRates(player: PlayerRow, lens: StatLens) {
  const { thresholds } = STAT_CONFIG[lens];
  const rounds = getRoundsForLens(player, lens);
  return thresholds.map((t) => {
    const count = rounds.filter((v) => v >= t).length;
    return Math.round((count / rounds.length) * 100);
  });
}

function computeConfidenceScore(player: PlayerRow, lens: StatLens) {
  const hitRates = computeHitRates(player, lens);
  const { volatilityRange } = computeSummary(player, lens);

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
  const [expandedPlayerId, setExpandedPlayerId] = useState<number | null>(1);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [compactMode, setCompactMode] = useState(false);

  // mobile insights panel
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobilePlayer, setMobilePlayer] = useState<PlayerRow | null>(null);

  const players = MOCK_PLAYERS; // swap for Supabase query later

  const filteredPlayers = useMemo(() => players, [players]);
  const visiblePlayers = useMemo(
    () => filteredPlayers.slice(0, Math.min(visibleCount, filteredPlayers.length)),
    [filteredPlayers, visibleCount]
  );
  const hasMoreRows = visibleCount < filteredPlayers.length;

  const config = STAT_CONFIG[selectedStat];

  const handleToggleExpand = (id: number) => {
    setExpandedPlayerId((prev) => (prev === id ? null : id));
  };

  const handleShowMore = () => {
    setVisibleCount((prev) =>
      Math.min(prev + PAGE_SIZE, filteredPlayers.length)
    );
  };

  const handleOpenMobileInsights = (player: PlayerRow) => {
    setMobilePlayer(player);
    setMobileOpen(true);
  };

  const handleMobileSheetChange = (open: boolean) => {
    setMobileOpen(open);
    if (!open) setMobilePlayer(null);
  };

  return (
    <section
      id="master-table"
      className="relative mt-16 mb-24 rounded-[32px] border border-yellow-500/15 bg-gradient-to-b from-neutral-950 via-neutral-950/90 to-black px-4 py-8 shadow-[0_40px_160px_rgba(0,0,0,0.9)] sm:px-6 lg:px-8"
    >
      {/* Header & Controls */}
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

        <div className="flex flex-col gap-3 md:items-end">
          {/* Stat selector */}
          <div className="flex items-center gap-2 rounded-full border border-neutral-700/70 bg-black/70 px-2 py-1 text-xs text-neutral-200">
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

          {/* Compact toggle – desktop only */}
          <div className="hidden items-center gap-3 rounded-full border border-neutral-700/70 bg-black/70 px-3 py-1.5 text-[11px] text-neutral-300 sm:flex">
            <span className="font-medium text-neutral-100">Full grid</span>
            <Switch
              checked={compactMode}
              onCheckedChange={(val) => setCompactMode(val)}
              className="data-[state=checked]:bg-yellow-400"
            />
            <span className="font-medium text-neutral-100">Compact</span>
          </div>
        </div>
      </div>

      {/* Search + filters (Neeko+ locked) */}
      <div className="mt-6 space-y-3">
        {/* Search bar – locked */}
        <div className="flex items-center gap-2 rounded-full border border-neutral-700/80 bg-black/80 px-3 py-1.5 text-[11px] text-neutral-300">
          <Search className="h-3.5 w-3.5 text-yellow-300" />
          <input
            type="text"
            disabled
            placeholder="Search players (Neeko+ only)"
            className="w-full bg-transparent text-xs text-neutral-500 placeholder:text-neutral-500 focus:outline-none"
          />
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900/90 px-2 py-0.5 text-[10px] text-neutral-300">
            <Lock className="h-3 w-3 text-yellow-300" />
            Neeko+
          </span>
        </div>

        {/* Team & Round filter pills – Neeko+ only (visual) */}
        <div className="flex flex-col gap-2 text-[11px] text-neutral-300 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700/80 bg-black/80 px-3 py-1">
              <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                Team
              </span>
              <button
                type="button"
                className="rounded-full bg-neutral-900/80 px-2 py-0.5 text-[11px] text-neutral-100"
                disabled
              >
                All teams
              </button>
              <span className="inline-flex items-center gap-1 rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] text-neutral-300">
                <Lock className="h-3 w-3 text-yellow-300" />
                Neeko+
              </span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700/80 bg-black/80 px-3 py-1">
              <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                Round
              </span>
              <button
                type="button"
                className="rounded-full bg-neutral-900/80 px-2 py-0.5 text-[11px] text-neutral-100"
                disabled
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
      </div>

      {/* DESKTOP TABLE ------------------------------------------------------- */}
      <div className="mt-8 hidden rounded-3xl border border-neutral-800/80 bg-neutral-950/95 md:block">
        <div className="w-full overflow-x-auto">
          <table className="min-w-[1040px] border-separate border-spacing-0 text-[11px] text-neutral-100 md:min-w-full">
            <thead>
              <tr className="sticky top-0 z-20 bg-black/95 backdrop-blur-sm">
                {/* Sticky player header */}
                <th
                  className="sticky left-0 z-30 w-60 border-b border-neutral-800/80 bg-black px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300"
                  scope="col"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 text-[10px] text-neutral-500">#</span>
                    <span>Player</span>
                  </span>
                </th>

                {/* Round headers */}
                {!compactMode &&
                  ROUND_LABELS.map((label) => (
                    <HeaderCell key={label} label={label} />
                  ))}

                {/* Summary */}
                {!compactMode && <HeaderCell label="Min" />}
                {!compactMode && <HeaderCell label="Max" />}
                <HeaderCell label="Avg" />
                <HeaderCell label="Total" wide />

                {/* Hit-rate headers depend on selected stat */}
                {config.hitRateLabels.map((label) => (
                  <HeaderCell key={label} label={label} accent />
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-900/80">
              {visiblePlayers.map((player, index) => {
                const isExpanded = expandedPlayerId === player.id;
                const isPremiumBlurred = index >= 20;
                const rounds = getRoundsForLens(player, selectedStat);
                const summary = computeSummary(player, selectedStat);
                const hitRates = computeHitRates(player, selectedStat);
                const confidence = computeConfidenceScore(
                  player,
                  selectedStat
                );

                const rowBase =
                  "transition-colors duration-150 " +
                  (compactMode ? "leading-tight" : "");

                const blurClass = isPremiumBlurred
                  ? "blur-[3px] brightness-[0.65]"
                  : "";

                return (
                  <React.Fragment key={player.id}>
                    {/* Main row */}
                    <tr
                      className={`${rowBase} ${
                        isExpanded
                          ? "bg-neutral-900/75"
                          : "hover:bg-neutral-900/55"
                      }`}
                    >
                      {/* Sticky player cell */}
                      <td
                        className={`sticky left-0 z-10 w-60 border-r border-neutral-900/80 bg-gradient-to-r from-black/98 via-black/94 to-black/80 px-4 ${
                          compactMode ? "py-2" : "py-2.5"
                        } ${blurClass}`}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleExpand(player.id)}
                          className="flex w-full items-center gap-3 text-left"
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
                      </td>

                      {/* Round values */}
                      {!compactMode &&
                        rounds.map((score, idx) => (
                          <BodyCell
                            key={idx}
                            value={score}
                            compact={compactMode}
                            blurClass={blurClass}
                          />
                        ))}

                      {/* Summary */}
                      {!compactMode && (
                        <BodyCell
                          value={summary.min}
                          dim
                          compact={compactMode}
                          blurClass={blurClass}
                        />
                      )}
                      {!compactMode && (
                        <BodyCell
                          value={summary.max}
                          compact={compactMode}
                          blurClass={blurClass}
                        />
                      )}

                      <BodyCell
                        value={summary.avg.toFixed(1)}
                        compact={compactMode}
                        blurClass={blurClass}
                      />
                      <BodyCell
                        value={summary.total}
                        strong
                        wide
                        compact={compactMode}
                        blurClass={blurClass}
                      />

                      {/* Hit-rates */}
                      {hitRates.map((value, idx) => (
                        <HitRateCell
                          key={idx}
                          value={value}
                          compact={compactMode}
                          blurClass={blurClass}
                        />
                      ))}
                    </tr>

                    {/* Expanded analytics row (desktop only) */}
                    {isExpanded && (
                      <tr className="bg-gradient-to-b from-neutral-950 via-neutral-950 to-black">
                        <td
                          colSpan={1000}
                          className={`border-t border-neutral-900/80 px-4 pb-6 pt-4 sm:px-6 lg:px-8 ${
                            isPremiumBlurred
                              ? "blur-[3px] brightness-[0.65]"
                              : ""
                          }`}
                        >
                          <ExpandedInsights
                            player={player}
                            selectedStat={selectedStat}
                            confidence={confidence}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Show more rows – desktop */}
        {hasMoreRows && (
          <div className="border-t border-neutral-900/80 bg-black/90 py-4 text-center">
            <Button
              variant="outline"
              onClick={handleShowMore}
              className="rounded-full border-neutral-700 bg-neutral-950/90 px-5 py-1.5 text-xs text-neutral-200 hover:border-yellow-400 hover:bg-neutral-900"
            >
              Show 20 more rows
            </Button>
          </div>
        )}
      </div>

      {/* MOBILE CARD LIST ---------------------------------------------------- */}
      <div className="mt-8 md:hidden">
        <div className="space-y-3">
          {visiblePlayers.map((player, index) => {
            const isPremiumBlurred = index >= 20;
            const blurClass = isPremiumBlurred
              ? "blur-[3px] brightness-[0.65]"
              : "";

            return (
              <MobilePlayerCard
                key={player.id}
                player={player}
                index={index}
                selectedStat={selectedStat}
                blurClass={blurClass}
                onOpen={() => handleOpenMobileInsights(player)}
              />
            );
          })}
        </div>

        {hasMoreRows && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={handleShowMore}
              className="rounded-full border-neutral-700 bg-neutral-950/90 px-5 py-1.5 text-xs text-neutral-200 hover:border-yellow-400 hover:bg-neutral-900"
            >
              Show 20 more players
            </Button>
          </div>
        )}
      </div>

      {/* Bottom CTA – full-width Neeko+ card */}
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/60 bg-black/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
          <Sparkles className="h-3 w-3" />
          <span>Neeko+ Master Grid</span>
        </div>
        <p className="max-w-xl text-xs text-neutral-300/90">
          Unlock full compact grid, advanced hit-rate bands and deep role
          filters for every player.
        </p>
        <Button
          size="lg"
          className="mt-1 rounded-full bg-yellow-400 px-7 py-2 text-sm font-semibold text-black shadow-[0_0_40px_rgba(250,204,21,0.9)] hover:bg-yellow-300"
        >
          Unlock Neeko+ Insights
        </Button>
      </div>

      {/* MOBILE BOTTOM SHEET ------------------------------------------------- */}
      <Sheet open={mobileOpen} onOpenChange={handleMobileSheetChange}>
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-[32px] border border-yellow-500/40 bg-gradient-to-b from-neutral-950 via-black to-black px-4 py-4"
        >
          {mobilePlayer && (
            <>
              <SheetHeader className="space-y-1">
                <SheetTitle className="text-base font-semibold text-neutral-50">
                  {mobilePlayer.name}
                </SheetTitle>
                <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
                  {mobilePlayer.team} • {mobilePlayer.role}
                </div>
              </SheetHeader>

              <div className="mt-4 h-[calc(85vh-80px)] overflow-y-auto pb-6">
                <ExpandedInsights
                  player={mobilePlayer}
                  selectedStat={selectedStat}
                  confidence={computeConfidenceScore(
                    mobilePlayer,
                    selectedStat
                  )}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
};

// -----------------------------------------------------------------------------
// Expanded insights layout – reused for desktop row + mobile bottom sheet
// -----------------------------------------------------------------------------

type ExpandedInsightsProps = {
  player: PlayerRow;
  selectedStat: StatLens;
  confidence: number;
};

const ExpandedInsights: React.FC<ExpandedInsightsProps> = ({
  player,
  selectedStat,
  confidence,
}) => {
  const config = STAT_CONFIG[selectedStat];
  const summary = computeSummary(player, selectedStat);
  const hitRates = computeHitRates(player, selectedStat);

  const volatilityLabel =
    summary.volatilityRange <= 8
      ? "Low"
      : summary.volatilityRange <= 14
      ? "Medium"
      : "High";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)]">
      {/* Left – sparkline + micro stats + AI summary */}
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

          {/* Mini sparkline */}
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

        {/* AI Summary */}
        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/80 px-5 py-4 text-[11px] text-neutral-300 shadow-inner">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200">
            AI Performance Summary
          </div>
          <p className="leading-snug">
            Usage and role suggest{" "}
            <span className="font-semibold text-neutral-50">
              stable opportunity with moderate volatility
            </span>{" "}
            in this scoring lens. Hit-rate distribution indicates a secure floor
            with periodic ceiling spikes in favourable matchups.
          </p>
        </div>
      </div>

      {/* Right – Confidence index + hit-rate profile */}
      <div className="space-y-4">
        {/* Confidence Index */}
        <div className="rounded-2xl border border-yellow-400/35 bg-gradient-to-b from-yellow-500/18 via-black to-black p-5 shadow-[0_0_30px_rgba(250,204,21,0.75)]">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-yellow-100">
            <span>Confidence Index</span>
            <span>{confidence}%</span>
          </div>
          <p className="text-[11px] text-neutral-200">
            Blends floor/ceiling hit-rates, recent window stability and spread
            of outcomes at this stat lens.
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

        {/* Hit-rate profile bars */}
        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/80 px-5 py-4 text-[11px] text-neutral-200">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Hit-rate profile
          </div>
          <div className="space-y-2.5">
            {hitRates.map((value, idx) => (
              <HitRateProfileBar
                key={config.hitRateLabels[idx]}
                label={config.hitRateLabels[idx]}
                value={value}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Mobile premium card – gradient/glow, compact summary
// -----------------------------------------------------------------------------

type MobilePlayerCardProps = {
  player: PlayerRow;
  index: number;
  selectedStat: StatLens;
  blurClass?: string;
  onOpen: () => void;
};

const MobilePlayerCard: React.FC<MobilePlayerCardProps> = ({
  player,
  index,
  selectedStat,
  blurClass = "",
  onOpen,
}) => {
  const config = STAT_CONFIG[selectedStat];
  const summary = computeSummary(player, selectedStat);
  const hitRates = computeHitRates(player, selectedStat);

  const topBand = hitRates[0] ?? 0;
  const ceilingBand = hitRates[hitRates.length - 1] ?? 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 via-black to-black px-4 py-3 shadow-[0_0_40px_rgba(0,0,0,0.9)] ${blurClass}`}
    >
      {/* subtle glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-yellow-500/5 via-transparent to-yellow-500/5 opacity-60" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700/80 bg-neutral-950/80 text-[10px] text-neutral-300">
              {index + 1}
            </span>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-neutral-50">
                {player.name}
              </span>
              <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                {player.team} • {player.role}
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-neutral-200">
            <div>
              <div className="text-[9px] uppercase tracking-[0.18em] text-neutral-500">
                {config.label} avg
              </div>
              <div className="mt-0.5 text-sm font-semibold text-yellow-200">
                {summary.avg.toFixed(1)} {config.valueUnitShort}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.18em] text-neutral-500">
                Total
              </div>
              <div className="mt-0.5 text-sm font-semibold text-neutral-100">
                {summary.total}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.18em] text-neutral-500">
                L5 avg
              </div>
              <div className="mt-0.5 text-xs font-medium text-neutral-100">
                {summary.l5Avg.toFixed(1)} {config.valueUnitShort}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.18em] text-neutral-500">
                Hit profile
              </div>
              <div className="mt-0.5 text-xs text-neutral-200">
                <span className="font-semibold text-emerald-300">
                  {topBand}%{" "}
                </span>
                {config.hitRateLabels[0]} floor •{" "}
                <span className="font-semibold text-lime-300">
                  {ceilingBand}%{" "}
                </span>
                {config.hitRateLabels[config.hitRateLabels.length - 1]} ceiling
              </div>
            </div>
          </div>
        </div>

        <Button
          size="sm"
          onClick={onOpen}
          className="rounded-full bg-yellow-400 px-3 py-1 text-[11px] font-semibold text-black shadow-[0_0_24px_rgba(250,204,21,0.9)] hover:bg-yellow-300"
        >
          View insights
        </Button>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Shared cells
// -----------------------------------------------------------------------------

type HeaderCellProps = {
  label: string;
  wide?: boolean;
  accent?: boolean;
};

const HeaderCell: React.FC<HeaderCellProps> = ({ label, wide, accent }) => (
  <th
    scope="col"
    className={`border-b border-l border-neutral-800/80 px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em] ${
      wide ? "min-w-[72px]" : "min-w-[52px]"
    } ${accent ? "text-emerald-300" : "text-neutral-400"}`}
  >
    {label}
  </th>
);

type BodyCellProps = {
  value: number | string;
  dim?: boolean;
  strong?: boolean;
  wide?: boolean;
  compact?: boolean;
  blurClass?: string;
};

const BodyCell: React.FC<BodyCellProps> = ({
  value,
  dim,
  strong,
  wide,
  compact,
  blurClass = "",
}) => (
  <td
    className={`border-l border-neutral-900/85 px-2 ${
      compact ? "py-1.5" : "py-2.5"
    } text-center text-[11px] ${
      wide ? "min-w-[72px]" : "min-w-[52px]"
    } ${dim ? "text-neutral-400" : "text-neutral-100"} ${
      strong ? "font-semibold text-neutral-50" : ""
    } ${blurClass}`}
  >
    {value}
  </td>
);

// Hit-rate % with red → green gradient
type HitRateCellProps = {
  value: number;
  compact?: boolean;
  blurClass?: string;
};

const HitRateCell: React.FC<HitRateCellProps> = ({
  value,
  compact,
  blurClass = "",
}) => {
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
    <td
      className={`border-l border-neutral-900/85 px-2 ${
        compact ? "py-1.5" : "py-2.5"
      } text-center ${blurClass}`}
    >
      <span
        className={`inline-flex min-w-[44px] items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${bg} ${color}`}
      >
        {value}%
      </span>
    </td>
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

// -----------------------------------------------------------------------------
// Mini sparkline (SVG)
// -----------------------------------------------------------------------------

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
      {/* baseline */}
      <line
        x1={paddingX}
        x2={width - paddingX}
        y1={height - paddingY}
        y2={height - paddingY}
        stroke="rgba(148,163,184,0.35)"
        strokeWidth={0.75}
      />
      {/* line */}
      <path
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      {/* last point marker */}
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
