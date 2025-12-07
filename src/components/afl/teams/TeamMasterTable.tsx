// src/components/afl/teams/TeamMasterTable.tsx
import React, { useMemo, useState } from "react";
import { Lock, Sparkles, AlertTriangle } from "lucide-react";

type StatLens = "Fantasy" | "Offence" | "Defence" | "Disposals" | "Goals";

const ROUND_LABELS = Array.from({ length: 23 }, (_, i) => `R${i + 1}`);

// we’ll use hit-rates mainly for Fantasy-style stats
const HIT_THRESHOLDS = [100, 110];

type TeamRow = {
  team: string;
  fantasy: number[];
  offence: number[];
  defence: number[];
  disposals: number[];
  goals: number[];
  upcomingDifficulty: 1 | 2 | 3; // 1 easy, 2 neutral, 3 hard
};

//
// MOCK TEAM DATA – realistic-ish spread
//
function buildSeries(base: number, spread = 6): number[] {
  const offsets = [
    -3, 1, 0, 2, -1, 4, -2, 1, 3, -4, 0, 2, -1, 4, -3, 1, 0, 2, -2, 3, -1, 4,
    -3,
  ];
  return offsets.map((o) => base + o + Math.round((Math.random() - 0.5) * spread));
}

const TEAMS: TeamRow[] = [
  {
    team: "Brisbane Lions",
    fantasy: buildSeries(106),
    offence: buildSeries(108),
    defence: buildSeries(97),
    disposals: buildSeries(305, 10),
    goals: buildSeries(14, 2),
    upcomingDifficulty: 2,
  },
  {
    team: "Sydney Swans",
    fantasy: buildSeries(101),
    offence: buildSeries(102),
    defence: buildSeries(99),
    disposals: buildSeries(298, 9),
    goals: buildSeries(12, 2),
    upcomingDifficulty: 1,
  },
  {
    team: "GWS Giants",
    fantasy: buildSeries(109),
    offence: buildSeries(111),
    defence: buildSeries(96),
    disposals: buildSeries(312, 10),
    goals: buildSeries(15, 2),
    upcomingDifficulty: 2,
  },
  {
    team: "Carlton",
    fantasy: buildSeries(95),
    offence: buildSeries(97),
    defence: buildSeries(92),
    disposals: buildSeries(293, 8),
    goals: buildSeries(11, 2),
    upcomingDifficulty: 2,
  },
  {
    team: "Collingwood",
    fantasy: buildSeries(97),
    offence: buildSeries(99),
    defence: buildSeries(93),
    disposals: buildSeries(295, 8),
    goals: buildSeries(13, 2),
    upcomingDifficulty: 3,
  },
  {
    team: "Melbourne",
    fantasy: buildSeries(98),
    offence: buildSeries(100),
    defence: buildSeries(98),
    disposals: buildSeries(300, 9),
    goals: buildSeries(12, 2),
    upcomingDifficulty: 1,
  },
  {
    team: "Geelong Cats",
    fantasy: buildSeries(102),
    offence: buildSeries(103),
    defence: buildSeries(95),
    disposals: buildSeries(307, 9),
    goals: buildSeries(14, 2),
    upcomingDifficulty: 2,
  },
  {
    team: "Port Adelaide",
    fantasy: buildSeries(97),
    offence: buildSeries(100),
    defence: buildSeries(90),
    disposals: buildSeries(291, 8),
    goals: buildSeries(11, 2),
    upcomingDifficulty: 2,
  },
  {
    team: "Richmond",
    fantasy: buildSeries(92),
    offence: buildSeries(94),
    defence: buildSeries(88),
    disposals: buildSeries(283, 7),
    goals: buildSeries(9, 2),
    upcomingDifficulty: 3,
  },
  {
    team: "Hawthorn",
    fantasy: buildSeries(90),
    offence: buildSeries(92),
    defence: buildSeries(86),
    disposals: buildSeries(279, 7),
    goals: buildSeries(8, 2),
    upcomingDifficulty: 3,
  },
];

//
// UTILITIES
//
function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (!values.length) return 0;
  const avg = average(values);
  const variance =
    values.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function summarise(values: number[]) {
  const avgVal = average(values);
  const last5Arr = values.slice(-5);
  const last5Val = average(last5Arr);

  const hit100 =
    (values.filter((v) => v >= 100).length / values.length || 0) * 100;
  const hit110 =
    (values.filter((v) => v >= 110).length / values.length || 0) * 100;

  const volatility = stdDev(values); // higher = more volatile
  const rawConsistency = Math.max(0, 40 - volatility * 4); // maps typical 0–10 stdev → ~0–40
  const consistencyScore = Math.max(
    5,
    Math.min(95, 60 + rawConsistency) // cluster around 60–95 for nice bars
  );

  let confidenceLabel: "High" | "Medium" | "Low";
  if (consistencyScore >= 80) confidenceLabel = "High";
  else if (consistencyScore >= 60) confidenceLabel = "Medium";
  else confidenceLabel = "Low";

  return {
    avg: Math.round(avgVal),
    last5: Math.round(last5Val),
    hit100: Math.round(hit100),
    hit110: Math.round(hit110),
    consistencyScore,
    confidenceLabel,
  };
}

