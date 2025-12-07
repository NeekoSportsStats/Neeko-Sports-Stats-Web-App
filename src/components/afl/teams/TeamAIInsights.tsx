// src/components/afl/teams/TeamAIInsights.tsx
import React from "react";
import { Sparkles } from "lucide-react";

const TeamAIInsights: React.FC = () => {
  return (
    <section className="rounded-[32px] border border-yellow-500/25 bg-gradient-to-b from-yellow-500/14 via-black to-black px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Team Insights</span>
          </div>
          <h2 className="mt-3 text-xl font-semibold text-white md:text-2xl">
            Narrative-style read on each club
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-neutral-300/90">
            This block will generate AI summaries for every team — usage shifts,
            role tweaks, matchup-driven spikes and structural changes that
            matter for fantasy and betting.
          </p>
        </div>

        <p className="max-w-sm text-[12px] text-neutral-400">
          For now this section is a styled placeholder so your layout matches
          the player dashboard 1:1. We can wire the real AI pipeline into this
          container next.
        </p>
      </header>
    </section>
  );
};

export default TeamAIInsights;
