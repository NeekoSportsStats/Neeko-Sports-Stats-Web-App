import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Flame,
  Shield,
  Sparkles,
  Activity,
} from "lucide-react";

import {
  useAFLMockPlayers,
  getSeriesForStat,
  average,
  StatKey,
} from "@/components/afl/players/useAFLMockData";

/* ---------------------------------------------------------
   Stat Options
--------------------------------------------------------- */
const STATS: StatKey[] = [
  "fantasy",
  "disposals",
  "kicks",
  "marks",
  "tackles",
  "hitouts",
  "goals",
];

/* ---------------------------------------------------------
   Sparkline (gold theme)
--------------------------------------------------------- */
function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);

  const normalized = data.map(
    (v) => ((v - min) / (max - min || 1)) * 100
  );

  return (
    <div className="relative h-16 w-full md:h-20">
      {/* glow */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${normalized.length * 20} 100`}
      >
        <polyline
          points={normalized
            .map((v, i) => `${i * 20},${100 - v}`)
            .join(" ")}
          fill="none"
          stroke="rgba(234,179,8,0.25)"
          strokeWidth="4"
          className="drop-shadow-[0_0_12px_rgba(234,179,8,0.25)]"
        />
      </svg>

      {/* line */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${normalized.length * 20} 100`}
      >
        <polyline
          points={normalized
            .map((v, i) => `${i * 20},${100 - v}`)
            .join(" ")}
          fill="none"
          stroke="rgb(234,179,8)"
          strokeWidth="3"
        />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------
   Mini Card (gold premium)
--------------------------------------------------------- */
function MiniCard({
  icon: Icon,
  label,
  value,
  player,
  delay,
}: {
  icon: any;
  label: string;
  value: string;
  player: string;
  delay: number;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/8 p-3 md:p-4",
        "bg-black/40 backdrop-blur-sm",
        "transition-transform duration-300",
        "hover:-translate-y-[3px] hover:shadow-[0_0_10px_rgba(234,179,8,0.18)]",
        "animate-in fade-in slide-in-from-bottom-4"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <Icon className="h-4 w-4 text-yellow-400" />
        <p className="text-[11px] uppercase tracking-wide text-white/50">
          {label}
        </p>
      </div>
      <p className="text-base md:text-lg font-semibold text-yellow-300">
        {value}
      </p>
      <p className="mt-1 text-xs text-white/55">{player}</p>
    </div>
  );
}

/* ---------------------------------------------------------
   MAIN: Round Summary
   - Controlled by parent via selectedStat + onStatChange
   - roundNumber is section-specific, not global
--------------------------------------------------------- */
type RoundSummaryProps = {
  selectedStat: StatKey;
  onStatChange: (s: StatKey) => void;
  roundNumber?: number;
};

export default function RoundSummary({
  selectedStat,
  onStatChange,
  roundNumber = 6,
}: RoundSummaryProps) {
  const players = useAFLMockPlayers();

  /* -----------------------------------------
     Compute Round Data
  ----------------------------------------- */
  const avgRounds = useMemo(() => {
    if (!players.length) return [];

    const len = getSeriesForStat(players[0], selectedStat).length;
    const totals = Array(len).fill(0);

    players.forEach((p) => {
      const s = getSeriesForStat(p, selectedStat);
      s.forEach((v, i) => (totals[i] += v));
    });

    return totals.map((t) => Math.round(t / players.length));
  }, [players, selectedStat]);

  const topScorer = useMemo(() => {
    return players
      .map((p) => ({
        name: p.name,
        last: getSeriesForStat(p, selectedStat).at(-1) || 0,
      }))
      .sort((a, b) => b.last - a.last)[0];
  }, [players, selectedStat]);

  const biggestRiser = useMemo(() => {
    return players
      .map((p) => {
        const s = getSeriesForStat(p, selectedStat);
        if (s.length < 2) return null;
        return { name: p.name, diff: s.at(-1)! - s.at(-2)! };
      })
      .filter(Boolean)
      .sort((a, b) => b!.diff - a!.diff)[0];
  }, [players, selectedStat]);

  const mostConsistent = useMemo(() => {
    return players
      .map((p) => {
        const s = getSeriesForStat(p, selectedStat);
        const base = average(s) || 1;
        const consistency =
          (s.filter((v) => v >= base).length / s.length) * 100;
        return { name: p.name, consistency };
      })
      .sort((a, b) => b.consistency - a.consistency)[0];
  }, [players, selectedStat]);

  const statLabel =
    selectedStat.charAt(0).toUpperCase() + selectedStat.slice(1);

  /* ---------------------------------------------------------
     Render
  --------------------------------------------------------- */
  return (
    <section
      className="
        relative rounded-2xl border border-white/10
        bg-gradient-to-br from-black/70 via-black/80 to-black/95
        px-4 py-6 md:px-6 md:py-7
        shadow-[0_0_24px_rgba(0,0,0,0.55)]
        animate-in fade-in slide-in-from-bottom-6
      "
    >
      {/* MOBILE/GENERAL glow toned down & lowered */}
      <div className="pointer-events-none absolute -top-8 left-1/2 h-[160px] w-[340px] -translate-x-1/2 rounded-full bg-yellow-500/5 blur-3xl md:-top-10 md:h-[220px] md:w-[420px] md:bg-yellow-500/10" />

      {/* HEADER BLOCK */}
      <div className="relative mb-5">
        {/* Title */}
        <h2 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
          <Sparkles className="h-5 w-5 text-yellow-400 md:h-6 md:w-6" />
          <span>Round Momentum Summary —</span>
        </h2>

        {/* Round + snapshot line (dynamic) */}
        <p className="mt-1 text-xs text-white/50 md:text-sm">
          Round {roundNumber} • {statLabel} Snapshot
        </p>

        {/* Sub text */}
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
          Live round snapshot — track fantasy trends, standout players and
          role/stability shifts across the league as this stat moves week to
          week.
        </p>
      </div>

      {/* FILTER BAR WITH FADE */}
      <div className="relative mb-5">
        <div
          className="
            flex gap-2 overflow-x-auto pb-1 pr-10
            scrollbar-none snap-x snap-mandatory
          "
        >
          {STATS.map((s) => {
            const label = s.charAt(0).toUpperCase() + s.slice(1);
            const isActive = selectedStat === s;

            return (
              <button
                key={s}
                onClick={() => onStatChange(s)}
                className={cn(
                  "snap-start whitespace-nowrap rounded-full px-4 py-1.5 text-xs md:text-sm transition-all",
                  isActive
                    ? "bg-yellow-400 text-black font-semibold shadow-[0_0_10px_rgba(234,179,8,0.45)]"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Right edge fade so the scroll doesn’t feel cut off */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black via-black/0" />
      </div>

      {/* GRID */}
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {/* Pulse */}
        <div
          className="
            rounded-xl border border-white/10 bg-black/30 p-4
            backdrop-blur-sm transition
            hover:shadow-[0_0_12px_rgba(234,179,8,0.18)]
            md:p-5
          "
        >
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold md:text-base">
            <Activity className="h-4 w-4 text-yellow-300 md:h-5 md:w-5" />
            <span>Round Momentum Pulse</span>
          </h3>

          <p className="mb-3 text-xs leading-relaxed text-white/65 md:text-sm">
            League-wide <strong>{statLabel}</strong> trends show shifts driven
            by usage rates, matchup edges and evolving team roles.
          </p>

          <Sparkline data={avgRounds} />
        </div>

        {/* Headlines */}
        <div
          className="
            rounded-xl border border-white/10 bg-black/30 p-4
            backdrop-blur-sm transition
            hover:shadow-[0_0_12px_rgba(234,179,8,0.18)]
            md:p-5
          "
        >
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold md:text-base">
            <Flame className="h-4 w-4 text-orange-400 md:h-5 md:w-5" />
            <span>Key Headlines</span>
          </h3>

          <ul className="space-y-1.5 text-xs text-white/80 md:text-sm">
            <li>
              • <strong>{topScorer?.name}</strong> led this round with{" "}
              <strong>{topScorer?.last ?? 0} pts</strong>.
            </li>
            <li>
              • <strong>{biggestRiser?.name}</strong> climbed{" "}
              <strong>
                {biggestRiser?.diff
                  ? biggestRiser.diff.toFixed(1)
                  : "0.0"}{" "}
                pts
              </strong>{" "}
              on last week.
            </li>
            <li>
              • <strong>{mostConsistent?.name}</strong> is the stability pick
              at{" "}
              <strong>
                {mostConsistent?.consistency
                  ? mostConsistent.consistency.toFixed(0)
                  : "0"}
                %
              </strong>{" "}
              above-average games.
            </li>
            <li>
              • League-wide {statLabel.toLowerCase()} output shows meaningful
              momentum shifts for role and role certainty.
            </li>
          </ul>
        </div>
      </div>

      {/* MINI CARDS */}
      <div className="mt-5 grid gap-3 md:mt-6 md:grid-cols-3 md:gap-4">
        <MiniCard
          icon={Flame}
          label="Top Score"
          value={`${topScorer?.last ?? 0} pts`}
          player={topScorer?.name || ""}
          delay={80}
        />
        <MiniCard
          icon={TrendingUp}
          label="Biggest Riser"
          value={`${
            biggestRiser?.diff ? biggestRiser.diff.toFixed(1) : "0.0"
          } pts`}
          player={biggestRiser?.name || ""}
          delay={160}
        />
        <MiniCard
          icon={Shield}
          label="Most Consistent"
          value={`${
            mostConsistent?.consistency
              ? mostConsistent.consistency.toFixed(0)
              : "0"
          }%`}
          player={mostConsistent?.name || ""}
          delay={240}
        />
      </div>
    </section>
  );
}
