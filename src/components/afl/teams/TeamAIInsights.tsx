// src/components/afl/teams/TeamAIInsights.tsx
import React from "react";
import { MOCK_TEAMS, AFLTeam } from "./mockTeams";

/* ---------------------------------------------- */
/*                 UTILITY FUNCTIONS              */
/* ---------------------------------------------- */

const avg = (arr: number[]) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const volatility = (arr: number[]) =>
  arr.length ? Math.max(...arr) - Math.min(...arr) : 0;

/* -------------------------------------------------------------------------- */
/*                          TEAM AI INSIGHT GENERATOR                          */
/* -------------------------------------------------------------------------- */

function generateTeamAIPoints(team: AFLTeam) {
  // FIXED VERSION: compute league attack from last 5 scores
  const leagueAttack = avg(
    MOCK_TEAMS.map((t) => avg(t.scores.slice(-5)))
  );

  // ❌ ORIGINAL BUG:
  // avg(t.scores.slice(-5) - t.margins.slice(-5))
  // scores.slice is number[], margins.slice is number[]
  // number[] - number[] = invalid

  // ✔ FIX:
  // Estimate “points against” by: pointsFor - margin
  // pointsAgainst = PF - margin
  const leagueDefence = avg(
    MOCK_TEAMS.map((t) => {
      const PF = t.scores.slice(-5);
      const M = t.margins.slice(-5);
      const PA = PF.map((pf, i) => pf - M[i]); // vector subtract (VALID)
      return avg(PA);
    })
  );

  const leagueClearance = avg(
    MOCK_TEAMS.map((t) => avg(t.clearanceDom.slice(-5)))
  );

  const leagueVolatility = avg(
    MOCK_TEAMS.map((t) => volatility(t.margins.slice(-5)))
  );

  const insights: string[] = [];

  /* -------------------------------------------------------------- */
  /*                 1) Momentum / Stability                        */
  /* -------------------------------------------------------------- */
  const teamMomentum = volatility(team.margins.slice(-5));
  insights.push(
    teamMomentum < leagueVolatility
      ? `${team.name} is entering a stabilising window with decreasing volatility.`
      : `${team.name} shows elevated round-to-round swing, indicating unstable momentum.`
  );

  /* -------------------------------------------------------------- */
  /*                        2) Attack                              */
  /* -------------------------------------------------------------- */
  const teamAttack = avg(team.scores.slice(-5));
  insights.push(
    teamAttack > leagueAttack
      ? `${team.name} is trending above league attack averages over the last 5 rounds.`
      : `${team.name} attack output is currently below league-wide expectations.`
  );

  /* -------------------------------------------------------------- */
  /*                        3) Defence                             */
  /* -------------------------------------------------------------- */
  const PF = team.scores.slice(-5);
  const M = team.margins.slice(-5);
  const PA = PF.map((pf, i) => pf - M[i]); // points against

  const teamDefence = avg(PA);
  insights.push(
    teamDefence < leagueDefence
      ? `${team.name} defensive profile has tightened relative to league averages.`
      : `${team.name} defence is conceding above projected levels.`
  );

  /* -------------------------------------------------------------- */
  /*                   4) Clearance Domination                      */
  /* -------------------------------------------------------------- */
  const clearance5 = avg(team.clearanceDom.slice(-5));
  insights.push(
    clearance5 > leagueClearance
      ? `${team.name} is winning the clearance battle consistently.`
      : `${team.name} clearance differential is trending below league norms.`
  );

  return insights;
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                   */
/* -------------------------------------------------------------------------- */

export default function TeamAIInsights({ team }: { team: AFLTeam }) {
  const insights = generateTeamAIPoints(team);

  return (
    <div className="rounded-2xl border border-neutral-800/70 bg-black/90 p-5 text-[12px] text-neutral-200 space-y-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-yellow-200 mb-2">
        AI Team Insights
      </div>

      {insights.map((line, i) => (
        <p key={i} className="text-neutral-300 leading-relaxed">
          • {line}
        </p>
      ))}
    </div>
  );
}
