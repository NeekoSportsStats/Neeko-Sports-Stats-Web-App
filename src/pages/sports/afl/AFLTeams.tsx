// src/pages/sports/afl/AFLTeams.tsx
import React from "react";
import TeamRoundSummary from "@/components/afl/teams/TeamRoundSummary";
import TeamFormStabilityGrid from "@/components/afl/teams/TeamFormStabilityGrid";
import TeamProfileGrid from "@/components/afl/teams/TeamProfileGrid";
import TeamAIInsights from "@/components/afl/teams/TeamAIInsights";
import TeamMasterTable from "@/components/afl/teams/TeamMasterTable";
import { useAuth } from "@/lib/auth";

const SECTIONS = [
  { id: "round-momentum-teams", label: "Round Momentum" },
  { id: "team-form-stability", label: "Form & Stability" },
  { id: "team-style-matchups", label: "Style & Matchup Profiles" },
  { id: "team-ai-insights", label: "AI Insights" },
  { id: "team-ledger-grid", label: "Team Ledger & Grid" },
];

const AFLTeams: React.FC = () => {
  const { isPremium } = useAuth();

  const handleNavClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const headerOffset = 96; // matches player dashboard
    const rect = el.getBoundingClientRect();
    const scrollTop = window.scrollY + rect.top - headerOffset;
    window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: scrollTop, behavior: "smooth" });
  };

  React.useEffect(() => {
    // scroll-to-hash on first load (matches Players page behaviour)
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;
    const headerOffset = 96;
    const rect = el.getBoundingClientRect();
    const scrollTop = window.scrollY + rect.top - headerOffset;
    window.scrollTo({ top: scrollTop });
  }, []);

  return (
    <div className="min-h-screen bg-[#050507] text-white">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-24 pt-10 md:gap-12 md:px-6 md:pt-16 lg:gap-16">
        {/* Page header */}
        <header className="space-y-4 md:space-y-6">
          <p className="text-xs font-semibold tracking-[0.28em] text-yellow-500/80">
            AFL • TEAMS
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            AFL Team Performance Dashboard
          </h1>
          <p className="max-w-3xl text-sm text-zinc-300 md:text-base">
            League-wide team analytics — scoring momentum, defensive strength,
            matchup difficulty, stability profiles, pace-of-play indicators,
            and predictive intelligence across all 18 AFL clubs.
          </p>
          <p className="max-w-3xl text-xs text-zinc-400 md:text-sm">
            Designed to mirror the player dashboard, but powered at the{" "}
            <span className="font-semibold text-yellow-400">team intelligence</span>{" "}
            level — helping you track club-wide form lines, structural trends and
            evolving matchup landscapes.
          </p>
        </header>

        {/* Section nav */}
        <nav className="sticky top-16 z-30 -mx-4 border-y border-yellow-500/5 bg-black/40 backdrop-blur-sm md:top-20 md:mx-0 md:rounded-full md:border">
          <div className="mx-auto flex max-w-6xl items-center overflow-x-auto px-4 py-3 md:px-6">
            <span className="mr-4 hidden text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-zinc-400 md:inline">
              Sections
            </span>
            <div className="flex gap-2">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleNavClick(section.id)}
                  className="rounded-full border border-zinc-700/60 bg-zinc-900/70 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-yellow-500/60 hover:text-yellow-300 data-[active=true]:border-yellow-500 data-[active=true]:bg-yellow-500/15 data-[active=true]:text-yellow-300"
                  data-active={
                    typeof window !== "undefined" &&
                    window.location.hash.replace("#", "") === section.id
                  }
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Sections */}
        <section id="round-momentum-teams">
          <TeamRoundSummary />
        </section>

        <section id="team-form-stability">
          <TeamFormStabilityGrid />
        </section>

        <section id="team-style-matchups">
          <TeamProfileGrid />
        </section>

        <section id="team-ai-insights">
          <TeamAIInsights />
        </section>

        <section id="team-ledger-grid">
          <TeamMasterTable isPremium={isPremium} />
        </section>
      </main>
    </div>
  );
};

export default AFLTeams;