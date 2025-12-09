// IMPORTS
import React, { useMemo, useState } from "react";
import { MOCK_TEAMS, AFLTeam } from "./mockTeams";
import { Flame, CircleDot, Snowflake } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

const METRICS = ["momentum", "fantasy", "disposals", "goals"] as const;
type Metric = (typeof METRICS)[number];
type Variant = "hot" | "stable" | "cold";

interface ClassifiedTeams {
  hot: AFLTeam[];
  stable: AFLTeam[];
  cold: AFLTeam[];
}

/* -------------------------------------------------------------------------- */
/*                        Metric + Fake Data Logic                            */
/* -------------------------------------------------------------------------- */

function getBaseMomentum(team: AFLTeam): number {
  const last5 = team.margins.slice(-5);
  return last5.reduce((a, b) => a + b, 0) / last5.length;
}

function metricJitter(team: AFLTeam, metric: Metric): number {
  const seed =
    team.id *
    (metric === "fantasy"
      ? 1.7
      : metric === "disposals"
      ? 2.3
      : metric === "goals"
      ? 3.1
      : 0.9);
  return Math.sin(seed) * 6;
}

function getMetricScore(team: AFLTeam, metric: Metric): number {
  const base = getBaseMomentum(team);
  if (metric === "momentum") return base;
  if (metric === "fantasy") return base * 0.7 + metricJitter(team, metric);
  if (metric === "disposals") return base * 0.5 + metricJitter(team, metric);
  return base * 0.35 + metricJitter(team, metric);
}

function classifyTeams(metric: Metric): ClassifiedTeams {
  const sorted = [...MOCK_TEAMS].sort(
    (a, b) => getMetricScore(b, metric) - getMetricScore(a, metric)
  );

  return {
    hot: sorted.slice(0, 3),
    stable: sorted.slice(8, 11),
    cold: sorted.slice(-3),
  };
}

/* -------------------------------------------------------------------------- */
/*                              Colour System                                 */
/* -------------------------------------------------------------------------- */

// CRIMSON HOT THEME (#D72638)
const CRIMSON = "#D72638";

const badgeStyles: Record<Variant, string> = {
  hot: `
    bg-[rgba(215,38,56,0.22)]
    border border-[rgba(215,38,56,0.45)]
    text-[rgba(255,220,220,0.95)]
    shadow-[0_0_14px_rgba(215,38,56,0.55)]
    ring-1 ring-[rgba(215,38,56,0.45)]
  `,
  stable: `
    bg-emerald-400/15 border border-emerald-400/30
    text-lime-200 shadow-[0_0_12px_rgba(80,255,170,0.45)]
  `,
  cold: `
    bg-sky-400/15 border border-sky-400/30
    text-sky-200 shadow-[0_0_12px_rgba(0,180,255,0.45)]
  `,
};

// Halo with mobile/deskop balance
const variantHalo: Record<Variant, string> = {
  hot:
    "shadow-[0_0_12px_rgba(215,38,56,0.22)] md:shadow-[0_0_20px_rgba(215,38,56,0.32)]",
  stable:
    "shadow-[0_0_14px_rgba(80,255,170,0.22)] md:shadow-[0_0_20px_rgba(80,255,170,0.32)]",
  cold:
    "shadow-[0_0_14px_rgba(0,180,255,0.22)] md:shadow-[0_0_20px_rgba(0,180,255,0.32)]",
};

/* -------------------------------------------------------------------------- */
/*                              Utility Helpers                               */
/* -------------------------------------------------------------------------- */

const metricLabels: Record<Metric, string> = {
  momentum: "Momentum · Last 5",
  fantasy: "Fantasy edge",
  disposals: "Disposals edge",
  goals: "Goals edge",
};

const metricPrefix: Record<Metric, string> = {
  momentum: "Momentum",
  fantasy: "Fantasy",
  disposals: "Disposals",
  goals: "Goals",
};

function formatMetric(value: number): string {
  const x = Math.round(value * 10) / 10;
  return `${x > 0 ? "+" : ""}${x.toFixed(1)}`;
}

function intensityWidth(value: number): string {
  const v = Math.max(-40, Math.min(40, value));
  const pct = (Math.abs(v) / 40) * 100;
  return `${Math.max(6, Math.min(100, pct))}%`;
}

/* -------------------------------------------------------------------------- */
/*                            Premium Sparkline                               */
/* -------------------------------------------------------------------------- */

function SoftZigZagSparkline({ variant }: { variant: Variant }) {
  const color =
    variant === "hot"
      ? "text-[rgba(215,38,56,0.9)]"
      : variant === "stable"
      ? "text-lime-300"
      : "text-sky-300";

  return (
    <div className={`h-5 w-full ${color}`}>
      <svg viewBox="0 0 100 24" className="h-full w-full opacity-90">
        <path
          d="M0 14 L14 8 L28 12 L42 6 L56 11 L70 9 L84 14 L100 9"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                           Main Component                                   */
/* -------------------------------------------------------------------------- */

export default function TeamFormGrid() {
  const [metric, setMetric] = useState<Metric>("momentum");
  const classified = useMemo(() => classifyTeams(metric), [metric]);

  return (
    <section className="mt-16">

      <div className="rounded-[32px] border border-neutral-800/40 bg-gradient-to-b from-black/40 via-black/70 to-black/90 px-4 py-8 sm:px-6 md:px-10 lg:px-12">

        {/* Header */}
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-400/15 px-4 py-1 shadow-[0_0_26px_rgba(250,204,21,0.55)] backdrop-blur-[2px]">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_9px_rgba(250,204,21,1)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-yellow-50">
            Team Form Grid
          </span>
        </div>

        <h2 className="mt-5 text-2xl font-semibold text-neutral-50 sm:text-3xl md:text-[32px]">
          Hot, stable and cold clubs by performance lens
        </h2>

        <p className="mt-3 max-w-3xl text-xs text-neutral-400 sm:text-sm">
          Switch between lenses. Tap cards for deeper analytics.
        </p>

        {/* Metric Tabs */}
        <div className="mt-6 inline-flex rounded-full bg-black/60 p-1 ring-1 ring-yellow-500/25 shadow-[0_0_34px_rgba(250,204,21,0.32)] backdrop-blur-sm">
          {METRICS.map((m) => {
            const active = metric === m;
            return (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`relative flex min-w-[92px] flex-1 items-center justify-center rounded-full px-4 py-2 text-xs font-semibold transition ${
                  active
                    ? "text-black"
                    : "text-neutral-400 hover:text-neutral-100"
                }`}
              >
                {active && (
                  <span className="absolute inset-0 rounded-full bg-yellow-400/55 shadow-[0_0_44px_rgba(250,204,21,0.8)] ring-1 ring-yellow-300/40" />
                )}
                <span className="relative z-10 capitalize">
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Columns */}
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <FormColumn
            variant="hot"
            title="Hot Teams"
            icon={
              <Flame className="h-4 w-4 text-[rgba(215,38,56,0.9)] drop-shadow-[0_0_7px_rgba(215,38,56,0.7)]" />
            }
            teams={classified.hot}
            metric={metric}
          />

          <FormColumn
            variant="stable"
            title="Stable Teams"
            icon={
              <CircleDot className="h-4 w-4 text-lime-300 drop-shadow-[0_0_6px_rgba(80,255,170,0.7)]" />
            }
            teams={classified.stable}
            metric={metric}
          />

          <FormColumn
            variant="cold"
            title="Cold Teams"
            icon={
              <Snowflake className="h-4 w-4 text-sky-300 drop-shadow-[0_0_6px_rgba(0,180,255,0.7)]" />
            }
            teams={classified.cold}
            metric={metric}
          />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                           Column Component                                 */
/* -------------------------------------------------------------------------- */

function FormColumn({
  variant,
  title,
  icon,
  teams,
  metric,
}: {
  variant: Variant;
  title: string;
  icon: React.ReactNode;
  teams: AFLTeam[];
  metric: Metric;
}) {
  const color =
    variant === "hot"
      ? "text-[rgba(215,38,56,0.9)]"
      : variant === "stable"
      ? "text-lime-200"
      : "text-sky-200";

  const divider =
    variant === "hot"
      ? "from-[rgba(215,38,56,0.7)] shadow-[0_0_20px_rgba(215,38,56,0.35)]"
      : variant === "stable"
      ? "from-lime-500/60 shadow-[0_0_16px_rgba(80,255,170,0.3)]"
      : "from-sky-500/60 shadow-[0_0_16px_rgba(0,180,255,0.3)]";

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-neutral-400">
        {icon}
        <span className={`font-semibold ${color}`}>{title}</span>
      </div>

      <div className={`mb-4 h-px bg-gradient-to-r ${divider}`} />

      <div className="space-y-4">
        {teams.map((team) => (
          <TeamFormCard
            key={`${team.code}-${metric}`}
            variant={variant}
            team={team}
            metric={metric}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Team Card                                    */
/* -------------------------------------------------------------------------- */

function TeamFormCard({
  variant,
  team,
  metric,
}: {
  variant: Variant;
  team: AFLTeam;
  metric: Metric;
}) {
  const [flipped, setFlipped] = useState(false);

  const score = getMetricScore(team, metric);
  const formattedScore = formatMetric(score);
  const barWidth = intensityWidth(score);

  const attackDelta =
    team.scores[team.scores.length - 1] - team.scores[team.scores.length - 2];

  const defenceDelta =
    team.margins[team.margins.length - 1] -
    team.margins[team.margins.length - 2];

  const clearance = team.clearanceDom[team.clearanceDom.length - 1];
  const consistency = team.consistencyIndex;

  return (
    <div
      className={`relative min-h-[185px] cursor-pointer rounded-2xl border border-neutral-700/40 bg-black/90 backdrop-blur-[2px] transform-gpu transition duration-300 ${variantHalo[variant]}`}
      onClick={() => setFlipped(!flipped)}
    >
      <div
        className={`relative h-full w-full transform-gpu transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* FRONT */}
        <div className="absolute inset-0 flex h-full flex-col justify-between px-4 py-3 [backface-visibility:hidden]">

          {/* Top */}
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[15px] font-semibold text-neutral-50 leading-tight">
                {team.name}
              </div>
              <div className="mt-[2px] text-[9px] uppercase text-neutral-500 tracking-[0.14em]">
                {metricLabels[metric]}
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div
                className={`${badgeStyles[variant]} inline-flex items-center rounded-full px-1 py-[1px] text-[8.5px] font-semibold`}
              >
                {formattedScore}
              </div>
            </div>
          </div>

          {/* Sparkline */}
          <div className="mt-1 mb-1">
            <SoftZigZagSparkline variant={variant} />
          </div>

          {/* Bar */}
          <div className="">
            <div className="relative h-2 w-full rounded-full bg-neutral-800/85 overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${
                  variant === "hot"
                    ? "from-[rgba(215,38,56,0.7)] to-[rgba(215,38,56,1)]"
                    : variant === "stable"
                    ? "from-lime-300 to-emerald-400"
                    : "from-sky-300 to-cyan-400"
                }`}
                style={{ width: barWidth }}
              />
            </div>
          </div>

          {/* Footer row */}
          <div className="mt-3 flex items-center justify-between text-[8.5px] text-neutral-500 uppercase tracking-[0.14em]">
            <span>{metricLabels[metric]}</span>
            <span className="flex items-center gap-1 text-neutral-400">
              <span className="hidden sm:inline">Analytics</span>
              <span className="text-[11px]">↺</span>
            </span>
          </div>
        </div>

        {/* BACK */}
        <div className="absolute inset-0 flex h-full flex-col justify-between rounded-xl border border-white/5 bg-black/60 px-4 py-4 backdrop-blur-[4px] [backface-visibility:hidden] [transform:rotateY(180deg)]">

          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="text-sm font-semibold text-neutral-50 leading-tight">
                {team.name}
              </div>
              <div className="mt-[2px] text-[8px] md:text-[9px] uppercase text-neutral-500 tracking-[0.16em]">
                {metricPrefix[metric]} snapshot
              </div>
            </div>

            <div
              className={`text-[11px] font-semibold ${
                variant === "hot"
                  ? "text-[rgba(215,38,56,0.9)]"
                  : variant === "stable"
                  ? "text-lime-200"
                  : "text-sky-200"
              }`}
            >
              {formattedScore}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mt-3 grid grid-cols-3 gap-y-2 gap-x-4 text-[10px] md:text-[11px] text-neutral-300 leading-tight">

            {/* Attack */}
            <div>
              <div className="text-[7px] md:text-[8px] uppercase text-neutral-500 tracking-[0.14em]">
                Attack Δ
              </div>
              <div className="font-semibold">
                {attackDelta >= 0 ? "+" : ""}
                {attackDelta}
              </div>
            </div>

            {/* Defence */}
            <div>
              <div className="text-[7px] md:text-[8px] uppercase text-neutral-500 tracking-[0.14em]">
                Defence Δ
              </div>
              <div className="font-semibold">
                {defenceDelta >= 0 ? "+" : ""}
                {defenceDelta}
              </div>
            </div>

            {/* Clearance */}
            <div>
              <div className="text-[7px] md:text-[8px] uppercase text-neutral-500 tracking-[0.14em]">
                Clear %
              </div>
              <div className="font-semibold">{clearance}%</div>
            </div>

            {/* Consistency */}
            <div>
              <div className="text-[7px] md:text-[8px] uppercase text-neutral-500 tracking-[0.14em]">
                Consist.
              </div>
              <div className="font-semibold">{consistency}</div>
            </div>

            {/* Pressure (placeholder) */}
            <div>
              <div className="text-[7px] md:text-[8px] uppercase text-neutral-500 tracking-[0.14em]">
                Pressure
              </div>
              <div className="font-semibold">+3</div>
            </div>

            {/* Fixture Score */}
            <div>
              <div className="text-[7px] md:text-[8px] uppercase text-neutral-500 tracking-[0.14em]">
                Fixture
              </div>
              <div className="font-semibold">
                {team.fixtureDifficulty.score}
              </div>
            </div>
          </div>

          {/* Opponents */}
          <div className="mt-3">
            <div className="text-[7px] md:text-[8px] uppercase text-neutral-500 tracking-[0.14em]">
              Opponents
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {team.fixtureDifficulty.opponents.map((op) => (
                <code
                  key={op}
                  className="rounded bg-white/5 px-1.5 py-[1px] text-[7px] md:text-[8px] text-neutral-300"
                >
                  {op}
                </code>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}