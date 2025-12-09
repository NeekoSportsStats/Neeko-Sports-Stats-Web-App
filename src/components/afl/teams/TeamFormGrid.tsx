// src/components/afl/teams/TeamFormGrid.tsx
import React, { useMemo, useState } from "react";
import { MOCK_TEAMS, AFLTeam } from "./mockTeams";
import { Flame, CircleDot, Snowflake } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* TYPES & UTILS                                                              */
/* -------------------------------------------------------------------------- */

type MetricMode = "momentum" | "fantasy" | "disposals" | "goals";

const METRIC_LABELS: { id: MetricMode; label: string }[] = [
  { id: "momentum", label: "Momentum" },
  { id: "fantasy", label: "Fantasy" },
  { id: "disposals", label: "Disposals" },
  { id: "goals", label: "Goals" },
];

type CategoryTint = "hot" | "stable" | "cold";

type ClassifiedTeam = AFLTeam & {
  momentum: number;
  attackDelta: number;
  defenceDelta: number;
};

const lastN = (arr: number[], n: number) => arr.slice(-n);

const avg = (arr: number[]) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

/* -------------------------------------------------------------------------- */
/* METRIC / CLASSIFICATION LOGIC                                              */
/* -------------------------------------------------------------------------- */

function buildTeams(): ClassifiedTeam[] {
  const last = 22; // R23 idx
  const prev = 19; // R20 idx

  return MOCK_TEAMS.map((t) => {
    const momentum = t.margins[last] - t.margins[prev];
    const attackDelta = t.scores[last] - t.scores[last - 1];
    const defenceDelta = t.margins[last] - t.margins[last - 1];

    return { ...t, momentum, attackDelta, defenceDelta };
  }) as ClassifiedTeam[];
}

// NOTE: fantasy / disposals / goals are derived from existing mock data –
// we don't need extra fields on AFLTeam for this grid.
function getMetricValue(team: ClassifiedTeam, mode: MetricMode): number {
  switch (mode) {
    case "momentum": {
      return team.momentum;
    }
    case "fantasy": {
      // use attackRating as a proxy
      return team.attackRating;
    }
    case "disposals": {
      // use midfieldTrend last point as a proxy
      return team.midfieldTrend.at(-1) ?? 0;
    }
    case "goals": {
      // use recent scores delta as a proxy
      return team.scores[22] - team.scores[21];
    }
    default:
      return 0;
  }
}

function classifyTeamsByMode(
  teams: ClassifiedTeam[],
  mode: MetricMode
) {
  const scored = teams
    .map((t) => ({ team: t, value: getMetricValue(t, mode) }))
    .sort((a, b) => b.value - a.value);

  return {
    hot: scored.slice(0, 3).map((x) => x.team),
    stable: scored.slice(7, 10).map((x) => x.team),
    cold: scored.slice(-3).map((x) => x.team),
  };
}

/* -------------------------------------------------------------------------- */
/* MINI SPARKLINES (ATT / DEF / MID)                                          */
/* -------------------------------------------------------------------------- */

