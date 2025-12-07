// src/components/afl/teams/TeamRoundSummary.tsx
import React from "react";
import { Activity, BarChart3, Shield, TrendingUp } from "lucide-react";

const highlightCards = [
  {
    label: "Highest scoring team",
    team: "Brisbane Lions",
    metric: "+12.3 vs last round",
    icon: BarChart3,
  },
  {
    label: "Strongest defence",
    team: "Sydney Swans",
    metric: "Lowest points conceded",
    icon: Shield,
  },
  {
    label: "Play-style surge",
    team: "Western Bulldogs",
    metric: "+9.1% possession tempo",
    icon: Activity,
  },
  {
    label: "Biggest round-to-round rise",
    team: "GWS Giants",
    metric: "+18.5 form index",
    icon: TrendingUp,
  },
];

const bandCards = [
  {
    tone: "Hot Teams",
    description:
      "Surging clubs outperforming expectations and season averages across the last 3–5 rounds.",
    bulletTeams: ["Brisbane Lions", "GWS Giants", "Carlton"],
    accentClass: "from-red-500/40 via-red-500/15 to-transparent",
    borderClass: "border-red-500/50",
  },
  {
    tone: "Stable Anchors",
    description:
      "Low-volatility clubs providing predictable scoring bands and consistent structural roles.",
    bulletTeams: ["Sydney Swans", "Collingwood", "Melbourne"],
    accentClass: "from-emerald-500/40 via-emerald-500/15 to-transparent",
    borderClass: "border-emerald-500/50",
  },
  {
    tone: "Cooling Teams",
    description:
      "Teams showing a contraction in scoring, pressure metrics or consistency — elevated short-term risk.",
    bulletTeams: ["Richmond", "Hawthorn", "West Coast"],
    accentClass: "from-cyan-500/40 via-cyan-500/15 to-transparent",
    borderClass: "border-cyan-500/50",
  },
];

const TeamRoundSummary: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-yellow-500/35 bg-gradient-to-br from-yellow-500/10 via-black/70 to-black shadow-[0_0_40px_rgba(234,179,8,0.18)]">
      <div className="pointer-events-none absolute inset-x-32 top-0 h-40 rounded-full bg-yellow-500/10 blur-3xl" />

      <div className="relative space-y-8 px-5 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
        {/* Label + heading */}
        <div className="space-y-3 md:space-y-4">
          <div className="inline-flex items-center rounded-full border border-yellow-500/60 bg-black/60 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-yellow-300 shadow-[0_0_18px_rgba(234,179,8,0.45)]">
            <span className="mr-1.5 text-xs">↗</span>
            Round Momentum — Teams
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3 md:max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Round momentum snapshot across the league
              </h2>
              <p className="text-sm text-zinc-300 md:text-[0.95rem]">
                Identify which clubs are surging, stabilising or dropping away.
                Powered by scoring trends, defensive indicators, usage rates and
                form pulses from the most recent 3–5 rounds.
              </p>
            </div>
            <p className="max-w-sm text-xs text-zinc-400 md:text-[0.8rem]">
              Updated every round. This section will evolve into a live trend
              engine surfacing fixture momentum, matchup watch-list alerts and
              team role diagnostics.
            </p>
          </div>
        </div>

        {/* Highlight row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {highlightCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="relative overflow-hidden rounded-2xl border border-yellow-500/15 bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-black/90 px-4 py-4 text-sm shadow-[0_0_24px_rgba(0,0,0,0.9)]"
              >
                <div className="absolute inset-x-8 top-0 h-16 bg-yellow-500/5 blur-xl" />
                <div className="relative flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-medium uppercase tracking-[0.16em]">
                      {card.label}
                    </span>
                    <Icon className="h-4 w-4 text-yellow-400/80" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[0.98rem] font-semibold text-yellow-100">
                      {card.team}
                    </p>
                    <p className="text-[0.8rem] text-zinc-400">{card.metric}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bands row */}
        <div className="grid gap-4 md:grid-cols-3">
          {bandCards.map((card) => (
            <div
              key={card.tone}
              className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${card.borderClass} from-black/90 via-zinc-950 to-black`}
            >
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${card.accentClass} opacity-70 blur-2xl`}
              />
              <div className="relative space-y-4 px-4 py-5 text-sm md:px-5 md:py-6">
                <p className="text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-zinc-300/80">
                  {card.tone}
                </p>
                <p className="text-[0.85rem] leading-relaxed text-zinc-300">
                  {card.description}
                </p>
                <div className="space-y-1.5 text-[0.82rem] text-zinc-300">
                  {card.bulletTeams.map((team) => (
                    <div key={team} className="flex items-center justify-between">
                      <span className="flex-1 truncate">{team}</span>
                      <span className="ml-2 h-px flex-1 bg-gradient-to-r from-zinc-700/60 via-zinc-800/0 to-transparent" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamRoundSummary;