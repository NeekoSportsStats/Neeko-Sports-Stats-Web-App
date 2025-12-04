// src/components/afl/players/MasterTable.tsx
import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { BrainCircuit, Filter, Lock } from "lucide-react";
import {
  useAFLMockPlayers,
  getSeriesForStat,
  lastN,
  average,
  stdDev,
  StatKey,
} from "@/components/afl/players/useAFLMockData";

/**
 * TEMP: Gating flag.
 * Replace later with: const { isPremium } = useAuth();
 */
const IS_PREMIUM = false;

const FREE_STATS: StatKey[] = ["fantasy", "disposals", "goals"];

const STAT_LABELS: Record<StatKey, string> = {
  fantasy: "Fantasy",
  disposals: "Disposals",
  kicks: "Kicks",
  marks: "Marks",
  tackles: "Tackles",
  hitouts: "Hitouts",
  goals: "Goals",
};

type PlayerRowMetrics = {
  id: number | string;
  name: string;
  team: string;
  pos: string;
  opening: number | null;
  rounds: number[];
  min: number;
  max: number;
  avg: number;
  total: number;
  pct90: number;
  pct95: number;
  pct100: number;
  pct105: number;
  pct110: number;
  games: number;
  seriesForSpark: number[];
};

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */

function toPercentColour(value: number): React.CSSProperties["color"] {
  // 0 -> red (0deg), 100 -> green (120deg)
  const clamped = Math.max(0, Math.min(100, value || 0));
  const hue = (clamped / 100) * 120;
  return `hsl(${hue}, 75%, 55%)`;
}

function buildActiveSeries(
  full: number[],
  roundCount: number | "ALL"
): number[] {
  if (roundCount === "ALL") return full;
  return full.slice(0, roundCount);
}