function SparklineStrip({
  label,
  trendValues,
}: {
  label: string;
  trendValues: number[];
}) {
  const tone =
    label === "Attack"
      ? "from-yellow-400/70 via-yellow-300/50"
      : label === "Defence"
      ? "from-sky-400/70 via-sky-300/50"
      : "from-emerald-400/70 via-emerald-300/50";

  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </div>
      <div
        className={`h-1.5 w-full rounded-full bg-gradient-to-r ${tone} to-transparent shadow-[0_0_10px_rgba(0,0,0,0.8)]`}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN SECTION                                                                */
/* -------------------------------------------------------------------------- */

export default function TeamFormGrid() {
  const [mode, setMode] = useState<MetricMode>("momentum");

  const teams = useMemo(() => buildTeams(), []);
  const { hot, stable, cold } = useMemo(
    () => classifyTeamsByMode(teams, mode),
    [teams, mode]
  );

  return (
    <section className="mt-12 rounded-3xl border border-yellow-500/14 bg-gradient-to-b from-neutral-950/95 via-black/96 to-black px-4 py-8 shadow-[0_0_80px_rgba(0,0,0,0.75)] md:px-8 md:py-10">
      {/* Header pill */}
      <div
        className="inline-flex items-center gap-2 rounded-full border border-yellow-500/55
        bg-gradient-to-r from-yellow-500/25 via-yellow-500/10 to-transparent px-4 py-1.5
        shadow-[0_0_26px_rgba(250,204,21,0.35)]"
      >
        <span className="h-2 w-2 rounded-full bg-yellow-300 shadow-[0_0_14px_rgba(250,204,21,0.95)]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-yellow-200">
          Team Form Grid
        </span>
      </div>

      <h2 className="mt-4 text-xl font-semibold text-neutral-50 md:text-2xl">
        Hot, stable and cold clubs by performance lens
      </h2>

      <p className="mt-2 max-w-2xl text-xs text-neutral-400">
        Switch between momentum, fantasy, disposals and goals to see how each
        club is trending. Tap a club pill to flip into a deeper analytics view.
      </p>

      <div className="mt-3 h-px w-40 bg-gradient-to-r from-yellow-500/90 via-yellow-300/60 to-transparent" />

      {/* Metric tabs */}
      <div className="mt-6 flex overflow-x-auto rounded-full border border-neutral-800 bg-black/80 p-1 text-xs">
        {METRIC_LABELS.map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 font-medium transition-all ${
                active
                  ? "bg-yellow-500/20 text-yellow-300 shadow-[0_0_14px_rgba(250,204,21,0.4)]"
                  : "text-neutral-400 hover:text-neutral-100"
              }`}
            >
              {m.label.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Categories grid */}
      <div className="mt-10 grid gap-8 md:gap-6 lg:grid-cols-3">
        <CategoryColumn
          title="Hot Teams"
          icon={
            <Flame className="h-4 w-4 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
          }
          tint="hot"
          teams={hot}
          mode={mode}
        />

        <CategoryColumn
          title="Stable Teams"
          icon={
            <CircleDot className="h-4 w-4 text-lime-300 drop-shadow-[0_0_8px_rgba(190,242,100,0.8)]" />
          }
          tint="stable"
          teams={stable}
          mode={mode}
        />

        <CategoryColumn
          title="Cold Teams"
          icon={
            <Snowflake className="h-4 w-4 text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
          }
          tint="cold"
          teams={cold}
          mode={mode}
        />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* CATEGORY COLUMN                                                             */
/* -------------------------------------------------------------------------- */

function CategoryColumn({
  title,
  icon,
  tint,
  teams,
  mode,
}: {
  title: string;
  icon: React.ReactNode;
  tint: CategoryTint;
  teams: ClassifiedTeam[];
  mode: MetricMode;
}) {
  const dividerGradient =
    tint === "hot"
      ? "from-amber-400/65 via-amber-300/35 to-transparent"
      : tint === "stable"
      ? "from-lime-400/65 via-lime-300/35 to-transparent"
      : "from-sky-400/65 via-sky-300/35 to-transparent";

  return (
    <div className="flex flex-col gap-3">
      {/* Divider + label */}
      <div className="space-y-3">
        <div className={`h-px w-full bg-gradient-to-r ${dividerGradient}`} />
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">
            {title}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3 md:space-y-3.5">
        {teams.map((team) => (
          <FlipCard key={`${team.code}-${mode}`} team={team} tint={tint} mode={mode} />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FLIP CARD                                                                   */
/* -------------------------------------------------------------------------- */

function FlipCard({
  team,
  tint,
  mode,
}: {
  team: ClassifiedTeam;
  tint: CategoryTint;
  mode: MetricMode;
}) {
  const [flipped, setFlipped] = useState(false);

  const metricLabel = METRIC_LABELS.find((m) => m.id === mode)?.label ?? "";
  const metricValue = getMetricValue(team, mode);

  const barTint =
    tint === "hot"
      ? "from-amber-400/30 via-amber-400/12"
      : tint === "stable"
      ? "from-lime-400/30 via-lime-400/12"
      : "from-sky-400/30 via-sky-400/12";

  const borderTint =
    tint === "hot"
      ? "border-amber-400/40"
      : tint === "stable"
      ? "border-lime-400/40"
      : "border-sky-400/40";

  const shadowTint =
    tint === "hot"
      ? "shadow-[0_0_30px_rgba(251,191,36,0.35)]"
      : tint === "stable"
      ? "shadow-[0_0_30px_rgba(74,222,128,0.35)]"
      : "shadow-[0_0_30px_rgba(56,189,248,0.4)]";

  // analytics (Option B)
  const clearanceLast5 = avg(lastN(team.clearanceDom, 5));
  const { score: fixtureScore, opponents } = team.fixtureDifficulty;

  return (
    <div
      className={`group relative rounded-full border bg-neutral-950/95 px-3 py-2.5 md:px-4 md:py-3
      ${borderTint} ${shadowTint} overflow-hidden`}
    >
      {/* Pulsing glow halo */}
      <div
        className={`pointer-events-none absolute inset-0 opacity-40 blur-2xl
        bg-gradient-to-r ${barTint} to-transparent animate-[ping_3s_ease-in-out_infinite]`}
      />

      {/* Hover ripple (desktop only) */}
      <div className="pointer-events-none absolute inset-0 opacity-0 md:group-hover:opacity-40 md:group-hover:scale-105 transition-all duration-500 bg-radial-at-tl from-white/6 via-transparent to-transparent" />

      {/* Flip container */}
      <button
        type="button"
        className="relative block h-full w-full text-left [perspective:1200px] md:cursor-pointer"
        onClick={() => setFlipped((v) => !v)}
      >
        <div
          className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]
            md:group-hover:[transform:rotateY(180deg)]
            ${flipped ? "[transform:rotateY(180deg)]" : ""}`}
        >
          {/* FRONT: compact glow pill */}
          <div className="absolute inset-0 flex items-center justify-between gap-3 [backface-visibility:hidden]">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: team.colours.primary }}
                />
                <span className="truncate text-sm font-semibold text-neutral-50">
                  {team.name}
                </span>
              </div>

              <div
                className={`flex items-center gap-2 rounded-full border border-neutral-800/80 bg-gradient-to-r ${barTint} to-neutral-900/90 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-neutral-300 shadow-[0_0_15px_rgba(0,0,0,0.75)]`}
              >
                <span className="truncate">
                  {metricLabel.toUpperCase()} · LAST 5
                </span>
                <span className="ml-auto text-[11px] font-semibold text-yellow-200">
                  {metricValue >= 0 ? "+" : ""}
                  {metricValue.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="hidden flex-col items-end text-[10px] text-neutral-400 sm:flex">
              <span className="uppercase tracking-[0.16em]">Tap to</span>
              <span className="uppercase tracking-[0.16em] text-neutral-200">
                View analytics
              </span>
            </div>
          </div>

          {/* BACK: analytics view (Option B) */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-neutral-950 via-black/95 to-neutral-900/98 px-4 py-3 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="flex h-full flex-col justify-between gap-2">
              {/* Heading */}
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-neutral-50">
                    {team.name} analytics
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    {metricLabel} form snapshot
                  </div>
                </div>
                <div
                  className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-950
                  ${
                    tint === "hot"
                      ? "bg-amber-300"
                      : tint === "stable"
                      ? "bg-lime-300"
                      : "bg-sky-300"
                  }`}
                >
                  {tint}
                </div>
              </div>

              {/* Sparkline trio */}
              <div className="mt-1 grid grid-cols-3 gap-3">
                <SparklineStrip label="Attack" trendValues={team.attackTrend} />
                <SparklineStrip label="Defence" trendValues={team.defenceTrend} />
                <SparklineStrip label="Midfield" trendValues={team.midfieldTrend} />
              </div>

              {/* Stats stack */}
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-neutral-300">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Attack Δ (last rd)
                  </div>
                  <div
                    className={`mt-0.5 font-semibold ${
                      team.attackDelta >= 0 ? "text-lime-300" : "text-red-300"
                    }`}
                  >
                    {team.attackDelta >= 0 ? "+" : ""}
                    {team.attackDelta}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Defence Δ (last rd)
                  </div>
                  <div
                    className={`mt-0.5 font-semibold ${
                      team.defenceDelta >= 0 ? "text-lime-300" : "text-red-300"
                    }`}
                  >
                    {team.defenceDelta >= 0 ? "+" : ""}
                    {team.defenceDelta}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Clearance% (last 5)
                  </div>
                  <div className="mt-0.5 font-semibold text-amber-200">
                    {clearanceLast5.toFixed(1)}%
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Consistency Index
                  </div>
                  <div className="mt-0.5 font-semibold text-sky-200">
                    {team.consistencyIndex}/100
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Fixture Difficulty
                  </div>
                  <div className="mt-0.5 font-semibold text-neutral-200">
                    {fixtureScore}/100
                  </div>
                </div>

                <div className="truncate">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Next 3 Opponents
                  </div>
                  <div className="mt-0.5 text-[10px] text-neutral-300">
                    {opponents.join(" • ")}
                  </div>
                </div>
              </div>

              <div className="mt-1 text-[10px] text-neutral-500">
                Tap again to flip back. Full club breakdown lives on the team profile page.
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}