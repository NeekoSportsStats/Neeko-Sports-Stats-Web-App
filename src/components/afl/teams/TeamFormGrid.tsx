// src/components/afl/teams/TeamFormGrid.tsx

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

/* -------------------------------------------------------------------------- */
/*                             Metric Logic                                   */
/* -------------------------------------------------------------------------- */

function getBaseMomentum(team: AFLTeam): number {
  const last5 = team.margins.slice(-5);
  return last5.reduce((a, b) => a + b, 0) / last5.length;
}

function getMetricScore(team: AFLTeam, metric: Metric): number {
  const base = getBaseMomentum(team);
  if (metric === "momentum") return base;
  if (metric === "fantasy") return team.attackRating * 0.4 + base * 0.2;
  if (metric === "disposals") return team.midfieldTrend.slice(-5).reduce((a, b) => a + b, 0) / 5 - 50;
  return team.scores.slice(-5).reduce((a, b) => a + b, 0) / 5 / 10;
}

function classifyTeams(metric: Metric) {
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
/*                               Visual Helpers                               */
/* -------------------------------------------------------------------------- */

const metricLabels: Record<Metric, string> = {
  momentum: "Momentum · Last 5",
  fantasy: "Fantasy edge",
  disposals: "Disposals edge",
  goals: "Goals edge",
};

function formatMetric(value: number) {
  const r = Math.round(value * 10) / 10;
  return `${r > 0 ? "+" : ""}${r.toFixed(1)}`;
}

function intensityWidth(value: number): string {
  const clamped = Math.max(-40, Math.min(40, value));
  return `${Math.max(6, Math.min(100, (Math.abs(clamped) / 40) * 100))}%`;
}

const variantHalo: Record<Variant, string> = {
  hot: "shadow-[0_0_32px_rgba(255,60,60,0.22)]",
  stable: "shadow-[0_0_32px_rgba(60,220,150,0.22)]",
  cold: "shadow-[0_0_32px_rgba(0,180,255,0.22)]",
};

const badgeStyles: Record<Variant, string> = {
  hot: "bg-red-400/15 border border-red-400/30 text-red-200",
  stable: "bg-emerald-400/15 border border-emerald-400/30 text-lime-200",
  cold: "bg-sky-400/15 border border-sky-400/30 text-sky-200",
};

/* -------------------------------------------------------------------------- */
/*                       Enhanced Smooth Sparkline (Option A)                 */
/* -------------------------------------------------------------------------- */

function smoothArray(values: number[]) {
  if (values.length < 3) return values;
  const out = [...values];
  for (let i = 1; i < values.length - 1; i++) {
    out[i] = (values[i - 1] + values[i] + values[i + 1]) / 3;
  }
  return out;
}

function EnhancedSparkline({
  values,
  variant,
}: {
  values: number[];
  variant: Variant;
}) {
  const smoothed = smoothArray(values);

  const { points, lastX, lastY } = useMemo(() => {
    if (!smoothed.length) return { points: "0,20 100,20", lastX: 100, lastY: 20 };

    const min = Math.min(...smoothed);
    const max = Math.max(...smoothed);
    const range = max - min || 1;

    let pts = "";
    let lx = 100;
    let ly = 20;

    smoothed.forEach((v, i) => {
      const x = (i / (smoothed.length - 1)) * 100;
      const norm = (v - min) / range;
      const y = 30 - norm * 16;
      pts += `${x},${y} `;
      if (i === smoothed.length - 1) {
        lx = x;
        ly = y;
      }
    });

    return { points: pts.trim(), lastX: lx, lastY: ly };
  }, [smoothed]);

  const glow =
    variant === "hot"
      ? "rgba(255,80,80,0.45)"
      : variant === "stable"
      ? "rgba(80,255,170,0.45)"
      : "rgba(0,180,255,0.45)";

  const stroke =
    variant === "hot"
      ? "rgb(255,150,150)"
      : variant === "stable"
      ? "rgb(170,255,200)"
      : "rgb(150,220,255)";

  return (
    <div className="relative w-full h-10 overflow-hidden rounded-xl bg-black/70 border border-neutral-800/60">
      <svg viewBox="0 0 100 40" className="h-full w-full">
        <defs>
          <filter id="spark-glow">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feBlend in="SourceGraphic" in2="blur" mode="screen" />
          </filter>
        </defs>

        <polyline
          points={points}
          stroke={glow}
          strokeWidth={3.2}
          fill="none"
          filter="url(#spark-glow)"
        />

        <polyline
          points={points}
          stroke={stroke}
          strokeWidth={1.6}
          fill="none"
        />

        <circle cx={lastX} cy={lastY} r={1.8} fill={stroke} />
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
      <div className="rounded-[32px] border border-yellow-500/10 bg-gradient-to-b from-yellow-900/5 via-black/70 to-black/95 px-4 py-8 sm:px-6 md:px-10">

        {/* Header pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-400/15 px-4 py-1 shadow-[0_0_14px_rgba(250,204,21,0.3)] backdrop-blur-[2px]">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_6px_rgba(250,204,21,0.9)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-yellow-50">
            Team Form Grid
          </span>
        </div>

        <h2 className="mt-5 text-2xl font-semibold text-neutral-50 sm:text-3xl md:text-[32px] leading-tight">
          Hot, stable and cold clubs by performance lens
        </h2>

        <p className="mt-3 max-w-3xl text-xs text-neutral-400 sm:text-sm">
          Switch between lenses. Tap cards for deeper analytics.
        </p>

        {/* Metric filter tabs */}
        <div className="mt-6 inline-flex rounded-full bg-black/50 p-1 ring-1 ring-yellow-400/25 shadow-[0_0_26px_rgba(255,240,150,0.35)]">
          {METRICS.map((m) => {
            const active = metric === m;
            return (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`relative flex min-w-[92px] flex-1 items-center justify-center rounded-full px-4 py-2 text-xs font-semibold transition ${
                  active ? "text-black" : "text-neutral-200 hover:text-neutral-50"
                }`}
              >
                {active && (
                  <span className="absolute inset-0 rounded-full bg-yellow-300/60 shadow-[0_0_40px_rgba(255,240,150,0.75)]" />
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
            icon={<Flame className="h-4 w-4 text-red-300" />}
            teams={classified.hot}
            metric={metric}
          />
          <FormColumn
            variant="stable"
            title="Stable Teams"
            icon={<CircleDot className="h-4 w-4 text-lime-300" />}
            teams={classified.stable}
            metric={metric}
          />
          <FormColumn
            variant="cold"
            title="Cold Teams"
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
/*                            Column Wrapper                                  */
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
      ? "text-red-300"
      : variant === "stable"
      ? "text-lime-300"
      : "text-sky-300";

  const divider =
    variant === "hot"
      ? "from-red-500/40"
      : variant === "stable"
      ? "from-lime-500/40"
      : "from-sky-500/40";

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

  // Sparkline data mapping (Option A)
  const series =
    metric === "momentum"
      ? team.margins
      : metric === "fantasy"
      ? team.attackTrend
      : metric === "disposals"
      ? team.midfieldTrend
      : team.scores;

  const attackDelta =
    team.scores[team.scores.length - 1] -
    team.scores[team.scores.length - 2];

  const defenceDelta =
    team.margins[team.margins.length - 1] -
    team.margins[team.margins.length - 2];

  const clearance = team.clearanceDom[team.clearanceDom.length - 1];
  const consistency = team.consistencyIndex;

  return (
    <div
      className={`relative min-h-[200px] cursor-pointer rounded-2xl border border-neutral-700/40 bg-black/90 backdrop-blur-[2px] transform-gpu transition duration-300 ${variantHalo[variant]}`}
      onClick={() => setFlipped(!flipped)}
    >
      <div
        className={`relative h-full w-full transform-gpu transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* FRONT */}
        <div className="absolute inset-0 flex flex-col justify-between px-4 py-3 [backface-visibility:hidden] min-h-[200px]">

          {/* Header row */}
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[15px] font-semibold text-neutral-50 leading-tight">
                {team.name}
              </div>
              <div className="mt-[2px] text-[9px] uppercase text-neutral-500 tracking-[0.14em]">
                {metricLabels[metric]}
              </div>
            </div>

            <div
              className={`${badgeStyles[variant]} inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[10px] font-semibold`}
            >
              {formattedScore}
            </div>
          </div>

          {/* Sparkline centered, clean, full width */}
          <div className="mt-3 mb-3 w-full">
            <EnhancedSparkline values={series} variant={variant} />
          </div>

          {/* Progress bar bottom */}
          <div className="mt-3">
            <div className="relative h-2 w-full rounded-full bg-neutral-800/80 overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${
                  variant === "hot"
                    ? "from-red-300 to-red-500"
                    : variant === "stable"
                    ? "from-lime-300 to-emerald-400"
                    : "from-sky-300 to-cyan-400"
                }`}
                style={{ width: barWidth }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between text-[9px] text-neutral-500 uppercase tracking-[0.14em]">
            <span>{metricLabels[metric]}</span>
            <span className="flex items-center gap-1 text-neutral-400">
              <span className="hidden sm:inline">Analytics</span>
              <span className="text-[11px]">↺</span>
            </span>
          </div>
        </div>

        {/* BACK */}
        <div className="absolute inset-0 flex h-full flex-col justify-between rounded-xl border border-white/5 bg-black/65 px-4 py-4 backdrop-blur-[4px] [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="text-sm font-semibold text-neutral-50">{team.name}</div>
              <div className="mt-[2px] text-[9px] uppercase text-neutral-500 tracking-[0.16em]">
                Snapshot
              </div>
            </div>

            <div
              className={`text-[11px] font-semibold ${
                variant === "hot"
                  ? "text-red-300"
                  : variant === "stable"
                  ? "text-lime-300"
                  : "text-sky-300"
              }`}
            >
              {formattedScore}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-y-2 gap-x-4 text-[11px] text-neutral-300 leading-snug">
            <div>
              <div className="text-[9px] uppercase text-neutral-500 tracking-[0.14em]">
                Attack Δ
              </div>
              <div className="font-semibold">
                {attackDelta >= 0 ? "+" : ""}
                {attackDelta}
              </div>
            </div>

            <div>
              <div className="text-[9px] uppercase text-neutral-500 tracking-[0.14em]">
                Defence Δ
              </div>
              <div className="font-semibold">
                {defenceDelta >= 0 ? "+" : ""}
                {defenceDelta}
              </div>
            </div>

            <div>
              <div className="text-[9px] uppercase text-neutral-500 tracking-[0.14em]">
                Clear %
              </div>
              <div className="font-semibold">{clearance}%</div>
            </div>

            <div>
              <div className="text-[9px] uppercase text-neutral-500 tracking-[0.14em]">
                Consist.
              </div>
              <div className="font-semibold">{consistency}</div>
            </div>

            <div>
              <div className="text-[9px] uppercase text-neutral-500 tracking-[0.14em]">
                Pressure
              </div>
              <div className="font-semibold">+3</div>
            </div>

            <div>
              <div className="text-[9px] uppercase text-neutral-500 tracking-[0.14em]">
                Fixture
              </div>
              <div className="font-semibold">{team.fixtureDifficulty.score}</div>
            </div>
          </div>

          <div className="mt-3">
            <div className="text-[9px] uppercase text-neutral-500 tracking-[0.14em]">
              Opponents
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {team.fixtureDifficulty.opponents.map((op) => (
                <code
                  key={op}
                  className="rounded bg-white/5 px-1.5 py-[1px] text-[9px] text-neutral-300"
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
