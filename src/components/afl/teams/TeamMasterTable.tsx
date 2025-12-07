// src/components/afl/teams/TeamMasterTable.tsx
import React, { useMemo, useState } from "react";
import { Lock, Sparkles } from "lucide-react";

type StatType = "Fantasy" | "Offence" | "Defence" | "Disposals" | "Goals";

const ROUND_LABELS = Array.from({ length: 23 }, (_, i) => `R${i + 1}`);

type TeamRow = {
  team: string;
  baseIndex: number;
};

const TEAM_ROWS: TeamRow[] = [
  { team: "Brisbane Lions", baseIndex: 104 },
  { team: "Sydney Swans", baseIndex: 102 },
  { team: "GWS Giants", baseIndex: 101 },
  { team: "Carlton", baseIndex: 99 },
  { team: "Collingwood", baseIndex: 98 },
  { team: "Melbourne", baseIndex: 98 },
  { team: "Geelong Cats", baseIndex: 97 },
  { team: "Port Adelaide", baseIndex: 96 },
  { team: "Western Bulldogs", baseIndex: 96 },
  { team: "Adelaide Crows", baseIndex: 95 },
  { team: "Fremantle", baseIndex: 94 },
  { team: "St Kilda", baseIndex: 93 },
  { team: "Gold Coast Suns", baseIndex: 93 },
  { team: "Richmond", baseIndex: 92 },
  { team: "Hawthorn", baseIndex: 91 },
  { team: "West Coast Eagles", baseIndex: 90 },
  { team: "North Melbourne", baseIndex: 88 },
  { team: "Essendon", baseIndex: 96 },
];

function buildSeries(seed: number) {
  return ROUND_LABELS.map((_, idx) => {
    const wave = Math.sin((idx / 23) * Math.PI * 2);
    const variation = Math.round(wave * 6);
    return seed + variation;
  });
}

function buildStatSeries(type: StatType, base: number) {
  const baseSeries = buildSeries(base);
  switch (type) {
    case "Fantasy":
      return baseSeries;
    case "Offence":
      return baseSeries.map((v) => v + 3);
    case "Defence":
      return baseSeries.map((v) => 200 - (v + 4));
    case "Disposals":
      return baseSeries.map((v) => Math.round(v * 1.2));
    case "Goals":
      return baseSeries.map((v) => Math.round((v - 80) / 4).clamp?.(0) ?? Math.max(0, Math.round((v - 80) / 4)));
    default:
      return baseSeries;
  }
}

// simple polyfill-style helper for Goals calculation when clamp isn’t present
declare global {
  interface Number {
    clamp?(this: number, min: number, max: number): number;
  }
}
if (!Number.prototype.clamp) {
  // eslint-disable-next-line no-extend-native
  Number.prototype.clamp = function (this: number, min: number, max: number) {
    return Math.min(max, Math.max(min, this));
  };
}

function summarise(values: number[]) {
  if (!values.length) return { avg: 0, min: 0, max: 0 };
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = Math.round((sum / values.length) * 10) / 10;
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { avg, min, max };
}

type Props = {
  isPremium?: boolean;
};

const STAT_TYPES: StatType[] = [
  "Fantasy",
  "Offence",
  "Defence",
  "Disposals",
  "Goals",
];

