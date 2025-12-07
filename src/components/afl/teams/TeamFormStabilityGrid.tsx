// src/components/afl/teams/TeamFormStabilityGrid.tsx
import React from "react";

const TeamFormStabilityGrid: React.FC = () => {
  return (
    <section className="rounded-[32px] border border-neutral-800/80 bg-gradient-to-b from-neutral-900 via-black to-black px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-300/80">
            Team Form &amp; Stability Grid
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white md:text-2xl">
            Hot, stable and volatile clubs over last 5 rounds
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-neutral-300/90">
            At-a-glance read on which teams are{" "}
            <span className="text-yellow-200">running hot</span>, which are
            rock-solid, and which carry high volatility across fantasy scoring,
            inside-50s, clearances and defensive metrics.
          </p>
        </div>

        <p className="max-w-sm text-[12px] text-neutral-400">
          Future state: three-column grid of{" "}
          <span className="text-yellow-200">Hot Teams, Stable Teams, Cooling / 
          Risk Teams</span> with simple trend indicators.
        </p>
      </header>

      {/* Placeholder body until we wire real data */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-red-500/25 bg-gradient-to-br from-red-500/15 via-black to-black p-4">
          <h3 className="text-sm font-semibold text-red-200">Hot Teams</h3>
          <p className="mt-2 text-xs text-neutral-300/90">
            Teams significantly outperforming season-to-date baselines across
            the last 3–5 rounds.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 via-black to-black p-4">
          <h3 className="text-sm font-semibold text-emerald-200">
            Stable Anchors
          </h3>
          <p className="mt-2 text-xs text-neutral-300/90">
            Clubs with tight scoring bands and consistent role usage — ideal for
            reliable fantasy stacks.
          </p>
        </div>
        <div className="rounded-2xl border border-sky-500/25 bg-gradient-to-br from-sky-500/15 via-black to-black p-4">
          <h3 className="text-sm font-semibold text-sky-200">
            Cooling / Risk Teams
          </h3>
          <p className="mt-2 text-xs text-neutral-300/90">
            Squads whose output is softening versus baseline or showing wide,
            risky volatility.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TeamFormStabilityGrid;
