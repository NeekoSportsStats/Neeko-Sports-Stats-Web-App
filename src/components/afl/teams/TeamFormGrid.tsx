// src/components/afl/teams/TeamFormGrid.tsx
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
/*                               TYPE & HELPERS                                */
/* -------------------------------------------------------------------------- */

type MetricKey = "momentum" | "fantasy" | "disposals" | "goals";

type ClassifiedTeam = AFLTeam & {
  // primary form signals
  momentum: number;
  attackDelta: number;
  defenceDelta: number;
  category: "hot" | "stable" | "cold";

  // faux but consistent metrics per lens
  fantasyScore: number;
  disposalsScore: number;
  goalsScore: number;

  // sparkline per lens (0–100ish)
  trends: {
    momentum: number[];
    fantasy: number[];
    disposals: number[];
    goals: number[];
  };
};

const METRIC_LABELS: Record<MetricKey, string> = {
  momentum: "MOMENTUM • LAST 5",
  fantasy: "FANTASY EDGE • LAST 5",
  disposals: "DISPOSALS • LAST 5",
  goals: "GOAL IMPACT • LAST 5",
};

const METRIC_BADGE_PREFIX: Record<MetricKey, string> = {
  momentum: "",
  fantasy: "+",
  disposals: "+",
  goals: "+",
};

const METRIC_COPY_PREFIX: Record<MetricKey, string> = {
  momentum: "Momentum",
  fantasy: "Fantasy edge",
  disposals: "Disposal trend",
  goals: "Goal impact",
};

// clamp helper
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/* -------------------------------------------------------------------------- */
/*                          CLASSIFICATION + METRICS                           */
/* -------------------------------------------------------------------------- */

function classifyTeams(): ClassifiedTeam[] {
  const last = 22; // R23 idx
  const prev = 19; // R20 idx

  return MOCK_TEAMS.map((team) => {
    const momentum = team.margins[last] - team.margins[prev];
    const attackDelta = team.scores[last] - team.scores[last - 1];
    const defenceDelta = team.margins[last] - team.margins[last - 1];

    let category: "hot" | "stable" | "cold" = "stable";
    if (momentum >= 12) category = "hot";
    else if (momentum <= -12) category = "cold";

    // Faux but deterministic-ish scores based on existing data
    const fantasyBase =
      team.attackRating * 0.55 +
      team.clearanceDom[22] * 0.35 +
      team.consistencyIndex * 0.1;
    const disposalsBase =
      team.midfieldTrend.reduce((a, b) => a + b, 0) / team.midfieldTrend.length;
    const goalsBase =
      team.attackTrend[team.attackTrend.length - 1] * 0.6 +
      team.defenceTrend[team.defenceTrend.length - 1] * 0.4;

    const fantasyScore = Math.round((fantasyBase - 55) / 2 + momentum * 0.3);
    const disposalsScore = Math.round((disposalsBase - 55) / 2 + momentum * 0.2);
    const goalsScore = Math.round((goalsBase - 55) / 2 + momentum * 0.25);

    // Re-use existing trends and lightly blend them
    const { attackTrend, defenceTrend, midfieldTrend } = team;

    const blendTrend = (a: number[], b: number[]) =>
      a.map((v, i) => clamp((v * 0.6 + b[i] * 0.4) || v, 35, 95));

    const trends = {
      momentum: attackTrend.map((v) => clamp(v, 35, 95)),
      fantasy: midfieldTrend.map((v) => clamp(v + 3, 35, 98)),
      disposals: blendTrend(attackTrend, midfieldTrend),
      goals: defenceTrend.map((v) => clamp(v + 5, 35, 98)),
    };

    return {
      ...team,
      momentum,
      attackDelta,
      defenceDelta,
      category,
      fantasyScore,
      disposalsScore,
      goalsScore,
      trends,
    };
  });
}

