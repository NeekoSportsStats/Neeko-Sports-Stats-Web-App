// src/components/afl/teams/TeamAIInsights.tsx
import React from "react";
import { Sparkles, Brain, TrendingUp, Shield } from "lucide-react";

const InsightCard = ({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}) => (
  <div
    className="
      rounded-2xl border border-white/10 
      bg-white/5 backdrop-blur-sm px-5 py-6 
      shadow-[0_0_40px_rgba(0,0,0,0.35)]
    "
  >
    <div className="flex items-center gap-2">
      <div
        className={`
          flex h-7 w-7 items-center justify-center rounded-full 
          border ${color}
        `}
      >
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
    </div>

    <p className="mt-3 text-sm leading-relaxed text-white/75">{children}</p>
  </div>
);

const TeamAIInsights: React.FC = () => {
  return (
    <section
      className="
        rounded-[32px] border border-yellow-500/25
        bg-gradient-to-b from-yellow-500/14 via-[#0a0a0f] to-black
        px-5 py-8 sm:px-7 lg:px-10 
        shadow-[0_40px_140px_rgba(0,0,0,0.75)]
      "
    >
      {/* LABEL */}
      <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-black/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
        <Sparkles className="h-3.5 w-3.5" />
        <span>AI Team Insights</span>
      </div>

      {/* HEADING */}
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white md:text-2xl">
            Narrative analysis across offensive, defensive and matchup trends
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-neutral-300/90 leading-relaxed">
            Generated summaries highlight tactical strengths, structural shifts,
            matchup-based vulnerabilities and fantasy-relevant storylines.
            Perfect for round previews and DFS strategy.
          </p>
        </div>

        <p className="max-w-sm text-[12px] text-neutral-400 leading-relaxed">
          Once your AI pipeline is connected, each card becomes a live
          round-specific intelligence module.
        </p>
      </div>

      {/* INSIGHT GRID */}
      <div className="mt-8 grid gap-5 md:grid-cols-3">

        {/* OFFENCE INSIGHT */}
        <InsightCard
          title="Offensive Profile"
          icon={<Brain className="h-4 w-4 text-yellow-300" />}
          color="border-yellow-400/40"
        >
          Many high-output teams this round are benefiting from faster
          ball-movement chains and improved inside-50 depth. Clubs like
          <span className="text-yellow-200"> Brisbane</span> and
          <span className="text-yellow-200"> GWS</span> continue to leverage
          corridor usage, generating elevated fantasy scoring for midfielders
          and half-forwards.
        </InsightCard>

        {/* DEFENCE INSIGHT */}
        <InsightCard
          title="Defensive Tendencies"
          icon={<Shield className="h-4 w-4 text-blue-300" />}
          color="border-blue-400/40"
        >
          Defensive profiles show tightening structures in
          <span className="text-blue-200"> Sydney</span> and
          <span className="text-blue-200"> Melbourne</span>, with fewer
          high-value fantasy scores conceded. Matchups against these clubs are
          becoming increasingly ceiling-limited.
        </InsightCard>

        {/* TREND WATCH */}
        <InsightCard
          title="Trend Watch"
          icon={<TrendingUp className="h-4 w-4 text-emerald-300" />}
          color="border-emerald-400/40"
        >
          Cooling indicators are emerging for
          <span className="text-emerald-200"> Hawthorn</span> and
          <span className="text-emerald-200"> Richmond</span>, driven by
          declining clearance rates and reduced forward-half time. Fantasy
          matchups against them remain favourable for MID/DEF roles.
        </InsightCard>

      </div>
    </section>
  );
};

export default TeamAIInsights;
