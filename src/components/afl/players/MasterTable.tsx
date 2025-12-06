// src/components/afl/players/MasterTable.tsx

import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Lock, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

// -----------------------------------------------------------------------------
// Types & mock data (swap for Supabase later)
// -----------------------------------------------------------------------------

type StatLens = "Fantasy" | "Disposals" | "Goals";

type StatBands = {
  label: string;
  thresholds: number[]; // 5 thresholds, low → high
};

const STAT_BANDS: Record<StatLens, StatBands> = {
  Fantasy: {
    label: "pts",
    thresholds: [90, 100, 110, 120, 130],
  },
  Disposals: {
    label: "disp",
    thresholds: [20, 25, 30, 35, 40],
  },
  Goals: {
    label: "goals",
    thresholds: [1, 2, 3, 4, 5],
  },
};

type HitRates = {
  bands: number[]; // % for each threshold
};

type PlayerRow = {
  id: number;
  name: string;
  team: string;
  role: string;
  fantasy: number[]; // R1–R23
  disposals: number[];
  goals: number[];
};

const ROUND_LABELS = Array.from({ length: 23 }).map((_, i) => `R${i + 1}`);

const generateRounds = (length: number, base: number, spread: number) =>
  Array.from({ length }).map(
    () => base + Math.round((Math.random() - 0.5) * spread * 2)
  );

const MOCK_PLAYERS: PlayerRow[] = Array.from({ length: 40 }).map((_, idx) => {
  const baseFantasy = 80 + (idx % 10);
  const fantasy = generateRounds(23, baseFantasy, 15);

  const baseDisposals = 18 + (idx % 6);
  const disposals = generateRounds(23, baseDisposals, 6);

  const baseGoals = (idx % 4) === 0 ? 2 : 1;
  const goals = generateRounds(23, baseGoals, 2).map((v) => Math.max(0, v));

  return {
    id: idx + 1,
    name: `Player ${idx + 1}`,
    team: ["GEEL", "CARL", "RICH", "ESS", "COLL", "NMFC"][idx % 6],
    role: ["MID", "RUC", "FWD", "DEF"][idx % 4],
    fantasy,
    disposals,
    goals,
  };
});

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const getRoundsForLens = (player: PlayerRow, lens: StatLens): number[] => {
  if (lens === "Fantasy") return player.fantasy;
  if (lens === "Disposals") return player.disposals;
  return player.goals;
};

const calcSummary = (rounds: number[]) => {
  const min = Math.min(...rounds);
  const max = Math.max(...rounds);
  const total = rounds.reduce((s, v) => s + v, 0);
  const avg = total / rounds.length;
  return { min, max, total, avg };
};

const calcHitRates = (rounds: number[], thresholds: number[]): HitRates => {
  const len = rounds.length || 1;
  const bands = thresholds.map((t) => {
    const count = rounds.filter((r) => r >= t).length;
    return Math.round((count / len) * 100);
  });
  return { bands };
};

const calcRecentWindow = (rounds: number[]) => {
  const window = rounds.slice(-8);
  const { min, max, total, avg } = calcSummary(window);
  const volatility = max - min;
  return {
    window,
    min,
    max,
    avg,
    volatility,
  };
};

const calcConfidenceIndex = (hitRates: HitRates, volatility: number) => {
  // crude but feels believable: favour higher bands, penalise volatility
  const [b1, b2, b3, b4, b5] = hitRates.bands;
  const raw =
    b1 * 0.1 + // lowest band
    b2 * 0.15 +
    b3 * 0.25 +
    b4 * 0.25 +
    b5 * 0.25;

  const volPenalty = Math.min(volatility / 50, 0.4); // cap penalty
  const ci = Math.round(raw * (1 - volPenalty));
  return Math.max(40, Math.min(ci, 99));
};

const formatPct = (v: number) => `${v.toFixed(0)}%`;

// -----------------------------------------------------------------------------
// SVG sparkline (S4 – full mini chart)
// -----------------------------------------------------------------------------

type SparklineProps = {
  rounds: number[];
  lens: StatLens;
};

