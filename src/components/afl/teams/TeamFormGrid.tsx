// src/components/afl/teams/TeamFormGrid.tsx
import React, { useMemo } from "react";
import { MOCK_TEAMS } from "./mockTeams";
import {
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  CircleDot,
  Snowflake,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                           Sparkline Placeholder                             */
/* -------------------------------------------------------------------------- */
function SparklineSmall({ values }: { values: number[] }) {
  return (
    <div className="h-10 w-full rounded-md bg-gradient-to-b from-neutral-800/50 to-black shadow-inner" />
  );
}

/* -------------------------------------------------------------------------- */
/*                         TEAM FORM CLASSIFICATION LOGIC                      */
/* -------------------------------------------------------------------------- */

function classifyTeams() {
  // Momentum = margin(R23) – margin(R20)
  const last = 22; // R23 idx
  const prev = 19; // R20 idx

  return MOCK_TEAMS.map((team) => {
    const momentum = team.margins[last] - team.margins[prev];
    const attackDelta =
      team.scores[last] - team.scores[last - 1];
    const defenceDelta =
      team.margins[last] - team.margins[last - 1];

    let category: "hot" | "stable" | "cold" = "stable";

    if (momentum >= 12) category = "hot";
    else if (momentum <= -12) category = "cold";
    else category = "stable";

    return {
      ...team,
      momentum,
      attackDelta,
      defenceDelta,
      category,
    };
  });
}

/* -------------------------------------------------------------------------- */
/*                               FORM GRID SECTION                             */
/* -------------------------------------------------------------------------- */

export default function TeamFormGrid() {
  const classified = useMemo(() => classifyTeams(), []);

  const hotTeams = classified.filter((t) => t.category === "hot");
  const stableTeams = classified.filter((t) => t.category === "stable");
  const coldTeams = classified.filter((t) => t.category === "cold");

  const last5 = (arr: number[]) => arr.slice(-5);

  return (
    <section className="mt-12">
      <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-transparent px-3 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.8)]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
          Team Form Grid
        </span>
      </div>

      <h2 className="mt-4 text-xl font-semibold text-neutral-50 md:text-2xl">
        Hot, stable and cold clubs based on league-wide momentum
      </h2>

      <p className="mt-2 max-w-2xl text-xs text-neutral-400">
        Calculated using recent margins, attack/defence deltas and rolling volatility.
      </p>

      {/* GRID: 3 columns */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* -------------------------------------------------------------- */}
        {/* HOT TEAMS                                                      */}
        {/* -------------------------------------------------------------- */}
        <FormColumn
          title="Hot Teams"
          icon={<Flame className="h-4 w-4 text-yellow-300" />}
          teams={hotTeams}
          last5={last5}
        />

        {/* -------------------------------------------------------------- */}
        {/* STABLE TEAMS                                                   */}
        {/* -------------------------------------------------------------- */}
        <FormColumn
          title="Stable Teams"
          icon={<CircleDot className="h-4 w-4 text-lime-300" />}
          teams={stableTeams}
          last5={last5}
        />

        {/* -------------------------------------------------------------- */}
        {/* COLD TEAMS                                                     */}
        {/* -------------------------------------------------------------- */}
        <FormColumn
          title="Cold Teams"
          icon={<Snowflake className="h-4 w-4 text-blue-300" />}
          teams={coldTeams}
          last5={last5}
        />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                             FORM COLUMN COMPONENT                           */
/* -------------------------------------------------------------------------- */

function FormColumn({
  title,
  icon,
  teams,
  last5,
}: {
  title: string;
  icon: React.ReactNode;
  teams: any[];
  last5: (arr: number[]) => number[];
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
          {title}
        </span>
      </div>

      <div className="space-y-4">
        {teams.map((t) => (
          <FormCard key={t.name} team={t} last5={last5} />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              FORM CARD COMPONENT                            */
/* -------------------------------------------------------------------------- */

function FormCard({ team, last5 }: any) {
  const margins5 = last5(team.margins);

  const trendUp = team.momentum >= 0;
  const attackUp = team.attackDelta >= 0;
  const defenceUp = team.defenceDelta >= 0;

  return (
    <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/90 to-black p-5 shadow-[0_0_40px_rgba(0,0,0,0.45)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-neutral-50">
            {team.name}
          </div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            Last 5 margins
          </div>
        </div>

        {trendUp ? (
          <ArrowUpRight className="h-5 w-5 text-lime-300" />
        ) : (
          <ArrowDownRight className="h-5 w-5 text-red-300" />
        )}
      </div>

      {/* Sparkline */}
      <div className="mt-3">
        <SparklineSmall values={margins5} />
      </div>

      {/* Attack / Defence delta */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] text-neutral-300">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            Attack Δ
          </div>
          <div
            className={`mt-1 font-semibold ${
              attackUp ? "text-lime-300" : "text-red-300"
            }`}
          >
            {attackUp ? "+" : ""}
            {team.attackDelta}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            Defence Δ
          </div>
          <div
            className={`mt-1 font-semibold ${
              defenceUp ? "text-lime-300" : "text-red-300"
            }`}
          >
            {defenceUp ? "+" : ""}
            {team.defenceDelta}
          </div>
        </div>
      </div>
    </div>
  );
}
