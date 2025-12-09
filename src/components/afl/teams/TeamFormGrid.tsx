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
/*                               TYPES & HELPERS                               */
/* -------------------------------------------------------------------------- */

type FilterMode = "momentum" | "fantasy" | "disposals" | "goals";

const MODE_LABELS: { id: FilterMode; label: string }[] = [
  { id: "momentum", label: "Momentum" },
  { id: "fantasy", label: "Fantasy" },
  { id: "disposals", label: "Disposals" },
  { id: "goals", label: "Goals" },
];

const lastN = (arr: number[], n: number) => arr.slice(-n);

const avg = (arr: number[]) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const stdDev = (arr: number[]) => {
  if (!arr.length) return 0;
  const mean = avg(arr);
  const variance = avg(arr.map((v) => (v - mean) ** 2));
  return Math.sqrt(variance);
};

type ClassifiedTeam = AFLTeam & {
  momentum: number;
  attackDelta: number;
  defenceDelta: number;
};

/* -------------------------------------------------------------------------- */
/*                         BASE FORM METRIC CALCULATIONS                       */
/* -------------------------------------------------------------------------- */

function buildClassifiedTeams(): ClassifiedTeam[] {
  const last = 22; // R23 idx
  const prev = 19; // R20 idx

  return MOCK_TEAMS.map((team) => {
    const momentum = team.margins[last] - team.margins[prev];
    const attackDelta = team.scores[last] - team.scores[last - 1];
    const defenceDelta = team.margins[last] - team.margins[last - 1];

    return {
      ...team,
      momentum,
      attackDelta,
      defenceDelta,
    };
  });
}

function getModeSeries(team: ClassifiedTeam, mode: FilterMode): number[] {
  switch (mode) {
    case "fantasy":
      return team.fantasy;
    case "disposals":
      return team.disposals;
    case "goals":
      return team.goals;
    case "momentum":
    default:
      return team.margins;
  }
}

function getModeMetric(team: ClassifiedTeam, mode: FilterMode): number {
  const series = getModeSeries(team, mode);
  const last = series.length - 1;
  const prev = Math.max(0, last - 3);
  // use average of last 3–4 rounds as ranking metric
  const window = series.slice(prev, last + 1);
  return avg(window);
}

/* -------------------------------------------------------------------------- */
/*                        PARTITION TEAMS: HOT / STABLE / COLD                */
/* -------------------------------------------------------------------------- */

function partitionTeamsByMode(
  teams: ClassifiedTeam[],
  mode: FilterMode
): {
  hot: ClassifiedTeam[];
  stable: ClassifiedTeam[];
  cold: ClassifiedTeam[];
} {
  const scored = teams.map((t) => ({
    team: t,
    metric: getModeMetric(t, mode),
  }));

  const sortedDesc = scored.sort((a, b) => b.metric - a.metric);
  const n = sortedDesc.length;

  if (n <= 9) {
    // simple split if somehow fewer than 9 teams
    const third = Math.max(1, Math.floor(n / 3));
    const hot = sortedDesc.slice(0, third).map((x) => x.team);
    const stable = sortedDesc.slice(third, third * 2).map((x) => x.team);
    const cold = sortedDesc.slice(third * 2).map((x) => x.team);
    return { hot, stable, cold };
  }

  const hot = sortedDesc.slice(0, 3).map((x) => x.team);
  const cold = sortedDesc.slice(n - 3).map((x) => x.team);
  const midStart = Math.floor(n / 2) - 1;
  const stable = sortedDesc.slice(midStart, midStart + 3).map((x) => x.team);

  return { hot, stable, cold };
}

/* -------------------------------------------------------------------------- */
/*                               SPARKLINE SHELL                              */
/* -------------------------------------------------------------------------- */

function SparklineSmall({ values }: { values: number[] }) {
  return (
    <div className="h-8 w-full rounded-md border border-black/60 bg-gradient-to-b from-neutral-800/40 via-neutral-900 to-black shadow-inner shadow-black/70" />
  );
}

/* -------------------------------------------------------------------------- */
/*                          TOP-LEVEL FORM GRID SECTION                       */
/* -------------------------------------------------------------------------- */