const TeamMasterTable: React.FC<Props> = ({ isPremium = false }) => {
  const [statType, setStatType] = useState<StatType>("Fantasy");
  const [visibleCount, setVisibleCount] = useState(8);

  const tableRows = useMemo(() => {
    return TEAM_ROWS.map((row, idx) => {
      const fantasySeries = buildStatSeries("Fantasy", row.baseIndex);
      const series = buildStatSeries(statType, row.baseIndex);
      const summary = summarise(series);
      const trend =
        series[series.length - 1] - series[Math.max(0, series.length - 5)];
      return {
        index: idx + 1,
        team: row.team,
        series,
        fantasySeries,
        summary,
        trend,
      };
    });
  }, [statType]);

  const canShowMore = visibleCount < tableRows.length;
  const rowsToShow = tableRows.slice(0, visibleCount);

  const isInverted = statType === "Defence"; // lower is better

  const lensDescription: Record<StatType, string> = {
    Fantasy:
      "Team fantasy output index relative to league average (100) across all 23 rounds.",
    Offence:
      "Points-for and fantasy-friendly attacking metrics combined into a single pace-adjusted index.",
    Defence:
      "Defensive restriction index — lower scores indicate a tougher matchup for fantasy scoring.",
    Disposals:
      "Average team disposals index, reflecting ball-control and accumulation trends across the season.",
    Goals:
      "Goals-scoring intensity index highlighting ceiling games and high-scoring team environments.",
  };

  return (
    <section className="mt-10 rounded-3xl border border-yellow-500/25 bg-gradient-to-b from-zinc-900/70 via-black to-black/95 px-2 py-6 shadow-[0_0_40px_rgba(0,0,0,0.9)] md:mt-16 md:px-6 md:py-8 lg:px-8 lg:py-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 px-3 md:mb-7 md:flex-row md:items-start md:justify-between md:px-0">
        <div className="space-y-3 md:max-w-2xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-yellow-400">
            Full-season team ledger & hit-rate grid
          </p>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Round-by-round pace & consistency indicators
          </h2>
          <p className="text-sm text-zinc-300 md:text-[0.95rem]">
            Explore how each club performs across the full AFL season. Switch
            lenses to see fantasy scoring, offensive output, defensive resistance,
            team disposals or goals mapped across all 23 rounds.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2 rounded-full bg-zinc-900/80 px-2 py-1 text-[0.7rem] uppercase tracking-[0.16em] text-zinc-400">
            <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[0.65rem] font-semibold text-yellow-300">
              Stat Lens
            </span>
            {STAT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setStatType(type)}
                className={`rounded-full px-3 py-1 text-[0.72rem] font-medium transition ${
                  statType === type
                    ? "bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.7)]"
                    : "text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <p className="hidden max-w-xs text-right text-[0.75rem] text-zinc-400 md:block">
            {lensDescription[statType]}
          </p>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/80 md:block">
        <div className="relative overflow-x-auto">
          <table className="min-w-full border-collapse text-[0.78rem]">
            <thead className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-xs uppercase tracking-[0.16em] text-zinc-400">
              <tr>
                <th className="sticky left-0 z-20 bg-zinc-950/95 px-4 py-3 text-left">
                  Team
                </th>
                {ROUND_LABELS.map((label) => (
                  <th key={label} className="px-3 py-3 text-center">
                    {label}
                  </th>
                ))}
                <th className="px-4 py-3 text-center">Min</th>
                <th className="px-4 py-3 text-center">Avg</th>
                <th className="px-4 py-3 text-center">Max</th>
              </tr>
            </thead>
            <tbody>
              {rowsToShow.map((row, idx) => {
                const { avg, min, max } = row.summary;
                const isLocked = !isPremium && idx >= 8;
                const rowContent = (
                  <>
                    <td className="sticky left-0 z-10 bg-gradient-to-r from-black via-black to-transparent px-4 py-3 text-left">
                      <div className="flex flex-col">
                        <span className="text-[0.82rem] font-semibold text-zinc-50">
                          {row.team}
                        </span>
                        <span className="text-[0.7rem] text-zinc-500">
                          Index trend:{" "}
                          <span
                            className={
                              row.trend >= 0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }
                          >
                            {row.trend >= 0 ? "+" : ""}
                            {row.trend}
                          </span>
                        </span>
                      </div>
                    </td>
                    {row.series.map((value, roundIdx) => (
                      <td
                        key={`${row.team}-${roundIdx}`}
                        className="px-3 py-2 text-center align-middle text-[0.78rem]"
                      >
                        <span
                          className={
                            isInverted
                              ? value <= 95
                                ? "text-emerald-400"
                                : value >= 105
                                ? "text-red-400"
                                : "text-zinc-200"
                              : value >= 105
                              ? "text-emerald-400"
                              : value <= 95
                              ? "text-red-400"
                              : "text-zinc-200"
                          }
                        >
                          {value}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-2 text-center text-[0.78rem] text-zinc-300">
                      {min}
                    </td>
                    <td className="px-4 py-2 text-center text-[0.78rem] text-yellow-300">
                      {avg}
                    </td>
                    <td className="px-4 py-2 text-center text-[0.78rem] text-zinc-300">
                      {max}
                    </td>
                  </>
                );

                return (
                  <tr
                    key={row.team}
                    className={`border-t border-zinc-800/70 ${
                      idx % 2 === 0 ? "bg-black/60" : "bg-zinc-950/60"
                    }`}
                  >
                    {rowContent}
                    {isLocked && (
                      <td
                        colSpan={ROUND_LABELS.length + 4}
                        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/70 to-black/95 backdrop-blur-sm"
                      />
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Premium blur overlay */}
          {!isPremium && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[260px] bg-gradient-to-b from-transparent via-black/70 to-black/95" />
          )}
          {!isPremium && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/60 bg-black/90 px-4 py-2 text-xs font-medium text-yellow-200 shadow-[0_0_30px_rgba(234,179,8,0.7)]">
                <Lock className="h-3.5 w-3.5" />
                <span>Unlock full team ledger with Neeko+</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Show more / compact mobile */}
      <div className="mt-6 flex flex-col items-center gap-4">
        {canShowMore && (
          <button
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="inline-flex items-center gap-2 rounded-full border border-yellow-500/60 bg-black px-4 py-2 text-xs font-semibold text-yellow-200 shadow-[0_0_20px_rgba(234,179,8,0.5)] hover:bg-yellow-500 hover:text-black"
          >
            <Sparkles className="h-4 w-4" />
            Show more teams
          </button>
        )}
      </div>

      {/* Mobile card list */}
      <div className="mt-6 space-y-4 md:hidden">
        {rowsToShow.map((row, idx) => {
          const { avg, min, max } = row.summary;
          const locked = !isPremium && idx >= 8;
          return (
            <div
              key={row.team}
              className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/90 px-4 py-4 text-[0.8rem]"
            >
              {locked && (
                <>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-black/95 backdrop-blur-sm" />
                  <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-center justify-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/60 bg-black/95 px-3 py-1.5 text-xs font-medium text-yellow-200">
                      <Lock className="h-3.5 w-3.5" />
                      Neeko+ unlocks this team
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[0.9rem] font-semibold text-zinc-50">
                    {row.team}
                  </p>
                  <p className="text-[0.7rem] text-zinc-500">
                    {statType} index • avg {avg}
                  </p>
                </div>
              </div>

              {/* mini sparkline */}
              <div className="mt-3 h-12 w-full rounded-xl bg-zinc-900/90 p-2">
                <div className="flex h-full items-end gap-[2px]">
                  {row.series.map((v, i) => {
                    const normalised = (v - 80) / 40; // rough scaling
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-full bg-gradient-to-t from-yellow-500/10 to-yellow-400"
                        style={{ height: `${Math.max(0.1, normalised) * 100}%` }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* summary */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-[0.72rem] text-zinc-300">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.16em] text-zinc-500">
                    Min
                  </p>
                  <p>{min}</p>
                </div>
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.16em] text-zinc-500">
                    Avg
                  </p>
                  <p className="text-yellow-300">{avg}</p>
                </div>
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.16em] text-zinc-500">
                    Max
                  </p>
                  <p>{max}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TeamMasterTable;