const Sparkline: React.FC<SparklineProps> = ({ rounds, lens }) => {
  const recent = rounds.slice(-8);
  if (recent.length === 0) return null;

  const min = Math.min(...recent);
  const max = Math.max(...recent);
  const range = max - min || 1;

  const points = recent.map((v, idx) => {
    const x = (idx / Math.max(recent.length - 1, 1)) * 100;
    const norm = (v - min) / range;
    const y = 36 - norm * 26; // padding top/bottom
    return { x, y, value: v };
  });

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  const band = STAT_BANDS[lens];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] text-neutral-400">
        <div className="flex gap-3">
          <span className="uppercase tracking-[0.16em] text-neutral-300">
            Recent form sparkline
          </span>
          <span className="text-neutral-500">
            Range {min}–{max} {band.label}
          </span>
        </div>
        <span className="text-neutral-400">
          Last {recent.length} rounds ·{" "}
          <span className="text-yellow-200 font-medium">
            {recent.reduce((s, v) => s + v, 0) / recent.length || 0
              ? (recent.reduce((s, v) => s + v, 0) / recent.length).toFixed(1)
              : "0.0"}
          </span>{" "}
          avg
        </span>
      </div>

      <div className="relative h-28 w-full overflow-hidden rounded-md border border-yellow-500/20 bg-gradient-to-b from-neutral-900 via-black to-black">
        <svg
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          {/* grid lines */}
          {[0, 1, 2, 3].map((g) => (
            <line
              key={g}
              x1={0}
              x2={100}
              y1={8 + g * 8}
              y2={8 + g * 8}
              stroke="rgba(148,163,184,0.16)"
              strokeWidth={0.25}
            />
          ))}
          {/* vertical guides */}
          {points.map((p, idx) => (
            <line
              key={`v-${idx}`}
              x1={p.x}
              x2={p.x}
              y1={6}
              y2={36}
              stroke="rgba(148,163,184,0.16)"
              strokeWidth={0.25}
            />
          ))}
          {/* area fill */}
          <path
            d={`${path} L ${points[points.length - 1].x} 40 L ${
              points[0].x
            } 40 Z`}
            fill="rgba(250,204,21,0.10)"
          />
          {/* main line */}
          <path
            d={path}
            fill="none"
            stroke="rgba(250,204,21,0.9)"
            strokeWidth={1.4}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* points */}
          {points.map((p, idx) => (
            <circle
              key={`p-${idx}`}
              cx={p.x}
              cy={p.y}
              r={0.7}
              fill="rgba(250,250,250,0.95)"
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

export const MasterTable: React.FC = () => {
  const [compactMode, setCompactMode] = useState(false);
  const [expandedPlayerId, setExpandedPlayerId] = useState<number | null>(null);
  const [selectedStat, setSelectedStat] = useState<StatLens>("Fantasy");
  const [visibleCount, setVisibleCount] = useState(20);

  const bandConfig = STAT_BANDS[selectedStat];

  const players = useMemo(() => MOCK_PLAYERS.slice(0, visibleCount), [visibleCount]);

  const handleToggleExpand = (id: number) => {
    setExpandedPlayerId((prev) => (prev === id ? null : id));
  };

  const handleShowMore = () => {
    setVisibleCount((prev) => Math.min(prev + 20, MOCK_PLAYERS.length));
  };

  const hitRateLegend = useMemo(
    () =>
      bandConfig.thresholds.map((t) => `${t}${bandConfig.label === "goals" ? "+" : "+"}`),
    [bandConfig]
  );

  return (
    <section
      id="master-table"
      className="relative mt-16 mb-24 rounded-[32px] border border-yellow-500/15 bg-gradient-to-b from-neutral-950 via-neutral-950/90 to-black px-4 py-8 shadow-[0_40px_160px_rgba(0,0,0,0.9)] sm:px-8"
    >
      {/* Header */}
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
              output, totals and hit-rates across key thresholds — ordered by total
              output.
            </p>
            <p className="mt-1 max-w-xl text-[11px] text-neutral-400">
              Hit-rate bands automatically adjust to the selected stat lens. For example:{" "}
              <span className="font-medium text-neutral-300">
                Fantasy {STAT_BANDS.Fantasy.thresholds[0]}+
              </span>
              ,{" "}
              <span className="font-medium text-neutral-300">
                Disposals {STAT_BANDS.Disposals.thresholds[0]}+
              </span>{" "}
              and{" "}
              <span className="font-medium text-neutral-300">
                Goals {STAT_BANDS.Goals.thresholds[0]}+.
              </span>{" "}
              Team &amp; Round filters are Neeko+ only.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 md:items-end">
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

          {/* Team / Round filters (locked) */}
          <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] text-neutral-300">
            <LockedFilter label="Team" value="All teams" />
            <LockedFilter label="Round" value="All rounds" />
          </div>

          {/* Compact toggle */}
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

      {/* Desktop / large-table layout */}
      <div className="mt-8 hidden md:block">
        {compactMode ? (
          <DesktopCompactTable
            players={players}
            lens={selectedStat}
            bandConfig={bandConfig}
            hitRateLegend={hitRateLegend}
            expandedPlayerId={expandedPlayerId}
            onToggleExpand={handleToggleExpand}
          />
        ) : (
          <DesktopFullTable
            players={players}
            lens={selectedStat}
            bandConfig={bandConfig}
            hitRateLegend={hitRateLegend}
            expandedPlayerId={expandedPlayerId}
            onToggleExpand={handleToggleExpand}
          />
        )}
      </div>

      {/* Mobile layout */}
      <div className="mt-6 space-y-3 md:hidden">
        <MobileCards players={players} lens={selectedStat} bandConfig={bandConfig} />
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/60 bg-black/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
          <Sparkles className="h-3 w-3" />
          <span>Neeko+ Master Grid</span>
        </div>
        <p className="max-w-xl text-xs text-neutral-300/90">
          Unlock full-season ledgers, advanced hit-rate bands and deep role filters for every
          player.
        </p>
        <Button
          size="lg"
          className="mt-1 rounded-full bg-yellow-400 px-7 py-2 text-sm font-semibold text-black shadow-[0_0_40px_rgba(250,204,21,0.9)] hover:bg-yellow-300"
        >
          Unlock Neeko+ Insights
        </Button>
      </div>

      {/* Show more (shared for desktop + mobile) */}
      {visibleCount < MOCK_PLAYERS.length && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={handleShowMore}
            className="rounded-full border-neutral-700 bg-neutral-950/90 px-5 py-1.5 text-xs text-neutral-200 hover:border-yellow-400 hover:bg-neutral-900"
          >
            Show 20 more rows
          </Button>
        </div>
      )}
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
    <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">{label}</span>
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

type DesktopTableBaseProps = {
  players: PlayerRow[];
  lens: StatLens;
  bandConfig: StatBands;
  hitRateLegend: string[];
  expandedPlayerId: number | null;
  onToggleExpand: (id: number) => void;
};

const DesktopFullTable: React.FC<DesktopTableBaseProps> = ({
  players,
  lens,
  bandConfig,
  hitRateLegend,
  expandedPlayerId,
  onToggleExpand,
}) => {
  const thresholds = bandConfig.thresholds;

  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-800/80 bg-neutral-950/95">
      <div className="relative max-h-[620px] overflow-auto">
        <table className="min-w-[1200px] border-separate border-spacing-0">
          <thead className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm">
            <tr>
              {/* Player header */}
              <th
                scope="col"
                className="sticky left-0 z-50 w-64 border-b border-neutral-800/80 bg-black/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300"
              >
                Player
              </th>
              <HeaderCell align="center" label="OR" />
              {ROUND_LABELS.map((label) => (
                <HeaderCell key={label} align="center" label={label} />
              ))}
              <HeaderCell align="center" label="Min" />
              <HeaderCell align="center" label="Max" />
              <HeaderCell align="center" label="Avg" />
              <HeaderCell align="center" label="Total" wide />
              {thresholds.map((t, idx) => (
                <HeaderCell
                  key={t}
                  align="center"
                  label={`${hitRateLegend[idx]}`}
                  accent
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((player, idx) => {
              const rounds = getRoundsForLens(player, lens);
              const summary = calcSummary(rounds);
              const hitRates = calcHitRates(rounds, thresholds);
              const recent = calcRecentWindow(rounds);
              const ci = calcConfidenceIndex(hitRates, recent.volatility);
              const isExpanded = expandedPlayerId === player.id;

              return (
                <React.Fragment key={player.id}>
                  <tr
                    className={`text-xs text-neutral-100 transition-colors ${
                      isExpanded ? "bg-neutral-900/75" : "hover:bg-neutral-900/55"
                    }`}
                  >
                    {/* Player cell */}
                    <td className="sticky left-0 z-30 w-64 border-b border-neutral-900/80 bg-gradient-to-r from-black/98 via-black/94 to-black/85 px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => onToggleExpand(player.id)}
                        className="flex w-full items-center gap-3 text-left"
                      >
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700/80 bg-neutral-950/80 text-[10px] text-neutral-300">
                          {idx + 1}
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

                    {/* OR + rounds */}
                    <BodyCell value={Math.round(summary.avg)} />
                    {rounds.map((score, rIdx) => (
                      <BodyCell key={rIdx} value={score} />
                    ))}
                    <BodyCell value={summary.min} dim />
                    <BodyCell value={summary.max} />
                    <BodyCell value={summary.avg.toFixed(1)} />
                    <BodyCell value={summary.total} strong />
                    {hitRates.bands.map((v, bIdx) => (
                      <HitRateCell key={bIdx} value={v} />
                    ))}
                  </tr>

                  {isExpanded && (
                    <tr className="bg-neutral-950/98">
                      <td
                        colSpan={2 + ROUND_LABELS.length + 4 + bandConfig.thresholds.length}
                        className="border-t border-neutral-900/80 px-6 py-5"
                      >
                        <ExpandedRowContent
                          player={player}
                          lens={lens}
                          rounds={rounds}
                          hitRates={hitRates}
                          recent={recent}
                          ci={ci}
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
    </div>
  );
};

const DesktopCompactTable: React.FC<DesktopTableBaseProps> = ({
  players,
  lens,
  bandConfig,
  hitRateLegend,
  expandedPlayerId,
  onToggleExpand,
}) => {
  const thresholds = bandConfig.thresholds;

  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-800/80 bg-neutral-950/95">
      <div className="relative max-h-[620px] overflow-auto">
        <table className="min-w-[900px] border-separate border-spacing-0">
          <thead className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm">
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-50 w-64 border-b border-neutral-800/80 bg-black/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300"
              >
                Player
              </th>
              <HeaderCell align="center" label="Min" />
              <HeaderCell align="center" label="Max" />
              <HeaderCell align="center" label="Avg" />
              <HeaderCell align="center" label="Total" wide />
              {thresholds.map((t, idx) => (
                <HeaderCell
                  key={t}
                  align="center"
                  label={`${hitRateLegend[idx]}`}
                  accent
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((player, idx) => {
              const rounds = getRoundsForLens(player, lens);
              const summary = calcSummary(rounds);
              const hitRates = calcHitRates(rounds, thresholds);
              const recent = calcRecentWindow(rounds);
              const ci = calcConfidenceIndex(hitRates, recent.volatility);
              const isExpanded = expandedPlayerId === player.id;

              return (
                <React.Fragment key={player.id}>
                  <tr
                    className={`text-xs text-neutral-100 transition-colors ${
                      isExpanded ? "bg-neutral-900/75" : "hover:bg-neutral-900/55"
                    }`}
                  >
                    <td className="sticky left-0 z-30 w-64 border-b border-neutral-900/80 bg-gradient-to-r from-black/98 via-black/94 to-black/85 px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => onToggleExpand(player.id)}
                        className="flex w-full items-center gap-3 text-left"
                      >
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700/80 bg-neutral-950/80 text-[10px] text-neutral-300">
                          {idx + 1}
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
                    <BodyCell value={summary.min} dim />
                    <BodyCell value={summary.max} />
                    <BodyCell value={summary.avg.toFixed(1)} />
                    <BodyCell value={summary.total} strong />
                    {hitRates.bands.map((v, bIdx) => (
                      <HitRateCell key={bIdx} value={v} />
                    ))}
                  </tr>

                  {isExpanded && (
                    <tr className="bg-neutral-950/98">
                      <td
                        colSpan={4 + bandConfig.thresholds.length + 1}
                        className="border-t border-neutral-900/80 px-6 py-5"
                      >
                        <ExpandedRowContent
                          player={player}
                          lens={lens}
                          rounds={rounds}
                          hitRates={hitRates}
                          recent={recent}
                          ci={ci}
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
    </div>
  );
};

// -----------------------------------------------------------------------------
// Expanded dropdown content (desktop)
// -----------------------------------------------------------------------------

type ExpandedRowContentProps = {
  player: PlayerRow;
  lens: StatLens;
  rounds: number[];
  hitRates: HitRates;
  recent: ReturnType<typeof calcRecentWindow>;
  ci: number;
};

const ExpandedRowContent: React.FC<ExpandedRowContentProps> = ({
  player,
  lens,
  rounds,
  hitRates,
  recent,
  ci,
}) => {
  const statLabel =
    lens === "Fantasy" ? "fantasy points" : lens === "Disposals" ? "disposals" : "goals";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      {/* Left column: scoring window + sparkline + AI summary */}
      <div className="space-y-4">
        {/* Recent scoring window */}
        <div className="rounded-xl border border-neutral-800/80 bg-gradient-to-r from-neutral-900/95 via-neutral-900/90 to-black/95 p-4">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-300">
            Recent scoring window
          </div>
          <p className="text-[11px] text-neutral-300">
            Snapshot of consistency and ceiling across the most recent rounds in this scoring
            lens.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3 text-[11px] text-neutral-200">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                L5 avg
              </div>
              <div className="mt-1 text-sm font-semibold text-yellow-200">
                {recent.avg.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                Best / Worst
              </div>
              <div className="mt-1 text-sm">
                <span className="text-emerald-300 font-semibold">{recent.max}</span>{" "}
                <span className="text-neutral-500">/</span>{" "}
                <span className="text-red-300 font-semibold">{recent.min}</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                Volatility
              </div>
              <div className="mt-1 text-sm">
                {recent.volatility <= 10 && (
                  <span className="text-emerald-300 font-semibold">Low</span>
                )}
                {recent.volatility > 10 && recent.volatility <= 20 && (
                  <span className="text-yellow-300 font-semibold">Moderate</span>
                )}
                {recent.volatility > 20 && (
                  <span className="text-red-300 font-semibold">High</span>
                )}
                <span className="ml-1 text-neutral-400 text-[11px]">
                  ({recent.volatility.toFixed(0)} range)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Sparkline rounds={rounds} lens={lens} />
          </div>
        </div>

        {/* AI summary */}
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/80 px-4 py-3 shadow-inner">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-yellow-200">
            AI Performance Summary
          </div>
          <p className="text-[11px] text-neutral-300 leading-snug">
            Role expectations and scoring trends indicate{" "}
            <span className="font-medium text-neutral-50">
              {recent.volatility <= 10
                ? "strong stability with a reliable floor"
                : recent.volatility <= 20
                ? "solid output with manageable risk"
                : "impact scoring with elevated volatility"}
            </span>{" "}
            for {player.name} in {statLabel} over the upcoming rounds.
          </p>
        </div>
      </div>

      {/* Right column: Confidence index + hit-rate bands summary */}
      <div className="space-y-4">
        <div className="rounded-xl border border-yellow-400/35 bg-gradient-to-b from-yellow-500/16 via-black to-black p-4 shadow-[0_0_30px_rgba(250,204,21,0.45)]">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-yellow-50">
            <span>Confidence index</span>
            <span>{ci}%</span>
          </div>
          <p className="mt-2 text-[11px] text-neutral-100/90 leading-snug">
            Blends hit-rate consistency, volatility spread and number of recent games played in
            this scoring lens.
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-900">
            <div
              className="h-full rounded-full bg-lime-400"
              style={{ width: `${ci}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-neutral-400">
            <span>Floor security</span>
            <span>Ceiling access</span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/80 p-4 text-[11px] text-neutral-200">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Hit-rate profile
          </div>
          <div className="space-y-1.5">
            {hitRates.bands.map((v, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2">
                <span className="text-neutral-400">
                  {bandLabelForIndex(idx, lens)}
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-800">
                    <div
                      className={`h-full rounded-full ${hitRateBarColour(v)}`}
                      style={{ width: `${v}%` }}
                    />
                  </div>
                  <span className={hitRateTextColour(v)}>{formatPct(v)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Mobile cards
// -----------------------------------------------------------------------------

type MobileCardsProps = {
  players: PlayerRow[];
  lens: StatLens;
  bandConfig: StatBands;
};

const MobileCards: React.FC<MobileCardsProps> = ({ players, lens, bandConfig }) => {
  const thresholds = bandConfig.thresholds;

  return (
    <>
      {players.map((player, idx) => {
        const rounds = getRoundsForLens(player, lens);
        const summary = calcSummary(rounds);
        const hitRates = calcHitRates(rounds, thresholds);
        const recent = calcRecentWindow(rounds);

        return (
          <div
            key={player.id}
            className="rounded-2xl border border-neutral-800/80 bg-neutral-950/95 p-4 text-xs text-neutral-100"
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700/80 bg-neutral-950/90 text-[10px] text-neutral-300">
                {idx + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-neutral-50">{player.name}</span>
                  <span className="text-[11px] text-yellow-200">
                    {summary.avg.toFixed(1)} avg
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
            </div>

            {/* Hit-rate bands */}
            <div className="mt-3 grid grid-cols-5 gap-1 text-[10px]">
              {hitRates.bands.map((v, idx2) => (
                <HitRatePill
                  key={idx2}
                  label={bandLabelForIndex(idx2, lens)}
                  value={v}
                />
              ))}
            </div>

            {/* Round ledger mini-scroll */}
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[10px] text-neutral-400">
                <span className="uppercase tracking-[0.16em]">Round ledger</span>
                <span>
                  L5:{" "}
                  <span className="text-yellow-200">
                    {recent.avg.toFixed(1)}
                  </span>
                </span>
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {rounds.map((score, rIdx) => (
                  <div
                    key={rIdx}
                    className="min-w-[46px] rounded-md bg-neutral-900/90 px-2 py-1 text-center text-[10px]"
                  >
                    <div className="text-[9px] text-neutral-500">
                      {ROUND_LABELS[rIdx]}
                    </div>
                    <div className="mt-0.5 text-[11px] text-neutral-100">{score}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sparkline */}
            <div className="mt-3">
              <Sparkline rounds={rounds} lens={lens} />
            </div>
          </div>
        );
      })}
    </>
  );
};

// -----------------------------------------------------------------------------
// Shared cells
// -----------------------------------------------------------------------------

type HeaderCellProps = {
  label: string;
  align?: "left" | "center" | "right";
  wide?: boolean;
  accent?: boolean;
};

const HeaderCell: React.FC<HeaderCellProps> = ({
  label,
  align = "center",
  wide,
  accent,
}) => (
  <th
    scope="col"
    className={`border-b border-neutral-800/80 px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400 ${
      wide ? "min-w-[72px]" : "min-w-[52px]"
    } ${accent ? "text-emerald-300" : ""} ${
      align === "left"
        ? "text-left"
        : align === "right"
        ? "text-right"
        : "text-center"
    }`}
  >
    {label}
  </th>
);

type BodyCellProps = {
  value: number | string;
  dim?: boolean;
  strong?: boolean;
};

const BodyCell: React.FC<BodyCellProps> = ({ value, dim, strong }) => (
  <td
    className={`border-b border-neutral-900/85 px-2 py-2.5 text-center text-[11px] ${
      dim ? "text-neutral-400" : "text-neutral-100"
    } ${strong ? "font-semibold text-neutral-50" : ""}`}
  >
    {value}
  </td>
);

type HitRateCellProps = {
  value: number;
};

const HitRateCell: React.FC<HitRateCellProps> = ({ value }) => (
  <td className="border-b border-neutral-900/85 px-2 py-2.5 text-center">
    <span
      className={`inline-flex min-w-[44px] items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${hitRateChipColour(
        value
      )}`}
    >
      {formatPct(value)}
    </span>
  </td>
);

type HitRatePillProps = {
  label: string;
  value: number;
};

const HitRatePill: React.FC<HitRatePillProps> = ({ label, value }) => (
  <div className="flex flex-col items-center justify-center rounded-lg bg-neutral-900/90 px-2 py-1 text-[10px]">
    <span className="text-[9px] text-neutral-500">{label}</span>
    <span className={`mt-0.5 text-[11px] font-semibold ${hitRateTextColour(value)}`}>
      {formatPct(value)}
    </span>
  </div>
);

// -----------------------------------------------------------------------------
// Colour helpers for hit-rates
// -----------------------------------------------------------------------------

const hitRateChipColour = (v: number) => {
  if (v >= 85) return "bg-emerald-500/20 text-emerald-300";
  if (v >= 70) return "bg-emerald-500/10 text-emerald-200";
  if (v >= 50) return "bg-amber-500/10 text-amber-200";
  return "bg-neutral-800 text-neutral-300";
};

const hitRateTextColour = (v: number) => {
  if (v >= 85) return "text-emerald-300";
  if (v >= 70) return "text-emerald-200";
  if (v >= 50) return "text-amber-200";
  return "text-neutral-300";
};

const hitRateBarColour = (v: number) => {
  if (v >= 85) return "bg-emerald-400";
  if (v >= 70) return "bg-emerald-300";
  if (v >= 50) return "bg-amber-300";
  return "bg-neutral-500";
};

const bandLabelForIndex = (idx: number, lens: StatLens) => {
  const cfg = STAT_BANDS[lens];
  const val = cfg.thresholds[idx];
  return `${val}${cfg.label === "goals" ? "+" : "+"}`;
};

export default MasterTable;
