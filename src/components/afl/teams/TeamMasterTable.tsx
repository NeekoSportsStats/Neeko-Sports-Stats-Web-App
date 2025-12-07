// src/components/afl/teams/TeamMasterTable.tsx
import React, { useMemo, useState } from "react";
import { Lock, Sparkles } from "lucide-react";

type StatType = "Fantasy" | "Offence" | "Defence" | "Pace";

const ROUND_LABELS = Array.from({ length: 23 }, (_, i) => `R${i + 1}`);
const HIT_THRESHOLDS = [80, 90, 100, 110];

type TeamRow = {
  team: string;
  fantasy: number[];
  offence: number[];
  defence: number[];
  pace: number[];
};

const SERIES_OFFSETS = [
  -4, -2, 1, 3, 0, 2, -1, 4, -3, 1, 2, -2, 3, -1, 0, 2, -3, 4, -2, 1, 3, -4, 2,
];

function buildSeries(base: number): number[] {
  return ROUND_LABELS.map((_, idx) => base + SERIES_OFFSETS[idx]);
}

const TEAM_BASES: {
  team: string;
  fantasy: number;
  offence: number;
  defence: number;
  pace: number;
}[] = [
  { team: "Brisbane Lions", fantasy: 105, offence: 108, defence: 96, pace: 103 },
  { team: "Sydney Swans", fantasy: 100, offence: 102, defence: 98, pace: 101 },
  { team: "GWS Giants", fantasy: 108, offence: 110, defence: 97, pace: 104 },
  { team: "Carlton", fantasy: 95, offence: 97, defence: 92, pace: 96 },
  { team: "Collingwood", fantasy: 96, offence: 98, defence: 94, pace: 97 },
  { team: "Melbourne", fantasy: 99, offence: 100, defence: 99, pace: 95 },
  { team: "Geelong Cats", fantasy: 101, offence: 103, defence: 96, pace: 100 },
  { team: "Port Adelaide", fantasy: 97, offence: 100, defence: 92, pace: 99 },
  { team: "Adelaide Crows", fantasy: 94, offence: 96, defence: 90, pace: 95 },
  { team: "Western Bulldogs", fantasy: 98, offence: 101, defence: 91, pace: 102 },
  { team: "Richmond", fantasy: 92, offence: 94, defence: 88, pace: 93 },
  { team: "Hawthorn", fantasy: 90, offence: 92, defence: 86, pace: 91 },
  { team: "Fremantle", fantasy: 93, offence: 94, defence: 92, pace: 89 },
  { team: "West Coast Eagles", fantasy: 88, offence: 89, defence: 84, pace: 90 },
];

const TEAMS: TeamRow[] = TEAM_BASES.map((base) => ({
  team: base.team,
  fantasy: buildSeries(base.fantasy),
  offence: buildSeries(base.offence),
  defence: buildSeries(base.defence),
  pace: buildSeries(base.pace),
}));

function summariseSeries(values: number[]) {
  if (!values.length) {
    return {
      seasonAvg: 0,
      last5Avg: 0,
      hitRates: HIT_THRESHOLDS.map(() => 0),
    };
  }

  const seasonAvg = Math.round(
    values.reduce((a, b) => a + b, 0) / values.length
  );

  const last5Slice = values.slice(-5);
  const last5Avg = Math.round(
    last5Slice.reduce((a, b) => a + b, 0) / last5Slice.length
  );

  const hitRates = HIT_THRESHOLDS.map((t) => {
    const count = values.filter((v) => v >= t).length;
    return Math.round((count / values.length) * 100);
  });

  return { seasonAvg, last5Avg, hitRates };
}

type SparkProps = { values: number[] };

const MiniSparklineTeam: React.FC<SparkProps> = ({ values }) => {
  if (!values || values.length === 0) {
    return (
      <div className="h-10 rounded-md bg-neutral-950/80" aria-hidden="true" />
    );
  }

  const width = 260;
  const height = 60;
  const paddingX = 8;
  const paddingY = 6;

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

  const first = points[0];
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-12 w-full text-yellow-300"
      preserveAspectRatio="none"
    >
      {/* Baseline */}
      <line
        x1={paddingX}
        x2={width - paddingX}
        y1={height - paddingY}
        y2={height - paddingY}
        stroke="rgba(148,163,184,0.35)"
        strokeWidth={0.75}
      />
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      {/* Start + End markers */}
      {first && (
        <circle
          cx={first.x}
          cy={first.y}
          r={2}
          fill="#ffffff"
          stroke="currentColor"
          strokeWidth={1}
        />
      )}
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
            r={2.4}
            fill="#ffffff"
            stroke="currentColor"
            strokeWidth={1}
          />
        </>
      )}
    </svg>
  );
};

