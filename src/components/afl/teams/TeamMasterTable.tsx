// src/components/afl/teams/TeamMasterTable.tsx
import React from "react";

const TeamMasterTable: React.FC = () => {
  return (
    <section className="rounded-[32px] border border-yellow-500/18 bg-gradient-to-b from-neutral-950 via-neutral-950/90 to-black px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-300/80">
            Full-season Team Ledger &amp; Hit-rate Grid
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white md:text-2xl">
            Season-long performance &amp; matchup grid by club
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-neutral-300/90">
            Eventually this mirrors the player Master Table: round-by-round
            scoring, aggregates and hit-rates by stat lens — but aggregated to
            the team level.
          </p>
        </div>

        <p className="max-w-sm text-[12px] text-neutral-400">
          Placeholder table shell can be dropped in here once we define the
          exact columns (points for/against, fantasy allowed, etc).
        </p>
      </header>

      <div className="rounded-2xl border border-neutral-800/80 bg-black/70 px-4 py-6 text-center text-xs text-neutral-400">
        Team ledger grid coming soon — layout is ready for a sticky header
        table with Neeko+ blur and hit-rate bands just like the player Master
        Table.
      </div>
    </section>
  );
};

export default TeamMasterTable;
