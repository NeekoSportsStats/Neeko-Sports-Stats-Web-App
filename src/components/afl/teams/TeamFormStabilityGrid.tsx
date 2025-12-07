// src/components/afl/teams/TeamFormStabilityGrid.tsx
import React from "react";
import { Flame, Snowflake, Activity } from "lucide-react";

type FormBand = {
  label: string;
  description: string;
  teams: { name: string; spread: string }[];
  accent: "hot" | "stable" | "cooling";
};

const FORM_BANDS: FormBand[] = [
  {
    label: "Hot Teams",
    description:
      "Clubs outperforming seasonal baselines across fantasy scoring, inside-50s, pressure chains and clearance dominance.",
    teams: [
      { name: "Brisbane Lions", spread: "+14.8%" },
      { name: "GWS Giants", spread: "+11.2%" },
      { name: "Carlton", spread: "+9.5%" },
    ],
    accent: "hot",
  },
  {
    label: "Stable Teams",
    description:
      "Low-volatility teams producing predictable scoring bands and locked-in role identity.",
    teams: [
      { name: "Sydney Swans", spread: "3.4% spread" },
      { name: "Melbourne", spread: "4.1% spread" },
      { name: "Collingwood", spread: "4.7% spread" },
    ],
    accent: "stable",
  },
  {
    label: "Cooling Teams",
    description:
      "Clubs showing contraction in scoring, defensive resistance or pressure ratings — elevated risk until form stabilises.",
    teams: [
      { name: "Richmond", spread: "-8.4%" },
      { name: "Hawthorn", spread: "-6.1%" },
      { name: "West Coast", spread: "-5.7%" },
    ],
    accent: "cooling",
  },
];

const accentClasses: Record<
  FormBand["accent"],
  { border: string; glow: string; pill: string }
> = {
  hot: {
    border: "border-red-500/50",
    glow: "from-red-500/40 via-red-500/10 to-transparent",
    pill: "bg-gradient-to-r from-red-500 to-orange-500",
  },
  stable: {
    border: "border-emerald-500/45",
    glow: "from-emerald-500/35 via-emerald-500/10 to-transparent",
    pill: "bg-gradient-to-r from-emerald-500 to-teal-500",
  },
  cooling: {
    border: "border-cyan-500/50",
    glow: "from-cyan-500/40 via-cyan-500/10 to-transparent",
    pill: "bg-gradient-to-r from-cyan-400 to-sky-500",
  },
};

const TeamFormStabilityGrid: React.FC = () => {
  return (
    <section className="mt-10 rounded-3xl border border-yellow-500/25 bg-gradient-to-b from-zinc-900/70 via-black to-black/95 px-5 py-7 shadow-[0_0_40px_rgba(0,0,0,0.9)] md:mt-14 md:px-8 md:py-9 lg:px-10 lg:py-10">
      {/* Header */}
      <div className="mb-7 flex flex-col gap-4 md:mb-8 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3 md:max-w-2xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-yellow-400">
            Team Form & Stability Grid
          </p>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Hot, stable and cooling clubs over the last 5 rounds
          </h2>
          <p className="text-sm text-zinc-300 md:text-[0.95rem]">
            A macro view of league-wide team performance. See which clubs are
            surging (Hot), which offer predictable output (Stable), and which
            carry elevated risk (Cooling) across fantasy scoring, pressure
            metrics and defensive resistance.
          </p>
        </div>
        <p className="max-w-sm text-xs text-zinc-400 md:text-[0.8rem]">
          This area evolves into a full trend engine comparing team-level pace
          of play, pressure ratings and opponent-adjusted form — perfect for
          stacking fixtures and avoiding trap matchups.
        </p>
      </div>

      {/* Bands */}
      <div className="grid gap-4 md:grid-cols-3">
        {FORM_BANDS.map((band) => {
          const accent = accentClasses[band.accent];
          const Icon =
            band.accent === "hot"
              ? Flame
              : band.accent === "stable"
              ? Activity
              : Snowflake;

          return (
            <div
              key={band.label}
              className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-black/95 via-zinc-950/95 to-black ${accent.border}`}
            >
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accent.glow} opacity-80 blur-2xl`}
              />
              <div className="relative space-y-4 px-4 py-5 text-sm md:px-5 md:py-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900/90 px-3 py-1 text-[0.75rem] font-medium text-zinc-100 shadow-[0_0_18px_rgba(0,0,0,0.8)]">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.7rem] text-black ${accent.pill}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span>{band.label}</span>
                  </div>
                </div>
                <p className="text-[0.85rem] leading-relaxed text-zinc-300">
                  {band.description}
                </p>

                <div className="space-y-2 pt-1 text-[0.82rem]">
                  {band.teams.map((team) => (
                    <div
                      key={team.name}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="truncate text-zinc-200">
                        {team.name}
                      </span>
                      <span className="ml-auto text-xs font-semibold text-zinc-300">
                        {team.spread}
                      </span>
                    </div>
                  ))}
                </div>

                {/* subtle loading bar */}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
                  <div className="h-full w-2/3 bg-gradient-to-r from-yellow-400 via-yellow-300 to-transparent opacity-80" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TeamFormStabilityGrid;