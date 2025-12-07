// src/components/afl/teams/TeamMasterTable.tsx
import React, { useState } from "react";

const mockTeams = [
  {
    team: "Brisbane Lions",
    rounds: [92, 101, 110, 97, 104, 112],
    seasonAvg: 102,
    last5: 105,
    hit80: 88,
    hit90: 72,
    hit100: 61,
    hit110: 44,
  },
  {
    team: "Sydney Swans",
    rounds: [88, 94, 103, 107, 98, 100],
    seasonAvg: 99,
    last5: 100,
    hit80: 84,
    hit90: 69,
    hit100: 55,
    hit110: 40,
  },
  {
    team: "GWS Giants",
    rounds: [105, 112, 118, 120, 109, 102],
    seasonAvg: 111,
    last5: 113,
    hit80: 90,
    hit90: 82,
    hit100: 74,
    hit110: 61,
  },
  {
    team: "Carlton",
    rounds: [75, 88, 93, 85, 90, 92],
    seasonAvg: 87,
    last5: 88,
    hit80: 64,
    hit90: 48,
    hit100: 32,
    hit110: 22,
  },
  {
    team: "Collingwood",
    rounds: [82, 79, 95, 91, 88, 84],
    seasonAvg: 86,
    last5: 87,
    hit80: 59,
    hit90: 42,
    hit100: 28,
    hit110: 16,
  },
];

export default function TeamMasterTable() {
  const [visible, setVisible] = useState(3);

  const loadMore = () => setVisible((prev) => prev + 3);

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
      <header className="mb-7 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-300/80">
            Full-season Team Ledger & Hit-rate Grid
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white md:text-2xl">
            Round-by-round scoring, season trends & consistency indicators
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-neutral-300/90 leading-relaxed">
            Track each club’s scoring profile across the season. Includes
            round-by-round scoring, season averages, and hit-rate bands showing
            how frequently each club reaches key scoring thresholds.
          </p>
        </div>

        <p className="max-w-sm text-[12px] text-neutral-400 leading-relaxed">
          Future updates: sortable rounds, filter by stat lens, premium-only
          comparison mode, and full AFL fixture integration.
        </p>
      </header>

      {/* TABLE WRAPPER */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 backdrop-blur-md">
        <table className="min-w-full border-collapse text-sm">
          {/* HEADERS */}
          <thead>
            <tr className="border-b border-white/10 text-white/60 text-xs uppercase tracking-wide">
              <th className="sticky left-0 bg-black/50 px-4 py-3 text-left backdrop-blur-md">
                Team
              </th>

              {/* ROUNDS */}
              {[1, 2, 3, 4, 5, 6].map((r) => (
                <th key={r} className="px-3 py-3 text-center">
                  R{r}
                </th>
              ))}

              {/* SUMMARY COLUMNS */}
              <th className="px-3 py-3 text-center">Season Avg</th>
              <th className="px-3 py-3 text-center">Last 5</th>
              <th className="px-3 py-3 text-center">80+</th>
              <th className="px-3 py-3 text-center">90+</th>
              <th className="px-3 py-3 text-center">100+</th>
              <th className="px-3 py-3 text-center">110+</th>
            </tr>
          </thead>

          <tbody>
            {mockTeams.slice(0, visible).map((team, index) => (
              <tr
                key={team.team}
                className={`
                  border-b border-white/5 transition-colors
                  ${index % 2 === 0 ? "bg-white/5" : "bg-white/0"}
                `}
              >
                {/* TEAM NAME */}
                <td className="sticky left-0 bg-black/40 px-4 py-3 font-medium text-white backdrop-blur-lg">
                  {team.team}
                </td>

                {/* ROUND SCORES */}
                {team.rounds.map((score, idx) => (
                  <td key={idx} className="px-3 py-3 text-center text-white/90">
                    {score}
                  </td>
                ))}

                {/* SUMMARY COLUMNS */}
                <td className="px-3 py-3 text-center text-yellow-300">
                  {team.seasonAvg}
                </td>
                <td className="px-3 py-3 text-center text-yellow-300">
                  {team.last5}
                </td>
                <td className="px-3 py-3 text-center text-emerald-300">
                  {team.hit80}%
                </td>
                <td className="px-3 py-3 text-center text-emerald-300">
                  {team.hit90}%
                </td>
                <td className="px-3 py-3 text-center text-emerald-300">
                  {team.hit100}%
                </td>
                <td className="px-3 py-3 text-center text-emerald-300">
                  {team.hit110}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SHOW MORE BUTTON */}
      {visible < mockTeams.length && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={loadMore}
            className="
              rounded-full border border-yellow-500/40 
              px-5 py-2 text-xs font-semibold text-yellow-300
              bg-black/40 backdrop-blur-sm hover:bg-black/60 transition
              shadow-[0_0_20px_rgba(255,200,0,0.2)]
            "
          >
            Show More Teams
          </button>
        </div>
      )}
    </section>
  );
}
