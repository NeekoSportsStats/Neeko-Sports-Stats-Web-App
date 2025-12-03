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
   Sparkline
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
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${normalized.length * 20} 100`}
      >
        <polyline
          points={normalized
            .map((v, i) => `${i * 20},${100 - v}`)
            .join(" ")}
          fill="none"
          stroke="rgba(234,179,8,0.20)"
          strokeWidth="4"
          className="drop-shadow-[0_0_10px_rgba(234,179,8,0.20)]"
        />
      </svg>

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
   MiniCard — gold outline version
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
        "rounded-xl border border-yellow-400/25",
        "bg-black/40 backdrop-blur-sm",
        "p-2 md:p-3",
        "transition-transform duration-300",
        "hover:-translate-y-[3px] hover:shadow-[0_0_10px_rgba(234,179,8,0.18)]",
        "animate-in fade-in slide-in-from-bottom-4"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <Icon className="h-4 w-4 text-yellow-400" />
        <p className="text-[11px] uppercase tracking-wide text-white/45">
          {label}
        </p>
      </div>

      <p className="text-lg md:text-xl font-semibold text-yellow-300">
        {value}
      </p>

      <p className="text-[11px] text-white/55 mt-0.5">{player}</p>
    </div>
  );
}

/* ---------------------------------------------------------
   MAIN COMPONENT
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

  /* ---------------------- COMPUTATIONS ---------------------- */

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

  /* ----------------------------------------------------------- */

  return (
    <section
      className="
        relative rounded-2xl
        border border-yellow-400/30
        bg-gradient-to-br from-black/75 via-black/80 to-black/95
        px-4 py-6 md:px-6 md:py-7
        shadow-[0_0_18px_rgba(234,179,8,0.15)]
      "
    >
      {/* Glow (balanced top/bottom) */}
      <div className="pointer-events-none absolute -top-16 left-1/2 h-[200px] w-[440px] -translate-x-1/2 rounded-full bg-yellow-500/6 blur-3xl md:bg-yellow-500/8" />

      {/* HEADER */}
      <div className="relative mb-6">
        <h2 className="flex items-center gap-2 text-xl md:text-2xl font-bold">
          <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-yellow-400" />
          Round Momentum Summary —
        </h2>

        <p className="mt-1.5 text-xs md:text-sm text-white/50">
          Round {roundNumber} • {statLabel} Snapshot
        </p>

        <p className="mt-3 text-sm md:text-[15px] leading-relaxed max-w-xl text-white/60">
          Live round snapshot — track fantasy trends, standout players and
          role/stability shifts across the league as this stat moves week to
          week.
        </p>
      </div>

      {/* FILTER ROW */}
      <div className="relative mb-5">
        <div
          className="
            flex gap-2 overflow-x-auto pr-14 pb-1
            scrollbar-none snap-x snap-mandatory
          "
        >
          {STATS.map((s) => {
            const label =
              s.charAt(0).toUpperCase() + s.slice(1);
            const active = selectedStat === s;

            return (
              <button
                key={s}
                onClick={() => onStatChange(s)}
                className={cn(
                  "snap-start whitespace-nowrap rounded-full px-4 py-1.5 text-xs md:text-sm transition-all",
                  active
                    ? "bg-yellow-400 text-black font-semibold shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* smoother fade */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-black via-black/0" />
      </div>

      {/* GRID */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {/* Pulse Card */}
        <div
          className="
            rounded-xl border border-white/10 bg-black/30
            p-4 md:p-5
            min-h-[235px] md:min-h-[250px]
            backdrop-blur-sm
          "
        >
          <h3 className="flex items-center gap-2 text-sm md:text-base font-semibold mb-1">
            <Activity className="h-4 w-4 md:h-5 md:w-5 text-yellow-300" />
            Round Momentum Pulse
          </h3>

          <p className="mb-3 text-xs md:text-sm leading-snug md:leading-relaxed text-white/65">
            League-wide <strong>{statLabel}</strong> trends reflect shifts
            driven by usage, matchup edges and evolving roles.
          </p>

          <Sparkline data={avgRounds} />
        </div>

        {/* Headlines Card */}
        <div
          className="
            rounded-xl border border-white/10 bg-black/30
            p-4 md:p-5
            min-h-[235px] md:min-h-[250px]
            backdrop-blur-sm
          "
        >
          <h3 className="flex items-center gap-2 text-sm md:text-base font-semibold mb-2">
            <Flame className="h-4 w-4 md:h-5 md:w-5 text-orange-400" />
            Key Headlines
          </h3>

          <ul className="text-xs md:text-sm text-white/70 space-y-1.5">
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
              • <strong>{mostConsistent?.name}</strong> holds{" "}
              <strong>
                {mostConsistent?.consistency
                  ? mostConsistent.consistency.toFixed(0)
                  : "0"}
                %
              </strong>{" "}
              above-average games.
            </li>
            <li>
              • League-wide{" "}
              {statLabel.toLowerCase()} output continues to show meaningful
              stability and role changes.
            </li>
          </ul>
        </div>
      </div>

      {/* MINI CARDS */}
      <div className="grid md:grid-cols-3 gap-3 md:gap-4 mt-5 md:mt-6">
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
            biggestRiser?.diff
              ? biggestRiser.diff.toFixed(1)
              : "0.0"
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
