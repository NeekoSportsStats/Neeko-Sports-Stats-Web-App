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

      {/* ---------------------------------------------------- */}
      {/*  PAGE HEADER — HERO SECTION (Matches Player Dashboard) */}
      {/* ---------------------------------------------------- */}

      <header className="mb-8 md:mb-10">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          AFL Team Performance Dashboard
        </h1>

        <p className="mt-3 max-w-3xl text-sm text-white/75 md:text-[15px] leading-relaxed">
          League-wide team analytics — scoring momentum, defensive strength,
          matchup difficulty, stability profiles, pace-of-play metrics and
          predictive intelligence across all 18 AFL clubs.
        </p>

        <p className="mt-2 max-w-3xl text-[13px] text-white/55 leading-relaxed">
          Designed to mirror the player dashboard, but powered at the{" "}
          <span className="text-yellow-200/90 font-semibold">
            team intelligence
          </span>{" "}
          level — helping you track club-wide form lines, structural trends and
          evolving matchup landscapes.
        </p>
      </header>

      {/* ---------------------------------------------------- */}
      {/*  SECTION SELECTOR NAVIGATION (Matches Player Dashboard) */}
      {/* ---------------------------------------------------- */}

      <nav
        className="
          mb-8 rounded-2xl border border-white/5
          bg-gradient-to-r from-[#050515] via-[#050512] to-[#030308]
          px-4 py-3 md:px-6 md:py-3.5
          shadow-[0_0_40px_rgba(0,0,0,0.55)]
        "
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

          {/* Label */}
          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
            Sections
          </div>

          {/* Pills */}
          <div className="flex flex-wrap gap-2 md:justify-end">

            {/* Round Momentum */}
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

            {/* Form & Stability */}
            <a
              href="#team-form-stability"
              className="
                rounded-full border border-white/15 bg-white/5
                px-3.5 py-1.5 text-xs font-medium text-white/75
                hover:bg-white/10 hover:text-white
                transition-colors
              "
            >
              Form & Stability
            </a>

            {/* Style & Matchups */}
            <a
              href="#team-profiles"
              className="
                rounded-full border border-white/15 bg-white/5
                px-3.5 py-1.5 text-xs font-medium text-white/75
                hover:bg-white/10 hover:text-white 
                transition-colors
              "
            >
              Style & Matchup Profiles
            </a>

            {/* AI Insights */}
            <a
              href="#team-ai-insights"
              className="
                rounded-full border border-white/15 bg-white/5
                px-3.5 py-1.5 text-xs font-medium text-white/75
                hover:bg-white/10 hover:text-white
                transition-colors
              "
            >
              AI Insights
            </a>

            {/* Master Table */}
            <a
              href="#team-master-table"
              className="
                rounded-full border border-white/15 bg-white/5
                px-3.5 py-1.5 text-xs font-medium text-white/75
                hover:bg-white/10 hover:text-white 
                transition-colors
              "
            >
              Team Ledger & Grid
            </a>

          </div>
        </div>
      </nav>

      {/* ---------------------------------------------------- */}
      {/*  MAIN CONTENT SECTIONS — Will build these one by one */}
      {/* ---------------------------------------------------- */}

      <div className="space-y-12 md:space-y-16">

        {/* SECTION 1 — Round Momentum (Teams) */}
        <section id="team-round-momentum" className="scroll-mt-24">
          <TeamRoundSummary />
        </section>

        {/* SECTION 2 — Form & Stability */}
        <section id="team-form-stability" className="scroll-mt-24">
          <TeamFormStabilityGrid />
        </section>

        {/* SECTION 3 — Style & Matchups */}
        <section id="team-profiles" className="scroll-mt-24">
          <TeamProfileGrid />
        </section>

        {/* SECTION 4 — AI Insights */}
        <section id="team-ai-insights" className="scroll-mt-24">
          <TeamAIInsights />
        </section>

        {/* SECTION 5 — Team Ledger / Master Table */}
        <section id="team-master-table" className="scroll-mt-24">
          <TeamMasterTable />
        </section>

      </div>
    </div>
  );
}
