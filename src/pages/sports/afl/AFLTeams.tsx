// src/pages/sports/afl/AFLTeams.tsx
import React from "react";

import TeamRoundSummary from "@/components/afl/teams/TeamRoundSummary";
import TeamFormStabilityGrid from "@/components/afl/teams/TeamFormStabilityGrid";
import TeamProfileGrid from "@/components/afl/teams/TeamProfileGrid";
import TeamAIInsights from "@/components/afl/teams/TeamAIInsights";
import TeamMasterTable from "@/components/afl/teams/TeamMasterTable";

export default function AFLTeamsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      {/* PAGE HEADER */}
      <header className="mb-7 md:mb-9">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          AFL Team Performance Dashboard
        </h1>

        <p className="mt-3 max-w-3xl text-sm text-white/75 md:text-[15px]">
          League-wide{" "}
          <span className="font-semibold text-yellow-300">
            team momentum, strengths and matchup edges
          </span>{" "}
          — track form lines, stability profiles, role and style trends and
          full-season ledgers for every AFL club.
        </p>

        <p className="mt-2 max-w-3xl text-[13px] text-white/55">
          Built to mirror the player dashboard, but at a{" "}
          <span className="font-semibold text-yellow-200/90">
            team intelligence
          </span>{" "}
          level — perfect for spotting system trends, favourable matchup lanes
          and fixture-driven swings.
        </p>
      </header>

      {/* SECTION SELECTOR STRIP (matches player dashboard styling) */}
      <nav
        className="
          mb-6 md:mb-8
          rounded-2xl border border-white/5
          bg-gradient-to-r from-[#050515] via-[#050512] to-[#030308]
          px-4 py-3 md:px-6 md:py-3.5
          shadow-[0_0_40px_rgba(0,0,0,0.55)]
        "
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
            Sections
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            <a
              href="#team-round-momentum"
              className="
                rounded-full border border-white/15 bg-white/5
                px-3.5 py-1.5 text-xs font-medium text-white/75
                hover:bg-white/10 hover:text-white 
                transition-colors
              "
            >
              Round Momentum
            </a>

            <a
              href="#team-form-stability"
              className="
                rounded-full border border-white/15 bg-white/5
                px-3.5 py-1.5 text-xs font-medium text-white/75
                hover:bg-white/10 hover:text-white
                transition-colors
              "
            >
              Form &amp; Stability
            </a>

            <a
              href="#team-profiles"
              className="
                rounded-full border border-white/15 bg-white/5
                px-3.5 py-1.5 text-xs font-medium text-white/75
                hover:bg-white/10 hover:text-white 
                transition-colors
              "
            >
              Style &amp; Matchup Profiles
            </a>

            <a
              href="#team-ai-insights"
              className="
                rounded-full border border-white/15 bg-white/5
                px-3.5 py-1.5 text-xs font-medium text-white/75
                hover:bg-white/10 hover:text-white
                transition-colors
              "
            >
              AI Team Insights
            </a>

            <a
              href="#team-master-table"
              className="
                rounded-full border border-white/15 bg-white/5
                px-3.5 py-1.5 text-xs font-medium text-white/75
                hover:bg-white/10 hover:text-white 
                transition-colors
              "
            >
              Team Ledger &amp; Grid
            </a>
          </div>
        </div>
      </nav>

      {/* CONTENT SECTIONS – team versions of the player blocks */}
      <div className="space-y-10 md:space-y-14">
        {/* SECTION 1 — Round Momentum */}
        <section id="team-round-momentum" className="scroll-mt-24">
          <TeamRoundSummary />
        </section>

        {/* SECTION 2 — Team Form & Stability */}
        <section id="team-form-stability" className="scroll-mt-24">
          <TeamFormStabilityGrid />
        </section>

        {/* SECTION 3 — Style / Matchup Profiles */}
        <section id="team-profiles" className="scroll-mt-24">
          <TeamProfileGrid />
        </section>

        {/* SECTION 4 — AI Insights */}
        <section id="team-ai-insights" className="scroll-mt-24">
          <TeamAIInsights />
        </section>

        {/* SECTION 5 — Team Master Table */}
        <section id="team-master-table" className="scroll-mt-24">
          <TeamMasterTable />
        </section>
      </div>
    </div>
  );
}
