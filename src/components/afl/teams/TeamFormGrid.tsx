// src/components/afl/teams/TeamFormGrid.tsx
import React, { useMemo, useState } from "react";
import {
  Flame,
  CircleDot,
  Snowflake,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { MOCK_TEAMS, AFLTeam } from "./mockTeams";

/* -------------------------------------------------------------------------- */
/*                                Types & helpers                             */
/* -------------------------------------------------------------------------- */

type MetricType = "momentum" | "fantasy" | "disposals" | "goals";

type EnrichedTeam = AFLTeam & {
  // base deltas
  attackDelta: number;
  defenceDelta: number;
  lastClearance: number;
  momentumScore: number; // last 5 margin trend
  fantasyScore: number;
  disposalsScore: number;
  goalsScore: number;
};

type ClassifiedTeams = {
  hotTeams: EnrichedTeam[];
  stableTeams: EnrichedTeam[];
  coldTeams: EnrichedTeam[];
};

const LAST_ROUND = 22; // R23 index
const FIVE_BACK = LAST_ROUND - 4;

const METRIC_CONFIG: Record<
  MetricType,
  {
    label: string;
    range: { min: number; max: number };
  }
> = {
  momentum: {
    label: "Momentum • Last 5",
    range: { min: -80, max: 80 },
  },
  fantasy: {
    label: "Fantasy edge",
    range: { min: 5, max: 40 },
  },
  disposals: {
    label: "Disposal trend",
    range: { min: 5, max: 40 },
  },
  goals: {
    label: "Scoreboard impact",
    range: { min: 5, max: 40 },
  },
};

const CATEGORY_COLORS = {
  hot: {
    glow: "shadow-[0_0_45px_rgba(250,204,21,0.55)]",
    bar: "bg-yellow-400",
    badge: "border-yellow-300/80 bg-yellow-400/10 text-yellow-200",
    spark: "bg-gradient-to-r from-yellow-300/80 via-yellow-100/90 to-yellow-400",
    divider: "from-yellow-500/40 via-yellow-500/5 to-transparent",
  },
  stable: {
    glow: "shadow-[0_0_45px_rgba(74,222,128,0.55)]",
    bar: "bg-lime-400",
    badge: "border-lime-300/80 bg-lime-400/10 text-lime-200",
    spark: "bg-gradient-to-r from-lime-300/80 via-lime-100/90 to-lime-400",
    divider: "from-lime-500/40 via-lime-500/5 to-transparent",
  },
  cold: {
    glow: "shadow-[0_0_45px_rgba(56,189,248,0.55)]",
    bar: "bg-sky-400",
    badge: "border-sky-300/80 bg-sky-400/10 text-sky-200",
    spark: "bg-gradient-to-r from-sky-300/80 via-sky-100/90 to-sky-400",
    divider: "from-sky-500/40 via-sky-500/5 to-transparent",
  },
} as const;

type CategoryKey = keyof typeof CATEGORY_COLORS;

/* ------------------------------- Calculations ------------------------------ */

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalise(value: number, metric: MetricType) {
  const { min, max } = METRIC_CONFIG[metric].range;
  const clamped = clamp(value, min, max);
  return ((clamped - min) / (max - min)) * 100;
}

function computeTeamMetrics(team: AFLTeam): EnrichedTeam {
  const attackDelta = team.scores[LAST_ROUND] - team.scores[LAST_ROUND - 1];
  const defenceDelta =
    team.margins[LAST_ROUND] - team.margins[LAST_ROUND - 1];

  // Momentum = avg(last 5 margins) - avg(previous 5 margins)
  const last5 = team.margins.slice(FIVE_BACK, LAST_ROUND + 1);
  const prev5 = team.margins.slice(FIVE_BACK - 5, FIVE_BACK);
  const avg = (arr: number[]) =>
    arr.reduce((sum, v) => sum + v, 0) / Math.max(arr.length, 1);

  const momentumScore = avg(last5) - avg(prev5);

  // Fake-but-consistent extra metrics
  const baseRating = (team.attackRating + team.defenceRating) / 2;
  const midTrend =
    team.midfieldTrend.reduce((sum, v) => sum + v, 0) /
    Math.max(team.midfieldTrend.length, 1);

  const fantasyScore = baseRating * 0.25 + midTrend * 0.2;
  const disposalsScore = baseRating * 0.22 + team.attackTrend[0] * 0.25;
  const goalsScore = baseRating * 0.24 + team.defenceTrend[0] * 0.18;

  const lastClearance =
    team.clearanceDom[LAST_ROUND] ?? team.clearanceDom.at(-1) ?? 50;

  return {
    ...team,
    attackDelta: Math.round(attackDelta),
    defenceDelta: Math.round(defenceDelta),
    lastClearance,
    momentumScore,
    fantasyScore,
    disposalsScore,
    goalsScore,
  };
}

const ENRICHED_TEAMS: EnrichedTeam[] = MOCK_TEAMS.map(computeTeamMetrics);

function getMetricScore(team: EnrichedTeam, metric: MetricType) {
  switch (metric) {
    case "momentum":
      return team.momentumScore;
    case "fantasy":
      return team.fantasyScore;
    case "disposals":
      return team.disposalsScore;
    case "goals":
      return team.goalsScore;
  }
}

/**
 * Given a metric, sort teams by that metric and slice out
 * 3 hot / 3 stable / 3 cold.
 */
function classifyTeamsByMetric(metric: MetricType): ClassifiedTeams {
  const sorted = [...ENRICHED_TEAMS].sort(
    (a, b) => getMetricScore(b, metric) - getMetricScore(a, metric)
  );

  if (sorted.length < 9) {
    return {
      hotTeams: sorted.slice(0, 3),
      stableTeams: sorted.slice(3, 6),
      coldTeams: sorted.slice(6, 9),
    };
  }

  const hotTeams = sorted.slice(0, 3);
  const coldTeams = sorted.slice(-3);
  const midStart = Math.floor(sorted.length / 2) - 1;
  const stableTeams = sorted.slice(midStart, midStart + 3);

  return { hotTeams, stableTeams, coldTeams };
}

function formatMetricValue(value: number, metric: MetricType) {
  const v =
    metric === "momentum"
      ? Math.round(value * 10) / 10
      : Math.round(value * 10) / 10;

  const sign = v > 0 ? "+" : v < 0 ? "" : "";
  return `${sign}${v.toFixed(1)}`;
}

/* -------------------------------------------------------------------------- */
/*                                Sparkline Stub                              */
/* -------------------------------------------------------------------------- */

function SparklineStub({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative h-6 w-16 overflow-hidden rounded-md bg-gradient-to-b from-white/5 to-white/0/5 ${className}`}
    >
      <div className="absolute inset-x-1 bottom-1 top-[10px]">
        <div className="h-[2px] w-full rounded-full bg-white/10" />
      </div>
      <div className="absolute inset-x-1 top-2 flex gap-1">
        {/* three little zig-zag segments */}
        <div className="h-[10px] flex-1">
          <div className="h-full w-full -skew-x-[20deg] rounded-full bg-white/60 opacity-80" />
        </div>
        <div className="h-[12px] flex-1">
          <div className="h-full w-full -skew-x-[20deg] rounded-full bg-white/80 opacity-90" />
        </div>
        <div className="h-[9px] flex-1">
          <div className="h-full w-full -skew-x-[18deg] rounded-full bg-white/70 opacity-80" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Component                                */
/* -------------------------------------------------------------------------- */

export default function TeamFormGrid() {
  const [metric, setMetric] = useState<MetricType>("momentum");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { hotTeams, stableTeams, coldTeams } = useMemo(
    () => classifyTeamsByMetric(metric),
    [metric]
  );

  const handleToggle = (teamId: number) => {
    setExpandedId((current) => (current === teamId ? null : teamId));
  };

  return (
    <section className="mt-16">
      {/* Glass wrapper */}
      <div className="relative overflow-hidden rounded-[32px] border border-white/6 bg-gradient-to-b from-[#141414]/90 via-[#050505]/95 to-black/95 px-4 py-8 shadow-[0_0_80px_rgba(0,0,0,0.85)] sm:px-6 md:px-10 md:py-10">
        {/* soft corner vignette */}
        <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_top,_rgba(250,250,250,0.08),transparent_55%),radial-gradient(circle_at_bottom,_rgba(250,250,250,0.05),transparent_55%)] opacity-80" />

        {/* Content */}
        <div className="relative">
          {/* Header pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-[radial-gradient(circle_at_30%_0%,rgba(250,204,21,0.65),transparent_55%),radial-gradient(circle_at_80%_120%,rgba(234,179,8,0.4),transparent_55%)] px-4 py-1.5 shadow-[0_0_32px_rgba(250,204,21,0.75)]">
            <span className="h-2 w-2 rounded-full bg-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.9)]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-yellow-100">
              Team Form Grid
            </span>
          </div>

          {/* Title + copy */}
          <h2 className="mt-5 max-w-xl text-2xl font-semibold text-neutral-50 sm:text-3xl">
            Hot, stable and cold clubs by performance lens
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-neutral-400">
            Switch between momentum, fantasy, disposals and goals to see how
            each club is trending. Tap a pill on mobile or click a card on
            desktop to reveal a deeper analytics panel.
          </p>

          {/* Metric pills */}
          <MetricTabs metric={metric} onChange={setMetric} />

          {/* Category grid */}
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <CategoryColumn
              title="Hot teams"
              icon={<Flame className="h-4 w-4 text-yellow-300" />}
              category="hot"
              metric={metric}
              teams={hotTeams}
              expandedId={expandedId}
              onToggle={handleToggle}
            />
            <CategoryColumn
              title="Stable teams"
              icon={<CircleDot className="h-4 w-4 text-lime-300" />}
              category="stable"
              metric={metric}
              teams={stableTeams}
              expandedId={expandedId}
              onToggle={handleToggle}
            />
            <CategoryColumn
              title="Cold teams"
              icon={<Snowflake className="h-4 w-4 text-sky-300" />}
              category="cold"
              metric={metric}
              teams={coldTeams}
              expandedId={expandedId}
              onToggle={handleToggle}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Metric Tabs                                 */
/* -------------------------------------------------------------------------- */

function MetricTabs({
  metric,
  onChange,
}: {
  metric: MetricType;
  onChange: (m: MetricType) => void;
}) {
  const tabs: { key: MetricType; label: string }[] = [
    { key: "momentum", label: "Momentum" },
    { key: "fantasy", label: "Fantasy" },
    { key: "disposals", label: "Disposals" },
    { key: "goals", label: "Goals" },
  ];

  return (
    <div className="mt-6 inline-flex rounded-full bg-black/80 p-1 shadow-[0_0_40px_rgba(0,0,0,0.75)] ring-1 ring-white/5">
      {tabs.map((tab) => {
        const active = metric === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`relative flex-1 rounded-full px-5 py-2 text-center text-xs font-semibold uppercase tracking-[0.18em] transition-all md:px-7 md:text-[11px] ${
              active
                ? "text-yellow-50"
                : "text-neutral-400 hover:text-neutral-100"
            }`}
          >
            {active && (
              <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_0%,rgba(250,204,21,0.75),transparent_55%),radial-gradient(circle_at_80%_120%,rgba(234,179,8,0.7),transparent_60%)] shadow-[0_0_30px_rgba(250,204,21,0.7)]" />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Category Column                                */
/* -------------------------------------------------------------------------- */

function CategoryColumn({
  title,
  icon,
  category,
  teams,
  metric,
  expandedId,
  onToggle,
}: {
  title: string;
  icon: React.ReactNode;
  category: CategoryKey;
  teams: EnrichedTeam[];
  metric: MetricType;
  expandedId: number | null;
  onToggle: (id: number) => void;
}) {
  const color = CATEGORY_COLORS[category];

  return (
    <div className="relative">
      {/* subtle column header divider */}
      <div
        className={`mb-4 flex items-center gap-2 border-b border-white/5 pb-2 text-[11px] uppercase tracking-[0.2em] text-neutral-400`}
      >
        <span>{icon}</span>
        <span>{title}</span>
      </div>

      <div className="space-y-4">
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            metric={metric}
            category={category}
            isExpanded={expandedId === team.id}
            onToggle={() => onToggle(team.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Team Card                                  */
/* -------------------------------------------------------------------------- */

function TeamCard({
  team,
  metric,
  category,
  isExpanded,
  onToggle,
}: {
  team: EnrichedTeam;
  metric: MetricType;
  category: CategoryKey;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const color = CATEGORY_COLORS[category];
  const metricConfig = METRIC_CONFIG[metric];
  const rawValue = getMetricScore(team, metric);
  const widthPct = normalise(rawValue, metric);
  const displayValue = formatMetricValue(rawValue, metric);

  return (
    <div
      className={`relative rounded-3xl border border-white/6 bg-gradient-to-b from-neutral-950/95 via-black to-black/95 px-4 py-4 transition-all duration-200 hover:border-white/20 ${color.glow}`}
    >
      {/* halo */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_10%_-10%,rgba(255,255,255,0.18),transparent_55%),radial-gradient(circle_at_90%_120%,rgba(0,0,0,0.9),transparent_60%)] opacity-60" />

      <button
        type="button"
        onClick={onToggle}
        className="relative z-10 flex w-full flex-col gap-3 text-left"
      >
        {/* Top row: name + sparkline + badge */}
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-neutral-50 md:text-[15px]">
              {team.name}
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              {metricConfig.label}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SparklineStub />
            <div
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold ${color.badge}`}
            >
              <span>{displayValue}</span>
            </div>
            <span className="text-neutral-400">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </span>
          </div>
        </div>

        {/* Momentum bar */}
        <div className="mt-1">
          <div className="h-2 rounded-full bg-neutral-800/90">
            <div
              className={`h-2 rounded-full ${color.bar}`}
              style={{ width: `${widthPct}%` }}
            />
          </div>
        </div>
      </button>

      {/* Expanded analytics */}
      <div
        className={`relative z-10 overflow-hidden transition-all duration-200 ${
          isExpanded ? "mt-4 max-h-48 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {isExpanded && (
          <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-2 text-[11px] text-neutral-300 md:text-xs">
            <AnalyticsMetric
              label="Attack Δ"
              value={`${team.attackDelta > 0 ? "+" : ""}${team.attackDelta}`}
            />
            <AnalyticsMetric
              label="Defence Δ"
              value={`${team.defenceDelta > 0 ? "+" : ""}${team.defenceDelta}`}
            />
            <AnalyticsMetric
              label="Clearance %"
              value={`${Math.round(team.lastClearance)}%`}
            />
            <AnalyticsMetric
              label="Consistency"
              value={team.consistencyIndex.toString()}
            />
            <AnalyticsMetric
              label="Fixture diff"
              value={team.fixtureDifficulty.score.toString()}
            />
            <AnalyticsMetric
              label="Opponents"
              value={team.fixtureDifficulty.opponents.join(", ")}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyticsMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </div>
      <div className="mt-0.5 text-[11px] font-semibold text-neutral-50">
        {value}
      </div>
    </div>
  );
}
