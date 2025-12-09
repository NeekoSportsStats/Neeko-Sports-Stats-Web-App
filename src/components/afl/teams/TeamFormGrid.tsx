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
/*                          MINI SPARKLINE (ANALYTICS)                        */
/* -------------------------------------------------------------------------- */

function MiniSparkline({ values }: { values: number[] }) {
  // Visual placeholder – you can wire this to a real chart later
  return (
    <div className="h-8 w-full rounded-md bg-gradient-to-r from-neutral-900 via-neutral-800/70 to-black shadow-inner" />
  );
}

/* -------------------------------------------------------------------------- */
/*                        CLASSIFICATION + METRIC LOGIC                        */
/* -------------------------------------------------------------------------- */

type ClassifiedTeam = (typeof MOCK_TEAMS)[number] & {
  metric: number;
  category: "hot" | "stable" | "cold";
  attackDelta: number;
  defenceDelta: number;
};

function classifyTeams(filter: "momentum" | "fantasy" | "disposals" | "goals") {
  const last = 22; // R23 index
  const prev = 19; // R20 index

  return MOCK_TEAMS.map<ClassifiedTeam>((team) => {
    let metric = 0;

    if (filter === "momentum") {
      metric = team.margins[last] - team.margins[prev];
    } else if (filter === "fantasy") {
      metric = team.attackRating - 50;
    } else if (filter === "disposals") {
      metric = team.midfieldTrend[team.midfieldTrend.length - 1] - 50;
    } else if (filter === "goals") {
      metric = team.scores[last] - team.scores[last - 1];
    }

    const attackDelta =
      team.attackTrend[team.attackTrend.length - 1] -
      team.attackTrend[team.attackTrend.length - 2];

    const defenceDelta =
      team.defenceTrend[team.defenceTrend.length - 1] -
      team.defenceTrend[team.defenceTrend.length - 2];

    let category: "hot" | "stable" | "cold" = "stable";
    if (metric >= 12) category = "hot";
    else if (metric <= -12) category = "cold";

    return {
      ...team,
      metric,
      category,
      attackDelta,
      defenceDelta,
    };
  });
}

/* -------------------------------------------------------------------------- */
/*                                  WRAPPER                                   */
/* -------------------------------------------------------------------------- */

