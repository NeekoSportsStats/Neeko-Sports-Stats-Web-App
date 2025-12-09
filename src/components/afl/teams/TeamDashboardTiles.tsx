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
/*                             METRIC / SEGMENT LOGIC                          */
/* -------------------------------------------------------------------------- */

function computeMetric(team: (typeof MOCK_TEAMS)[number], lens: Lens): number {
  const lastIdx = team.margins.length - 1;

  switch (lens) {
    case "momentum": {
      const last5 = team.margins.slice(-5);
      return last5.reduce((a, b) => a + b, 0);
    }
    case "fantasy":
      // Attack rating as fantasy proxy
      return team.attackRating - 50;
    case "disposals":
      // Midfield trend (disposals proxy)
      return team.midfieldTrend[lastIdx] - 50;
    case "goals":
      // Attack trend (goals proxy)
      return team.attackTrend[lastIdx] - 50;
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
    const metric = computeMetric(t, lens);
    return { ...t, metric } as ClassifiedTeam;
  }).sort((a, b) => b.metric - a.metric);

  // Top 3 = hot, next 3 = stable, next 3 = cold
  const hot = scored.slice(0, 3).map((t) => ({ ...t, tint: "hot" as Tint }));
  const stable = scored
    .slice(3, 6)
    .map((t) => ({ ...t, tint: "stable" as Tint }));
  const cold = scored
    .slice(6, 9)
    .map((t) => ({ ...t, tint: "cold" as Tint }));

  return { hot, stable, cold };
}

/* -------------------------------------------------------------------------- */
/*                                   SPARKLINE                                */
/* -------------------------------------------------------------------------- */

