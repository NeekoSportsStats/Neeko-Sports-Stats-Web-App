// src/pages/sports/afl/AFLTeams.tsx

import React from "react";
import TeamMomentumPulse from "@/components/afl/teams/TeamMomentumPulse";
import TeamDashboardTiles from "@/components/afl/teams/TeamDashboardTiles";
import TeamFormGrid from "@/components/afl/teams/TeamFormGrid";
import TeamTrends from "@/components/afl/teams/TeamTrends";
import TeamAIInsights from "@/components/afl/teams/TeamAIInsights";
import TeamMasterTable from "@/components/afl/teams/TeamMasterTable";
import { MOCK_TEAMS } from "@/components/afl/teams/mockTeams";

export default function AFLTeams() {
  const round = 6; // You can wire this to live data later

  return (
    <div className="mx-auto max-w-7xl px-4 pb-40 pt-6 md:px-6 lg:px-8">

      {/* ---------------------------------------------------------------------- */}
      {/*                              PAGE HEADER                               */}
      {/* ---------------------------------------------------------------------- */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border 
          border-yellow-500/40 bg-gradient-to-r from-yellow-500/15 
          via-yellow-500/5 to-transparent px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 
            shadow-[0_0_12px_rgba(250,204,21,0.9)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em]
            text-yellow-200/90">
            AFL Teams
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-semibold text-neutral-50 md:text-3xl">
          Team Analytics & League-wide Trends
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-neutral-400">
          Round {round} insights, momentum indicators, form grids, trends and
          full-season team ledger — all mirroring the AFL Players layout for a
          unified experience.
        </p>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/*                       SECTION 1 — MOMENTUM PULSE                       */}
      {/* ---------------------------------------------------------------------- */}
      <section className="mt-10 rounded-3xl border border-neutral-800/80 
        bg-gradient-to-b from-neutral-950 via-black/95 to-black 
        px-5 py-6 shadow-[0_0_60px_rgba(0,0,0,0.85)]">
        
        <TeamMomentumPulse teams={MOCK_TEAMS} />
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/*                      SECTION 2 — DASHBOARD TILES                       */}
      {/* ---------------------------------------------------------------------- */}
      <section className="mt-16 rounded-3xl border border-neutral-800/80 
        bg-gradient-to-b from-neutral-950 via-black/96 to-black 
        px-5 py-6 shadow-[0_0_60px_rgba(0,0,0,0.85)]">
        
        <TeamDashboardTiles />
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/*                    SECTION 3 — TEAM FORM GRID (HSC)                    */}
      {/* ---------------------------------------------------------------------- */}
      <section className="mt-16 rounded-3xl border border-neutral-800/80 
        bg-gradient-to-b from-neutral-950 via-black/96 to-black 
        px-5 py-6 shadow-[0_0_60px_rgba(0,0,0,0.85)]">

        <TeamFormGrid teams={MOCK_TEAMS} />
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/*                      SECTION 4 — TEAM TRENDS CHARTS                    */}
      {/* ---------------------------------------------------------------------- */}
      <section className="mt-16 rounded-3xl border border-neutral-800/80 
        bg-gradient-to-b from-neutral-950 via-black/96 to-black 
        px-5 py-6 shadow-[0_0_60px_rgba(0,0,0,0.85)]">

        <TeamTrends teams={MOCK_TEAMS} />
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/*                   SECTION 5 — AI TEAM INSIGHTS (LIGHT)                 */}
      {/* ---------------------------------------------------------------------- */}
      <section className="mt-16 rounded-3xl border border-neutral-800/80 
        bg-gradient-to-b from-neutral-950 via-black/96 to-black 
        px-5 py-6 shadow-[0_0_60px_rgba(0,0,0,0.85)]">

        {/* Page-level summary (matches players style) */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 rounded-full border 
            border-yellow-500/40 bg-gradient-to-r from-yellow-500/15 
            via-yellow-500/5 to-transparent px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 
              shadow-[0_0_12px_rgba(250,204,21,0.9)]" />
            <span className="text-[10px] font-semibold uppercase
              tracking-[0.18em] text-yellow-200/90">
              AI Insights
            </span>
          </div>

          <p className="mt-3 text-sm text-neutral-400 max-w-xl">
            High-level team trends including momentum stability, attack/
            defence shifts and role cohesion — lighter than the full AI analysis
            page but still driven by dynamic AFL data.
          </p>
        </div>

        {/* Render one AI insight card per team — compact */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_TEAMS.map((team) => (
            <TeamAIInsights key={team.id} team={team} />
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/*                   SECTION 6 — TEAM MASTER TABLE (FULL)                 */}
      {/* ---------------------------------------------------------------------- */}
      <section className="mt-16">
        <TeamMasterTable />
      </section>
    </div>
  );
}
