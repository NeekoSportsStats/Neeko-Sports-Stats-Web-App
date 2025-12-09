"use client";

import React, { useMemo, useState } from "react";
import { MOCK_TEAMS } from "./mockTeams";

type Lens = "momentum" | "fantasy" | "disposals" | "goals";
type Tint = "hot" | "stable" | "cold";

type ClassifiedTeam = (typeof MOCK_TEAMS)[number] & {
  metric: number;
  tint: Tint;
};

/* -------------------------------------------------------------------------- */
/*                         METRIC / SEGMENT CALCULATION                        */
/* -------------------------------------------------------------------------- */

function computeLensMetric(team: (typeof MOCK_TEAMS)[number], lens: Lens) {
  const last5Margins = team.margins.slice(-5);
  const avgLast5Margins =
    last5Margins.reduce((a, b) => a + b, 0) / Math.max(last5Margins.length, 1);

  const lastClearance = team.clearanceDom.slice(-1)[0] ?? 50;
  const lastAttackTrend = team.attackTrend.slice(-1)[0] ?? 50;
  const lastMidfieldTrend = team.midfieldTrend.slice(-1)[0] ?? 50;

  switch (lens) {
    case "momentum":
      // True momentum: average of last 5 margins
      return avgLast5Margins;

    case "fantasy":
      // Fake fantasy edge: attack rating + clearances + consistency
      return (
        (team.attackRating - 50) * 0.6 +
        (lastClearance - 50) * 0.3 +
        (team.consistencyIndex - 60) * 0.4
      );

    case "disposals":
      // Fake disposals trend: midfield trend + clearances
      return (
        (lastMidfieldTrend - 50) * 0.8 +
        (lastClearance - 50) * 0.4
      );

    case "goals":
      // Fake goals trend: recent attack trend + attack rating
      return (
        (lastAttackTrend - 50) * 0.8 +
        (team.attackRating - 50) * 0.5
      );

    default:
      return 0;
  }
}

function segmentTeams(lens: Lens): {
  hot: ClassifiedTeam[];
  stable: ClassifiedTeam[];
  cold: ClassifiedTeam[];
} {
  const scored = MOCK_TEAMS.map((t) => {
    const metric = computeLensMetric(t, lens);
    return { ...t, metric } as ClassifiedTeam;
  }).sort((a, b) => b.metric - a.metric);

  const hot = scored.slice(0, 3).map((t) => ({ ...t, tint: "hot" as Tint }));
  const stable = scored.slice(3, 6).map((t) => ({ ...t, tint: "stable" as Tint }));
  const cold = scored.slice(6, 9).map((t) => ({ ...t, tint: "cold" as Tint }));

  return { hot, stable, cold };
}

/* -------------------------------------------------------------------------- */
/*                                   SPARKLINE                                */
/* -------------------------------------------------------------------------- */

