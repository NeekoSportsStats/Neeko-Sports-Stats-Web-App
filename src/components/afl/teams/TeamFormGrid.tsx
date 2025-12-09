// src/components/afl/teams/TeamFormGrid.tsx
import React, { useMemo, useState } from "react";
import { MOCK_TEAMS } from "./mockTeams";
import {
  Flame,
  CircleDot,
  Snowflake,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                       SLIM SPARKLINE (very compact)                        */
/* -------------------------------------------------------------------------- */
function MiniSparkline({ values }: { values: number[] }) {
  return (
    <div className="h-8 w-full rounded-md bg-gradient-to-b from-neutral-800/40 to-black shadow-inner" />
  );
}

/* -------------------------------------------------------------------------- */
/*                         TEAM FORM CLASSIFICATION LOGIC                      */
/* -------------------------------------------------------------------------- */
function classifyTeams() {
  // Momentum = margin(R23) – margin(R20)
  const last = 22;
  const prev = 19;

  return MOCK_TEAMS.map((team) => {
    const momentum = team.margins[last] - team.margins[prev];
    const attackDelta = team.scores[last] - team.scores[last - 1];
    const defenceDelta = team.margins[last] - team.margins[last - 1];

    let category: "hot" | "stable" | "cold" = "stable";
    if (momentum >= 12) category = "hot";
    else if (momentum <= -12) category = "cold";

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
/*                               SECTION WRAPPER                              */
/* -------------------------------------------------------------------------- */
export default function TeamFormGrid() {
  const [metric, setMetric] = useState<"momentum" | "fantasy" | "disposals" | "goals">("momentum");
  const classified = useMemo(() => classifyTeams(), []);

  // TOP 3 PER CATEGORY
  const hot = classified.filter(t => t.category === "hot").slice(0, 3);
  const stable = classified.filter(t => t.category === "stable").slice(0, 3);
  const cold = classified.filter(t => t.category === "cold").slice(0, 3);

  return (
    <section className="mt-12 pb-12">
      {/* Header Pill */}
      <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 
      bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-transparent px-3 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.8)]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
          Team Form Grid
        </span>
      </div>

      {/* Title */}
      <h2 className="mt-4 text-xl font-semibold text-neutral-50 md:text-2xl">
        Hot, stable and cold clubs by performance lens
      </h2>

      <p className="mt-2 max-w-2xl text-xs text-neutral-400">
        Switch between momentum, fantasy, disposals and goals to see how each club is trending. Tap a club pill to flip into a deeper analytics view.
      </p>

      {/* Metric Tabs */}
      <div className="mt-6 flex w-full overflow-x-auto rounded-full border border-neutral-800/70 
      bg-black/40 p-1 no-scrollbar">
        {["momentum", "fantasy", "disposals", "goals"].map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m as any)}
            className={`
              flex-1 min-w-[110px] px-4 py-2 rounded-full text-xs uppercase tracking-wide 
              transition-all duration-200 whitespace-nowrap
              ${metric === m
                ? "bg-yellow-500/20 text-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.5)]"
                : "text-neutral-400"
              }
            `}
          >
            {m}
          </button>
        ))}
      </div>

      {/* 3-Column Desktop Layout / Stacked Mobile */}
      <div className="mt-8 grid gap-8 lg:grid-cols-3">

        {/* Hot */}
        <CategoryBlock
          icon={<Flame className="h-4 w-4 text-yellow-300" />}
          title="Hot Teams"
          tint="hot"
          teams={hot}
        />

        {/* Stable */}
        <CategoryBlock
          icon={<CircleDot className="h-4 w-4 text-lime-300" />}
          title="Stable Teams"
          tint="stable"
          teams={stable}
        />

        {/* Cold */}
        <CategoryBlock
          icon={<Snowflake className="h-4 w-4 text-sky-300" />}
          title="Cold Teams"
          tint="cold"
          teams={cold}
        />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                             CATEGORY BLOCK                                  */
/* -------------------------------------------------------------------------- */
function CategoryBlock({
  icon,
  title,
  tint,
  teams,
}: {
  icon: React.ReactNode;
  title: string;
  tint: "hot" | "stable" | "cold";
  teams: any[];
}) {
  const tintColor =
    tint === "hot"
      ? "yellow"
      : tint === "stable"
      ? "lime"
      : "sky";

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">{title}</span>
      </div>

      <div className="space-y-3">
        {teams.map((team) => (
          <SlimFlipPill key={team.id} team={team} tint={tintColor} />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            SLIM FLIP PILL (Mobile)                          */
/* -------------------------------------------------------------------------- */
function SlimFlipPill({ team, tint }: { team: any; tint: string }) {
  const [open, setOpen] = useState(false);

  const halo = {
    yellow: "shadow-[0_0_14px_rgba(234,179,8,0.45)]",
    lime: "shadow-[0_0_14px_rgba(132,204,22,0.45)]",
    sky: "shadow-[0_0_14px_rgba(56,189,248,0.45)]",
  }[tint];

  return (
    <div className="relative">
      {/* FRONT — Slim full-width pill */}
      <button
        onClick={() => setOpen(!open)}
        className={`
          w-full h-[40px] rounded-full flex items-center justify-between 
          px-4 text-xs font-medium tracking-wide
          bg-gradient-to-r from-neutral-800/40 to-black
          border border-neutral-800/70 
          transition-all duration-300
          ${halo}
        `}
      >
        <span className="text-neutral-200">{team.name}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-neutral-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-neutral-500" />
        )}
      </button>

      {/* EXPANDABLE ANALYTICS */}
      <div
        className={`
          overflow-hidden transition-[max-height,opacity] duration-500 ease-out 
          ${open ? "max-h-[500px] opacity-100 mt-3" : "max-h-0 opacity-0"}
        `}
      >
        <div
          className="rounded-xl p-4 bg-gradient-to-b from-neutral-900/90 to-black 
          border border-neutral-800/80"
        >
          {/* Sparkline */}
          <MiniSparkline values={team.margins.slice(-5)} />

          {/* Analytics Grid */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-[11px]">
            <Metric label="Attack Δ" value={team.attackDelta} />
            <Metric label="Defence Δ" value={team.defenceDelta} />
            <Metric label="Clearance %" value={`${team.clearanceDom.slice(-5).reduce((a,b)=>a+b,0)/5 | 0}%`} />
            <Metric label="Consistency" value={team.consistencyIndex} />
            <Metric label="Fixture Diff" value={team.fixtureDifficulty.score} />
            <Metric label="Opponents" value={team.fixtureDifficulty.opponents.join(", ")} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               ANALYTICS ITEM                                */
/* -------------------------------------------------------------------------- */
function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <div className="text-neutral-500 uppercase text-[9px] tracking-[0.15em]">{label}</div>
      <div className="mt-1 font-semibold text-neutral-200">{value}</div>
    </div>
  );
}