function getMetricValue(team: ClassifiedTeam, metric: MetricKey): number {
  switch (metric) {
    case "momentum":
      return team.momentum;
    case "fantasy":
      return team.fantasyScore;
    case "disposals":
      return team.disposalsScore;
    case "goals":
      return team.goalsScore;
    default:
      return 0;
  }
}

/* -------------------------------------------------------------------------- */
/*                          SPARKLINE (LIGHTWEIGHT)                            */
/* -------------------------------------------------------------------------- */

function SparklineSmall({
  values,
  tintClass,
}: {
  values: number[];
  tintClass: string;
}) {
  // We fake the rendering with a gradient blob – enough for premium feel.
  return (
    <div
      className={`h-6 w-16 rounded-full bg-gradient-to-tr ${tintClass} opacity-90`}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

export default function TeamFormGrid() {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("momentum");
  const [flippedId, setFlippedId] = useState<number | null>(null);

  const classified = useMemo(() => classifyTeams(), []);
  const hotTeams = classified.filter((t) => t.category === "hot");
  const stableTeams = classified.filter((t) => t.category === "stable");
  const coldTeams = classified.filter((t) => t.category === "cold");

  const sortAndTake = (arr: ClassifiedTeam[]) =>
    [...arr]
      .sort(
        (a, b) => getMetricValue(b, activeMetric) - getMetricValue(a, activeMetric)
      )
      .slice(0, 3);

  const hotTop = sortAndTake(hotTeams);
  const stableTop = sortAndTake(stableTeams);
  const coldTop = sortAndTake(coldTeams);

  const handleFlip = (id: number) => {
    setFlippedId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="mt-12">
      {/* Glass wrapper */}
      <div className="rounded-[32px] border border-white/6 bg-gradient-to-b from-[#151515]/90 via-black/95 to-black/98 px-4 py-6 shadow-[0_0_80px_rgba(0,0,0,0.75)] sm:px-6 lg:px-10">
        {/* Header pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-[radial-gradient(circle_at_0%_0%,rgba(250,204,21,0.25),transparent_55%),rgba(15,15,15,0.95)] px-4 py-1 shadow-[0_0_30px_rgba(250,204,21,0.45)]">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.95)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-100/95">
            Team Form Grid
          </span>
        </div>

        {/* Title + copy */}
        <div className="mt-5 max-w-3xl">
          <h2 className="text-2xl font-semibold text-neutral-50 sm:text-3xl">
            Hot, stable and cold clubs by performance lens
          </h2>
          <p className="mt-2 text-xs text-neutral-400 sm:text-sm">
            Switch between momentum, fantasy, disposals and goals to see how each
            club is trending. Tap a pill on mobile or click a card on desktop to
            flip into a deeper analytics panel.
          </p>
        </div>

        {/* Metric switcher */}
        <div className="mt-6 rounded-full border border-neutral-800/80 bg-gradient-to-r from-neutral-900/90 via-black to-neutral-900/90 p-1 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">
            <MetricPill
              label="Momentum"
              active={activeMetric === "momentum"}
              onClick={() => setActiveMetric("momentum")}
            />
            <MetricPill
              label="Fantasy"
              active={activeMetric === "fantasy"}
              onClick={() => setActiveMetric("fantasy")}
            />
            <MetricPill
              label="Disposals"
              active={activeMetric === "disposals"}
              onClick={() => setActiveMetric("disposals")}
            />
            <MetricPill
              label="Goals"
              hideOnMobile
              active={activeMetric === "goals"}
              onClick={() => setActiveMetric("goals")}
            />
          </div>
        </div>

        {/* Columns */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <CategoryColumn
            title="Hot Teams"
            icon={<Flame className="h-4 w-4 text-yellow-300" />}
            accent="hot"
            teams={hotTop}
            activeMetric={activeMetric}
            flippedId={flippedId}
            onFlip={handleFlip}
          />
          <CategoryColumn
            title="Stable Teams"
            icon={<CircleDot className="h-4 w-4 text-lime-300" />}
            accent="stable"
            teams={stableTop}
            activeMetric={activeMetric}
            flippedId={flippedId}
            onFlip={handleFlip}
          />
          <CategoryColumn
            title="Cold Teams"
            icon={<Snowflake className="h-4 w-4 text-sky-300" />}
            accent="cold"
            teams={coldTop}
            activeMetric={activeMetric}
            flippedId={flippedId}
            onFlip={handleFlip}
          />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                              METRIC PILL SWITCHER                           */
/* -------------------------------------------------------------------------- */

function MetricPill({
  label,
  active,
  hideOnMobile,
  onClick,
}: {
  label: string;
  active: boolean;
  hideOnMobile?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-medium transition-all duration-200 sm:text-sm ${
        hideOnMobile ? "hidden sm:flex" : "flex"
      } ${
        active
          ? "text-yellow-100"
          : "text-neutral-400 hover:text-neutral-100/90"
      }`}
    >
      {active && (
        <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_20%_0%,rgba(250,204,21,0.6),transparent_55%)] shadow-[0_0_35px_rgba(250,204,21,0.55)]" />
      )}
      <span className={`relative ${active ? "font-semibold" : ""}`}>
        {label}
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                            CATEGORY COLUMN COMPONENT                        */
/* -------------------------------------------------------------------------- */

function CategoryColumn({
  title,
  icon,
  accent,
  teams,
  activeMetric,
  flippedId,
  onFlip,
}: {
  title: string;
  icon: React.ReactNode;
  accent: "hot" | "stable" | "cold";
  teams: ClassifiedTeam[];
  activeMetric: MetricKey;
  flippedId: number | null;
  onFlip: (id: number) => void;
}) {
  const accentColor = {
    hot: "from-yellow-500/55 via-yellow-500/0 to-transparent",
    stable: "from-lime-400/55 via-lime-400/0 to-transparent",
    cold: "from-sky-400/55 via-sky-400/0 to-transparent",
  }[accent];

  const badgeColor = {
    hot: "bg-yellow-400 text-black",
    stable: "bg-lime-400 text-black",
    cold: "bg-sky-400 text-black",
  }[accent];

  const sparkTint = {
    hot: "from-yellow-200/80 via-yellow-100/20 to-transparent",
    stable: "from-lime-200/80 via-lime-100/20 to-transparent",
    cold: "from-sky-200/80 via-sky-100/20 to-transparent",
  }[accent];

  return (
    <div className="relative">
      {/* subtle category halo */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-24 rounded-3xl bg-gradient-to-b ${accentColor} blur-3xl opacity-55`}
      />
      {/* header */}
      <div className="relative mb-4 flex items-center gap-2 border-b border-neutral-800/80 pb-3">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-300">
          {title}
        </span>
      </div>

      <div className="relative space-y-4">
        {teams.map((team) => (
          <FormCard
            key={team.id}
            team={team}
            activeMetric={activeMetric}
            flipped={flippedId === team.id}
            onFlip={() => onFlip(team.id)}
            badgeColor={badgeColor}
            sparkTint={sparkTint}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                FORM CARD                                    */
/* -------------------------------------------------------------------------- */

function FormCard({
  team,
  activeMetric,
  flipped,
  onFlip,
  badgeColor,
  sparkTint,
}: {
  team: ClassifiedTeam;
  activeMetric: MetricKey;
  flipped: boolean;
  onFlip: () => void;
  badgeColor: string;
  sparkTint: string;
}) {
  const metricValue = getMetricValue(team, activeMetric);
  const metricLabel = METRIC_LABELS[activeMetric];
  const badgePrefix = METRIC_BADGE_PREFIX[activeMetric];

  // normalise metric into 0–100 width for micro bar
  const normalised = clamp((metricValue + 60) * 0.75, 6, 100);
  const barWidth = `${normalised}%`;

  const trendValues = team.trends[activeMetric];

  const isUp = metricValue >= 0;

  return (
    <button
      type="button"
      onClick={onFlip}
      className="group block w-full text-left focus:outline-none"
    >
      <div className="perspective-1000 relative h-[120px] w-full sm:h-[128px]">
        {/* glow */}
        <div className="absolute -inset-2 rounded-[28px] bg-gradient-to-b from-white/4 via-white/0 to-white/0 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-40" />

        {/* card glass + flip wrapper */}
        <div
          className={`flip-inner relative h-full w-full rounded-[24px] border border-white/6 bg-gradient-to-b from-neutral-900/95 via-black/98 to-black/100 px-4 py-3 shadow-[0_0_40px_rgba(0,0,0,0.85)] transition-transform duration-500 [transform-style:preserve-3d] ${
            flipped ? "rotate-y-180" : ""
          }`}
          style={{ transformOrigin: "center center" }}
        >
          {/* FRONT */}
          <div className="absolute inset-0 flex flex-col justify-between backface-hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-neutral-50">
                  {team.name}
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  {metricLabel}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                {/* sparkline */}
                <SparklineSmall values={trendValues} tintClass={sparkTint} />
                {/* badge */}
                <div
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-[0_0_16px_rgba(0,0,0,0.7)] ${badgeColor}`}
                >
                  <span>{badgePrefix}</span>
                  <span>{metricValue.toFixed(1)}</span>
                  {isUp ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                </div>
              </div>
            </div>

            {/* micro momentum bar */}
            <div className="mt-4">
              <div className="h-2 w-full rounded-full bg-neutral-800/90">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-yellow-300 via-yellow-200 to-amber-300 shadow-[0_0_18px_rgba(250,204,21,0.7)]"
                  style={{ width: barWidth }}
                />
              </div>
            </div>
          </div>

          {/* BACK – analytics snapshot */}
          <div className="absolute inset-0 flex flex-col justify-between rounded-[24px] bg-gradient-to-b from-neutral-900/98 via-black/98 to-black/100 px-4 py-3 text-[11px] text-neutral-300 [backface-visibility:hidden] rotate-y-180">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                {team.name.toUpperCase()}
              </div>
              <div className="mt-0.5 text-xs text-neutral-400">
                Analytics snapshot
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
              <StatBlock
                label="Attack Δ"
                value={`${team.attackDelta >= 0 ? "+" : ""}${team.attackDelta}`}
              />
              <StatBlock
                label="Defence Δ"
                value={`${team.defenceDelta >= 0 ? "+" : ""}${
                  team.defenceDelta
                }`}
              />
              <StatBlock
                label="Clearance %"
                value={`${team.clearanceDom[22].toFixed(0)}%`}
              />
              <StatBlock
                label="Consistency"
                value={team.consistencyIndex.toFixed(0)}
              />
              <StatBlock
                label="Fixture diff"
                value={team.fixtureDifficulty.score.toFixed(0)}
              />
              <StatBlock
                label="Opponents"
                value={team.fixtureDifficulty.opponents.join(", ")}
              />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  STAT BLOCK                                 */
/* -------------------------------------------------------------------------- */

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[9px] uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </div>
      <div className="text-xs font-semibold text-neutral-50">{value}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                CSS HELPERS                                  */
/* -------------------------------------------------------------------------- */
/**
 * NOTE:
 * Tailwind doesn't know rotate-y utilities out-of-the-box.
 * Add these to your global CSS (e.g. globals.css):
 *
 * .perspective-1000 {
 *   perspective: 1000px;
 * }
 * .flip-inner {
 *   transform-style: preserve-3d;
 * }
 * .backface-hidden {
 *   backface-visibility: hidden;
 * }
 * .rotate-y-180 {
 *   transform: rotateY(180deg);
 * }
 */
