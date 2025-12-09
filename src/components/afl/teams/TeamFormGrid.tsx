// src/components/afl/teams/TeamFormGrid.tsx

import React, { useMemo, useState } from "react";
import { MOCK_TEAMS, AFLTeam } from "./mockTeams";
import { Flame, CircleDot, Snowflake } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

const METRICS = ["momentum", "fantasy", "disposals", "goals"] as const;
type Metric = (typeof METRICS)[number];

type Variant = "hot" | "stable" | "cold";

type ClassifiedTeams = {
  hot: AFLTeam[];
  stable: AFLTeam[];
  cold: AFLTeam[];
};

/* -------------------------------------------------------------------------- */
/*                           Metric + Fake Data Logic                          */
/* -------------------------------------------------------------------------- */

function getBaseMomentum(team: AFLTeam): number {
  const last5 = team.margins.slice(-5);
  const avg = last5.reduce((a, b) => a + b, 0) / last5.length;
  return avg;
}

// deterministic “fake” jitter based on id + metric
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
  return Math.sin(seed) * 6; // -6 to +6
}

function getMetricScore(team: AFLTeam, metric: Metric): number {
  const base = getBaseMomentum(team);

  switch (metric) {
    case "momentum":
      return base;
    case "fantasy":
      return base * 0.7 + metricJitter(team, metric);
    case "disposals":
      return base * 0.5 + metricJitter(team, metric);
    case "goals":
      return base * 0.35 + metricJitter(team, metric);
    default:
      return base;
  }
}

function classifyTeams(metric: Metric): ClassifiedTeams {
  const sorted = [...MOCK_TEAMS].sort(
    (a, b) => getMetricScore(b, metric) - getMetricScore(a, metric)
  );

  // 18 teams → 3 hot / 3 stable (middle) / 3 cold
  const hot = sorted.slice(0, 3);
  const stableStart = Math.floor(sorted.length / 2) - 1; // around the middle
  const stable = sorted.slice(stableStart, stableStart + 3);
  const cold = sorted.slice(-3);

  return { hot, stable, cold };
}

/* -------------------------------------------------------------------------- */
/*                            Small Visual Helpers                             */
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

const variantClasses: Record<
  Variant,
  {
    halo: string;
    bar: string;
    accent: string;
    badge: string;
  }
> = {
  hot: {
    halo: "shadow-[0_0_40px_rgba(250,204,21,0.18)]",
    bar: "from-yellow-300 to-yellow-400",
    accent: "text-yellow-200",
    badge:
      "border-yellow-400/60 bg-[radial-gradient(circle_at_30%_0,rgba(250,204,21,0.45),transparent_55%),linear-gradient(to_right,rgba(250,204,21,0.15),rgba(0,0,0,0.6))]",
  },
  stable: {
    halo: "shadow-[0_0_40px_rgba(74,222,128,0.18)]",
    bar: "from-lime-300 to-emerald-400",
    accent: "text-lime-200",
    badge:
      "border-lime-400/60 bg-[radial-gradient(circle_at_30%_0,rgba(74,222,128,0.45),transparent_55%),linear-gradient(to_right,rgba(74,222,128,0.15),rgba(0,0,0,0.6))]",
  },
  cold: {
    halo: "shadow-[0_0_40px_rgba(56,189,248,0.2)]",
    bar: "from-sky-300 to-cyan-400",
    accent: "text-sky-200",
    badge:
      "border-sky-400/60 bg-[radial-gradient(circle_at_30%_0,rgba(56,189,248,0.45),transparent_55%),linear-gradient(to_right,rgba(56,189,248,0.15),rgba(0,0,0,0.6))]",
  },
};

function formatMetric(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(1)}`;
}

function intensityWidth(value: number): string {
  const clamped = Math.max(-40, Math.min(40, value));
  const width = (Math.abs(clamped) / 40) * 100;
  return `${Math.max(6, Math.min(100, width))}%`;
}

/* -------------------------------------------------------------------------- */
/*                              Sparkline (zigzag)                             */
/* -------------------------------------------------------------------------- */

function SoftZigZagSparkline({ variant }: { variant: Variant }) {
  const colorClass =
    variant === "hot"
      ? "text-yellow-300"
      : variant === "stable"
      ? "text-lime-300"
      : "text-sky-300";

  return (
    <div className={`h-5 w-14 md:w-16 ${colorClass}`}>
      <svg
        viewBox="0 0 100 24"
        className="h-full w-full opacity-90"
        aria-hidden="true"
      >
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
/*                             Main Section Component                          */
/* -------------------------------------------------------------------------- */

export default function TeamFormGrid() {
  const [metric, setMetric] = useState<Metric>("momentum");

  const classified = useMemo(() => classifyTeams(metric), [metric]);

  return (
    <section className="mt-16">
      <div className="rounded-[32px] border border-yellow-500/12 bg-gradient-to-b from-yellow-900/10 via-black/70 to-black/95 px-4 py-8 sm:px-6 md:px-10 lg:px-12">
        {/* Header pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/45 bg-[radial-gradient(circle_at_15%_0,rgba(250,204,21,0.55),transparent_55%),linear-gradient(to_right,rgba(250,204,21,0.28),rgba(17,17,17,0.9))] px-4 py-1 shadow-[0_0_25px_rgba(250,204,21,0.5)]">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.9)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-50">
            Team Form Grid
          </span>
        </div>

        {/* Title + copy */}
        <h2 className="mt-5 text-2xl font-semibold text-neutral-50 sm:text-3xl md:text-[32px]">
          Hot, stable and cold clubs by performance lens
        </h2>
        <p className="mt-3 max-w-3xl text-xs text-neutral-400 sm:text-sm">
          Switch between momentum, fantasy, disposals and goals to see how each
          club is trending. Tap a pill on mobile or click a card on desktop to
          reveal a deeper analytics panel.
        </p>

        {/* Metric tabs */}
        <div className="mt-6 inline-flex rounded-full bg-black/70 p-1 ring-1 ring-neutral-800/70">
          {METRICS.map((m) => {
            const active = metric === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMetric(m)}
                className={`relative flex min-w-[92px] flex-1 items-center justify-center rounded-full px-4 py-2 text-xs font-semibold capitalize tracking-wide transition ${
                  active
                    ? "text-black"
                    : "text-neutral-400 hover:text-neutral-100"
                }`}
              >
                {active && (
                  <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_20%_0,rgba(250,204,21,0.5),transparent_55%),linear-gradient(to_right,rgba(250,204,21,0.45),rgba(0,0,0,1))] shadow-[0_0_25px_rgba(250,204,21,0.7)]" />
                )}
                <span className="relative z-10">
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Columns: Hot / Stable / Cold */}
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
/*                              Column + Divider                               */
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
  const colors = variantClasses[variant];

  return (
    <div className="relative">
      {/* Category header */}
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

      {/* Divider line */}
      <div
        className={`mb-4 h-px w-full bg-gradient-to-r ${
          variant === "hot"
            ? "from-yellow-400/40 via-yellow-500/10 to-transparent"
            : variant === "stable"
            ? "from-lime-400/40 via-lime-500/10 to-transparent"
            : "from-sky-400/40 via-sky-500/10 to-transparent"
        }`}
      />

      <div className="space-y-4">
        {teams.map((team) => (
          <TeamFormCard
            key={`${team.code}-${metric}`}
            variant={variant}
            team={team}
            metric={metric}
            colors={colors}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Team Card                                   */
/* -------------------------------------------------------------------------- */

function TeamFormCard({
  variant,
  team,
  metric,
  colors,
}: {
  variant: Variant;
  team: AFLTeam;
  metric: Metric;
  colors: (typeof variantClasses)[Variant];
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
  const fixtureDiff = team.fixtureDifficulty.score;
  const opponents = team.fixtureDifficulty.opponents.join(", ");

  return (
    <div
      className={`relative h-[190px] transform-gpu transition-[transform,box-shadow] duration-300 ease-out ${
        !flipped ? "hover:scale-[1.025]" : ""
      } cursor-pointer rounded-2xl border border-neutral-700/55 bg-gradient-to-b from-neutral-900/95 via-black to-black/95 ${colors.halo}`}
      onClick={() => setFlipped((prev) => !prev)}
    >
      <div
        className={`relative h-full w-full transform-gpu transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* FRONT FACE */}
        <div className="absolute inset-0 flex flex-col justify-between px-4 py-4 [backface-visibility:hidden] sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-neutral-50">
                {team.name}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                {metricLabels[metric]}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <SoftZigZagSparkline variant={variant} />
              <div
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold text-black ${colors.badge}`}
              >
                <span>{formattedScore}</span>
              </div>
            </div>
          </div>

          {/* Metric bar */}
          <div className="mt-4">
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-neutral-800/90">
              <div
                className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${colors.bar}`}
                style={{ width: barWidth }}
              />
            </div>
          </div>

          {/* Footer row */}
          <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            <span>{metricLabels[metric]}</span>
            <span className="flex items-center gap-1 text-[9px] text-neutral-400">
              <span className="hidden sm:inline">Analytics</span>
              <span className="text-xs">↺</span>
            </span>
          </div>
        </div>

        {/* BACK FACE */}
        <div className="absolute inset-0 px-4 py-3 [backface-visibility:hidden] [transform:rotateY(180deg)] sm:px-5 sm:py-3 bg-black/90 backdrop-blur-[1px]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-neutral-50">
                {team.name}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                {metricPrefix[metric]} analytics snapshot
              </div>
            </div>
            <div className={`text-[10px] font-semibold ${colors.accent}`}>
              {formattedScore}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-neutral-200 leading-tight">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                Attack Δ
              </div>
              <div className="mt-1 font-semibold">
                {attackDelta >= 0 ? "+" : ""}
                {attackDelta}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                Defence Δ
              </div>
              <div className="mt-1 font-semibold">
                {defenceDelta >= 0 ? "+" : ""}
                {defenceDelta}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                Clearance %
              </div>
              <div className="mt-1 font-semibold">{clearance}%</div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                Consistency
              </div>
              <div className="mt-1 font-semibold">{consistency}</div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                Fixture diff
              </div>
              <div className="mt-1 font-semibold">{fixtureDiff}</div>
            </div>

            <div className="col-span-2">
              <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                Opponents
              </div>
              <div className="mt-1 text-[10px] leading-tight font-semibold text-neutral-200 break-words">
                {opponents}
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            <span>Tap to return</span>
            <span className="text-xs">↺</span>
          </div>
        </div>
      </div>
    </div>
  );
}
