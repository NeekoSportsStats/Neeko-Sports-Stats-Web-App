// src/pages/sports/afl/AFLTeams.tsx
import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Sections (all upgraded)
import TeamRoundSummary from "@/components/afl/teams/TeamRoundSummary";
import TeamFormStabilityGrid from "@/components/afl/teams/TeamFormStabilityGrid";
import TeamProfileGrid from "@/components/afl/teams/TeamProfileGrid";
import TeamAIInsights from "@/components/afl/teams/TeamAIInsights";
import TeamMasterTable from "@/components/afl/teams/TeamMasterTable";

const AFLTeams: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen pb-20">
      {/* Page Container */}
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8">

        {/* Back Button */}
        <button
          onClick={() => navigate("/sports/afl")}
          className="mt-6 mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to AFL
        </button>

        {/* Page Heading */}
        <header className="mb-10 space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            AFL Team Dashboard
          </h1>

          <p className="text-zinc-400 max-w-2xl text-[0.95rem]">
            Explore league-wide team performance, tactical identities,
            matchup dynamics and full-season advanced statistics.
          </p>
        </header>

        {/* --- SECTION 1: Round Momentum Snapshot --- */}
        <div className="mt-14">
          <TeamRoundSummary />
        </div>

        {/* --- SECTION 2: Team Form & Stability Grid --- */}
        <div className="mt-14">
          <TeamFormStabilityGrid />
        </div>

        {/* --- SECTION 3: Team Style & Matchup Profiles --- */}
        <div className="mt-14">
          <TeamProfileGrid />
        </div>

        {/* --- SECTION 4: AI Team Insights --- */}
        <div className="mt-14">
          <TeamAIInsights />
        </div>

        {/* --- SECTION 5: Team Master Ledger Table --- */}
        <div className="mt-14 mb-20">
          <TeamMasterTable />
        </div>
      </div>
    </div>
  );
};

export default AFLTeams;