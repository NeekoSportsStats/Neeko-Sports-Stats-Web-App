// src/components/afl/teams/TeamMasterTable.tsx
import React, { useState, useMemo } from "react";
import { Lock, Sparkles } from "lucide-react";

//
// ---------------------------------------------
// CONFIG
// ---------------------------------------------
//

const ROUND_LABELS = Array.from({ length: 23 }, (_, i) => `R${i + 1}`);

const HIT_THRESHOLDS = [80, 90, 100, 110];

type StatLens = "Fantasy" | "Offence" | "Defence" | "Disposals" | "Goals";

//
// ---------------------------------------------
// MOCK TEAM DATA (automatically generated realistic ranges)
// ---------------------------------------------
//

function buildSeries(base: number): number[] {
  const offsets = [
    -3, 1, 0, 2, -1, 4, -2, 1, 3, -4, 0, 2, -1, 4, -3, 1, 0, 2, -2, 3, -1, 4, -3,
  ];
  return offsets.map((o) => base + o);
}

const TEAMS = [
  {
    team: "Brisbane Lions",
    fantasy: buildSeries(106),
    offence: buildSeries(108),
    defence: buildSeries(97),
    disposals: buildSeries(309),
    goals: buildSeries(14),
  },
  {
    team: "Sydney Swans",
    fantasy: buildSeries(101),
    offence: buildSeries(102),
    defence: buildSeries(99),
    disposals: buildSeries(301),
    goals: buildSeries(12),
  },
  {
    team: "GWS Giants",
    fantasy: buildSeries(109),
    offence: buildSeries(111),
    defence: buildSeries(96),
    disposals: buildSeries(314),
    goals: buildSeries(15),
  },
  {
    team: "Carlton",
    fantasy: buildSeries(95),
    offence: buildSeries(97),
    defence: buildSeries(92),
    disposals: buildSeries(296),
    goals: buildSeries(11),
  },
  {
    team: "Collingwood",
    fantasy: buildSeries(97),
    offence: buildSeries(99),
    defence: buildSeries(93),
    disposals: buildSeries(298),
    goals: buildSeries(13),
  },
  {
    team: "Melbourne",
    fantasy: buildSeries(98),
    offence: buildSeries(100),
    defence: buildSeries(98),
    disposals: buildSeries(302),
    goals: buildSeries(12),
  },
  {
    team: "Geelong Cats",
    fantasy: buildSeries(102),
    offence: buildSeries(103),
    defence: buildSeries(95),
    disposals: buildSeries(307),
    goals: buildSeries(14),
  },
  {
    team: "Port Adelaide",
    fantasy: buildSeries(97),
    offence: buildSeries(100),
    defence: buildSeries(90),
    disposals: buildSeries(293),
    goals: buildSeries(11),
  },
  {
    team: "Richmond",
    fantasy: buildSeries(92),
    offence: buildSeries(94),
    defence: buildSeries(88),
    disposals: buildSeries(281),
    goals: buildSeries(9),
  },
  {
    team: "Hawthorn",
    fantasy: buildSeries(90),
    offence: buildSeries(92),
    defence: buildSeries(86),
    disposals: buildSeries(276),
    goals: buildSeries(8),
  },
];

//
// ---------------------------------------------
// UTILITIES
// ---------------------------------------------
//

function summarise(values: number[]) {
  const avg = Math.round(values.reduce((a, b) => a + b) / values.length);
  const last5 = Math.round(
    values.slice(-5).reduce((a, b) => a + b) / Math.min(values.length, 5)
  );
  const hitRates = HIT_THRESHOLDS.map((t) =>
    Math.round((values.filter((v) => v >= t).length / values.length) * 100)
  );
  return { avg, last5, hitRates };
}

//
// ---------------------------------------------
// SPARKLINE COMPONENT
// ---------------------------------------------
// Minimal line, no glow (your request)
// ---------------------------------------------
//

const Sparkline = ({ values }: { values: number[] }) => {
  if (!values?.length) return null;

  const width = 260;
  const height = 60;
  const padX = 8;
  const padY = 6;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x =
      padX + (i / Math.max(values.length - 1, 1)) * (width - padX * 2);
    const y =
      padY + (1 - (v - min) / range) * (height - padY * 2);
    return { x, y };
  });

  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10">
      <path
        d={d}
        fill="none"
        stroke="rgb(250,250,250)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
};

//
// ---------------------------------------------
// TEAM MASTER TABLE
// ---------------------------------------------
//