export default function TeamFormGrid() {
  const [filter, setFilter] = useState<
    "momentum" | "fantasy" | "disposals" | "goals"
  >("momentum");

  const teams = useMemo(() => classifyTeams(filter), [filter]);

  const hotTeams = teams.filter((t) => t.category === "hot").slice(0, 3);
  const stableTeams = teams.filter((t) => t.category === "stable").slice(0, 3);
  const coldTeams = teams.filter((t) => t.category === "cold").slice(0, 3);

  return (
    <section className="mt-12 w-full">
      {/* Outer premium container */}
      <div className="rounded-3xl border border-neutral-800/60 bg-gradient-to-b from-neutral-900/70 via-neutral-950/90 to-black/95 px-5 py-10 shadow-[0_0_40px_rgba(0,0,0,0.45)] backdrop-blur-xl md:px-10 md:py-12">
        {/* Header pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-yellow-500/12 px-4 py-1.5 shadow-[0_0_20px_rgba(250,204,21,0.45)]">
          <span className="h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.9)]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-200">
            Team Form Grid
          </span>
        </div>

        {/* Heading */}
        <h2 className="mt-5 text-2xl font-semibold text-neutral-50 md:text-3xl">
          Hot, stable and cold clubs by performance lens
        </h2>

        <p className="mt-2 max-w-xl text-xs text-neutral-400">
          Switch between momentum, fantasy, disposals and goals to see how each
          club is trending. Tap a pill on mobile or hover on desktop to reveal a
          deeper analytics panel.
        </p>

        {/* Filter tabs */}
        <div className="mt-6 flex w-full gap-2 overflow-x-auto rounded-full border border-neutral-800/60 bg-black/50 p-1 text-sm backdrop-blur no-scrollbar">
          {(["momentum", "fantasy", "disposals", "goals"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex-shrink-0 rounded-full px-5 py-2.5 font-semibold capitalize transition-all duration-300 ${
                  filter === tab
                    ? "bg-yellow-500/18 text-yellow-200 shadow-[0_0_16px_rgba(250,204,21,0.45)]"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>

        {/* Categories grid */}
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          <CategoryColumn
            title="Hot Teams"
            icon={
              <Flame className="h-4 w-4 text-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.9)]" />
            }
            tint="yellow"
            teams={hotTeams}
          />

          <CategoryColumn
            title="Stable Teams"
            icon={
              <CircleDot className="h-4 w-4 text-lime-300 drop-shadow-[0_0_10px_rgba(132,204,22,0.9)]" />
            }
            tint="lime"
            teams={stableTeams}
          />

          <CategoryColumn
            title="Cold Teams"
            icon={
              <Snowflake className="h-4 w-4 text-sky-300 drop-shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
            }
            tint="sky"
            teams={coldTeams}
          />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                               CATEGORY COLUMN                               */
/* -------------------------------------------------------------------------- */

function CategoryColumn({
  title,
  icon,
  teams,
  tint,
}: {
  title: string;
  icon: React.ReactNode;
  teams: ClassifiedTeam[];
  tint: "yellow" | "lime" | "sky";
}) {
  const dividerGradient =
    tint === "yellow"
      ? "from-amber-400/70 via-amber-300/35 to-transparent"
      : tint === "lime"
      ? "from-lime-400/70 via-lime-300/35 to-transparent"
      : "from-sky-400/70 via-sky-300/35 to-transparent";

  return (
    <div className="space-y-4">
      {/* Sticky header on mobile */}
      <div className="sticky top-[70px] z-10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-transparent pb-2 pt-1 md:static md:bg-transparent md:pb-0 md:pt-0">
        <div className={`h-px w-full bg-gradient-to-r ${dividerGradient}`} />
        <div className="mt-2 flex items-center gap-2">
          {icon}
          <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-300">
            {title}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {teams.map((team) => (
          <FormPill key={team.id} team={team} tint={tint} />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            PILL + INLINE SPARKLINE                          */
/* -------------------------------------------------------------------------- */

function FormPill({ team, tint }: { team: ClassifiedTeam; tint: "yellow" | "lime" | "sky" }) {
  const [open, setOpen] = useState(false);

  const badgeClass =
    tint === "yellow"
      ? "bg-yellow-500/18 border-yellow-500/45 text-yellow-300"
      : tint === "lime"
      ? "bg-lime-500/18 border-lime-500/45 text-lime-300"
      : "bg-sky-500/18 border-sky-500/45 text-sky-300";

  const barFillClass =
    tint === "yellow"
      ? "bg-yellow-400/95"
      : tint === "lime"
      ? "bg-lime-400/95"
      : "bg-sky-400/95";

  // clamp metric into [0, 100] for bar length
  const absMetric = Math.min(Math.abs(team.metric), 100);

  return (
    <div className="group">
      {/* FRONT / MAIN CARD */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-2xl border border-neutral-800/70 bg-gradient-to-br from-neutral-900/80 via-neutral-950/95 to-black px-4 py-4 text-left shadow-[0_0_28px_rgba(0,0,0,0.7)] backdrop-blur-md transition-all duration-300 hover:border-neutral-500/80 hover:shadow-[0_0_40px_rgba(0,0,0,0.9)] md:px-5 md:py-4.5"
      >
        {/* Top row: name + bar + badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-neutral-50">
              {team.name}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* micro momentum bar */}
            <div className="relative h-1.5 w-14 overflow-hidden rounded-full bg-neutral-800/80">
              <div
                className={`h-full ${barFillClass}`}
                style={{ width: `${absMetric}%` }}
              />
            </div>

            {/* soft glow badge */}
            <span
              className={`rounded-md border px-2 py-1 text-xs font-semibold tracking-wide shadow-[0_0_10px_rgba(0,0,0,0.7)] ${badgeClass}`}
            >
              {team.metric >= 0 ? "+" : ""}
              {team.metric.toFixed(1)}
            </span>

            {/* chevron */}
            <span className="ml-1 flex items-center justify-center">
              {open ? (
                <ChevronUp className="h-4 w-4 text-neutral-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-neutral-500" />
              )}
            </span>
          </div>
        </div>

        {/* inline sparkline strip */}
        <div className="mt-3 h-6 w-full rounded-xl bg-gradient-to-r from-neutral-900 via-neutral-800/75 to-neutral-950 shadow-inner" />

        {/* descriptor row */}
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            Momentum • last 5
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.16em] text-neutral-600 md:inline">
            Hover for analytics
          </span>
        </div>
      </button>

      {/* ANALYTICS PANEL - mobile tap, desktop hover */}
      <div
        className={`
          overflow-hidden transition-[max-height,opacity,margin-top] duration-500 ease-out
          ${open ? "max-h-[420px] opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"}
          md:max-h-0 md:opacity-0 md:mt-0 md:group-hover:max-h-[420px] md:group-hover:opacity-100 md:group-hover:mt-3
        `}
      >
        <div className="relative rounded-2xl border border-neutral-800/70 bg-gradient-to-b from-neutral-900/95 to-black px-4 py-4 shadow-[0_0_30px_rgba(0,0,0,0.7)] md:px-5 md:py-5">
          {/* shimmer overlay on show */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.12),transparent_55%)] opacity-0 transition-opacity duration-700 md:group-hover:opacity-100" />

          <div className="relative">
            {/* sparkline / chart */}
            <MiniSparkline values={team.margins.slice(-5)} />

            {/* metrics grid */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-[11px] text-neutral-200">
              <Metric label="Attack Δ" value={team.attackDelta} />
              <Metric label="Defence Δ" value={team.defenceDelta} />
              <Metric
                label="Clearance %"
                value={`${Math.round(team.clearanceDom.slice(-5).reduce((a, b) => a + b, 0) / 5)}%`}
              />
              <Metric label="Consistency" value={team.consistencyIndex} />
              <Metric
                label="Fixture diff"
                value={team.fixtureDifficulty.score}
              />
              <Metric
                label="Opponents"
                value={team.fixtureDifficulty.opponents.join(", ")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                METRIC ITEM                                 */
/* -------------------------------------------------------------------------- */

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </div>
      <div className="mt-1 font-semibold text-neutral-100">{value}</div>
    </div>
  );
}