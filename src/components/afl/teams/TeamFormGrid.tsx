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
/*                               MINI SPARKLINE                               */
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
/*                                  WRAPPER                                   */
/* -------------------------------------------------------------------------- */

export default function TeamFormGrid() {
  const [metric, setMetric] = useState<
    "momentum" | "fantasy" | "disposals" | "goals"
  >("momentum");

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
        Switch between momentum, fantasy, disposals and goals to see how each
        club is trending. Tap a pill to reveal a full analytics panel.
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

      {/* Categories — stacked on mobile, 3 columns on desktop */}
      <div className="mt-10 grid gap-12 lg:grid-cols-3">
        <CategoryColumn
          icon={
            <Flame className="h-4 w-4 text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]" />
          }
          title="Hot Teams"
          tint="yellow"
          teams={hot}
          metric={metric}
          stickyOffset={0}
        />

        <CategoryColumn
          icon={
            <CircleDot className="h-4 w-4 text-lime-300 drop-shadow-[0_0_8px_rgba(132,204,22,0.9)]" />
          }
          title="Stable Teams"
          tint="lime"
          teams={stable}
          metric={metric}
          stickyOffset={0}
        />

        <CategoryColumn
          icon={
            <Snowflake className="h-4 w-4 text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
          }
          title="Cold Teams"
          tint="sky"
          teams={cold}
          metric={metric}
          stickyOffset={0}
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
  stickyOffset,
}: {
  icon: React.ReactNode;
  title: string;
  tint: "yellow" | "lime" | "sky";
  teams: any[];
  metric: string;
  stickyOffset: number;
}) {
  const dividerGradient =
    tint === "yellow"
      ? "from-amber-400/65 via-amber-300/35 to-transparent"
      : tint === "lime"
      ? "from-lime-400/65 via-lime-300/35 to-transparent"
      : "from-sky-400/65 via-sky-300/35 to-transparent";

  return (
    <div className="space-y-3">
      {/* Sticky header on mobile, static on md+ */}
      <div
        className={`
          sticky top-[60px] z-10 mb-1 bg-gradient-to-b from-neutral-950 via-black/95 to-transparent 
          pt-1 pb-2 md:static md:bg-transparent md:pt-0 md:pb-0
        `}
        style={{ top: `${stickyOffset}px` }}
      >
        <div className={`h-px w-full bg-gradient-to-r ${dividerGradient}`} />
        <div className="mt-2 flex items-center gap-2">
          {icon}
          <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
            {title}
          </span>
        </div>
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
/*                            SLIM PILL + BADGE + BAR                          */
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

  // Micro bar fill (clamped range)
  const clamped =
    metric === "momentum"
      ? Math.max(-30, Math.min(30, metricValue))
      : Math.max(0, Math.min(100, metricValue));
  const fillPct =
    metric === "momentum"
      ? ((clamped + 30) / 60) * 100
      : (clamped / 100) * 100;

  const glowClass =
    tint === "yellow"
      ? "text-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.8)]"
      : tint === "lime"
      ? "text-lime-300 shadow-[0_0_8px_rgba(132,204,22,0.8)]"
      : "text-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.9)]";

  const barFillClass =
    tint === "yellow"
      ? "bg-yellow-400"
      : tint === "lime"
      ? "bg-lime-400"
      : "bg-sky-400";

  const logoSrc = `/afl/logos/${(team.code || "").toLowerCase()}.svg`;

  return (
    <div>
      {/* Pill Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="
          w-full rounded-xl bg-gradient-to-r 
          from-neutral-900/85 to-black/90 border border-neutral-800/70 
          px-3 py-2.5 md:px-4 md:py-3 transition-all shadow-[0_0_14px_rgba(0,0,0,0.45)]
          hover:border-neutral-500/70
        "
      >
        {/* TOP ROW: logo + name, micro bar + badge */}
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700/80 bg-neutral-900 shadow-[0_0_10px_rgba(0,0,0,0.6)] overflow-hidden">
              <img
                src={logoSrc}
                alt={team.name}
                className="h-6 w-6 object-contain"
              />
            </div>
            <span className="truncate text-sm text-neutral-200">
              {team.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Micro bar */}
            <div className="h-1.5 w-10 rounded-full bg-neutral-800/80">
              <div
                className={`h-full rounded-full ${barFillClass}`}
                style={{ width: `${fillPct}%` }}
              />
            </div>

            {/* Badge */}
            <span
              className={`text-xs font-semibold tracking-wide ${glowClass}`}
            >
              {metricValue >= 0 ? "+" : ""}
              {metricValue.toFixed(1)}
            </span>
          </div>
        </div>

        {/* SECOND ROW: descriptor + chevron */}
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

      {/* Analytics Expand with shimmer */}
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-out ${
          open ? "max-h-[420px] opacity-100 mt-3" : "max-h-0 opacity-0"
        }`}
      >
        <div className="relative rounded-xl border border-neutral-800/70 bg-gradient-to-b from-neutral-900/95 to-black p-4">
          {/* Shimmer overlay */}
          {open && (
            <div className="pointer-events-none absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_0%_0%,rgba(250,250,250,0.18),transparent_55%)] opacity-40" />
          )}

          <div className="relative">
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
              <Metric
                label="Fixture Diff"
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
/*                           METRIC ITEM (ANALYTICS)                          */
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