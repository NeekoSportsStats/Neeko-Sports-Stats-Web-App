// src/components/afl/teams/TeamAIInsights.tsx
import React from "react";
import { Brain, LineChart, Radar } from "lucide-react";

const CARDS = [
  {
    title: "Offensive Profile",
    Icon: Brain,
    body: (
      <>
        Many high-output teams this round are benefiting from faster
        ball-movement chains and improved inside-50 depth. Clubs like{" "}
        <span className="font-semibold text-yellow-300">Brisbane</span> and{" "}
        <span className="font-semibold text-yellow-300">GWS</span> continue to
        leverage corridor usage, generating elevated fantasy scoring for
        midfielders and half-forwards.
      </>
    ),
  },
  {
    title: "Defensive Tendencies",
    Icon: ShieldedIcon,
    body: (
      <>
        Defensive profiles show tightening structures in{" "}
        <span className="font-semibold text-emerald-300">Sydney</span> and{" "}
        <span className="font-semibold text-emerald-300">Melbourne</span>, with
        fewer high-value fantasy scores conceded. Matchups against these clubs
        are increasingly ceiling-limited, especially for opposition MIDs.
      </>
    ),
  },
  {
    title: "Trend Watch",
    Icon: LineChart,
    body: (
      <>
        Cooling indicators are emerging for{" "}
        <span className="font-semibold text-amber-300">Hawthorn</span> and{" "}
        <span className="font-semibold text-amber-300">Richmond</span>, driven
        by declining clearance rates and reduced forward-half time. Fantasy
        matchups against them remain favourable for MID/DEF roles.
      </>
    ),
  },
];

function ShieldedIcon(props: React.SVGProps<SVGSVGElement>) {
  return <Radar {...props} />;
}

const TeamAIInsights: React.FC = () => {
  return (
    <section className="mt-10 rounded-3xl border border-yellow-500/25 bg-gradient-to-b from-zinc-900/70 via-black to-black/95 px-5 py-7 shadow-[0_0_32px_rgba(0,0,0,0.9)] md:mt-14 md:px-8 md:py-9 lg:px-10 lg:py-10">
      <div className="mb-7 flex flex-col gap-4 md:mb-8 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3 md:max-w-2xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-yellow-400">
            AI Team Insights
          </p>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Narrative analysis across offensive, defensive & matchup trends
          </h2>
          <p className="text-sm text-zinc-300 md:text-[0.95rem]">
            Generated summaries highlight tactical strengths, structural shifts,
            matchup-based vulnerabilities and fantasy-relevant storylines.
            Perfect for round previews and DFS strategy.
          </p>
        </div>
        <p className="max-w-sm text-xs text-zinc-400 md:text-[0.8rem]">
          Once your AI pipeline is connected, each card becomes a live
          round-specific intelligence module, pulling directly from your
          database and tagging key shifts in team behaviour.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {CARDS.map(({ title, Icon, body }) => (
          <article
            key={title}
            className="relative overflow-hidden rounded-2xl border border-zinc-700/60 bg-gradient-to-br from-zinc-900/80 via-zinc-950 to-black px-4 py-5 text-sm shadow-[0_0_24px_rgba(0,0,0,0.9)] md:px-5 md:py-6"
          >
            <div className="absolute inset-x-10 top-0 h-20 bg-yellow-500/5 blur-2xl" />
            <div className="relative space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-zinc-200">
                <Icon className="h-3.5 w-3.5 text-yellow-300" />
                {title}
              </div>
              <p className="leading-relaxed text-zinc-200 text-[0.85rem]">
                {body}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default TeamAIInsights;