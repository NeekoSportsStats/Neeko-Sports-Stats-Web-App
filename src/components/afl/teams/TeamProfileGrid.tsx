// src/components/afl/teams/TeamProfileGrid.tsx
import React from "react";
import { ShieldHalf, Target, Binary } from "lucide-react";

const meterBase =
  "h-1.5 w-full overflow-hidden rounded-full bg-zinc-900/80 shadow-inner";

const TeamProfileGrid: React.FC = () => {
  return (
    <section className="mt-10 rounded-3xl border border-yellow-500/25 bg-gradient-to-b from-zinc-900/70 via-black to-black/95 px-5 py-7 shadow-[0_0_36px_rgba(0,0,0,0.9)] md:mt-14 md:px-8 md:py-9 lg:px-10 lg:py-10">
      {/* Header */}
      <div className="mb-7 flex flex-col gap-4 md:mb-8 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3 md:max-w-2xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-yellow-400">
            Style & Matchup Profiles
          </p>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Offensive, defensive & fantasy-relevant styles across all clubs
          </h2>
          <p className="text-sm text-zinc-300 md:text-[0.95rem]">
            A fast visual read on how each team plays — attacking intent,
            defensive restrictiveness, and matchup suitability by fantasy role.
            These profiles help pinpoint fixture edges and avoid defensive traps.
          </p>
        </div>
        <p className="max-w-sm text-xs text-zinc-400 md:text-[0.8rem]">
          This evolves into a full matrix showing attack vs defence heatmaps by
          team and fantasy role type (MID/FWD/DEF/RUC).
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Attack Profile */}
        <div className="relative overflow-hidden rounded-2xl border border-red-500/45 bg-gradient-to-br from-red-500/20 via-zinc-950 to-black">
          <div className="pointer-events-none absolute inset-x-10 top-0 h-24 bg-red-500/30 blur-2xl" />
          <div className="relative space-y-4 px-4 py-5 text-sm md:px-5 md:py-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-red-100">
              <Target className="h-3.5 w-3.5 text-red-300" />
              Attack Profile
            </div>
            <p className="text-[0.85rem] leading-relaxed text-zinc-100">
              Offensive style indicators: points-for, inside-50 chain quality,
              ball movement and fantasy-boosting tendencies.
            </p>

            <div className="space-y-3 text-[0.8rem]">
              <div>
                <div className="mb-1 flex items-center justify-between text-zinc-300">
                  <span>Inside-50 Efficiency</span>
                  <span className="font-semibold text-yellow-300">72%</span>
                </div>
                <div className={meterBase}>
                  <div className="h-full w-[72%] bg-gradient-to-r from-yellow-400 via-amber-300 to-transparent" />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-zinc-300">
                  <span>Pace of Play</span>
                  <span className="font-semibold text-yellow-300">65%</span>
                </div>
                <div className={meterBase}>
                  <div className="h-full w-[65%] bg-gradient-to-r from-yellow-400 via-amber-300 to-transparent" />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-zinc-300">
                  <span>Fantasy Boost Score</span>
                  <span className="font-semibold text-yellow-300">58%</span>
                </div>
                <div className={meterBase}>
                  <div className="h-full w-[58%] bg-gradient-to-r from-yellow-400 via-amber-300 to-transparent" />
                </div>
              </div>
            </div>

            <ul className="mt-3 space-y-1 text-[0.78rem] text-zinc-200">
              <li>• Best suited against slow-play teams</li>
              <li>• MID & FWD fantasy ceiling access</li>
              <li>• Vulnerable to rebound-heavy defences</li>
            </ul>
          </div>
        </div>

        {/* Defence Profile */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/45 bg-gradient-to-br from-emerald-500/15 via-zinc-950 to-black">
          <div className="pointer-events-none absolute inset-x-10 top-0 h-24 bg-emerald-500/30 blur-2xl" />
          <div className="relative space-y-4 px-4 py-5 text-sm md:px-5 md:py-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-emerald-100">
              <ShieldHalf className="h-3.5 w-3.5 text-emerald-300" />
              Defence Profile
            </div>
            <p className="text-[0.85rem] leading-relaxed text-zinc-100">
              Restrictiveness metrics: pressure, defensive chains, fantasy
              ceiling allowed and positional shutdown tendencies.
            </p>

            <div className="space-y-3 text-[0.8rem]">
              <div>
                <div className="mb-1 flex items-center justify-between text-zinc-300">
                  <span>Pressure Rating</span>
                  <span className="font-semibold text-emerald-300">78%</span>
                </div>
                <div className={meterBase}>
                  <div className="h-full w-[78%] bg-gradient-to-r from-emerald-400 via-emerald-300 to-transparent" />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-zinc-300">
                  <span>Defensive Efficiency</span>
                  <span className="font-semibold text-emerald-300">69%</span>
                </div>
                <div className={meterBase}>
                  <div className="h-full w-[69%] bg-gradient-to-r from-emerald-400 via-emerald-300 to-transparent" />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-zinc-300">
                  <span>Fantasy Restriction</span>
                  <span className="font-semibold text-emerald-300">81%</span>
                </div>
                <div className={meterBase}>
                  <div className="h-full w-[81%] bg-gradient-to-r from-emerald-400 via-emerald-300 to-transparent" />
                </div>
              </div>
            </div>

            <ul className="mt-3 space-y-1 text-[0.78rem] text-zinc-200">
              <li>• Strong vs opposition MIDs</li>
              <li>• Restricts marching DEFs heavily</li>
              <li>• Vulnerable to tall forwards on turnover</li>
            </ul>
          </div>
        </div>

        {/* Matchup Lens */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-400/55 bg-gradient-to-br from-cyan-400/18 via-zinc-950 to-black">
          <div className="pointer-events-none absolute inset-x-10 top-0 h-24 bg-cyan-400/35 blur-2xl" />
          <div className="relative space-y-4 px-4 py-5 text-sm md:px-5 md:py-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-cyan-100">
              <Binary className="h-3.5 w-3.5 text-cyan-300" />
              Matchup Lens
            </div>
            <p className="text-[0.85rem] leading-relaxed text-zinc-100">
              Quick-view matchup suitability by fantasy role. Great for
              cross-checking fixture difficulty for MID, FWD, DEF and RUC lines.
            </p>

            <div className="flex flex-wrap gap-2 pt-1 text-[0.75rem]">
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200">
                MID-friendly
              </span>
              <span className="rounded-full bg-red-500/20 px-3 py-1 text-red-200">
                FWD graveyard
              </span>
              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-blue-200">
                DEF boost
              </span>
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-amber-200">
                RUC hotspot
              </span>
            </div>

            <div className="mt-3 space-y-3 text-[0.8rem]">
              <div>
                <div className="mb-1 flex items-center justify-between text-zinc-300">
                  <span>MID Matchup Score</span>
                  <span className="font-semibold text-emerald-300">68%</span>
                </div>
                <div className={meterBase}>
                  <div className="h-full w-[68%] bg-gradient-to-r from-emerald-400 via-emerald-300 to-transparent" />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-zinc-300">
                  <span>FWD Matchup Score</span>
                  <span className="font-semibold text-amber-300">42%</span>
                </div>
                <div className={meterBase}>
                  <div className="h-full w-[42%] bg-gradient-to-r from-amber-400 via-amber-300 to-transparent" />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-zinc-300">
                  <span>DEF Matchup Score</span>
                  <span className="font-semibold text-cyan-300">74%</span>
                </div>
                <div className={meterBase}>
                  <div className="h-full w-[74%] bg-gradient-to-r from-cyan-400 via-cyan-300 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamProfileGrid;