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
/*                              Visual Helpers                                */
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

const badgeStyles: Record<Variant, string> = {
  hot: "bg-yellow-400/20 border border-yellow-400/30 text-yellow-200 shadow-[0_0_8px_rgba(255,220,0,0.25)] backdrop-blur-[2px]",
  stable:
    "bg-emerald-400/20 border border-emerald-400/30 text-lime-200 shadow-[0_0_8px_rgba(80,255,170,0.22)] backdrop-blur-[2px]",
  cold: "bg-sky-400/20 border border-sky-400/30 text-sky-200 shadow-[0_0_8px_rgba(0,170,255,0.22)] backdrop-blur-[2px]",
};

const variantHalo: Record<Variant, string> = {
  hot: "shadow-[0_0_30px_rgba(250,204,21,0.15)]",
  stable: "shadow-[0_0_30px_rgba(74,222,128,0.15)]",
  cold: "shadow-[0_0_30px_rgba(56,189,248,0.15)]",
};

function formatMetric(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(1)}`;
}

function intensityWidth(value: number): string {
  const clamped = Math.max(-40, Math.min(40, value));
  const pct = (Math.abs(clamped) / 40) * 100;
  return `${Math.max(6, Math.min(100, pct))}%`;
}

/* -------------------------------------------------------------------------- */
/*                             Zigzag Sparkline                               */
/* -------------------------------------------------------------------------- */

function SoftZigZagSparkline({ variant }: { variant: Variant }) {
  const color =
    variant === "hot"
      ? "text-yellow-300"
      : variant === "stable"
      ? "text-lime-300"
      : "text-sky-300";

  return (
    <div className={`h-5 w-14 ${color}`}>
      <svg viewBox="0 0 100 24" className="h-full w-full opacity-90">
        <path
          d="M0 16 L14 8 L28 13 L42 6 L56 12 L70 9 L84 15 L100 10"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Main TeamFormGrid Component                        */
/* -------------------------------------------------------------------------- */

export default function TeamFormGrid() {
  const [metric, setMetric] = useState<Metric>("momentum");
  const classified = useMemo(() => classifyTeams(metric), [metric]);

  return (
    <section className="mt-16">
      <div className="rounded-[32px] border border-yellow-500/12 bg-gradient-to-b from-yellow-900/10 via-black/70 to-black/95 px-4 py-8 sm:px-6 md:px-10 lg:px-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-[rgba(250,204,21,0.25)] px-4 py-1 backdrop-blur-[2px] shadow-[0_0_20px_rgba(250,204,21,0.3)]">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-50">
            Team Form Grid
          </span>
        </div>

        <h2 className="mt-5 text-2xl font-semibold text-neutral-50 sm:text-3xl md:text-[32px]">
          Hot, stable and cold clubs by performance lens
        </h2>

        <p className="mt-3 max-w-3xl text-xs text-neutral-400 sm:text-sm">
          Switch between different lenses to reveal movement and trends.
          Click cards to reveal deeper analytics.
        </p>

        <div className="mt-6 inline-flex rounded-full bg-black/70 p-1 ring-1 ring-neutral-800/70">
          {METRICS.map((m) => {
            const active = metric === m;
            return (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`relative flex min-w-[92px] flex-1 items-center justify-center rounded-full px-4 py-2 text-xs font-semibold ${
                  active
                    ? "text-black"
                    : "text-neutral-400 hover:text-neutral-100"
                }`}
              >
                {active && (
                  <span className="absolute inset-0 rounded-full bg-yellow-400/40 shadow-[0_0_20px_rgba(250,204,21,0.4)]" />
                )}
                <span className="relative z-10 capitalize">
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <FormColumn
            variant="hot"
            title="Hot teams"
            icon={<Flame className="h-4 w-4 text-yellow-300" />}
            teams={classified.hot}
            metric={metric}
          />
          <FormColumn
            variant="stable"
            title="Stable teams"
            icon={<CircleDot className="h-4 w-4 text-lime-300" />}
            teams={classified.stable}
            metric={metric}
          />
          <FormColumn
            variant="cold"
            title="Cold teams"
            icon={<Snowflake className="h-4 w-4 text-sky-300" />}
            teams={classified.cold}
            metric={metric}
          />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Column Component                                  */
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
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-neutral-400">
        {icon}
        <span
          className={`font-semibold ${
            variant === "hot"
              ? "text-yellow-200"
              : variant === "stable"
              ? "text-lime-200"
              : "text-sky-200"
          }`}
        >
          {title}
        </span>
      </div>

      <div
        className={`mb-4 h-px bg-gradient-to-r ${
          variant === "hot"
            ? "from-yellow-400/40"
            : variant === "stable"
            ? "from-lime-400/40"
            : "from-sky-400/40"
        }`}
      />

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
      className={`relative min-h-[176px] h-auto pb-1 cursor-pointer rounded-2xl border border-neutral-700/40 bg-black/90 backdrop-blur-[1px] transform-gpu transition duration-300 ${
        variantHalo[variant]
      }`}
      onClick={() => setFlipped(!flipped)}
    >
      <div
        className={`relative h-full w-full transform-gpu transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* FRONT */}
        <div className="absolute inset-0 h-full flex flex-col justify-between px-4 py-4 [backface-visibility:hidden]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-neutral-50">
                {team.name}
              </div>
              <div className="mt-1 text-[10px] uppercase text-neutral-500 tracking-[0.16em]">
                {metricLabels[metric]}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <SoftZigZagSparkline variant={variant} />
              <div
                className={`${badgeStyles[variant]} inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[10px] font-semibold`}
              >
                {formattedScore}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="relative h-1.5 w-full rounded-full bg-neutral-800/80 overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${
                  variant === "hot"
                    ? "from-yellow-300 to-yellow-400"
                    : variant === "stable"
                    ? "from-lime-300 to-emerald-400"
                    : "from-sky-300 to-cyan-400"
                }`}
                style={{ width: barWidth }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px] text-neutral-500 uppercase tracking-[0.16em]">
            <span>{metricLabels[metric]}</span>
            <span className="flex items-center gap-1 text-[9px] text-neutral-400">
              <span className="hidden sm:inline">Analytics</span>
              <span className="text-xs">↺</span>
            </span>
          </div>
        </div>

        {/* BACK */}
        <div className="absolute inset-0 h-full px-4 py-3 bg-black/60 backdrop-blur-[3px] border border-white/5 rounded-xl flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-neutral-50">
                {team.name}
              </div>
              <div className="mt-1 text-[10px] uppercase text-neutral-500 tracking-[0.16em]">
                {metricPrefix[metric]} analytics snapshot
              </div>
            </div>

            <div
              className={`text-[10px] font-semibold ${
                variant === "hot"
                  ? "text-yellow-200"
                  : variant === "stable"
                  ? "text-lime-200"
                  : "text-sky-200"
              }`}
            >
              {formattedScore}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-y-1.5 gap-x-4 text-[11px] text-neutral-300 leading-tight">
            <div>
              <div className="text-[10px] uppercase text-neutral-500 tracking-[0.16em]">
                Attack Δ
              </div>
              <div className="mt-1 font-semibold">
                {attackDelta >= 0 ? "+" : ""}
                {attackDelta}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase text-neutral-500 tracking-[0.16em]">
                Defence Δ
              </div>
              <div className="mt-1 font-semibold">
                {defenceDelta >= 0 ? "+" : ""}
                {defenceDelta}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase text-neutral-500 tracking-[0.16em]">
                Clearance %
              </div>
              <div className="mt-1 font-semibold">{clearance}%</div>
            </div>

            <div>
              <div className="text-[10px] uppercase text-neutral-500 tracking-[0.16em]">
                Consistency
              </div>
              <div className="mt-1 font-semibold">{consistency}</div>
            </div>

            <div className="col-span-2">
              <div className="text-[10px] uppercase text-neutral-500 tracking-[0.16em]">
                Opponents
              </div>
              <div className="mt-1 flex gap-1">
                {team.fixtureDifficulty.opponents.map((op) => (
                  <code
                    key={op}
                    className="rounded bg-white/5 px-1.5 py-[1px] text-[10px] text-neutral-300"
                  >
                    {op}
                  </code>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-neutral-500 uppercase tracking-[0.16em]">
            <span>Tap to return</span>
            <span className="text-xs">↺</span>
          </div>
        </div>
      </div>
    </div>
  );
}