export default function TeamFormGrid() {
  const [mode, setMode] = useState<FilterMode>("momentum");

  const classified = useMemo(() => buildClassifiedTeams(), []);
  const { hot, stable, cold } = useMemo(
    () => partitionTeamsByMode(classified, mode),
    [classified, mode]
  );

  return (
    <section className="mt-12 rounded-3xl border border-yellow-500/15 bg-gradient-to-b from-neutral-950/95 via-black/96 to-black px-5 py-8 shadow-[0_0_80px_rgba(0,0,0,0.85)]">
      {/* Header + filters */}
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          {/* Unified static gold pill */}
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
            Hot, stable and cold clubs by performance lens
          </h2>

          <p className="mt-2 max-w-2xl text-xs text-neutral-400">
            Toggle between momentum, fantasy, disposals and goals to see which
            clubs are running hot, holding steady or dropping off across key
            metrics.
          </p>

          <div className="mt-3 h-px w-40 bg-gradient-to-r from-yellow-500/90 via-yellow-300/60 to-transparent" />
        </div>

        {/* Filter pill control */}
        <div className="flex justify-start md:justify-end">
          <div className="inline-flex items-center gap-1 rounded-full border border-neutral-700/70 bg-black/70 px-1 py-1">
            {MODE_LABELS.map((m) => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] transition ${
                    active
                      ? "bg-yellow-500/20 text-yellow-200 shadow-[0_0_18px_rgba(250,204,21,0.55)]"
                      : "text-neutral-400 hover:text-neutral-100"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Columns grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <FormColumn
          title="Hot Teams"
          tone="hot"
          icon={
            <Flame className="h-4 w-4 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          }
          teams={hot}
          mode={mode}
        />

        <FormColumn
          title="Stable Teams"
          tone="stable"
          icon={
            <CircleDot className="h-4 w-4 text-lime-300 drop-shadow-[0_0_7px_rgba(190,242,100,0.6)]" />
          }
          teams={stable}
          mode={mode}
        />

        <FormColumn
          title="Cold Teams"
          tone="cold"
          icon={
            <Snowflake className="h-4 w-4 text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
          }
          teams={cold}
          mode={mode}
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
  mode,
}: {
  title: string;
  icon: React.ReactNode;
  tone: "hot" | "stable" | "cold";
  teams: ClassifiedTeam[];
  mode: FilterMode;
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
          <FormCard key={`${t.code}-${mode}`} team={t} tone={tone} mode={mode} />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              FORM CARD COMPONENT                            */
/* -------------------------------------------------------------------------- */

function FormCard({
  team,
  tone,
  mode,
}: {
  team: ClassifiedTeam;
  tone: "hot" | "stable" | "cold";
  mode: FilterMode;
}) {
  const [flipped, setFlipped] = useState(false);

  const series = getModeSeries(team, mode);
  const series5 = lastN(series, 5);
  const volatility = stdDev(series5);

  const lastIdx = series.length - 1;
  const deltaShort = series[lastIdx] - series[lastIdx - 1];
  const deltaLong = series[lastIdx] - series[Math.max(0, lastIdx - 3)];

  const modeMetric = getModeMetric(team, mode);
  const trendUp = modeMetric >= 0;

  // extra momentum-specific values
  const attackUp = team.attackDelta >= 0;
  const defenceUp = team.defenceDelta >= 0;

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

  const modeLabel =
    mode === "momentum"
      ? "Momentum"
      : mode === "fantasy"
      ? "Fantasy"
      : mode === "disposals"
      ? "Disposals"
      : "Goals";

  const shortLabel =
    mode === "momentum" ? "Last Rd Δ (margin)" : "Last Rd Δ";

  const longLabel =
    mode === "momentum" ? "3-Rd Δ (margin)" : "3-Rd Δ";

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
                  {modeLabel} • last 5 rounds
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
              <SparklineSmall values={series5} />
            </div>

            {/* Deltas – mode-aware */}
            <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-neutral-300">
              {mode === "momentum" ? (
                <>
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
                </>
              ) : (
                <>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                      {shortLabel}
                    </div>
                    <div
                      className={`mt-1 font-semibold ${
                        deltaShort >= 0
                          ? "text-lime-300 drop-shadow-[0_0_7px_rgba(74,222,128,0.6)]"
                          : "text-red-300 drop-shadow-[0_0_6px_rgba(248,113,113,0.6)]"
                      }`}
                    >
                      {deltaShort >= 0 ? "+" : ""}
                      {deltaShort.toFixed(0)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                      {longLabel}
                    </div>
                    <div
                      className={`mt-1 font-semibold ${
                        deltaLong >= 0
                          ? "text-lime-300 drop-shadow-[0_0_7px_rgba(74,222,128,0.6)]"
                          : "text-red-300 drop-shadow-[0_0_6px_rgba(248,113,113,0.6)]"
                      }`}
                    >
                      {deltaLong >= 0 ? "+" : ""}
                      {deltaLong.toFixed(0)}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-3 text-[10px] text-neutral-500">
              Hover or tap to view analytics
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
                  {modeLabel} form snapshot
                </div>
              </div>

              {/* Analytics stack */}
              <div className="mt-3 space-y-2 text-[11px] text-neutral-300">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">
                    {modeLabel} score (last 3–4 Rd avg)
                  </span>
                  <span
                    className={`font-semibold ${
                      trendUp ? "text-lime-300" : "text-red-300"
                    }`}
                  >
                    {modeMetric.toFixed(1)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">
                    Volatility (last 5 rounds)
                  </span>
                  <span className="font-semibold text-neutral-200">
                    {volatility.toFixed(1)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">{shortLabel}</span>
                  <span
                    className={`font-semibold ${
                      deltaShort >= 0 ? "text-lime-300" : "text-red-300"
                    }`}
                  >
                    {deltaShort >= 0 ? "+" : ""}
                    {deltaShort.toFixed(0)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">{longLabel}</span>
                  <span
                    className={`font-semibold ${
                      deltaLong >= 0 ? "text-lime-300" : "text-red-300"
                    }`}
                  >
                    {deltaLong >= 0 ? "+" : ""}
                    {deltaLong.toFixed(0)}
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