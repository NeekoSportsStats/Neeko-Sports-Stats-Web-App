// src/components/afl/teams/TeamProfileGrid.tsx
import React from "react";
import { Sword, Shield, Sparkles } from "lucide-react";

const AttributeBar = ({ value }: { value: number }) => (
  <div className="mt-2 h-2 w-full rounded-md bg-white/10 overflow-hidden">
    <div
      className="h-full rounded-md bg-yellow-300/80 transition-all"
      style={{ width: `${value}%` }}
    />
  </div>
);

const TeamProfileGrid: React.FC = () => {
  return (
    <section
      className="
        rounded-[32px] border border-neutral-800/80
        bg-gradient-to-br from-[#08080c] via-black to-black
        px-5 py-8 sm:px-7 lg:px-10
        shadow-[0_40px_130px_rgba(0,0,0,0.7)]
      "
    >
      {/* HEADER */}
      <header className="mb-6 md:mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-300/80">
            Style & Matchup Profiles
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white md:text-2xl">
            Offensive, defensive & fantasy-relevant styles across all clubs
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-neutral-300/90 leading-relaxed">
            A fast visual read on how each team plays — attacking intent,
            defensive restrictiveness, and matchup suitability by fantasy role.
            These profiles help identify fantasy-friendly fixtures and avoid
            defensive traps.
          </p>
        </div>

        <p className="max-w-sm text-[12px] text-neutral-400 leading-relaxed">
          This expands into a full matrix showing attack vs defence matchup
          heatmaps by team and role type (MID/FWD/DEF/RUC).
        </p>
      </header>

      {/* GRID */}
      <div className="grid gap-6 md:grid-cols-3">

        {/* ------------------------------ */}
        {/* ATTACK PROFILE */}
        {/* ------------------------------ */}
        <div
          className="
            rounded-2xl border border-red-500/35 
            bg-gradient-to-br from-red-500/15 via-black to-black
            p-5 shadow-[0_0_32px_rgba(255,80,80,0.15)]
          "
        >
          <div className="flex items-center gap-2">
            <Sword className="h-4 w-4 text-red-300" />
            <h3 className="text-sm font-semibold text-red-200">Attack Profile</h3>
          </div>

          <p className="mt-2 text-xs text-neutral-300/90 leading-relaxed">
            Offensive style indicators: points-for, inside-50 chain quality,
            ball movement, and fantasy-boosting tendencies.
          </p>

          <div className="mt-4 space-y-5 text-xs text-neutral-300/90">

            <div>
              <div className="flex justify-between text-[11px] text-neutral-400">
                <span>Inside-50 Efficiency</span>
                <span className="text-red-300">72%</span>
              </div>
              <AttributeBar value={72} />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-neutral-400">
                <span>Pace of Play</span>
                <span className="text-red-300">65%</span>
              </div>
              <AttributeBar value={65} />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-neutral-400">
                <span>Fantasy Boost Score</span>
                <span className="text-red-300">58%</span>
              </div>
              <AttributeBar value={58} />
            </div>
          </div>

          <ul className="mt-5 space-y-1.5 text-xs text-neutral-300/90">
            <li>• Best suited against slow-play teams</li>
            <li>• MID & FWD fantasy ceiling access</li>
            <li>• Vulnerable to rebound-heavy defences</li>
          </ul>
        </div>

        {/* ------------------------------ */}
        {/* DEFENCE PROFILE */}
        {/* ------------------------------ */}
        <div
          className="
            rounded-2xl border border-indigo-500/35 
            bg-gradient-to-br from-indigo-500/15 via-black to-black
            p-5 shadow-[0_0_32px_rgba(80,80,255,0.15)]
          "
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-300" />
            <h3 className="text-sm font-semibold text-indigo-200">
              Defence Profile
            </h3>
          </div>

          <p className="mt-2 text-xs text-neutral-300/90 leading-relaxed">
            Restrictiveness metrics: pressure, defensive chains, fantasy ceiling
            allowed and positional shutdown tendencies.
          </p>

          <div className="mt-4 space-y-5 text-xs text-neutral-300/90">

            <div>
              <div className="flex justify-between text-[11px] text-neutral-400">
                <span>Pressure Rating</span>
                <span className="text-indigo-300">78%</span>
              </div>
              <AttributeBar value={78} />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-neutral-400">
                <span>Defensive Efficiency</span>
                <span className="text-indigo-300">69%</span>
              </div>
              <AttributeBar value={69} />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-neutral-400">
                <span>Fantasy Restriction</span>
                <span className="text-indigo-300">81%</span>
              </div>
              <AttributeBar value={81} />
            </div>
          </div>

          <ul className="mt-5 space-y-1.5 text-xs text-neutral-300/90">
            <li>• Strong vs opposition MIDs</li>
            <li>• Restricts marking DEFs heavily</li>
            <li>• Weakness in defending tall forwards</li>
          </ul>
        </div>

        {/* ------------------------------ */}
        {/* MATCHUP LENS */}
        {/* ------------------------------ */}
        <div
          className="
            rounded-2xl border border-emerald-500/35 
            bg-gradient-to-br from-emerald-500/15 via-black to-black
            p-5 shadow-[0_0_32px_rgba(80,255,160,0.15)]
          "
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-300" />
            <h3 className="text-sm font-semibold text-emerald-200">
              Matchup Lens
            </h3>
          </div>

          <p className="mt-2 text-xs text-neutral-300/90 leading-relaxed">
            Quick-view matchup suitability vs specific team styles and fantasy
            roles (MID/FWD/DEF/RUC).
          </p>

          {/* TAG CLOUD */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[11px] text-emerald-300">
              MID-friendly
            </span>
            <span className="rounded-full bg-red-500/20 border border-red-500/40 px-2.5 py-1 text-[11px] text-red-300">
              FWD graveyard
            </span>
            <span className="rounded-full bg-sky-500/20 border border-sky-500/40 px-2.5 py-1 text-[11px] text-sky-300">
              DEF Boost
            </span>
            <span className="rounded-full bg-yellow-500/20 border border-yellow-500/40 px-2.5 py-1 text-[11px] text-yellow-300">
              RUC hotspot
            </span>
          </div>

          {/* MATCHUP INDICATOR BARS */}
          <div className="mt-6 space-y-5 text-xs text-neutral-300/90">

            <div>
              <div className="flex justify-between text-[11px] text-neutral-400">
                <span>MID Matchup Score</span>
                <span className="text-emerald-300">68%</span>
              </div>
              <AttributeBar value={68} />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-neutral-400">
                <span>FWD Matchup Score</span>
                <span className="text-red-300">42%</span>
              </div>
              <AttributeBar value={42} />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-neutral-400">
                <span>DEF Matchup Score</span>
                <span className="text-sky-300">74%</span>
              </div>
              <AttributeBar value={74} />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default TeamProfileGrid;
