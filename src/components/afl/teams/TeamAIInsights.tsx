// src/components/afl/teams/TeamAIInsights.tsx

import React from "react";
import { MOCK_TEAMS, AFLTeam } from "./mockTeams";

/* -------------------------------------------------------------------------- */
/*                                HELPER FUNCS                                */
/* -------------------------------------------------------------------------- */

const avg = (arr: number[]): number =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const volatility = (arr: number[]): number => {
  if (arr.length < 2) return 0;
  return Math.max(...arr) - Math.min(...arr);
};

const lastN = (arr: number[], n: number) => arr.slice(-n);

/* -------------------------------------------------------------------------- */
/*                          TEAM AI INSIGHT GENERATOR                          */
/* -------------------------------------------------------------------------- */

function buildLeagueBaselines() {
  // Approximate points conceded as score - margin
  const leagueAttack = avg(
    MOCK_TEAMS.map((t) => avg(lastN(t.scores, 5)))
  );

  const leagueDefence = avg(
    MOCK_TEAMS.map((t) => {
      const pointsAgainst = t.scores.map((score, i) => score - t.margins[i]);
      return avg(lastN(pointsAgainst, 5));
    })
  );

  const leagueClearance = avg(
    MOCK_TEAMS.map((t) => avg(lastN(t.clearanceDom, 5)))
  );

  const leagueVolatility = avg(
    MOCK_TEAMS.map((t) => volatility(lastN(t.margins, 5)))
  );

  return { leagueAttack, leagueDefence, leagueClearance, leagueVolatility };
}

function buildTeamInsightLines(team: AFLTeam, baselines: ReturnType<typeof buildLeagueBaselines>): string[] {
  const last5Scores = lastN(team.scores, 5);
  const last5Margins = lastN(team.margins, 5);
  const last5Clear = lastN(team.clearanceDom, 5);

  const pointsAgainst = team.scores.map((s, i) => s - team.margins[i]);
  const last5Against = lastN(pointsAgainst, 5);

  const attackAvg = avg(last5Scores);
  const defenceAvg = avg(last5Against);
  const clearAvg = avg(last5Clear);
  const vol = volatility(last5Margins);

  const { leagueAttack, leagueDefence, leagueClearance, leagueVolatility } =
    baselines;

  const lines: string[] = [];

  // 1) Momentum / stability
  if (vol < leagueVolatility * 0.8) {
    lines.push(
      `${team.name} is entering a stabilising window with decreasing volatility.`
    );
  } else if (vol > leagueVolatility * 1.15) {
    lines.push(
      `${team.name} shows elevated round-to-round swing, indicating unstable momentum.`
    );
  } else {
    lines.push(
      `${team.name} momentum is tracking in line with league-wide volatility levels.`
    );
  }

  // 2) Attack vs league
  if (attackAvg > leagueAttack * 1.05) {
    lines.push(
      `${team.name} is trending above league attack averages over the last 5 rounds.`
    );
  } else if (attackAvg < leagueAttack * 0.95) {
    lines.push(
      `${team.name} attack output is currently below league-wide expectations.`
    );
  } else {
    lines.push(
      `${team.name} attack output is holding close to league averages recently.`
    );
  }

  // 3) Defence vs league
  if (defenceAvg < leagueDefence * 0.95) {
    lines.push(
      `${team.name} defensive profile has tightened relative to league averages.`
    );
  } else if (defenceAvg > leagueDefence * 1.05) {
    lines.push(
      `${team.name} defence is conceding above projected levels.`
    );
  } else {
    lines.push(
      `${team.name} defence is conceding in line with league norms.`
    );
  }

  // 4) Clearances vs league
  if (clearAvg > leagueClearance * 1.05) {
    lines.push(
      `${team.name} clearance differential is trending above league norms.`
    );
  } else if (clearAvg < leagueClearance * 0.95) {
    lines.push(
      `${team.name} clearance differential is trending below league norms.`
    );
  } else {
    lines.push(
      `${team.name} clearance differential is hovering around league averages.`
    );
  }

  return lines;
}

/* -------------------------------------------------------------------------- */
/*                               REACT COMPONENT                               */
/* -------------------------------------------------------------------------- */

export default function TeamAIInsights() {
  const baselines = buildLeagueBaselines();

  const items = MOCK_TEAMS.map((team) => ({
    team,
    lines: buildTeamInsightLines(team, baselines),
  }));

  return (
    <section className="mt-14 rounded-3xl border border-neutral-800/80 bg-gradient-to-b from-neutral-950/95 via-black/96 to-black px-5 py-6 shadow-[0_0_60px_rgba(0,0,0,0.9)]">
      {/* Section header */}
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-transparent px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.9)]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
              AI Insights
            </span>
          </div>
          <h3 className="mt-3 text-xl font-semibold text-neutral-50 md:text-2xl">
            High-level team trends & cohesion signals
          </h3>
          <p className="mt-2 max-w-2xl text-xs text-neutral-400">
            Momentum stability, attack/defence shifts and clearance dominance
            summarised into lightweight AI team notes — lighter than your full AI
            analysis page but still driven by dynamic AFL data.
          </p>
        </div>
      </div>

      {/* Grid of AI cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map(({ team, lines }) => (
          <article
            key={team.id}
            className="rounded-3xl border border-neutral-800/90 bg-gradient-to-b from-black/96 via-neutral-950 to-black px-5 py-4 text-xs text-neutral-200 shadow-[0_0_40px_rgba(0,0,0,0.7)]"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200/90">
                  AI Team Insights
                </div>
                <div className="mt-1 text-sm font-semibold text-neutral-50">
                  {team.name}
                </div>
              </div>

              <div
                className="flex h-7 w-7 items-center justify-center rounded-full border border-yellow-500/50 text-[11px]"
                style={{
                  background:
                    "radial-gradient(circle at 30% 0%, rgba(250,204,21,0.35), transparent 55%)",
                }}
              >
                <span
                  className="h-2 w-2 rounded-full shadow-[0_0_14px_rgba(250,204,21,0.9)]"
                  style={{ backgroundColor: "#FACC15" }}
                />
              </div>
            </div>

            <ul className="space-y-1.5 text-[11px] leading-relaxed text-neutral-200">
              {lines.map((line, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="mt-[3px] h-[3px] w-[3px] shrink-0 rounded-full bg-neutral-500" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
