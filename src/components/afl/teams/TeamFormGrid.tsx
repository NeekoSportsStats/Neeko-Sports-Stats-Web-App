import React, { useMemo, useState } from "react";
import { MOCK_TEAMS, AFLTeam } from "./mockTeams";
import {
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  CircleDot,
  Snowflake,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                               UTILITY HELPERS                              */
/* -------------------------------------------------------------------------- */

const lastN = (arr: number[], n: number) => arr.slice(-n);

const avg = (arr: number[]) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const stdDev = (arr: number[]) => {
  if (!arr.length) return 0;
  const mean = avg(arr);
  const variance = avg(arr.map((v) => (v - mean) ** 2));
  return Math.sqrt(variance);
};

/* -------------------------------------------------------------------------- */
/*                         TEAM FORM CLASSIFICATION LOGIC                      */
/* -------------------------------------------------------------------------- */

type ClassifiedTeam = AFLTeam & {
  momentum: number;
  attackDelta: number;
  defenceDelta: number;
  category: "hot" | "stable" | "cold";
};

function classifyTeams(): ClassifiedTeam[] {
  // Momentum = margin(R23) – margin(R20)
  const last = 22; // R23 idx
  const prev = 19; // R20 idx

  return MOCK_TEAMS.map((team) => {
    const momentum = team.margins[last] - team.margins[prev];
    const attackDelta = team.scores[last] - team.scores[last - 1];
    const defenceDelta = team.margins[last] - team.margins[last - 1];

    let category: "hot" | "stable" | "cold" = "stable";

    if (momentum >= 12) category = "hot";
    else if (momentum <= -12) category = "cold";
    else category = "stable";

    return {
      ...team,
      momentum,
      attackDelta,
      defenceDelta,
      category,
    };
  });
}

/* -------------------------------------------------------------------------- */
/*                               SPARKLINE SHELL                              */
/* -------------------------------------------------------------------------- */
/* Still a placeholder, but now styled to look like a proper mini chart area. */

function SparklineSmall({ values }: { values: number[] }) {
  return (
    <div className="h-8 w-full rounded-md border border-black/60 bg-gradient-to-b from-neutral-800/40 via-neutral-900 to-black shadow-inner shadow-black/70" />
  );
}

/* -------------------------------------------------------------------------- */
/*                          FORM GRID SECTION (TOP-LEVEL)                     */
/* -------------------------------------------------------------------------- */

export default function TeamFormGrid() {
  const classified = useMemo(() => classifyTeams(), []);

  // Split into categories
  const hotTeamsAll = classified.filter((t) => t.category === "hot");
  const stableTeamsAll = classified.filter((t) => t.category === "stable");
  const coldTeamsAll = classified.filter((t) => t.category === "cold");

  // Sort & take TOP 3 for each
  const hotTeams = [...hotTeamsAll]
    .sort((a, b) => b.momentum - a.momentum)
    .slice(0, 3);

  const stableTeams = [...stableTeamsAll]
    .sort((a, b) => Math.abs(a.momentum) - Math.abs(b.momentum))
    .slice(0, 3);

  const coldTeams = [...coldTeamsAll]
    .sort((a, b) => a.momentum - b.momentum)
    .slice(0, 3);

  return (
    <section className="mt-12 rounded-3xl border border-yellow-500/15 bg-gradient-to-b from-neutral-950/95 via-black/96 to-black px-5 py-8 shadow-[0_0_80px_rgba(0,0,0,0.85)]">
      {/* Header pill (unified style) */}
      <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div
            className="inline-flex items-center gap-2 rounded-full
            border border-yellow-500/60
            bg-gradient-to-r from-yellow-600/25 via-yellow-700/15 to-black/70
            px-4 py-1.5
            shadow-[0_0_28px_rgba(250,204,21,0.28)]"
          >
            <span className="h-2 w-2 rounded-full bg-yellow-300/90" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-yellow-200">
              Team Form Grid
            </span>
          </div>

          <h2 className="mt-4 text-xl font-semibold text-neutral-50 md:text-2xl">
            Hot, stable and cold clubs based on league-wide momentum
          </h2>

          <p className="mt-2 max-w-2xl text-xs text-neutral-400">
            Distilled view of recent margins, attack/defence deltas and rolling
            volatility – grouped into hot, stable and cold performance bands.
          </p>

          <div className="mt-3 h-px w-40 bg-gradient-to-r from-yellow-500/90 via-yellow-300/60 to-transparent" />
        </div>
      </div>

      {/* Columns: compact premium grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <FormColumn
          title="Hot Teams"
          tone="hot"
          icon={
            <Flame className="h-4 w-4 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          }
          teams={hotTeams}
        />

        <FormColumn
          title="Stable Teams"
          tone="stable"
          icon={
            <CircleDot className="h-4 w-4 text-lime-300 drop-shadow-[0_0_7px_rgba(190,242,100,0.6)]" />
          }
          teams={stableTeams}
        />

        <FormColumn
          title="Cold Teams"
          tone="cold"
          icon={
            <Snowflake className="h-4 w-4 text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
          }
          teams={coldTeams}
        />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                             FORM COLUMN COMPONENT                           */
/* -------------------------------------------------------------------------- */

function FormColumn({
  title,
  icon,
  tone,
  teams,
}: {
  title: string;
  icon: React.ReactNode;
  tone: "hot" | "stable" | "cold";
  teams: ClassifiedTeam[];
}) {
  return (
    <div className="space-y-3">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">
          {title}
        </span>
      </div>

      <div className="space-y-3">
        {teams.map((t) => (
          <FormCard key={t.name} team={t} tone={tone} />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              FORM CARD COMPONENT                            */
/* -------------------------------------------------------------------------- */

function FormCard({ team, tone }: { team: ClassifiedTeam; tone: "hot" | "stable" | "cold" }) {
  const [flipped, setFlipped] = useState(false);

  const margins5 = lastN(team.margins, 5);
  const volatility = stdDev(margins5);
  const attack3 = team.scores[team.scores.length - 1] - team.scores[team.scores.length - 4];
  const defence3 =
    team.margins[team.margins.length - 1] - team.margins[team.margins.length - 4];

  const trendUp = team.momentum >= 0;
  const attackUp = team.attackDelta >= 0;
  const defenceUp = team.defenceDelta >= 0;

  // Tone-based colours
  const toneBorder =
    tone === "hot"
      ? "border-amber-400/50"
      : tone === "stable"
      ? "border-lime-400/45"
      : "border-sky-400/45";

  const toneGlow =
    tone === "hot"
      ? "shadow-[0_0_40px_rgba(251,191,36,0.35)]"
      : tone === "stable"
      ? "shadow-[0_0_40px_rgba(74,222,128,0.35)]"
      : "shadow-[0_0_40px_rgba(56,189,248,0.4)]";

  const toneArrow =
    tone === "hot"
      ? "text-amber-300"
      : tone === "stable"
      ? "text-lime-300"
      : "text-sky-300";

  return (
    <div
      className={`group relative h-full rounded-2xl border bg-gradient-to-b from-neutral-950/95 via-black/98 to-black px-4 py-3 ${toneBorder} ${toneGlow} overflow-hidden`}
      style={{
        boxShadow:
          tone === "hot"
            ? "0 0 0 1px rgba(251,191,36,0.15), inset 0 0 0 0.5px rgba(251,191,36,0.25)"
            : tone === "stable"
            ? "0 0 0 1px rgba(132,204,22,0.18), inset 0 0 0 0.5px rgba(132,204,22,0.25)"
            : "0 0 0 1px rgba(56,189,248,0.18), inset 0 0 0 0.5px rgba(56,189,248,0.25)",
      }}
    >
      {/* team tint glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.09]"
        style={{
          background: `radial-gradient(circle at 12% 0%, ${team.colours.primary}, transparent 65%)`,
        }}
      />

      {/* 3D flip container */}
      <button
        type="button"
        className="relative block h-full w-full text-left [perspective:1200px] md:cursor-pointer"
        onClick={() => setFlipped((v) => !v)}
      >
        <div
          className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]${
            flipped ? " [transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* FRONT: basic stats */}
          <div className="absolute inset-0 [backface-visibility:hidden]">
            {/* Header row */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-neutral-50">
                  {team.name}
                </div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  Last 5 margins
                </div>
              </div>

              {trendUp ? (
                <ArrowUpRight className={`h-5 w-5 ${toneArrow}`} />
              ) : (
                <ArrowDownRight className={`h-5 w-5 ${toneArrow}`} />
              )}
            </div>

            {/* Sparkline */}
            <div className="mt-3">
              <SparklineSmall values={margins5} />
            </div>

            {/* Attack / Defence delta – compact layout */}
            <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-neutral-300">
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  Attack Δ
                </div>
                <div
                  className={`mt-1 font-semibold ${
                    attackUp
                      ? "text-lime-300 drop-shadow-[0_0_7px_rgba(74,222,128,0.6)]"
                      : "text-red-300 drop-shadow-[0_0_6px_rgba(248,113,113,0.6)]"
                  }`}
                >
                  {attackUp ? "+" : ""}
                  {team.attackDelta}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  Defence Δ
                </div>
                <div
                  className={`mt-1 font-semibold ${
                    defenceUp
                      ? "text-lime-300 drop-shadow-[0_0_7px_rgba(74,222,128,0.6)]"
                      : "text-red-300 drop-shadow-[0_0_6px_rgba(248,113,113,0.6)]"
                  }`}
                >
                  {defenceUp ? "+" : ""}
                  {team.defenceDelta}
                </div>
              </div>
            </div>

            <div className="mt-3 text-[10px] text-neutral-500">
              Tap or hover to view analytics
            </div>
          </div>

          {/* BACK: analytics side */}
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="flex h-full flex-col justify-between">
              {/* Title */}
              <div>
                <div className="text-sm font-semibold text-neutral-50">
                  {team.name} analytics
                </div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  Deeper form snapshot
                </div>
              </div>

              {/* Analytics stack */}
              <div className="mt-3 space-y-2 text-[11px] text-neutral-300">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Momentum score</span>
                  <span
                    className={`font-semibold ${
                      trendUp ? "text-lime-300" : "text-red-300"
                    }`}
                  >
                    {trendUp ? "+" : ""}
                    {team.momentum.toFixed(0)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">
                    Rolling volatility (last 5)
                  </span>
                  <span className="font-semibold text-neutral-200">
                    {volatility.toFixed(1)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Attack Δ (last 3 Rds)</span>
                  <span
                    className={`font-semibold ${
                      attack3 >= 0 ? "text-lime-300" : "text-red-300"
                    }`}
                  >
                    {attack3 >= 0 ? "+" : ""}
                    {attack3}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">
                    Defence Δ (last 3 Rds)
                  </span>
                  <span
                    className={`font-semibold ${
                      defence3 >= 0 ? "text-lime-300" : "text-red-300"
                    }`}
                  >
                    {defence3 >= 0 ? "+" : ""}
                    {defence3}
                  </span>
                </div>
              </div>

              {/* Footer line */}
              <div className="mt-3 text-[10px] text-neutral-500">
                Tap again to flip back • Full team breakdown lives on the club
                page.
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}