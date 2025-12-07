// src/components/afl/teams/TeamAIInsights.tsx
import React from "react";
import { Sparkles, Brain, TrendingUp, Shield } from "lucide-react";

type InsightProps = {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
};

const InsightCard: React.FC<InsightProps> = ({
  title,
  icon,
  color,
  children,
}) => {
  return (
    <div
      className={`
        rounded-2xl border ${color}
        bg-gradient-to-br from-black/80 via-black/90 to-black
        px-5 py-6 shadow-[0_0_38px_rgba(0,0,0,0.7)]
        backdrop-blur-xl
      `}
    >
      <div className="flex items-center gap-3">
        <div
          className={`
            flex h-9 w-9 items-center justify-center rounded-full 
            bg-black/70 border ${color}
            shadow-[0_0_18px_rgba(234,179,8,0.25)]
          `}
        >
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>

      <p className="mt-3 text-[0.83rem] leading-relaxed text-zinc-300">
        {children}
      </p>
    </div>
  );
};

const TeamAIInsights: React.FC = () => {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-yellow-500/30 bg-gradient-to-b from-neutral-950 via-black to-black shadow-[0_0_40px_rgba(0,0,0,0.65)]">
      {/* Background Halos */}
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-yellow-500/15 blur-3xl" />
      <div className="pointer-events-none absolute right-10 bottom-10 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl" />

      <div className="relative px-5 py-10 md:px-8 md:py-12 lg:px-10">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3 md:max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-600/60 bg-black/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-yellow-300 shadow-[0_0_18px_rgba(234,179,8,0.45)]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Team Insights</span>
            </div>

            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Narrative-style AI intelligence across offence, defence & form shifts
            </h2>

            <p className="text-sm text-zinc-300 md:text-[0.95rem]">
              High-level summaries that highlight tactical strengths, structural shifts,
              scoring texture and fantasy-relevant patterns across the league.
            </p>
          </div>

          <p className="max-w-sm text-xs text-zinc-500 md:text-[0.78rem]">
            Each card updates dynamically once connected to your AI engine,
            generating club-specific insights based on rolling datasets,
            matchups and trend detection.
          </p>
        </div>

        {/* 3-card grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Offensive Insight */}
          <InsightCard
            title="Offensive Profile"
            icon={<Brain className="h-4 w-4 text-yellow-300" />}
            color="border-yellow-500/40"
          >
            Clubs such as <span className="text-yellow-200">Brisbane</span> and{" "}
            <span className="text-yellow-200">GWS</span> continue generating deep
            scoring chains through corridor use and fast break entries, lifting
            fantasy ceilings for attacking midfielders and half-forwards.
          </InsightCard>

          {/* Defensive Insight */}
          <InsightCard
            title="Defensive Tendencies"
            icon={<Shield className="h-4 w-4 text-blue-300" />}
            color="border-blue-400/40"
          >
            High-pressure clubs including{" "}
            <span className="text-blue-200">Sydney</span> and{" "}
            <span className="text-blue-200">Melbourne</span> are restricting
            opposition fantasy output through structured defensive layers and
            reduced inside-50 quality.
          </InsightCard>

          {/* Trend Insight */}
          <InsightCard
            title="Trend Watch"
            icon={<TrendingUp className="h-4 w-4 text-emerald-300" />}
            color="border-emerald-400/40"
          >
            Cooling indicators appear across{" "}
            <span className="text-emerald-200">Hawthorn</span> and{" "}
            <span className="text-emerald-200">Richmond</span>, driven by
            reductions in clearance chains and forward-half time. Matchups against
            them remain fantasy-positive.
          </InsightCard>
        </div>

        <p className="mt-10 text-xs text-zinc-500 md:text-[0.78rem]">
          These AI-driven insights surface macro-level patterns that are difficult
          to see game-to-game, presenting a strong complement to your numerical
          analysis tools and weekly form metrics.
        </p>
      </div>
    </section>
  );
};

export default TeamAIInsights;