const TeamMasterTable = () => {
  const [lens, setLens] = useState<StatLens>("Fantasy");
  const [visibleCount, setVisibleCount] = useState(8);

  const visibleTeams = useMemo(
    () => TEAMS.slice(0, visibleCount),
    [visibleCount]
  );

  const hasMore = visibleCount < TEAMS.length;

  const getData = (team: any) =>
    lens === "Fantasy"
      ? team.fantasy
      : lens === "Offence"
      ? team.offence
      : lens === "Defence"
      ? team.defence
      : lens === "Disposals"
      ? team.disposals
      : team.goals;

  return (
    <section className="mt-16 rounded-3xl border border-yellow-500/20 bg-gradient-to-b from-black via-neutral-950 to-black px-6 py-10 shadow-[0_0_40px_rgba(0,0,0,0.65)]">
      {/* Header */}
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-black/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-yellow-300">
            <Sparkles className="h-3 w-3" />
            <span>Team Master Ledger</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Full-season performance ledger & hit-rate grid
          </h2>
          <p className="text-sm text-zinc-400 max-w-2xl">
            23-round performance scroll with hit-rates, last 5 form,
            volatility & consistency markers across all stat lenses.
          </p>
        </div>

        {/* Stat Lens Switcher */}
        <div className="flex flex-col items-start md:items-end gap-2">
          <p className="uppercase tracking-[0.18em] text-yellow-300/80 text-[10px] font-semibold">
            Stat Lens
          </p>

          <div className="inline-flex flex-wrap gap-1 rounded-full bg-white/5 p-1">
            {(["Fantasy", "Offence", "Defence", "Disposals", "Goals"] as StatLens[]).map(
              (t) => {
                const active = lens === t;
                return (
                  <button
                    key={t}
                    onClick={() => setLens(t)}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                      active
                        ? "bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,0.5)]"
                        : "bg-transparent text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    {t}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="relative max-h-[700px] overflow-auto">
          <table className="min-w-[1300px] text-[11px] text-zinc-200 border-separate border-spacing-0">
            <thead>
              <tr className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl text-[10px] uppercase tracking-[0.15em] text-zinc-400">
                <th className="sticky left-0 z-40 px-4 py-3 text-left border-b border-zinc-800 bg-black/90">
                  Team
                </th>

                {ROUND_LABELS.map((r) => (
                  <th
                    key={r}
                    className="px-2 py-3 text-center border-b border-zinc-800 whitespace-nowrap"
                  >
                    {r}
                  </th>
                ))}

                <th className="px-3 py-3 border-b border-zinc-800">Avg</th>
                <th className="px-3 py-3 border-b border-zinc-800">Last 5</th>

                {HIT_THRESHOLDS.map((t) => (
                  <th
                    key={t}
                    className="px-3 py-3 border-b border-zinc-800 whitespace-nowrap"
                  >
                    {t}+
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {visibleTeams.map((team, idx) => {
                const values = getData(team);
                const sum = summarise(values);
                const blurred = idx >= 8;

                return (
                  <tr
                    key={team.team}
                    className={`${
                      idx % 2 === 0 ? "bg-white/5" : "bg-transparent"
                    } hover:bg-white/10 transition`}
                  >
                    <td
                      className={`sticky left-0 z-30 px-4 py-3 font-medium bg-black/70 backdrop-blur-xl ${
                        blurred ? "blur-[3px] brightness-75" : ""
                      }`}
                    >
                      {team.team}
                    </td>

                    {values.map((v, i) => (
                      <td
                        key={i}
                        className={`px-2 py-2 text-center ${
                          blurred ? "blur-[3px] brightness-75" : ""
                        }`}
                      >
                        {v}
                      </td>
                    ))}

                    <td
                      className={`text-yellow-300 px-3 py-2 text-center ${
                        blurred ? "blur-[3px] brightness-75" : ""
                      }`}
                    >
                      {sum.avg}
                    </td>

                    <td
                      className={`text-yellow-300 px-3 py-2 text-center ${
                        blurred ? "blur-[3px] brightness-75" : ""
                      }`}
                    >
                      {sum.last5}
                    </td>

                    {sum.hitRates.map((hr, i) => (
                      <td
                        key={i}
                        className={`px-3 py-2 text-center text-emerald-300 ${
                          blurred ? "blur-[3px] brightness-75" : ""
                        }`}
                      >
                        {hr}%
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Blur lock overlay */}
          {visibleCount > 8 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 to-transparent" />
          )}

          {/* Unlock CTA */}
          {visibleCount > 8 && (
            <div className="absolute bottom-4 inset-x-0 flex justify-center">
              <button className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-yellow-500/70 bg-black/80 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-yellow-200 shadow-[0_0_20px_rgba(250,200,0,0.35)]">
                <Lock className="h-3.5 w-3.5 text-yellow-300" />
                Unlock full ledger with Neeko+
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-5 mt-6">
        {visibleTeams.map((team, idx) => {
          const values = getData(team);
          const sum = summarise(values);
          const blurred = idx >= 8;

          return (
            <div
              key={team.team}
              className={`rounded-2xl border border-zinc-800 bg-black/70 p-4 shadow-[0_0_24px_rgba(0,0,0,0.6)] ${
                blurred ? "blur-[3px] brightness-75" : ""
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold">{team.team}</h3>
                <span className="text-[10px] text-yellow-300">{lens}</span>
              </div>

              <div className="mt-3">
                <Sparkline values={values} />
              </div>

              <div className="mt-3 flex justify-between text-[11px] text-zinc-300">
                <div>
                  <p className="text-zinc-500 text-[10px]">Avg</p>
                  <p className="text-yellow-300 font-semibold">{sum.avg}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px]">Last 5</p>
                  <p className="text-yellow-300 font-semibold">{sum.last5}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px]">100+</p>
                  <p className="text-emerald-300 font-semibold">
                    {sum.hitRates[2]}%
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {visibleCount > 8 && (
          <button className="w-full text-xs text-yellow-300 mt-2">
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
            className="rounded-full border border-yellow-500/40 px-5 py-2 text-xs font-semibold text-yellow-300 bg-black/40 shadow-[0_0_18px_rgba(255,200,0,0.25)] hover:bg-black/60 transition"
          >
            Show More Teams
          </button>
        </div>
      )}
    </section>
  );
};

export default TeamMasterTable;