function Sparkline({
  values,
  tint,
}: {
  values: number[];
  tint: Tint;
}) {
  if (!values.length) return null;

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const norm = values.map((v) => (v - min) / range);

  const points = norm
    .map((v, i) => {
      const x =
        norm.length === 1 ? 50 : (i / (norm.length - 1)) * 100;
      const y = 20 - v * 14 - 2; // padding top/bottom
      return `${x},${y}`;
    })
    .join(" ");

  const strokeClass =
    tint === "hot"
      ? "stroke-yellow-300"
      : tint === "stable"
      ? "stroke-lime-300"
      : "stroke-sky-300";

  return (
    <svg
      viewBox="0 0 100 20"
      className={`h-6 w-20 ${strokeClass}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`spark-${tint}`} x1="0" x2="1" y1="0" y2="0">
          <stop
            offset="0%"
            stopColor={
              tint === "hot"
                ? "#facc15"
                : tint === "stable"
                ? "#a3e635"
                : "#38bdf8"
            }
          />
          <stop
            offset="100%"
            stopColor={
              tint === "hot"
                ? "#fef9c3"
                : tint === "stable"
                ? "#ecfccb"
                : "#e0f2fe"
            }
          />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={`url(#spark-${tint})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 TINY BAR                                   */
/* -------------------------------------------------------------------------- */

function TinyBar({ value, tint }: { value: number; tint: Tint }) {
  const abs = Math.min(Math.abs(value), 50); // cap for visuals
  const width = (abs / 50) * 100;

  const gradientClass =
    tint === "hot"
      ? "from-yellow-400 to-yellow-200"
      : tint === "stable"
      ? "from-lime-400 to-lime-200"
      : "from-sky-400 to-sky-200";

  return (
    <div className="relative h-1.5 w-20 overflow-hidden rounded-full bg-neutral-800/80">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${gradientClass} transition-[width] duration-500 ease-out`}
        style={{ width: `${width}%` }}
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
  fantasy: "Fantasy Edge",
  disposals: "Disposals Trend",
  goals: "Goals Trend",
};

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

export default function TeamFormGrid() {
  const [lens, setLens] = useState<Lens>("momentum");
  const [openId, setOpenId] = useState<number | null>(null);

  const { hot, stable, cold } = useMemo(
    () => segmentTeams(lens),
    [lens]
  );

  const toggle = (id: number) =>
    setOpenId((prev) => (prev === id ? null : id));

  const filters: { key: Lens; label: string }[] = [
    { key: "momentum", label: "Momentum" },
    { key: "fantasy", label: "Fantasy" },
    { key: "disposals", label: "Disposals" },
    { key: "goals", label: "Goals" },
  ];

  return (
    <section className="mt-14 px-4 md:px-8">
      <div className="rounded-3xl border border-yellow-500/10 bg-gradient-to-b from-black/40 to-black/80 px-4 py-8 shadow-[0_0_45px_rgba(0,0,0,0.75)] backdrop-blur-xl md:px-8 md:py-10">
        {/* Header pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-transparent px-4 py-1.5 shadow-[0_0_18px_rgba(250,204,21,0.45)]">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.9)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
            Team Form Grid
          </span>
        </div>

        <h2 className="mt-4 text-xl font-semibold text-neutral-50 md:text-2xl">
          Hot, stable and cold clubs by performance lens
        </h2>

        <p className="mt-2 max-w-2xl text-sm text-neutral-400 md:text-[15px]">
          Switch between momentum, fantasy, disposals and goals to see how each
          club is trending. Tap a pill on mobile or hover on desktop to reveal
          a deeper analytics panel.
        </p>

        {/* Lens switcher */}
        <div className="mt-6 flex w-full gap-2 overflow-x-auto rounded-full border border-neutral-800/60 bg-black/60 p-1.5 text-sm">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setLens(f.key)}
              className={`flex-1 rounded-full px-6 py-2.5 font-medium transition-all
                ${
                  lens === f.key
                    ? "bg-gradient-to-r from-yellow-500/40 via-yellow-500/20 to-transparent text-yellow-200 shadow-[0_0_14px_rgba(250,204,21,0.45)]"
                    : "text-neutral-400 hover:text-neutral-100"
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid: mobile 1 col, desktop 3 cols */}
        <div className="mt-9 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          <CategoryColumn
            title="Hot Teams"
            icon="🔥"
            tint="hot"
            teams={hot}
            lens={lens}
            openId={openId}
            onToggle={toggle}
          />
          <CategoryColumn
            title="Stable Teams"
            icon="●"
            tint="stable"
            teams={stable}
            lens={lens}
            openId={openId}
            onToggle={toggle}
          />
          <CategoryColumn
            title="Cold Teams"
            icon="❄"
            tint="cold"
            teams={cold}
            lens={lens}
            openId={openId}
            onToggle={toggle}
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
  openId,
  onToggle,
}: {
  title: string;
  icon: string;
  tint: Tint;
  teams: ClassifiedTeam[];
  lens: Lens;
  openId: number | null;
  onToggle: (id: number) => void;
}) {
  const headerTextClass =
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

  return (
    <div className="relative">
      {/* Sticky on mobile only */}
      <div className="sticky top-[70px] z-10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-transparent pb-2 md:static md:bg-transparent">
        <div
          className={`h-px w-full bg-gradient-to-r ${dividerGradient} to-transparent opacity-70`}
        />
        <div className="mt-2 flex items-center gap-2">
          <span className={headerTextClass}>{icon}</span>
          <span
            className={`text-[11px] uppercase tracking-[0.18em] ${headerTextClass}`}
          >
            {title}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-4 md:space-y-3">
        {teams.map((team) => (
          <TeamPill
            key={team.id}
            team={team}
            tint={tint}
            lens={lens}
            open={openId === team.id}
            onToggle={() => onToggle(team.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  TEAM PILL                                  */
/* -------------------------------------------------------------------------- */

function TeamPill({
  team,
  tint,
  lens,
  open,
  onToggle,
}: {
  team: ClassifiedTeam;
  tint: Tint;
  lens: Lens;
  open: boolean;
  onToggle: () => void;
}) {
  const glowClass =
    tint === "hot"
      ? "shadow-[0_0_18px_rgba(250,204,21,0.35)]"
      : tint === "stable"
      ? "shadow-[0_0_18px_rgba(163,230,53,0.35)]"
      : "shadow-[0_0_18px_rgba(56,189,248,0.35)]";

  const badgeClass =
    tint === "hot"
      ? "border-yellow-500/50 bg-yellow-500/15 text-yellow-200"
      : tint === "stable"
      ? "border-lime-500/50 bg-lime-500/15 text-lime-200"
      : "border-sky-500/50 bg-sky-500/15 text-sky-200";

  // Use different underlying data depending on lens
  const trendValues =
    lens === "disposals"
      ? team.midfieldTrend
      : lens === "goals"
      ? team.attackTrend
      : lens === "fantasy"
      ? team.attackTrend
      : team.margins.slice(-12);

  return (
    <div
      className={`group rounded-2xl border border-neutral-800/70 bg-gradient-to-b from-neutral-900/80 to-black p-4 transition-all md:px-5 md:py-5 ${glowClass} md:hover:-translate-y-[1px] md:hover:scale-[1.01] md:hover:shadow-[0_4px_32px_rgba(0,0,0,0.55)]`}
    >
      {/* Top row: name + micro metrics */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <div>
          <div className="text-base font-medium text-neutral-50">
            {team.name}
          </div>
          <div className="text-[9px] uppercase tracking-[0.18em] text-neutral-500">
            {lensLabel[lens]}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <Sparkline values={trendValues} tint={tint} />
          <div className="flex items-center gap-2">
            <TinyBar value={team.metric} tint={tint} />
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClass}`}
            >
              {formatSigned(team.metric)}
            </span>
          </div>
        </div>
      </button>

      {/* Flip-ish analytics preview on desktop hover (no click needed) */}
      <div className="mt-3 hidden text-[10px] uppercase tracking-[0.16em] text-neutral-500 md:block md:opacity-0 md:transition-opacity md:duration-300 md:group-hover:opacity-100">
        Hovered analytics preview
      </div>

      {/* Expanded analytics panel */}
      <div
        className={`overflow-hidden transition-[max-height,opacity,margin-top] duration-500 ease-out
          ${open ? "mt-4 max-height-96 opacity-100" : "max-h-0 opacity-0 mt-0"}
          md:group-hover:max-h-96 md:group-hover:opacity-100 md:group-hover:mt-4
        `}
      >
        <div className="rounded-xl border border-neutral-800/60 bg-gradient-to-b from-neutral-900/60 to-black px-4 py-4 shadow-inner">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px] text-neutral-200">
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
              value={`${team.clearanceDom.slice(-1)[0]}%`}
            />
            <MetricCell
              label="Consistency"
              value={team.consistencyIndex.toString()}
            />
            <MetricCell
              label="Fixture Difficulty"
              value={team.fixtureDifficulty.score.toString()}
            />
            <MetricCell
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
/*                               METRIC CELL                                   */
/* -------------------------------------------------------------------------- */

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-neutral-200">
        {value}
      </div>
    </div>
  );
}
