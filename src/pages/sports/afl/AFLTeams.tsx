// src/pages/sports/afl/AFLTeams.tsx
// AFL Teams Page — layout structure for AFL team analytics

import React from "react";
import TeamMomentumPulse from "@/components/afl/teams/TeamMomentumPulse";
import TeamDashboardTiles from "@/components/afl/teams/TeamDashboardTiles";
import TeamFormGrid from "@/components/afl/teams/TeamFormGrid";
import TeamTrends from "@/components/afl/teams/TeamTrends";
import TeamAIInsights from "@/components/afl/teams/TeamAIInsights";
import TeamMasterTable from "@/components/afl/teams/TeamMasterTable";

// No props required, teams are internally loaded from MOCK_TEAMS
export default function AFLTeams() {
  return (
    <div className="px-4 pb-20 pt-6 md:px-8 lg:px-12">
      {/* Page Heading */}
      <header className="mb-10">
        <h1 className="text-3xl font-semibold text-neutral-100 md:text-4xl">
          AFL Team Analytics
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-400">
          League-wide team trends, momentum pulses, attack/defence shifts and
          full season scoring tables.
        </p>
      </header>

      {/* SECTION 1 — Team Round Momentum */}
      <section id="momentum" className="mb-14">
        <TeamMomentumPulse />
      </section>

      {/* SECTION 2 — Dashboard Tiles */}
      <section id="dashboard" className="mb-14">
        <TeamDashboardTiles />
      </section>

      {/* SECTION 3 — Team Form Grid (hot / stable / cold) */}
      <section id="form-grid" className="mb-14">
        <TeamFormGrid />
      </section>

      {/* SECTION 4 — Attack / Defence / Midfield Trends */}
      <section id="trends" className="mb-14">
        <TeamTrends />
      </section>

      {/* SECTION 5 — Team AI Insights */}
      <section id="ai" className="mb-14">
        <TeamAIInsights />
      </section>

      {/* SECTION 6 — Full Team Master Table */}
      <section id="master-table">
        <TeamMasterTable />
      </section>
    </div>
  );
}
