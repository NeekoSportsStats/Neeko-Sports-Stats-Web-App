// src/components/afl/teams/TeamProfileGrid.tsx
import React from "react";

const TeamProfileGrid: React.FC = () => {
  return (
    <section className="rounded-[32px] border border-neutral-800/80 bg-gradient-to-br from-[#050510] via-black to-black px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-300/80">
            Style &amp; Matchup Profiles
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white md:text-2xl">
            Offensive, defensive and fantasy-friendly styles
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-neutral-300/90">
            Classify each team by game style — possession vs surge, corridor vs
            boundary, fantasy-friendly vs restrictive — and surface their best
            and worst matchup types.
          </p>
        </div>

        <p className="max-w-sm text-[12px] text-neutral-400">
          Placeholder: simple tiles now, later upgraded to a{" "}
          <span className="text-yellow-200">matrix view</span> for attack /
          defence vs each stat type.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-yellow-500/30 bg-black/70 p-4">
          <h3 className="text-sm font-semibold text-yellow-200">Attack</h3>
          <p className="mt-2 text-xs text-neutral-300/90">
            Offensive profile: points for, inside-50s, fantasy scoring boost
            given to opposition.
          </p>
        </div>
        <div className="rounded-2xl border border-indigo-500/30 bg-black/70 p-4">
          <h3 className="text-sm font-semibold text-indigo-200">Defence</h3>
          <p className="mt-2 text-xs text-neutral-300/90">
            Restrictiveness vs key stats (MID/FWD/DEF/RUC) and fantasy ceiling
            allowed.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-black/70 p-4">
          <h3 className="text-sm font-semibold text-emerald-200">
            Matchup Lens
          </h3>
          <p className="mt-2 text-xs text-neutral-300/90">
            Quick labels like{" "}
            <span className="text-emerald-300">MID-friendly</span> or{" "}
            <span className="text-red-300">FWD graveyard</span> for each team.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TeamProfileGrid;