function Sparkline({ values, tint }: { values: number[]; tint: Tint }) {
  if (!values.length) return null;

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const normalised = values.map((v) => (v - min) / range);

  const points = normalised
    .map((v, i) => {
      const x =
        normalised.length === 1
          ? 50
          : (i / (normalised.length - 1)) * 100;
      const y = 18 - v * 12; // 2–14 range
      return `${x},${y}`;
    })
    .join(" ");

  const stroke =
    tint === "hot"
      ? "#facc15"
      : tint === "stable"
      ? "#a3e635"
      : "#38bdf8";

  return (
    <svg
      viewBox="0 0 100 20"
      preserveAspectRatio="none"
      className="h-6 w-16 opacity-70"
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                               MICRO METRIC BAR                             */
/* -------------------------------------------------------------------------- */

function TinyMetricBar({
  value,
  maxAbsValue,
  tint,
}: {
  value: number;
  maxAbsValue: number;
  tint: Tint;
}) {
  const max = Math.max(maxAbsValue, 1);
  const abs = Math.min(Math.abs(value), max);
  const widthPercent = (abs / max) * 100;

  const gradientClass =
    tint === "hot"
      ? "from-yellow-400 to-yellow-200"
      : tint === "stable"
      ? "from-lime-400 to-lime-200"
      : "from-sky-400 to-sky-200";

  return (
    <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-neutral-900/90">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${gradientClass} transition-[width] duration-500 ease-out`}
        style={{ width: `${widthPercent}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

const formatSigned = (v: number) =>
  `${v >= 0 ? "+" : ""}${v.toFixed(1)}`;

const lensLabel: Record<Lens, string> = {
  momentum: "Momentum • Last 5",
  fantasy: "Fantasy edge",
  disposals: "Disposals trend",
  goals: "Goals trend",
};

const filters: { key: Lens; label: string }[] = [
  { key: "momentum", label: "Momentum" },
  { key: "fantasy", label: "Fantasy" },
  { key: "disposals", label: "Disposals" },
  { key: "goals", label: "Goals" },
];

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

export default function TeamFormGrid() {
  const [lens, setLens] = useState<Lens>("momentum");

  const { hot, stable, cold } = useMemo(
    () => segmentTeams(lens),
    [lens]
  );

  return (
    <section className="mt-14 px-4 md:px-8">
      {/* Glass section wrapper */}
      <div className="rounded-3xl border border-yellow-500/14 bg-gradient-to-b from-neutral-900/55 via-neutral-950/85 to-black/95 px-4 py-8 shadow-[0_0_45px_rgba(0,0,0,0.80)] ring-1 ring-white/6 backdrop-blur-2xl md:px-8 md:py-10">
        {/* Header pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-gradient-to-r from-yellow-500/22 via-yellow-500/10 to-transparent px-4 py-1.5 shadow-[0_0_20px_rgba(250,204,21,0.65)]">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.95)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-100">
            Team Form Grid
          </span>
        </div>

        <h2 className="mt-4 text-xl font-semibold text-neutral-50 md:text-2xl">
          Hot, stable and cold clubs by performance lens
        </h2>

        <p className="mt-2 max-w-2xl text-sm text-neutral-400 md:text-[15px]">
          Switch between momentum, fantasy, disposals and goals to see how each
          club is trending. Tap a pill on mobile or click a card on desktop to
          flip into a deeper analytics panel.
        </p>

        {/* Lens switcher */}
        <div className="mt-6 flex w-full gap-2 overflow-x-auto rounded-full border border-neutral-800/70 bg-black/75 p-1.5 text-sm">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setLens(f.key)}
              className={`flex-1 rounded-full px-5 py-2.5 font-medium transition-all
                ${
                  lens === f.key
                    ? "bg-gradient-to-r from-yellow-500/55 via-yellow-500/30 to-transparent text-yellow-50 shadow-[0_0_14px_rgba(250,204,21,0.45)]"
                    : "text-neutral-400 hover:text-neutral-100"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid layout: 1 col mobile, 3 cols desktop */}
        <div className="mt-8 grid grid-cols-1 gap-10 md:mt-9 md:grid-cols-3 md:gap-8">
          <CategoryColumn
            title="Hot Teams"
            icon="🔥"
            tint="hot"
            teams={hot}
            lens={lens}
          />
          <CategoryColumn
            title="Stable Teams"
            icon="●"
            tint="stable"
            teams={stable}
            lens={lens}
          />
          <CategoryColumn
            title="Cold Teams"
            icon="❄"
            tint="cold"
            teams={cold}
            lens={lens}
          />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                              CATEGORY COLUMN                                */
/* -------------------------------------------------------------------------- */

function CategoryColumn({
  title,
  icon,
  tint,
  teams,
  lens,
}: {
  title: string;
  icon: string;
  tint: Tint;
  teams: ClassifiedTeam[];
  lens: Lens;
}) {
  const headerColor =
    tint === "hot"
      ? "text-yellow-300"
      : tint === "stable"
      ? "text-lime-300"
      : "text-sky-300";

  const dividerGradient =
    tint === "hot"
      ? "from-yellow-500/40"
      : tint === "stable"
      ? "from-lime-400/40"
      : "from-sky-400/40";

  const maxAbsValue =
    teams.length > 0
      ? Math.max(...teams.map((t) => Math.abs(t.metric)))
      : 1;

  return (
    <div className="relative">
      {/* Sticky header on mobile to show category while scrolling */}
      <div className="sticky top-[76px] z-10 bg-gradient-to-b from-neutral-950 via-neutral-950/97 to-transparent pb-2 md:static md:bg-transparent">
        <div
          className={`h-px w-full bg-gradient-to-r ${dividerGradient} to-transparent opacity-85`}
        />
        <div className="mt-2 flex items-center gap-2">
          <span className={`text-base ${headerColor}`}>{icon}</span>
          <span
            className={`text-[11px] uppercase tracking-[0.18em] ${headerColor}`}
          >
            {title}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-4 md:space-y-3">
        {teams.map((team) => (
          <TeamFlipCard
            key={team.id}
            team={team}
            tint={tint}
            lens={lens}
            maxAbsValue={maxAbsValue}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                TEAM FLIP CARD                               */
/* -------------------------------------------------------------------------- */

function TeamFlipCard({
  team,
  tint,
  lens,
  maxAbsValue,
}: {
  team: ClassifiedTeam;
  tint: Tint;
  lens: Lens;
  maxAbsValue: number;
}) {
  const [flipped, setFlipped] = useState(false);

  const glowClass =
    tint === "hot"
      ? "shadow-[0_0_32px_8px_rgba(250,204,21,0.22)]"
      : tint === "stable"
      ? "shadow-[0_0_28px_6px_rgba(132,204,22,0.20)]"
      : "shadow-[0_0_28px_6px_rgba(56,189,248,0.19)]";

  const badgeClass =
    tint === "hot"
      ? "border-yellow-500/60 bg-yellow-500/18 text-yellow-100"
      : tint === "stable"
      ? "border-lime-500/60 bg-lime-500/18 text-lime-100"
      : "border-sky-500/60 bg-sky-500/18 text-sky-100";

  const label = lensLabel[lens];

  const trendValues =
    lens === "disposals"
      ? team.midfieldTrend
      : lens === "goals"
      ? team.attackTrend
      : lens === "fantasy"
      ? team.attackTrend
      : team.margins.slice(-12);

  const handleToggle = () => setFlipped((prev) => !prev);

  return (
    <div
      className={`group rounded-2xl border border-neutral-800/80 bg-black/40 px-[3px] py-[3px] ${glowClass} backdrop-blur-xl transition-shadow`}
    >
      <div
        className="relative h-40 w-full rounded-2xl"
        style={{ perspective: "1100px" }}
      >
        <button
          type="button"
          onClick={handleToggle}
          className="relative h-full w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          style={{
            transformStyle: "preserve-3d",
            transition:
              "transform 650ms cubic-bezier(0.22, 0.61, 0.36, 1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* FRONT FACE */}
          <div
            className="absolute inset-0 flex flex-col justify-between rounded-2xl bg-gradient-to-b from-neutral-900/95 via-neutral-950/95 to-black/95 p-4"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-[15px] font-medium text-neutral-50">
                  {team.name}
                </div>
                <div className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-neutral-500">
                  {label}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <Sparkline values={trendValues} tint={tint} />
                <div className="flex items-center gap-2">
                  <TinyMetricBar
                    value={team.metric}
                    maxAbsValue={maxAbsValue}
                    tint={tint}
                  />
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}
                  >
                    {formatSigned(team.metric)}
                  </span>
                </div>
              </div>
            </div>

            {/* Subtle baseline bar */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gradient-to-r from-neutral-800/80 via-neutral-900/90 to-neutral-950/95">
              <div className="h-full w-0 rounded-full bg-gradient-to-r from-white/20 to-white/0 opacity-60 group-hover:w-1/3 group-hover:opacity-80 transition-all duration-700" />
            </div>
          </div>

          {/* BACK FACE */}
          <div
            className="absolute inset-0 rounded-2xl bg-gradient-to-b from-neutral-900/98 via-neutral-950/98 to-black/98 p-4"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  {team.name}
                </div>
                <div className="mt-1 text-[11px] text-neutral-300">
                  Analytics snapshot
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-neutral-200">
                <MetricCell
                  label="Attack Δ"
                  value={formatSigned(team.attackRating - 50)}
                />
                <MetricCell
                  label="Defence Δ"
                  value={formatSigned(team.defenceRating - 50)}
                />
                <MetricCell
                  label="Clearance %"
                  value={`${team.clearanceDom.slice(-1)[0] ?? 0}%`}
                />
                <MetricCell
                  label="Consistency"
                  value={team.consistencyIndex.toString()}
                />
                <MetricCell
                  label="Fixture diff"
                  value={team.fixtureDifficulty.score.toString()}
                />
                <MetricCell
                  label="Opponents"
                  value={team.fixtureDifficulty.opponents.join(", ")}
                />
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 METRIC CELL                                 */
/* -------------------------------------------------------------------------- */

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-[9px] uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </div>
      <div className="mt-0.5 truncate text-sm font-semibold text-neutral-50">
        {value}
      </div>
    </div>
  );
}