/* Sparkline across the row (based on series) */
function RowSparkline({ series }: { series: number[] }) {
  if (!series.length) return null;
  const max = Math.max(...series);
  const min = Math.min(...series);
  const points = series
    .map((v, i) => {
      const x =
        (i / Math.max(series.length - 1, 1)) * 100; // 0..100
      const y = 24 - ((v - min) / (max - min || 1)) * 20; // 4..24
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 24"
      className="h-6 w-full text-yellow-300 opacity-80"
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

/* ---------------------------------------------------------
   Master Table Component
--------------------------------------------------------- */

export default function MasterTable() {
  const players = useAFLMockPlayers();
  const [selectedStat, setSelectedStat] =
    useState<StatKey>("fantasy");
  const [selectedTeam, setSelectedTeam] =
    useState<string>("ALL");
  // "ALL" or numeric count (e.g. "10" => first 10 rounds)
  const [selectedRoundCount, setSelectedRoundCount] =
    useState<string>("ALL");

  const statLabel = STAT_LABELS[selectedStat];

  const teams = useMemo(() => {
    const set = new Set<string>();
    players.forEach((p) => set.add(p.team));
    return Array.from(set).sort();
  }, [players]);

  const maxRounds = useMemo(() => {
    if (!players.length) return 0;
    const series = getSeriesForStat(players[0], selectedStat);
    return series.length;
  }, [players, selectedStat]);

  const activeRoundCount: number | "ALL" = useMemo(() => {
    if (selectedRoundCount === "ALL") return "ALL";
    const parsed = parseInt(selectedRoundCount, 10);
    if (isNaN(parsed)) return "ALL";
    return Math.min(Math.max(parsed, 1), maxRounds || 1);
  }, [selectedRoundCount, maxRounds]);

  /* -------------------------------------------------------
     Build metrics for visible section (real data)
  ------------------------------------------------------- */
  const visibleRows: PlayerRowMetrics[] = useMemo(() => {
    if (!players.length) return [];

    const metrics: PlayerRowMetrics[] = players
      .filter((p) =>
        selectedTeam === "ALL" ? true : p.team === selectedTeam
      )
      .map((p) => {
        const full = getSeriesForStat(p, selectedStat);
        const active =
          activeRoundCount === "ALL"
            ? full
            : full.slice(0, activeRoundCount);

        if (!active.length) {
          return {
            id: p.id,
            name: p.name,
            team: p.team,
            pos:
              (p as any).pos ??
              (p as any).position ??
              "",
            opening: null,
            rounds: [],
            min: 0,
            max: 0,
            avg: 0,
            total: 0,
            pct90: 0,
            pct95: 0,
            pct100: 0,
            pct105: 0,
            pct110: 0,
            games: 0,
            seriesForSpark: [],
          };
        }

        const opening = active[0] ?? null;
        const rounds = active.slice(1);
        const games = active.length;

        const total =
          active.reduce((sum, v) => sum + v, 0) || 0;
        const avg = total / games;
        const min = Math.min(...active);
        const max = Math.max(...active);

        function pctAt(threshold: number) {
          const hits = active.filter(
            (v) => v >= threshold
          ).length;
          return games ? (hits / games) * 100 : 0;
        }

        const pct90 = pctAt(90);
        const pct95 = pctAt(95);
        const pct100 = pctAt(100);
        const pct105 = pctAt(105);
        const pct110 = pctAt(110);

        return {
          id: p.id,
          name: p.name,
          team: p.team,
          pos:
            (p as any).pos ??
            (p as any).position ??
            "",
          opening,
          rounds,
          min,
          max,
          avg,
          total,
          pct90,
          pct95,
          pct100,
          pct105,
          pct110,
          games,
          seriesForSpark: active,
        };
      });

    return metrics
      .filter((m) => m.games > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 19); // rows 1–19 visible
  }, [
    players,
    selectedTeam,
    selectedStat,
    activeRoundCount,
  ]);

  /* -------------------------------------------------------
     Fake premium rows (behind blur, anti-scrape)
  ------------------------------------------------------- */
  const premiumRows: PlayerRowMetrics[] = useMemo(() => {
    // These are hand-crafted mocks, NOT real data.
    const rows: PlayerRowMetrics[] = [
      {
        id: "fake-20",
        name: "Player 58",
        team: "RICH",
        pos: "MID",
        opening: 88,
        rounds: [92, 84, 90, 95, 87],
        min: 84,
        max: 95,
        avg: 89.2,
        total: 535,
        pct90: 68,
        pct95: 42,
        pct100: 26,
        pct105: 18,
        pct110: 9,
        games: 6,
        seriesForSpark: [88, 92, 84, 90, 95, 87],
      },
      {
        id: "fake-21",
        name: "Player 42",
        team: "ESS",
        pos: "FWD",
        opening: 76,
        rounds: [81, 79, 83, 75, 82],
        min: 75,
        max: 83,
        avg: 79.5,
        total: 477,
        pct90: 22,
        pct95: 9,
        pct100: 4,
        pct105: 0,
        pct110: 0,
        games: 6,
        seriesForSpark: [76, 81, 79, 83, 75, 82],
      },
      {
        id: "fake-22",
        name: "Player 71",
        team: "ADE",
        pos: "DEF",
        opening: 82,
        rounds: [79, 88, 85, 81, 90],
        min: 79,
        max: 90,
        avg: 84.2,
        total: 505,
        pct90: 35,
        pct95: 18,
        pct100: 10,
        pct105: 5,
        pct110: 0,
        games: 6,
        seriesForSpark: [82, 79, 88, 85, 81, 90],
      },
      {
        id: "fake-23",
        name: "Player 63",
        team: "CARL",
        pos: "MID",
        opening: 91,
        rounds: [94, 89, 97, 92, 88],
        min: 88,
        max: 97,
        avg: 91.8,
        total: 551,
        pct90: 80,
        pct95: 52,
        pct100: 31,
        pct105: 19,
        pct110: 7,
        games: 6,
        seriesForSpark: [91, 94, 89, 97, 92, 88],
      },
      {
        id: "fake-24",
        name: "Player 39",
        team: "GWS",
        pos: "RUC",
        opening: 83,
        rounds: [86, 81, 88, 84, 90],
        min: 81,
        max: 90,
        avg: 85.3,
        total: 512,
        pct90: 40,
        pct95: 22,
        pct100: 11,
        pct105: 4,
        pct110: 0,
        games: 6,
        seriesForSpark: [83, 86, 81, 88, 84, 90],
      },
    ];

    return rows;
  }, []);

  const allRoundsCount =
    activeRoundCount === "ALL"
      ? maxRounds
      : activeRoundCount;

  const roundColumnLabels = useMemo(() => {
    if (!allRoundsCount || allRoundsCount < 1) return [];
    const labels: string[] = [];
    // OR = opening (index 0), R1..R(n-1) shown after
    for (let i = 1; i < allRoundsCount; i++) {
      labels.push(`R${i}`);
    }
    return labels;
  }, [allRoundsCount]);

  /* -------------------------------------------------------
     Filters
  ------------------------------------------------------- */

  const handleStatChange = (value: StatKey) => {
    if (!IS_PREMIUM && !FREE_STATS.includes(value)) {
      return;
    }
    setSelectedStat(value);
  };

  return (
    <section
      id="master-table"
      className={cn(
        "relative mt-12 rounded-3xl border border-white/10",
        "bg-gradient-to-b from-[#050508] via-[#050509] to-[#020204]",
        "px-4 py-8 md:px-6 md:py-10",
        "shadow-[0_0_70px_rgba(0,0,0,0.75)]"
      )}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-black/80 px-3 py-1 text-xs text-yellow-200/90">
            <BrainCircuit className="h-3.5 w-3.5 text-yellow-300" />
            <span className="uppercase tracking-[0.18em]">
              Master Table
            </span>
          </div>

          <h2 className="text-xl font-semibold md:text-2xl">
            Full-season player ledger &amp; hit-rate grid
          </h2>

          <p className="max-w-xl text-sm text-white/70">
            Every player’s round-by-round {statLabel.toLowerCase()} output,
            totals and hit rates across key thresholds — ordered by total{" "}
            {statLabel.toLowerCase()}.
          </p>

          <p className="text-[10px] text-white/35 mt-1.5">
            Hit-rate bands (90+, 95+, 100+, 105+, 110+) update with each
            selected stat lens.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col items-start gap-2 md:items-end">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/45">
            <Filter className="h-3.5 w-3.5" />
            <span>Table Filters</span>
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            {/* Stat filter */}
            <div className="flex items-center gap-1">
              <label className="text-[11px] text-white/55">
                Stat
              </label>
              <select
                value={selectedStat}
                onChange={(e) =>
                  handleStatChange(
                    e.target.value as StatKey
                  )
                }
                className={cn(
                  "rounded-full border border-white/12 bg-black/70 px-3 py-1.5 text-xs text-white/80",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow-400/60"
                )}
              >
                {(Object.keys(
                  STAT_LABELS
                ) as StatKey[]).map((key) => {
                  const locked =
                    !IS_PREMIUM &&
                    !FREE_STATS.includes(key);
                  return (
                    <option
                      key={key}
                      value={key}
                      disabled={locked}
                    >
                      {STAT_LABELS[key]}
                      {locked ? " (Neeko+)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Team filter (Neeko+ gated) */}
            <div className="flex items-center gap-1">
              <label className="text-[11px] text-white/55">
                Team
              </label>
              <div className="relative">
                <select
                  value={selectedTeam}
                  onChange={(e) =>
                    setSelectedTeam(e.target.value)
                  }
                  disabled={!IS_PREMIUM}
                  className={cn(
                    "rounded-full border border-white/12 bg-black/70 px-3 py-1.5 text-xs text-white/80 pr-7",
                    !IS_PREMIUM &&
                      "opacity-40 cursor-not-allowed"
                  )}
                >
                  <option value="ALL">All teams</option>
                  {teams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
                {!IS_PREMIUM && (
                  <Lock className="pointer-events-none absolute right-1.5 top-1.5 h-3.5 w-3.5 text-white/45" />
                )}
              </div>
            </div>

            {/* Round filter (Neeko+ gated) */}
            <div className="flex items-center gap-1">
              <label className="text-[11px] text-white/55">
                Round
              </label>
              <div className="relative">
                <select
                  value={selectedRoundCount}
                  onChange={(e) =>
                    setSelectedRoundCount(
                      e.target.value
                    )
                  }
                  disabled={!IS_PREMIUM}
                  className={cn(
                    "rounded-full border border-white/12 bg-black/70 px-3 py-1.5 text-xs text-white/80 pr-7",
                    !IS_PREMIUM &&
                      "opacity-40 cursor-not-allowed"
                  )}
                >
                  <option value="ALL">
                    All rounds
                  </option>
                  {Array.from(
                    { length: maxRounds },
                    (_, i) => i + 1
                  ).map((r) => (
                    <option
                      key={r}
                      value={String(r)}
                    >
                      Up to R{r}
                    </option>
                  ))}
                </select>
                {!IS_PREMIUM && (
                  <Lock className="pointer-events-none absolute right-1.5 top-1.5 h-3.5 w-3.5 text-white/45" />
                )}
              </div>
            </div>
          </div>

          {!IS_PREMIUM && (
            <p className="text-[10px] text-white/40">
              Fantasy, Disposals &amp; Goals are free. Team &amp;
              Round filters are Neeko+.
            </p>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 relative rounded-2xl border border-white/8 bg-black/60">
        <div className="max-h-[520px] overflow-auto rounded-2xl">
          <table className="min-w-[1200px] w-full text-[11px]">
            <thead className="sticky top-0 z-20 bg-gradient-to-b from-[#050507] via-[#050507] to-[#050507]/95 backdrop-blur-sm">
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-[0.16em] text-white/50">
                <th className="px-3 py-3 text-left">
                  Player
                </th>
                <th className="px-3 py-3 text-left">
                  Team
                </th>
                <th className="px-3 py-3 text-left">
                  Pos
                </th>
                <th className="px-3 py-3 text-right">
                  OR
                </th>
                {roundColumnLabels.map((label) => (
                  <th
                    key={label}
                    className="px-3 py-3 text-right"
                  >
                    {label}
                  </th>
                ))}
                <th className="px-3 py-3 text-right">
                  Min
                </th>
                <th className="px-3 py-3 text-right">
                  Max
                </th>
                <th className="px-3 py-3 text-right">
                  Avg
                </th>
                <th className="px-3 py-3 text-right">
                  Total
                </th>
                <th className="px-3 py-3 text-right">
                  90+
                </th>
                <th className="px-3 py-3 text-right">
                  95+
                </th>
                <th className="px-3 py-3 text-right">
                  100+
                </th>
                <th className="px-3 py-3 text-right">
                  105+
                </th>
                <th className="px-3 py-3 text-right">
                  110+
                </th>
                <th className="px-3 py-3 text-right">
                  Gms
                </th>
                <th className="px-3 py-3 text-left">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-white/5 last:border-b-0",
                    idx % 2 === 1 &&
                      "bg-white/[0.02]"
                  )}
                >
                  <td className="px-3 py-2 text-left font-medium text-[11px]">
                    {row.name}
                  </td>
                  <td className="px-3 py-2 text-left text-white/70">
                    {row.team}
                  </td>
                  <td className="px-3 py-2 text-left text-white/70">
                    {row.pos}
                  </td>
                  <td className="px-3 py-2 text-right text-white/80">
                    {row.opening != null
                      ? row.opening.toFixed(0)
                      : "—"}
                  </td>
                  {roundColumnLabels.map((_, i) => (
                    <td
                      key={`${row.id}-r-${i}`}
                      className="px-3 py-2 text-right text-white/70"
                    >
                      {row.rounds[i] != null
                        ? row.rounds[i].toFixed(0)
                        : "—"}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right text-white/80">
                    {row.min.toFixed(0)}
                  </td>
                  <td className="px-3 py-2 text-right text-white/80">
                    {row.max.toFixed(0)}
                  </td>
                  <td className="px-3 py-2 text-right text-white/80">
                    {row.avg.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-white">
                    {row.total.toFixed(0)}
                  </td>

                  <td
                    className="px-3 py-2 text-right"
                    style={{
                      color: toPercentColour(
                        row.pct90
                      ),
                    }}
                  >
                    {row.pct90.toFixed(0)}%
                  </td>
                  <td
                    className="px-3 py-2 text-right"
                    style={{
                      color: toPercentColour(
                        row.pct95
                      ),
                    }}
                  >
                    {row.pct95.toFixed(0)}%
                  </td>
                  <td
                    className="px-3 py-2 text-right"
                    style={{
                      color: toPercentColour(
                        row.pct100
                      ),
                    }}
                  >
                    {row.pct100.toFixed(0)}%
                  </td>
                  <td
                    className="px-3 py-2 text-right"
                    style={{
                      color: toPercentColour(
                        row.pct105
                      ),
                    }}
                  >
                    {row.pct105.toFixed(0)}%
                  </td>
                  <td
                    className="px-3 py-2 text-right"
                    style={{
                      color: toPercentColour(
                        row.pct110
                      ),
                    }}
                  >
                    {row.pct110.toFixed(0)}%
                  </td>

                  <td className="px-3 py-2 text-right text-white/75">
                    {row.games}
                  </td>
                  <td className="px-3 py-2 text-left align-middle">
                    <RowSparkline
                      series={row.seriesForSpark}
                    />
                  </td>
                </tr>
              ))}
            </tbody>

            {/* PREMIUM SECTION */}
            <tbody
              className={cn(
                !IS_PREMIUM &&
                  "blur-sm brightness-[0.6] select-none"
              )}
            >
              {premiumRows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-white/5 last:border-b-0",
                    (visibleRows.length + idx) %
                      2 ===
                      1 && "bg-white/[0.02]"
                  )}
                >
                  <td className="px-3 py-2 text-left font-medium text-[11px]">
                    {row.name}
                  </td>
                  <td className="px-3 py-2 text-left text-white/70">
                    {row.team}
                  </td>
                  <td className="px-3 py-2 text-left text-white/70">
                    {row.pos}
                  </td>
                  <td className="px-3 py-2 text-right text-white/80">
                    {row.opening != null
                      ? row.opening.toFixed(0)
                      : "—"}
                  </td>
                  {roundColumnLabels.map((_, i) => (
                    <td
                      key={`${row.id}-r-${i}`}
                      className="px-3 py-2 text-right text-white/70"
                    >
                      {row.rounds[i] != null
                        ? row.rounds[i].toFixed(0)
                        : "—"}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right text-white/80">
                    {row.min.toFixed(0)}
                  </td>
                  <td className="px-3 py-2 text-right text-white/80">
                    {row.max.toFixed(0)}
                  </td>
                  <td className="px-3 py-2 text-right text-white/80">
                    {row.avg.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-white">
                    {row.total.toFixed(0)}
                  </td>

                  <td
                    className="px-3 py-2 text-right"
                    style={{
                      color: toPercentColour(
                        row.pct90
                      ),
                    }}
                  >
                    {row.pct90.toFixed(0)}%
                  </td>
                  <td
                    className="px-3 py-2 text-right"
                    style={{
                      color: toPercentColour(
                        row.pct95
                      ),
                    }}
                  >
                    {row.pct95.toFixed(0)}%
                  </td>
                  <td
                    className="px-3 py-2 text-right"
                    style={{
                      color: toPercentColour(
                        row.pct100
                      ),
                    }}
                  >
                    {row.pct100.toFixed(0)}%
                  </td>
                  <td
                    className="px-3 py-2 text-right"
                    style={{
                      color: toPercentColour(
                        row.pct105
                      ),
                    }}
                  >
                    {row.pct105.toFixed(0)}%
                  </td>
                  <td
                    className="px-3 py-2 text-right"
                    style={{
                      color: toPercentColour(
                        row.pct110
                      ),
                    }}
                  >
                    {row.pct110.toFixed(0)}%
                  </td>

                  <td className="px-3 py-2 text-right text-white/75">
                    {row.games}
                  </td>
                  <td className="px-3 py-2 text-left align-middle">
                    <RowSparkline
                      series={row.seriesForSpark}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Premium overlay for locked rows */}
        {!IS_PREMIUM && (
          <div
            className={cn(
              "pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col items-center justify-center",
              "rounded-b-2xl bg-gradient-to-t from-black/90 via-black/80 to-transparent",
              "border-t border-yellow-500/30 pt-6 pb-6"
            )}
          >
            <div className="flex flex-col items-center gap-3 px-4 text-center">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400/15 border border-yellow-400/50">
                  <span className="text-xs font-semibold text-yellow-300">
                    +
                  </span>
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
                  Neeko+ Master Grid
                </span>
              </div>

              <p className="text-sm text-yellow-50/95 max-w-md">
                Unlock full-season {statLabel.toLowerCase()} ledgers, advanced
                hit-rate bands and deep role filters for every player.
              </p>

              <div className="flex flex-col gap-2">
                <a
                  href="/sports/afl/ai-analysis"
                  className={cn(
                    "rounded-full px-6 py-2 text-sm font-semibold text-black",
                    "bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400",
                    "shadow-[0_0_24px_rgba(250,204,21,0.7)] hover:brightness-110 transition"
                  )}
                >
                  Unlock Neeko+ Insights
                </a>
                <a
                  href="/sports/afl/ai-analysis"
                  className="text-[11px] text-yellow-200/80 hover:text-yellow-200 underline underline-offset-4"
                >
                  View full AI Analysis →
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
