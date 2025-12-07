// src/components/afl/teams/TeamRoundSummary.tsx
import React from "react";
import {
  Activity,
  BarChart3,
  Shield,
  TrendingUp,
  GaugeCircle,
} from "lucide-react";

type HighlightCard = {
  label: string;
  title: string;
  metric: string;
  subcopy: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const HIGHLIGHTS: HighlightCard[] = [
  {
    label: "Highest scoring club (current round)",
    title: "Brisbane Lions",
    metric: "+18.4 vs league avg",
    subcopy: "Explosive fantasy output from midfield + half-forward chains.",
    Icon: BarChart3,
  },
  {
    label: "Strongest defensive wall",
    title: "Sydney Swans",
    metric: "Lowest scoring against",
    subcopy:
      "Defensive structure continues to squeeze opposition ceiling outcomes.",
    Icon: Shield,
  },
  {
    label: "Play-style tempo surge",
    title: "Western Bulldogs",
    metric: "+9.3% pace-of-play",
    subcopy:
      "Lift in possession speed + corridor usage generating extra scoring chains.",
    Icon: Activity,
  },
  {
    label: "Biggest round-to-round riser",
    title: "GWS Giants",
    metric: "+16.7 form index",
    subcopy:
      "Meaningful jump in combined scoring, pressure and territory metrics.",
    Icon: TrendingUp,
  },
];

const TeamRoundSummary: React.FC = () => {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-yellow-500/35 bg-gradient-to-br from-yellow-500/10 via-black/80 to-black shadow-[0_0_40px_rgba(234,179,8,0.22)]">
      {/* Soft glow halos */}
      <div className="pointer-events-none absolute inset-x-16 top-0 h-40 rounded-full bg-yellow-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-[-80px] h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />

      <div className="relative px-5 py-7 md:px-8 md:py-9 lg:px-10 lg:py-10">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3 md:max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/60 bg-black/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-yellow-300 shadow-[0_0_18px_rgba(234,179,8,0.45)]">
              <GaugeCircle className="h-3.5 w-3.5" />
              <span>Current Round Summary — Teams</span>
            </div>

            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Round momentum snapshot across all AFL clubs
            </h2>

            <p className="text-sm text-zinc-300 md:text-[0.95rem]">
              A fast read of which clubs are driving this round — high-scoring
              sides, defensive clamps, tempo shifts and sharp form spikes. All
              metrics reset each round so you can instantly see where the heat is.
            </p>
          </div>

          <div className="space-y-2 max-w-sm text-xs text-zinc-400 md:text-[0.8rem]">
            <p>
              This block is intentionally{" "}
              <span className="font-semibold text-yellow-300">
                round-only
              </span>{" "}
              — it does <span className="underline underline-offset-2">
                not
              </span>{" "}
              show long-term form. Hot / Stable / Cooling clubs live in the{" "}
              <span className="font-semibold text-yellow-200">
                Form &amp; Stability Grid
              </span>{" "}
              below.
            </p>
          </div>
        </div>

        {/* Highlight cards (desktop: 4 across, tablet: 2x2, mobile: stacked) */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {HIGHLIGHTS.map(({ label, title, metric, subcopy, Icon }) => (
            <article
              key={label}
              className="relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-zinc-900/95 via-zinc-950 to-black/95 px-4 py-4 text-sm shadow-[0_0_26px_rgba(0,0,0,0.9)] sm:px-4 sm:py-5"
            >
              {/* Card halo */}
              <div className="pointer-events-none absolute inset-x-4 top-0 h-16 bg-yellow-500/10 blur-2xl" />

              <div className="relative flex h-full flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                      {label}
                    </p>
                    <p className="text-[0.95rem] font-semibold text-yellow-50">
                      {title}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/80 ring-1 ring-yellow-500/40">
                    <Icon className="h-4 w-4 text-yellow-300" />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[0.8rem] font-semibold text-yellow-300">
                    {metric}
                  </p>
                  <p className="text-[0.78rem] leading-relaxed text-zinc-300">
                    {subcopy}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Under-section hint / helper text */}
        <div className="mt-5 border-t border-yellow-500/10 pt-4 text-[0.76rem] text-zinc-400 md:mt-6 md:pt-5">
          <p>
            Use this round snapshot to spot{" "}
            <span className="font-semibold text-yellow-200">
              one-week spikes
            </span>{" "}
            or short-term tactical shifts. For longer-term trajectories and
            volatility bands, scroll to{" "}
            <span className="font-semibold text-yellow-200">
              Team Form &amp; Stability
            </span>{" "}
            below.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TeamRoundSummary;