function getLensSeries(team: TeamRow, lens: StatLens): number[] {
  switch (lens) {
    case "Fantasy":
      return team.fantasy;
    case "Offence":
      return team.offence;
    case "Defence":
      return team.defence;
    case "Disposals":
      return team.disposals;
    case "Goals":
      return team.goals;
  }
}

function difficultyLabel(d: 1 | 2 | 3) {
  if (d === 1) return "Favourable";
  if (d === 2) return "Neutral";
  return "Tough";
}

function difficultyColour(d: 1 | 2 | 3) {
  if (d === 1) return "text-emerald-300";
  if (d === 2) return "text-yellow-300";
  return "text-red-300";
}

//
// SIMPLE SPARKLINE – full 23 rounds
//
const Sparkline: React.FC<{ values: number[] }> = ({ values }) => {
  if (!values || !values.length) return null;

  const width = 260;
  const height = 60;
  const padX = 8;
  const padY = 6;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = padX + (i / Math.max(values.length - 1, 1)) * (width - padX * 2);
    const y =
      padY + (1 - (v - min) / range) * (height - padY * 2);
    return { x, y };
  });

  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-10 w-full"
      preserveAspectRatio="none"
    >
      <path
        d={d}
        fill="none"
        stroke="rgba(250,250,250,0.9)"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </svg>
  );
};

