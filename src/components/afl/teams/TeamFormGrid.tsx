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
/*                         SLIM SPARKLINE (COMPACT)                           */
/* -------------------------------------------------------------------------- */
function MiniSparkline({ values }: { values: number[] }) {
  return (
    <div className="h-8 w-full rounded-md bg-gradient-to-b from-neutral-800/35 to-black shadow-inner" />
  );
}

/* -------------------------------------------------------------------------- */
/*                        CLASSIFICATION + METRICS                            */
/* -------------------------------------------------------------------------- */
function classifyTeams() {
  const last = 22;
  const prev = 19;

  return MOCK_TEAMS.map((team) => {
    const momentum = team.margins[last] - team.margins[prev];
    const attackDelta = team.scores[last] - team.scores[last - 1];
    const defenceDelta = team.margins[last] - team.margins[last - 1];

    let category: "hot" | "stable" | "cold" = "stable";
    if (momentum >= 12) category = "hot";
    else if (momentum <= -12) category = "cold";

    return { ...team, momentum, attackDelta, defenceDelta, category };
  });
}

/* -------------------------------------------------------------------------- */
/*                                  WRAPPER                                    */
/* -------------------------------------------------------------------------- */
export default function TeamFormGrid() {
  const [metric, setMetric] = useState<"momentum" | "fantasy" | "disposals" | "goals">(
    "momentum"
  );

  const teams = useMemo(() => classifyTeams(), []);

  const hot = teams.filter((t) => t.category === "hot").slice(0, 3);
  const stable = teams.filter((t) => t.category === "stable").slice(0, 3);
  const cold = teams.filter((t) => t.category === "cold").slice(0, 3);

  return (
    <section className="mt-12 pb-12">
      {/* Header Pill */}
      <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-transparent px-3 py-1 shadow-[0_0_16px_rgba(250,204,21,0.25)]">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.85)]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
          Team Form Grid
        </span>
      </div>

      <h2 className="mt-4 text-xl font-semibold text-neutral-50 md:text-2xl">
        Hot, stable and cold clubs by performance lens
      </h2>

      <p className="mt-2 max-w-2xl text-xs text-neutral-400">
        Switch between momentum, fantasy, disposals and goals to see how each club is trending. Tap a pill to reveal a full analytics panel.
      </p>

      {/* Metric Tabs */}
      <div className="mt-6 flex w-full overflow-x-auto no-scrollbar rounded-full border border-neutral-800/70 bg-black/40 p-1 text-xs">
        {["momentum", "fantasy", "disposals", "goals"].map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m as any)}
            className={`flex-1 min-w-[110px] whitespace-nowrap rounded-full px-4 py-2 uppercase tracking-wide transition-all ${
              metric === m
                ? "bg-yellow-500/20 text-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.5)]"
                : "text-neutral-400"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Categories */}
      <div className="mt-10 grid gap-12 lg:grid-cols-3">
        <CategoryColumn
          icon={<Flame className="h-4 w-4 text-yellow-300" />}
          title="Hot Teams"
          tint="yellow"
          teams={hot}
          metric={metric}
        />

        <CategoryColumn
          icon={<CircleDot className="h-4 w-4 text-lime-300" />}
          title="Stable Teams"
          tint="lime"
          teams={stable}
          metric={metric}
        />

        <CategoryColumn
          icon={<Snowflake className="h-4 w-4 text-sky-300" />}
          title="Cold Teams"
          tint="sky"
          teams={cold}
          metric={metric}
        />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                              CATEGORY COLUMN                                */
/* -------------------------------------------------------------------------- */
function CategoryColumn({
  icon,
  title,
  tint,
  teams,
  metric,
}: {
  icon: React.ReactNode;
  title: string;
  tint: "yellow" | "lime" | "sky";
  teams: any[];
  metric: string;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
          {title}
        </span>
      </div>

      <div className="space-y-3">
        {teams.map((t) => (
          <SlimPill key={t.id} team={t} tint={tint} metric={metric} />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SLIM PILL + BADGE                              */
/* -------------------------------------------------------------------------- */
function SlimPill({
  team,
  tint,
  metric,
}: {
  team: any;
  tint: "yellow" | "lime" | "sky";
  metric: string;
}) {
  const [open, setOpen] = useState(false);

  const metricValue =
    metric === "momentum"
      ? team.momentum
      : metric === "fantasy"
      ? team.attackRating
      : metric === "disposals"
      ? team.midfieldTrend.at(-1) ?? 0
      : team.scores[22] - team.scores[21];

  const glow =
    tint === "yellow"
      ? "text-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.65)]"
      : tint === "lime"
      ? "text-lime-300 shadow-[0_0_10px_rgba(132,204,22,0.65)]"
      : "text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.7)]";

  return (
    <div>
      {/* Pill Button */}
      <button
        onClick={() => setOpen(!open)}
        className="
          w-full flex flex-col rounded-xl bg-gradient-to-r 
          from-neutral-900/85 to-black/90 border border-neutral-800/70 
          px-4 py-3 transition-all shadow-[0_0_14px_rgba(0,0,0,0.45)]
        "
      >
        <div className="flex w-full items-center justify-between">
          <span className="text-sm text-neutral-200 truncate">
            {team.name}
          </span>

          <span className={`text-xs font-semibold tracking-wide ${glow}`}>
            {metricValue >= 0 ? "+" : ""}
            {metricValue.toFixed(1)}
          </span>
        </div>

        <div className="mt-0.5 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            {metric} • last 5
          </span>

          {open ? (
            <ChevronUp className="h-4 w-4 text-neutral-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-neutral-600" />
          )}
        </div>
      </button>

      {/* Analytics Expand */}
      <div
        className={`transition-[max-height,opacity] duration-500 ease-out ${
          open ? "max-h-[400px] opacity-100 mt-3" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="rounded-xl border border-neutral-800/70 bg-gradient-to-b from-neutral-900/90 to-black p-4">
          <MiniSparkline values={team.margins.slice(-5)} />

          {/* Analytics grid */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-[11px]">
            <Metric label="Attack Δ" value={team.attackDelta} />
            <Metric label="Defence Δ" value={team.defenceDelta} />
            <Metric
              label="Clearance %"
              value={`${Math.round(
                team.clearanceDom.slice(-5).reduce((a, b) => a + b, 0) / 5
              )}%`}
            />
            <Metric label="Consistency" value={team.consistencyIndex} />
            <Metric label="Fixture Diff" value={team.fixtureDifficulty.score} />
            <Metric
              label="Opponents"
              value={team.fixtureDifficulty.opponents.join(", ")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                           METRIC ITEM (ANALYTICS)                           */
/* -------------------------------------------------------------------------- */
function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.15em] text-neutral-500">
        {label}
      </div>
      <div className="mt-1 font-semibold text-neutral-200">{value}</div>
    </div>
  );
}