// src/components/afl/teams/TeamRoundSummary.tsx
import React from "react";
import { Activity } from "lucide-react";

const TeamRoundSummary: React.FC = () => {
  return (
    <section className="rounded-[32px] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/12 via-black to-black px-4 py-6 shadow-[0_40px_140px_rgba(0,0,0,0.9)] sm:px-6 lg:px-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
        <Activity className="h-3.5 w-3.5" />
        <span>Round Momentum – Teams</span>
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white md:text-2xl">
            Round momentum snapshot by club
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-neutral-200/80">
            Round-level fantasy and scoring momentum at a{" "}
            <span className="font-semibold text-yellow-200">team level</span> —
            track which clubs are surging, flat or dropping away based on recent
            output, role usage and matchup quality.
          </p>
        </div>

        <p className="max-w-sm text-[12px] text-neutral-400">
          Coming next: heatmaps and tiles for{" "}
          <span className="text-yellow-200">top-6 teams, bottom-6 teams</span>,
          fixture difficulty pulses and matchup watch-list by club.
        </p>
      </div>
    </section>
  );
};

export default TeamRoundSummary;
