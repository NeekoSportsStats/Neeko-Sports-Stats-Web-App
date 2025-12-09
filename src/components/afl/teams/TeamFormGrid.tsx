// src/components/afl/teams/TeamFormGrid.tsx
import React, { useMemo, useState } from "react";
import { MOCK_TEAMS } from "./mockTeams";
import {
  Flame,
  CircleDot,
  Snowflake,
} from "lucide-react";

/* ----------------------------------------------------------- */
/* MOBILE-FIRST MINI GLOW BAR                                 */
/* ----------------------------------------------------------- */

function MiniGlowBar({
  label,
  tint,
}: {
  label: string;
  tint: "hot" | "stable" | "cold" | "fantasy" | "disposals" | "goals";
}) {
  const glow =
    tint === "hot"
      ? "from-yellow-500/30 via-yellow-500/10"
      : tint === "stable"
      ? "from-lime-400/30 via-lime-400/10"
      : tint === "cold"
      ? "from-sky-400/30 via-sky-400/10"
      : tint === "fantasy"
      ? "from-purple-400/30 via-purple-400/10"
      : tint === "disposals"
      ? "from-teal-400/30 via-teal-400/10"
      : "from-red-400/30 via-red-400/10";

  return (
    <div
      className={`w-full rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-neutral-300 bg-neutral-900/80 border border-neutral-800 shadow-[0_0_20px_rgba(0,0,0,0.4)] bg-gradient-to-r ${glow}`}
    >
      {label}
    </div>
  );
}

/* ----------------------------------------------------------- */
/* PERFORMANCE LOGIC                                           */
/* ----------------------------------------------------------- */

function computeMetric(team: any, metric: string) {
  switch (metric) {
    case "momentum": {
      // margin R23 - R20
      const last = 22;
      const prev = 19;
      return team.margins[last] - team.margins[prev];
    }

    case "fantasy": {
      // just reuse attack rating for now
      return team.attackRating;
    }

    case "disposals": {
      // fake using midfield trend last point
      return team.midfieldTrend.at(-1) ?? 0;
    }

    case "goals": {
      // fake using scores delta
      return team.scores[22] - team.scores[21];
    }

    default:
      return 0;
  }
}

function classifyTop3(teams: any[], metric: string) {
  const scored = teams
    .map((t) => ({
      ...t,
      value: computeMetric(t, metric),
    }))
    .sort((a, b) => b.value - a.value);

  return {
    hot: scored.slice(0, 3),
    stable: scored.slice(6, 9),
    cold: scored.slice(15, 18),
  };
}

/* ----------------------------------------------------------- */
/* MAIN SECTION                                                */
/* ----------------------------------------------------------- */

export default function TeamFormGrid() {
  const [metric, setMetric] = useState<"momentum" | "fantasy" | "disposals" | "goals">(
    "momentum"
  );

  const classified = useMemo(
    () => classifyTop3(MOCK_TEAMS, metric),
    [metric]
  );

  return (
    <section className="mt-12 rounded-3xl border border-yellow-500/10 bg-gradient-to-b from-neutral-950 to-neutral-900 px-5 py-8 shadow-[0_0_60px_rgba(0,0,0,0.45)] md:px-8 md:py-10">
      {/* HEADER PILL */}
      <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-transparent px-3 py-1 shadow-[0_0_18px_rgba(250,204,21,0.25)]">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.8)]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
          Team Form Grid
        </span>
      </div>

      <h2 className="mt-4 text-xl font-semibold text-neutral-50 md:text-2xl">
        Hot, stable and cold clubs by performance lens
      </h2>

      <p className="mt-2 max-w-2xl text-xs text-neutral-400">
        Switch between momentum, fantasy, disposals and goals to see how each club is trending across different metrics.
      </p>

      {/* METRIC FILTER TABS */}
      <div className="mt-6 flex overflow-x-auto rounded-full border border-neutral-800 bg-neutral-900/80 p-1 text-xs">
        {["momentum", "fantasy", "disposals", "goals"].map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m as any)}
            className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 font-medium transition-all ${
              metric === m
                ? "bg-yellow-500/20 text-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.25)]"
                : "text-neutral-400"
            }`}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {/* CATEGORIES */}
      <div className="mt-10 space-y-12">
        {/* HOT */}
        <CategorySection
          title="HOT TEAMS"
          icon={<Flame className="h-4 w-4 text-yellow-300" />}
          colour="hot"
          teams={classified.hot}
          metric={metric}
        />

        <DividerLine />

        {/* STABLE */}
        <CategorySection
          title="STABLE TEAMS"
          icon={<CircleDot className="h-4 w-4 text-lime-300" />}
          colour="stable"
          teams={classified.stable}
          metric={metric}
        />

        <DividerLine />

        {/* COLD */}
        <CategorySection
          title="COLD TEAMS"
          icon={<Snowflake className="h-4 w-4 text-sky-300" />}
          colour="cold"
          teams={classified.cold}
          metric={metric}
        />
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- */
/* CATEGORY BLOCK                                              */
/* ----------------------------------------------------------- */

function CategorySection({
  title,
  icon,
  colour,
  teams,
  metric,
}: {
  title: string;
  icon: React.ReactNode;
  colour: "hot" | "stable" | "cold";
  teams: any[];
  metric: string;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
          {title}
        </span>
      </div>

      <div className="space-y-3">
        {teams.map((t) => (
          <MiniGlowBar
            key={t.name}
            label={`${metric.toUpperCase()} · LAST 5`}
            tint={colour}
          />
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- */
/* DIVIDER LINE                                                */
/* ----------------------------------------------------------- */

function DividerLine() {
  return (
    <div className="mx-auto my-4 h-px w-full bg-gradient-to-r from-transparent via-neutral-700/40 to-transparent" />
  );
}