const TeamMasterTable: React.FC = () => {
  const [statType, setStatType] = useState<StatType>("Fantasy");
  const [visibleCount, setVisibleCount] = useState(10);

  const visibleTeams = useMemo(
    () => TEAMS.slice(0, visibleCount),
    [visibleCount]
  );

  const hasMore = visibleCount < TEAMS.length;

  const handleShowMore = () => {
    if (!hasMore) return;
    setVisibleCount((prev) => Math.min(prev + 5, TEAMS.length));
  };

  const getSeriesForTeam = (team: TeamRow): number[] => {
    switch (statType) {
      case "Offence":
        return team.offence;
      case "Defence":
        return team.defence;
      case "Pace":
        return team.pace;
      case "Fantasy":
      default:
        return team.fantasy;
    }
  };

  const statLabel =
    statType === "Fantasy" ? "Fantasy Scores" : statType;

  return (
    <section
      className="
        rounded-[32px] border border-yellow-500/18
        bg-gradient-to-b from-neutral-950 via-neutral-950/90 to-black
        px-5 py-8 sm:px-7 lg:px-10
        shadow-[0_40px_120px_rgba(0,0,0,0.7)]
      "
    >
      {/* HEADER */}
      <header className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-300/80">
            Full-season Team Ledger &amp; Hit-rate Grid
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white md:text-2xl">
            Round-by-round {statLabel.toLowerCase()} &amp; consistency
            indicators
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-neutral-300/90 leading-relaxed">
            Explore how each club performs across the full AFL season. Switch
            lenses to see fantasy scoring, offensive output, defensive
            resistance or pace-of-play mapped across all 23 rounds – plus
            hit-rates for key scoring thresholds.
          </p>
        </div>

        {/* Stat type switcher */}
        <div className="flex flex-col gap-3 text-xs md:items-end">
          <div className="inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
            <Sparkles className="h-3 w-3" />
            <span>Stat Lens</span>
          </div>
          <div className="inline-flex flex-wrap gap-1.5 rounded-full bg-white/5 p-1">
            {(["Fantasy", "Offence", "Defence", "Pace"] as StatType[]).map(
              (type) => {
                const active = statType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setStatType(type)}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                      active
                        ? "bg-yellow-400 text-black shadow-[0_0_22px_rgba(250,204,21,0.45)]"
                        : "bg-transparent text-neutral-300 hover:bg-white/10"
                    }`}
                  >
                    {type}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </header>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md">
          <div className="relative max-h-[calc(100vh-260px)] overflow-x-auto overflow-y-auto">
            <table className="min-w-[1150px] border-separate border-spacing-0 text-[11px] text-neutral-100">
              <thead>
                <tr className="sticky top-0 z-20 bg-black/95 text-[10px] uppercase tracking-[0.16em] text-neutral-400 backdrop-blur-sm">
                  {/* Team header */}
                  <th className="sticky left-0 z-30 w-52 border-b border-neutral-800/80 bg-black/95 px-4 py-3 text-left">
                    Team
                  </th>

                  {/* Rounds */}
                  {ROUND_LABELS.map((label) => (
                    <th
                      key={label}
                      className="border-b border-neutral-800/80 px-2.5 py-3 text-center"
                    >
                      {label}
                    </th>
                  ))}

                  {/* Summary */}
                  <th className="border-b border-neutral-800/80 px-3 py-3 text-center">
                    Season Avg
                  </th>
                  <th className="border-b border-neutral-800/80 px-3 py-3 text-center">
                    Last 5
                  </th>
                  {HIT_THRESHOLDS.map((t) => (
                    <th
                      key={t}
                      className="border-b border-neutral-800/80 px-2.5 py-3 text-center"
                    >
                      {t}+
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-900/80">
                {visibleTeams.map((team, index) => {
                  const series = getSeriesForTeam(team);
                  const summary = summariseSeries(series);
                  const isBlurred = index >= 8;

                  const rowClassBase =
                    "transition-colors duration-150 hover:bg-neutral-900/55";
                  const blurClass = isBlurred
                    ? "blur-[3px] brightness-[0.6]"
                    : "";

                  return (
                    <tr
                      key={team.team}
                      className={`${rowClassBase} ${
                        index % 2 === 0 ? "bg-white/5" : "bg-white/0"
                      }`}
                    >
                      {/* Team name */}
                      <td
                        className={`
                          sticky left-0 z-10 border-r border-neutral-900/80
                          px-4 py-3 font-medium text-white backdrop-blur-md
                          ${blurClass}
                        `}
                      >
                        {team.team}
                      </td>

                      {/* Rounds */}
                      {series.map((score, idx) => (
                        <td
                          key={idx}
                          className={`px-2.5 py-2 text-center text-neutral-100 ${blurClass}`}
                        >
                          {score}
                        </td>
                      ))}

                      {/* Summary */}
                      <td
                        className={`px-3 py-2 text-center text-yellow-300 ${blurClass}`}
                      >
                        {summary.seasonAvg}
                      </td>
                      <td
                        className={`px-3 py-2 text-center text-yellow-300 ${blurClass}`}
                      >
                        {summary.last5Avg}
                      </td>
                      {summary.hitRates.map((rate, idx) => (
                        <td
                          key={idx}
                          className={`px-2.5 py-2 text-center text-emerald-300 ${blurClass}`}
                        >
                          {rate}%
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Premium blur overlay */}
            {visibleTeams.length > 8 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
            )}

            {/* CTA over blur */}
            {visibleTeams.length > 8 && (
              <div className="pointer-events-auto absolute inset-x-0 bottom-4 flex justify-center">
                <button
                  type="button"
                  className="
                    inline-flex items-center gap-2 rounded-full border border-yellow-400/70 
                    bg-black/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]
                    text-yellow-200 shadow-[0_0_24px_rgba(250,204,21,0.45)]
                  "
                >
                  <Lock className="h-3.5 w-3.5 text-yellow-300" />
                  <span>Unlock full team ledger with Neeko+</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE CARDS */}
      <div className="mt-4 space-y-4 md:hidden">
        {visibleTeams.map((team, index) => {
          const series = getSeriesForTeam(team);
          const summary = summariseSeries(series);
          const isBlurred = index >= 8;

          const blurClass = isBlurred
            ? "blur-[3px] brightness-[0.6]"
            : "";

          return (
            <div
              key={team.team}
              className="rounded-2xl border border-neutral-800/80 bg-black/70 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
            >
              <div
                className={`flex items-center justify-between gap-2 ${blurClass}`}
              >
                <h3 className="text-sm font-semibold text-white">
                  {team.team}
                </h3>
                <div className="text-[11px] text-neutral-400">
                  <span className="font-semibold text-yellow-300">
                    {statLabel}
                  </span>
                </div>
              </div>

              <div className={`mt-3 ${blurClass}`}>
                <MiniSparklineTeam values={series} />
              </div>

              <div
                className={`mt-3 flex justify-between text-[11px] text-neutral-300 ${blurClass}`}
              >
                <div>
                  <div className="text-neutral-500">Season Avg</div>
                  <div className="font-semibold text-yellow-300">
                    {summary.seasonAvg}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500">Last 5</div>
                  <div className="font-semibold text-yellow-300">
                    {summary.last5Avg}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500">Hit 100+</div>
                  <div className="font-semibold text-emerald-300">
                    {summary.hitRates[2]}%
                  </div>
                </div>
              </div>

              <div
                className={`mt-2 flex flex-wrap gap-1 text-[10px] text-neutral-400 ${blurClass}`}
              >
                <span className="rounded-full border border-yellow-500/40 px-2 py-0.5">
                  80+ {summary.hitRates[0]}%
                </span>
                <span className="rounded-full border border-yellow-500/40 px-2 py-0.5">
                  90+ {summary.hitRates[1]}%
                </span>
                <span className="rounded-full border border-yellow-500/40 px-2 py-0.5">
                  110+ {summary.hitRates[3]}%
                </span>
              </div>
            </div>
          );
        })}

        {/* Mobile Neeko+ CTA */}
        {visibleTeams.length > 8 && (
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              className="
                inline-flex items-center gap-2 rounded-full border border-yellow-400/70 
                bg-black/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]
                text-yellow-200 shadow-[0_0_24px_rgba(250,204,21,0.45)]
              "
            >
              <Lock className="h-3.5 w-3.5 text-yellow-300" />
              <span>Unlock full team ledger with Neeko+</span>
            </button>
          </div>
        )}
      </div>

      {/* SHOW MORE BUTTON */}
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleShowMore}
            className="
              rounded-full border border-yellow-500/40 
              px-5 py-2 text-xs font-semibold text-yellow-300
              bg-black/40 backdrop-blur-sm hover:bg-black/60 transition
              shadow-[0_0_20px_rgba(255,200,0,0.25)]
            "
          >
            Show More Teams
          </button>
        </div>
      )}
    </section>
  );
};

export default TeamMasterTable;
