import React, { useState, useMemo } from "react";
import clsx from "clsx";
import { MOCK_TEAMS } from "./mockTeams";
import {
  ArrowDownRight,
  ArrowUpRight,
  Flame,
  CircleDot,
  Snowflake,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                         UTILITIES & SMALL COMPONENTS                        */
/* -------------------------------------------------------------------------- */

const formatSigned = (v: number) => `${v >= 0 ? "+" : ""}${v}`;

function TinyBar({ value, tint }: { value: number; tint: string }) {
  const abs = Math.min(Math.abs(value), 100);

  const tintClass =
    tint === "yellow"
      ? "from-yellow-400 to-yellow-200"
      : tint === "lime"
      ? "from-lime-400 to-lime-200"
      : "from-sky-400 to-sky-200";

  return (
    <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-neutral-800/70">
      <div
        className={clsx("h-full rounded-full bg-gradient-to-r", tintClass)}
        style={{ width: `${abs}%` }}
      />
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex flex-col">
      <div className="text-[9px] uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-neutral-200">
        {value}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                  CLASSIFY TEAMS INTO HOT / STABLE / COLD                   */
/* -------------------------------------------------------------------------- */

function classify(teams = MOCK_TEAMS, filter: string) {
  return teams.map((t) => {
    const last = t.margins.length - 1;
    const prev = last - 1;

    let metric = 0;

    if (filter === "momentum") metric = t.margins[last] - t.margins[last - 3];
    if (filter === "fantasy") metric = t.attackRating - 50;
    if (filter === "disposals") metric = t.midfieldTrend[last] - 50;
    if (filter === "goals") metric = t.attackTrend[last] - 50;

    const category =
      metric >= 12 ? "hot" : metric <= -12 ? "cold" : "stable";

    return {
      ...t,
      metric,
      category,
    };
  });
}

/* -------------------------------------------------------------------------- */
/*                                 MAIN VIEW                                   */
/* -------------------------------------------------------------------------- */

export default function TeamFormGrid() {
  const [filter, setFilter] = useState<"momentum" | "fantasy" | "disposals" | "goals">(
    "momentum"
  );

  const classified = useMemo(() => classify(MOCK_TEAMS, filter), [filter]);

  const hot = classified.filter((t) => t.category === "hot").slice(0, 3);
  const stable = classified.filter((t) => t.category === "stable").slice(0, 3);
  const cold = classified.filter((t) => t.category === "cold").slice(0, 3);

  const filters = [
    { key: "momentum", label: "Momentum" },
    { key: "fantasy", label: "Fantasy" },
    { key: "disposals", label: "Disposals" },
    { key: "goals", label: "Goals" },
  ];

  return (
    <section className="relative mt-14 rounded-3xl border border-neutral-800/60 bg-gradient-to-b from-black/40 to-black/70 px-4 py-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-lg md:px-8">
      {/* HEADER PILL */}
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
        club is trending. Tap a pill on mobile or hover on desktop to reveal a
        deeper analytics panel.
      </p>

      {/* FILTER TABS */}
      <div className="mt-5 flex w-full gap-2 overflow-x-auto rounded-full border border-neutral-800/60 bg-black/50 p-1.5 text-sm">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={clsx(
              "flex-shrink-0 rounded-full px-6 py-2.5 font-medium transition-all",
              filter === f.key
                ? "bg-gradient-to-r from-yellow-500/40 via-yellow-500/20 to-transparent text-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.5)]"
                : "text-neutral-400 hover:text-neutral-200"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* GRID */}
      <div className="mt-8 space-y-12">
        <CategoryBlock
          title="Hot Teams"
          icon={<Flame className="h-4 w-4 text-yellow-300" />}
          tint="yellow"
          teams={hot}
        />
        <CategoryBlock
          title="Stable Teams"
          icon={<CircleDot className="h-4 w-4 text-lime-300" />}
          tint="lime"
          teams={stable}
        />
        <CategoryBlock
          title="Cold Teams"
          icon={<Snowflake className="h-4 w-4 text-sky-300" />}
          tint="sky"
          teams={cold}
        />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                              CATEGORY BLOCK                                 */
/* -------------------------------------------------------------------------- */

function CategoryBlock({
  title,
  icon,
  tint,
  teams,
}: {
  title: string;
  icon: React.ReactNode;
  tint: "yellow" | "lime" | "sky";
  teams: any[];
}) {
  const divider =
    tint === "yellow"
      ? "from-yellow-500/40"
      : tint === "lime"
      ? "from-lime-400/40"
      : "from-sky-400/40";

  return (
    <div className="relative">
      <div className="sticky top-[64px] z-10 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-transparent py-2 md:static md:bg-transparent">
        <div className="h-px w-full bg-gradient-to-r opacity-70" style={{ backgroundImage: `linear-gradient(to right, ${divider}, transparent)` }} />
        <div className="mt-2 flex items-center gap-2">
          {icon}
          <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-200">
            {title}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-4 md:space-y-3">
        {teams.map((t) => (
          <TeamPill key={t.id} team={t} tint={tint} />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  TEAM PILL                                  */
/* -------------------------------------------------------------------------- */

function TeamPill({ team, tint }: any) {
  const [open, setOpen] = useState(false);

  const tintGlow =
    tint === "yellow"
      ? "shadow-[0_0_18px_rgba(250,204,21,0.35)]"
      : tint === "lime"
      ? "shadow-[0_0_18px_rgba(163,230,53,0.35)]"
      : "shadow-[0_0_18px_rgba(56,189,248,0.35)]";

  const tintBadge =
    tint === "yellow"
      ? "border-yellow-500/50 text-yellow-200"
      : tint === "lime"
      ? "border-lime-500/50 text-lime-200"
      : "border-sky-500/50 text-sky-200";

  const tintArrow = team.metric >= 0 ? (
    <ArrowUpRight className="h-4 w-4 text-lime-300" />
  ) : (
    <ArrowDownRight className="h-4 w-4 text-red-300" />
  );

  return (
    <div className={clsx("group rounded-2xl border border-neutral-800/70 bg-gradient-to-b from-neutral-900/70 to-black p-4 transition-all", tintGlow)}>
      {/* COLLAPSED HEADER */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <div>
          <div className="text-base font-medium text-neutral-50">
            {team.name}
          </div>
          <div className="text-[9px] uppercase tracking-[0.18em] text-neutral-500">
            Momentum • Last 5
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TinyBar value={team.metric} tint={tint} />

          <span
            className={clsx(
              "rounded-full border px-2.5 py-1 text-xs font-semibold",
              tintBadge
            )}
          >
            {formatSigned(team.metric.toFixed(1))}
          </span>

          <span
            className={clsx(
              "transition-transform",
              open ? "rotate-180" : "rotate-0"
            )}
          >
            {tintArrow}
          </span>
        </div>
      </button>

      {/* EXPANDED ANALYTICS */}
      <div
        className={clsx(
          "overflow-hidden transition-[max-height,opacity,margin-top] duration-500 ease-out",
          open ? "max-h-[400px] opacity-100 mt-4" : "max-h-0 opacity-0 mt-0",
          "md:max-h-0 md:opacity-0 md:mt-0 md:group-hover:max-h-[400px] md:group-hover:opacity-100 md:group-hover:mt-4"
        )}
      >
        <div className="rounded-xl border border-neutral-800/60 bg-gradient-to-b from-neutral-900/50 to-black px-4 py-4 shadow-inner">

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px]">
            <Metric label="Attack Δ" value={formatSigned(team.attackRating - 50)} />
            <Metric label="Defence Δ" value={formatSigned(team.defenceRating - 50)} />
            <Metric label="Clearance %" value={`${team.clearanceDom[0]}%`} />
            <Metric label="Consistency" value={team.consistencyIndex} />
            <Metric label="Fixture Difficulty" value={team.fixtureDifficulty.score} />
            <Metric
              label="Opponents"
              value={team.fixtureDifficulty.opponents.join(", ")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}