//
// MAIN COMPONENT
//
const TeamMasterTable: React.FC = () => {
  const [lens, setLens] = useState<StatLens>("Fantasy");
  const [visibleCount, setVisibleCount] = useState(8);

  const visibleTeams = useMemo(
    () => TEAMS.slice(0, visibleCount),
    [visibleCount]
  );
  const hasMore = visibleCount < TEAMS.length;

  return (
    <section className="mt-12 rounded-3xl border border-yellow-500/25 bg-gradient-to-b from-black via-neutral-950 to-black px-5 py-8 shadow-[0_0_40px_rgba(0,0,0,0.65)] md:px-6 md:py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/60 bg-black/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-yellow-300 shadow-[0_0_18px_rgba(250,204,21,0.45)]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Team Master Ledger</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Full-season team ledger, hit-rates & confidence metrics
          </h2>
          <p className="text-sm text-zinc-400">
            23-round performance grid with hit-rates, rolling form and
            consistency markers for each club, across multiple stat lenses.
          </p>
        </div>

        {/* Stat lens + helper */}
        <div className="flex flex-col items-start gap-2 text-xs md:items-end">
          <p className="uppercase tracking-[0.18em] text-yellow-200/80 font-semibold">
            Stat Lens
          </p>
          <div className="inline-flex flex-wrap gap-1.5 rounded-full bg-white/5 p-1">
            {(["Fantasy", "Offence", "Defence", "Disposals", "Goals"] as StatLens[]).map(
              (type) => {
                const active = lens === type;
                return (
                  <button
                    key={type}
                    onClick={() => setLens(type)}
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
          <p className="mt-1 max-w-xs text-[0.7rem] text-zinc-500 text-right">
            Hit-rates & extremes (🔥 / ❄️) are tuned primarily to{" "}
            <span className="text-yellow-200">Fantasy</span> style outputs.
          </p>
        </div>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block overflow-hidden rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="relative max-h-[720px] overflow-auto">
          <table className="min-w-[1350px] border-separate border-spacing-0 text-[11px] text-zinc-200">
            <thead>
              <tr className="sticky top-0 z-20 bg-black/95 text-[10px] uppercase tracking-[0.15em] text-zinc-400">
                {/* Team */}
                <th className="sticky left-0 z-30 border-b border-zinc-800 bg-black/95 px-4 py-3 text-left">
                  Team
                </th>

                {/* Rounds */}
                {ROUND_LABELS.map((r) => (
                  <th
                    key={r}
                    className="border-b border-zinc-800 px-2 py-3 text-center whitespace-nowrap"
                  >
                    {r}
                  </th>
                ))}

                {/* Summary cols */}
                <th className="border-b border-zinc-800 px-3 py-3 text-center whitespace-nowrap">
                  Sparkline
                </th>
                <th className="border-b border-zinc-800 px-3 py-3 text-center">
                  Avg
                </th>
                <th className="border-b border-zinc-800 px-3 py-3 text-center whitespace-nowrap">
                  Last 5
                </th>
                <th className="border-b border-zinc-800 px-3 py-3 text-center whitespace-nowrap">
                  Consistency
                </th>
                <th className="border-b border-zinc-800 px-3 py-3 text-center whitespace-nowrap">
                  Confidence
                </th>
                <th className="border-b border-zinc-800 px-3 py-3 text-center whitespace-nowrap">
                  100+ %
                </th>
                <th className="border-b border-zinc-800 px-3 py-3 text-center whitespace-nowrap">
                  110+ %
                </th>
                <th className="border-b border-zinc-800 px-3 py-3 text-center whitespace-nowrap">
                  Next 3
                </th>
              </tr>
            </thead>

            <tbody>
              {visibleTeams.map((team, rowIndex) => {
                const values = getLensSeries(team, lens);
                const summary = summarise(values);
                const blurred = rowIndex >= 8; // premium blur after first 8 rows

                // confidence colour
                const confidenceColour =
                  summary.confidenceLabel === "High"
                    ? "text-emerald-300"
                    : summary.confidenceLabel === "Medium"
                    ? "text-yellow-300"
                    : "text-red-300";

                return (
                  <tr
                    key={team.team}
                    className={`transition ${
                      rowIndex % 2 === 0 ? "bg-white/5" : "bg-transparent"
                    } hover:bg-white/10`}
                  >
                    {/* TEAM (sticky) */}
                    <td
                      className={`sticky left-0 z-10 border-r border-zinc-800 bg-black/80 px-4 py-3 text-left text-[0.85rem] font-semibold ${
                        blurred ? "blur-[3px] brightness-75" : ""
                      }`}
                    >
                      {team.team}
                    </td>

                    {/* ROUND VALUES */}
                    {values.map((v, idx) => {
                      const showIcon =
                        lens === "Fantasy" &&
                        (v >= 110 || v <= 80);
                      const extremeIcon =
                        v >= 110 ? "🔥" : v <= 80 ? "❄️" : "";

                      return (
                        <td
                          key={`${team.team}-${idx}`}
                          className={`px-2 py-2 text-center ${
                            blurred ? "blur-[3px] brightness-75" : ""
                          }`}
                        >
                          <span className="inline-flex items-center justify-center gap-1">
                            {showIcon && (
                              <span className="text-[0.7rem]">
                                {extremeIcon}
                              </span>
                            )}
                            <span>{v}</span>
                          </span>
                        </td>
                      );
                    })}

                    {/* SPARKLINE */}
                    <td
                      className={`px-3 py-2 ${
                        blurred ? "blur-[3px] brightness-75" : ""
                      }`}
                    >
                      <Sparkline values={values} />
                    </td>

                    {/* AVG */}
                    <td
                      className={`px-3 py-2 text-center font-semibold text-yellow-300 ${
                        blurred ? "blur-[3px] brightness-75" : ""
                      }`}
                    >
                      {summary.avg}
                    </td>

                    {/* LAST 5 */}
                    <td
                      className={`px-3 py-2 text-center text-yellow-200 ${
                        blurred ? "blur-[3px] brightness-75" : ""
                      }`}
                    >
                      {summary.last5}
                    </td>

                    {/* CONSISTENCY BAR */}
                    <td
                      className={`px-3 py-2 ${
                        blurred ? "blur-[3px] brightness-75" : ""
                      }`}
                    >
                      <div className="flex flex-col gap-1 text-[0.7rem] text-zinc-400">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
                          <div
                            className={`h-full ${
                              summary.consistencyScore >= 80
                                ? "bg-emerald-400"
                                : summary.consistencyScore >= 60
                                ? "bg-yellow-400"
                                : "bg-red-400"
                            }`}
                            style={{
                              width: `${summary.consistencyScore}%`,
                            }}
                          />
                        </div>
                        <span>{summary.consistencyScore.toFixed(0)} / 100</span>
                      </div>
                    </td>

                    {/* CONFIDENCE LABEL */}
                    <td
                      className={`px-3 py-2 text-center font-semibold ${confidenceColour} ${
                        blurred ? "blur-[3px] brightness-75" : ""
                      }`}
                    >
                      {summary.confidenceLabel}
                    </td>

                    {/* HIT RATES */}
                    <td
                      className={`px-3 py-2 text-center text-emerald-300 ${
                        blurred ? "blur-[3px] brightness-75" : ""
                      }`}
                    >
                      {summary.hit100}%
                    </td>
                    <td
                      className={`px-3 py-2 text-center text-emerald-300 ${
                        blurred ? "blur-[3px] brightness-75" : ""
                      }`}
                    >
                      {summary.hit110}%
                    </td>

                    {/* FIXTURE DIFFICULTY */}
                    <td
                      className={`px-3 py-2 text-center ${
                        blurred ? "blur-[3px] brightness-75" : ""
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1 text-[0.72rem]">
                        <div className="flex gap-0.5">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className={`h-1.5 w-1.5 rounded-full ${
                                team.upcomingDifficulty === 1
                                  ? "bg-emerald-400"
                                  : team.upcomingDifficulty === 2
                                  ? "bg-yellow-400"
                                  : "bg-red-400"
                              }`}
                            />
                          ))}
                        </div>
                        <span
                          className={difficultyColour(team.upcomingDifficulty)}
                        >
                          {difficultyLabel(team.upcomingDifficulty)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Blur gradient over locked rows */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/95 to-transparent" />

          {/* Unlock CTA */}
          <div className="pointer-events-auto absolute inset-x-0 bottom-3 flex justify-center">
            <button className="inline-flex items-center gap-2 rounded-full border border-yellow-500/70 bg-black/90 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-200 shadow-[0_0_20px_rgba(250,200,0,0.35)]">
              <Lock className="h-3.5 w-3.5" />
              Unlock full ledger with Neeko+
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE CARDS */}
      <div className="mt-5 space-y-5 md:hidden">
        {visibleTeams.map((team, rowIndex) => {
          const values = getLensSeries(team, lens);
          const summary = summarise(values);
          const blurred = rowIndex >= 8;

          const confidenceColour =
            summary.confidenceLabel === "High"
              ? "text-emerald-300"
              : summary.confidenceLabel === "Medium"
              ? "text-yellow-300"
              : "text-red-300";

          const hottest = Math.max(...values);
          const coldest = Math.min(...values);
          const hasExtreme =
            (lens === "Fantasy" && hottest >= 110) ||
            (lens === "Fantasy" && coldest <= 80);

          return (
            <div
              key={team.team}
              className={`rounded-2xl border border-zinc-800 bg-black/80 p-4 shadow-[0_0_26px_rgba(0,0,0,0.7)] ${
                blurred ? "blur-[3px] brightness-75" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.85rem] font-semibold">{team.team}</p>
                  <p className="mt-0.5 text-[0.7rem] text-zinc-500">
                    {lens} • 23-round ledger
                  </p>
                </div>
                {hasExtreme && (
                  <div className="flex items-center gap-1 text-[0.7rem] text-yellow-300">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Extremes
                  </div>
                )}
              </div>

              <div className="mt-3">
                <Sparkline values={values} />
              </div>

              <div className="mt-3 flex justify-between text-[0.75rem] text-zinc-300">
                <div>
                  <p className="text-[0.65rem] text-zinc-500">Avg</p>
                  <p className="font-semibold text-yellow-300">
                    {summary.avg}
                  </p>
                </div>
                <div>
                  <p className="text-[0.65rem] text-zinc-500">Last 5</p>
                  <p className="font-semibold text-yellow-200">
                    {summary.last5}
                  </p>
                </div>
                <div>
                  <p className="text-[0.65rem] text-zinc-500">100+ / 110+</p>
                  <p className="font-semibold text-emerald-300">
                    {summary.hit100}% / {summary.hit110}%
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 text-[0.72rem]">
                <div className="flex-1">
                  <p className="text-[0.65rem] text-zinc-500">Consistency</p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
                    <div
                      className={`h-full ${
                        summary.consistencyScore >= 80
                          ? "bg-emerald-400"
                          : summary.consistencyScore >= 60
                          ? "bg-yellow-400"
                          : "bg-red-400"
                      }`}
                      style={{ width: `${summary.consistencyScore}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[0.65rem] text-zinc-500">Confidence</p>
                  <p className={`font-semibold ${confidenceColour}`}>
                    {summary.confidenceLabel}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[0.7rem] text-zinc-400">
                <div className="flex items-center gap-1">
                  <span
                    className={`inline-flex h-1.5 w-1.5 rounded-full ${
                      team.upcomingDifficulty === 1
                        ? "bg-emerald-400"
                        : team.upcomingDifficulty === 2
                        ? "bg-yellow-400"
                        : "bg-red-400"
                    }`}
                  />
                  <span className={difficultyColour(team.upcomingDifficulty)}>
                    {difficultyLabel(team.upcomingDifficulty)} next 3
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {visibleCount >= 8 && (
          <button className="mt-1 w-full text-center text-[0.7rem] text-yellow-300">
            Unlock full table with Neeko+
          </button>
        )}
      </div>

      {/* Show More */}
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() =>
              setVisibleCount((prev) => Math.min(prev + 3, TEAMS.length))
            }
            className="rounded-full border border-yellow-500/40 bg-black/60 px-5 py-2 text-xs font-semibold text-yellow-300 shadow-[0_0_18px_rgba(255,200,0,0.25)] hover:bg-black/80 transition"
          >
            Show More Teams
          </button>
        </div>
      )}
    </section>
  );
};

export default TeamMasterTable;