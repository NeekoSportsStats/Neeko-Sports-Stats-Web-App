// src/components/afl/teams/TeamFormGrid.tsx
import React, { useState, useMemo } from "react";
import {
  Flame,
  CircleDot,
  Snowflake,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { MOCK_TEAMS } from "./mockTeams";

/* -------------------------------------------------------------------------- */
/*                               CATEGORY LOGIC                                */
/* -------------------------------------------------------------------------- */

function classifyTeams(filter: string) {
  const last = 22;
  const prev = 19;

  return MOCK_TEAMS.map((team) => {
    let metric = 0;

    if (filter === "momentum") {
      metric = team.margins[last] - team.margins[prev];
    } else if (filter === "fantasy") {
      metric = team.attackRating - 50; // placeholder logic
    } else if (filter === "disposals") {
      metric = team.clearanceDom[last] - 50;
    } else if (filter === "goals") {
      metric = team.defenceRating - 50;
    }

    const attackDelta = team.attackTrend[team.attackTrend.length - 1] -
                        team.attackTrend[team.attackTrend.length - 2];

    const defenceDelta = team.defenceTrend[team.defenceTrend.length - 1] -
                         team.defenceTrend[team.defenceTrend.length - 2];

    let category: "hot" | "stable" | "cold" = "stable";
    if (metric >= 12) category = "hot";
    else if (metric <= -12) category = "cold";

    return {
      ...team,
      metric,
      attackDelta,
      defenceDelta,
      category,
    };
  });
}

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export default function TeamFormGrid() {
  const [filter, setFilter] = useState("momentum");

  const classified = useMemo(() => classifyTeams(filter), [filter]);

  const hotTeams = classified.filter((t) => t.category === "hot").slice(0, 3);
  const stableTeams = classified.filter((t) => t.category === "stable").slice(0, 3);
  const coldTeams = classified.filter((t) => t.category === "cold").slice(0, 3);

  return (
    <section className="mt-12 w-full">
      {/* Outer Premium Card */}
      <div className="
        rounded-3xl border border-neutral-800/50 
        bg-gradient-to-b from-neutral-900/60 to-black/95
        shadow-[0_0_40px_rgba(0,0,0,0.45)] 
        backdrop-blur-xl px-5 py-10 md:px-10 md:py-12
      ">

        {/* Header Pill */}
        <div className="inline-flex items-center gap-2 rounded-full
          border border-yellow-500/40 bg-yellow-500/10 px-4 py-1.5
          shadow-[0_0_20px_rgba(250,204,21,0.45)]
        ">
          <span className="h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.8)]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-200">
            Team Form Grid
          </span>
        </div>

        {/* Title */}
        <h2 className="mt-5 text-2xl font-semibold text-neutral-50 md:text-3xl">
          Hot, stable and cold clubs by performance lens
        </h2>

        <p className="mt-2 max-w-xl text-xs text-neutral-400">
          Switch between momentum, fantasy, disposals and goals to see how each club is trending. 
          Tap a pill to reveal a full analytics panel.
        </p>

        {/* Tabs */}
        <div className="mt-6 flex w-full overflow-x-auto gap-3 rounded-full border border-neutral-800/60 bg-black/40 p-1 backdrop-blur">
          {["momentum", "fantasy", "disposals", "goals"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`
                flex-shrink-0 px-6 py-2.5 rounded-full text-sm font-semibold 
                transition-all duration-300
                ${filter === t 
                  ? "bg-yellow-500/20 text-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.4)]" 
                  : "text-neutral-400 hover:text-neutral-200"
                }
              `}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Grid - Desktop 3 columns */}
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          
          <FormCategory
            title="Hot Teams"
            icon={<Flame className="h-4 w-4 text-yellow-300" />}
            color="yellow"
            teams={hotTeams}
          />

          <FormCategory
            title="Stable Teams"
            icon={<CircleDot className="h-4 w-4 text-lime-300" />}
            color="lime"
            teams={stableTeams}
          />

          <FormCategory
            title="Cold Teams"
            icon={<Snowflake className="h-4 w-4 text-sky-300" />}
            color="sky"
            teams={coldTeams}
          />
        </div>

      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 CATEGORY BLOCK                              */
/* -------------------------------------------------------------------------- */

function FormCategory({ title, icon, teams, color }: any) {
  return (
    <div className="relative">
      {/* Sticky header on mobile */}
      <div className="sticky top-16 z-10 bg-black/60 backdrop-blur py-1">
        <div className="mb-3 flex items-center gap-2">
          {icon}
          <span className="text-[12px] uppercase tracking-[0.15em] text-neutral-300">
            {title}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {teams.map((t: any) => (
          <FormPill key={t.name} team={t} color={color} />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   FORM PILL                                 */
/* -------------------------------------------------------------------------- */

function FormPill({ team, color }: any) {
  const [open, setOpen] = useState(false);

  const glowColor = {
    yellow: "shadow-[0_0_20px_rgba(250,204,21,0.25)]",
    lime: "shadow-[0_0_20px_rgba(132,204,22,0.25)]",
    sky: "shadow-[0_0_20px_rgba(56,189,248,0.25)]",
  }[color];

  const badgeColor = {
    yellow: "bg-yellow-500/20 border-yellow-500/40 text-yellow-300",
    lime: "bg-lime-500/20 border-lime-500/40 text-lime-300",
    sky: "bg-sky-500/20 border-sky-500/40 text-sky-300",
  }[color];

  return (
    <div>
      {/* Pill */}
      <button
        onClick={() => setOpen(!open)}
        className={`
          w-full rounded-2xl px-5 py-4
          bg-gradient-to-br from-neutral-900/70 to-black/90 
          border border-neutral-800/70
          flex items-center justify-between
          backdrop-blur-md
          transition-all duration-300
          ${glowColor}
          hover:scale-[1.015]
        `}
      >
        <div>
          <div className="text-sm font-medium text-neutral-50">{team.name}</div>
          <div className="text-[10px] tracking-[0.17em] text-neutral-500">
            Momentum · Last 5
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Micro bar */}
          <div className="relative h-1.5 w-14 rounded-full bg-neutral-800/70 overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-full rounded-full 
                ${color === "yellow" && "bg-yellow-400/90"}
                ${color === "lime" && "bg-lime-400/90"}
                ${color === "sky" && "bg-sky-400/90"}
              `}
              style={{ width: `${Math.min(Math.abs(team.metric), 100)}%` }}
            />
          </div>

          {/* Badge */}
          <div className={`px-2 py-1 rounded-md border text-xs font-semibold ${badgeColor}`}>
            {team.metric > 0 ? "+" : ""}{team.metric.toFixed(1)}
          </div>

          {open ? (
            <ChevronUp className="h-4 w-4 text-neutral-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-neutral-500" />
          )}
        </div>
      </button>

      {/* Expanded analytics */}
      {open && (
        <div className="
          mt-3 rounded-2xl border border-neutral-800/60 
          bg-gradient-to-b from-neutral-900/80 to-black
          px-5 py-5 transition-all duration-300 animate-fade-in
        ">
          <div className="grid grid-cols-2 gap-y-4 text-xs text-neutral-300">
            <Stat label="Attack Δ" value={team.attackDelta} />
            <Stat label="Defence Δ" value={team.defenceDelta} />
            <Stat label="Clearance %" value={`${team.clearanceDom[22]}%`} />
            <Stat label="Consistency" value={team.consistencyIndex} />
            <Stat label="Fixture Diff" value={team.fixtureDifficulty.score} />
            <Stat
              label="Opponents"
              value={team.fixtureDifficulty.opponents.join(", ")}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   STAT ROW                                  */
/* -------------------------------------------------------------------------- */

function Stat({ label, value }: any) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </div>
      <div className="mt-1 font-semibold text-neutral-100">{value}</div>
    </div>
  );
}