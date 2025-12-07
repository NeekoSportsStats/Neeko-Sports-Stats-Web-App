// src/components/afl/teams/TeamRoundSummary.tsx
import React from "react";
import { Activity, TrendingUp, Shield, Zap, BarChart3 } from "lucide-react";

const TeamRoundSummary: React.FC = () => {
  return (
    <section
      className="
      rounded-[32px] border border-yellow-500/25 
      bg-gradient-to-br from-yellow-500/10 via-[#0b0b0f] to-black 
      px-5 py-7 sm:px-7 sm:py-8 lg:px-10 lg:py-10 
      shadow-[0_40px_140px_rgba(0,0,0,0.75)]
    "
    >
      {/* TOP LABEL */}
      <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90 shadow-[0_0_18px_rgba(255,215,0,0.2)]">
        <Activity className="h-3.5 w-3.5" />
        <span>Round Momentum — Teams</span>
      </div>

      {/* HEADING + SUBTEXT */}
      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white md:text-2xl">
            Round momentum snapshot across the league
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-neutral-200/80 leading-relaxed">
            Identify which clubs are surging, stabilising or dropping away.
            Powered by scoring trends, role usage indicators, matchup strength
            and form pulses from the last 3–5 rounds.
          </p>
        </div>

        {/* Side blurb */}
        <p className="max-w-sm text-[12px] text-neutral-400 leading-relaxed">
          Updated every round. Soon this area will surface{" "}
          <span className="font-semibold text-yellow-200">fixture momentum</span>
          , matchup watch-list alerts, and team role diagnostics.
        </p>
      </div>

      {/* 4 KEY HEADLINES */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
          <div className="text-[11px] uppercase tracking-wide text-white/40">
            Highest Scoring Team
          </div>
          <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-yellow-300">
            <TrendingUp className="h-4 w-4" />
            Brisbane Lions
          </div>
          <p className="mt-1 text-xs text-white/50">+12.3 vs last round</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
          <div className="text-[11px] uppercase tracking-wide text-white/40">
            Strongest Defence
          </div>
          <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-emerald-300">
            <Shield className="h-4 w-4" />
            Sydney Swans
          </div>
          <p className="mt-1 text-xs text-white/50">Lowest points conceded</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
          <div className="text-[11px] uppercase tracking-wide text-white/40">
            Pace-of-play Surge
          </div>
          <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-sky-300">
            <Zap className="h-4 w-4" />
            Western Bulldogs
          </div>
          <p className="mt-1 text-xs text-white/50">+9.1% possession tempo</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
          <div className="text-[11px] uppercase tracking-wide text-white/40">
            Biggest Round-to-Round Rise
          </div>
          <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-orange-300">
            <BarChart3 className="h-4 w-4" />
            GWS Giants
          </div>
          <p className="mt-1 text-xs text-white/50">+18.5 form index</p>
        </div>
      </div>

      {/* 3-COLUMN MOMENTUM GRID */}
      <div className="mt-10 grid gap-4 md:grid-cols-3">

        {/* HOT TEAMS */}
        <div className="rounded-2xl border border-red-500/25 bg-gradient-to-br from-red-500/15 via-black to-black p-5">
          <h3 className="text-sm font-semibold text-red-200">Hot Teams</h3>
          <p className="mt-2 text-xs text-neutral-300/90 leading-relaxed">
            Surging clubs outperforming expectations and season averages across
            the last 3–5 rounds.
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-neutral-300/90">
            <li>• Brisbane Lions</li>
            <li>• GWS Giants</li>
            <li>• Carlton</li>
          </ul>
        </div>

        {/* STABLE TEAMS */}
        <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 via-black to-black p-5">
          <h3 className="text-sm font-semibold text-emerald-200">
            Stable Anchors
          </h3>
          <p className="mt-2 text-xs text-neutral-300/90 leading-relaxed">
            Clubs with tight scoring bands and consistent structural roles.
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-neutral-300/90">
            <li>• Sydney Swans</li>
            <li>• Collingwood</li>
            <li>• Melbourne</li>
          </ul>
        </div>

        {/* COOLING TEAMS */}
        <div className="rounded-2xl border border-sky-500/25 bg-gradient-to-br from-sky-500/15 via-black to-black p-5">
          <h3 className="text-sm font-semibold text-sky-200">Cooling Teams</h3>
          <p className="mt-2 text-xs text-neutral-300/90 leading-relaxed">
            Teams showing a drop-off in scoring, pressure metrics or consistency.
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-neutral-300/90">
            <li>• Richmond</li>
            <li>• Hawthorn</li>
            <li>• West Coast</li>
          </ul>
        </div>

      </div>
    </section>
  );
};

export default TeamRoundSummary;
