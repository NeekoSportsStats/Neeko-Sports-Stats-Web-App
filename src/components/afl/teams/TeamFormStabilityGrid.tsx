// src/components/afl/teams/TeamFormStabilityGrid.tsx
import React from "react";
import { Flame, Activity, Snowflake } from "lucide-react";

const mockSparkline = (
  <div className="mt-2 h-8 w-full rounded-md bg-gradient-to-r from-white/10 to-white/5 opacity-60" />
);

const TeamFormStabilityGrid: React.FC = () => {
  return (
    <section
      className="
        rounded-[32px] border border-neutral-800/80
        bg-gradient-to-b from-neutral-950 via-[#0a0a0f] to-black
        px-5 py-8 sm:px-7 lg:px-10 
        shadow-[0_40px_120px_rgba(0,0,0,0.7)]
      "
    >
      {/* HEADER */}
      <header className="mb-6 md:mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-300/80">
            Team Form & Stability Grid
          </div>

          <h2 className="mt-1 text-xl font-semibold text-white md:text-2xl">
            Hot, stable and cooling clubs over the last 5 rounds
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-neutral-300/90 leading-relaxed">
            A macro view of league-wide team performance. See which clubs are
            surging (Hot), which offer predictable output (Stable), and which
            carry elevated risk (Cooling) across fantasy scoring, clearances,
            pressure metrics and defensive resistance.
          </p>
        </div>

        <p className="max-w-sm text-[12px] text-neutral-400 leading-relaxed">
          This section evolves into a full trend engine comparing pace-of-play,
          ball movement, pressure rating and opponent-adjusted form across the
          competition.
        </p>
      </header>

      {/* GRID: 3 COLUMNS */}
      <div className="grid gap-6 md:grid-cols-3">

        {/* ----------------------------- */}
        {/* HOT TEAMS */}
        {/* ----------------------------- */}
        <div
          className="
            rounded-2xl border border-red-500/30
            bg-gradient-to-br from-red-500/15 via-black to-black
            p-5 shadow-[0_0_40px_rgba(255,60,60,0.12)]
          "
        >
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-red-300" />
            <h3 className="text-sm font-semibold text-red-200">Hot Teams</h3>
          </div>

          <p className="mt-2 text-xs text-neutral-300/90 leading-relaxed">
            Teams outperforming seasonal baselines across scoring, inside-50s,
            pressure and clearance chains.
          </p>

          {/* SPARKLINE */}
          {mockSparkline}

          <ul className="mt-4 space-y-2 text-xs text-neutral-300/90">
            <li className="flex justify-between">
              <span>Brisbane Lions</span>
              <span className="text-red-300 font-medium">+14.8%</span>
            </li>
            <li className="flex justify-between">
              <span>GWS Giants</span>
              <span className="text-red-300 font-medium">+11.2%</span>
            </li>
            <li className="flex justify-between">
              <span>Carlton</span>
              <span className="text-red-300 font-medium">+9.5%</span>
            </li>
          </ul>
        </div>

        {/* ----------------------------- */}
        {/* STABLE TEAMS */}
        {/* ----------------------------- */}
        <div
          className="
            rounded-2xl border border-emerald-500/30
            bg-gradient-to-br from-emerald-500/15 via-black to-black
            p-5 shadow-[0_0_40px_rgba(80,200,140,0.15)]
          "
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-300" />
            <h3 className="text-sm font-semibold text-emerald-200">
              Stable Teams
            </h3>
          </div>

          <p className="mt-2 text-xs text-neutral-300/90 leading-relaxed">
            Low-volatility teams producing predictable scoring bands and
            consistent role identity.
          </p>

          {/* SPARKLINE */}
          {mockSparkline}

          <ul className="mt-4 space-y-2 text-xs text-neutral-300/90">
            <li className="flex justify-between">
              <span>Sydney Swans</span>
              <span className="text-emerald-300 font-medium">3.4% spread</span>
            </li>
            <li className="flex justify-between">
              <span>Melbourne</span>
              <span className="text-emerald-300 font-medium">4.1% spread</span>
            </li>
            <li className="flex justify-between">
              <span>Collingwood</span>
              <span className="text-emerald-300 font-medium">4.7% spread</span>
            </li>
          </ul>
        </div>

        {/* ----------------------------- */}
        {/* COOLING TEAMS */}
        {/* ----------------------------- */}
        <div
          className="
            rounded-2xl border border-sky-500/30
            bg-gradient-to-br from-sky-500/15 via-black to-black
            p-5 shadow-[0_0_40px_rgba(100,170,255,0.15)]
          "
        >
          <div className="flex items-center gap-2">
            <Snowflake className="h-4 w-4 text-sky-300" />
            <h3 className="text-sm font-semibold text-sky-200">Cooling Teams</h3>
          </div>

          <p className="mt-2 text-xs text-neutral-300/90 leading-relaxed">
            Teams showing contraction in scoring, defensive resistance or
            pressure metrics — elevated short-term risk.
          </p>

          {/* SPARKLINE */}
          {mockSparkline}

          <ul className="mt-4 space-y-2 text-xs text-neutral-300/90">
            <li className="flex justify-between">
              <span>Richmond</span>
              <span className="text-sky-300 font-medium">-8.4%</span>
            </li>
            <li className="flex justify-between">
              <span>Hawthorn</span>
              <span className="text-sky-300 font-medium">-6.1%</span>
            </li>
            <li className="flex justify-between">
              <span>West Coast</span>
              <span className="text-sky-300 font-medium">-5.7%</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default TeamFormStabilityGrid;
