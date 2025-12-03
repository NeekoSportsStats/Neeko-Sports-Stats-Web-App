import { useMemo, useState } from "react";
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
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${normalized.length * 20} 100`}
      >
        <polyline
          points={normalized
            .map((v, i) => `${i * 20},${100 - v}`)
            .join(" ")}
          fill="none"
          stroke="rgba(234,179,8,0.35)"
          strokeWidth="4"
          className="drop-shadow-[0_0_12px_rgba(234,179,8,0.35)]"
        />
      </svg>

      {/* line */}
      <svg
        className="absolute inset-0 w-full h-full"
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
        "rounded-xl border border-white/10 p-4",
        "bg-black/40 backdrop-blur-sm",
        "transition-transform duration-300",
        "hover:-translate-y-[3px] hover:shadow-[0_0_12px_rgba(234,179,8,0.2)]",
        "animate-in fade-in slide-in-from-bottom-4"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <Icon className="mx-auto h-5 w-5 text-yellow-400 mb-2" />
      <p className="text-white/60 text-xs">{label}</p>
      <p className="text-lg font-semibold text-yellow-300">{value}</p>
      <p className="text-xs text-white/50 mt-1">{player}</p>
    </div>
  );
}

/* ---------------------------------------------------------
   MAIN: Round Summary
--------------------------------------------------------- */
export default function RoundSummary() {
  const [selected, setSelected] = useState<StatKey>("fantasy");
  const players = useAFLMockPlayers();

  /* -----------------------------------------
     Compute Round Data
  ----------------------------------------- */
  const avgRounds = useMemo(() => {
    if (!players.length) return [];

    const len = getSeriesForStat(players[0], selected).length;
    const totals = Array(len).fill(0);

    players.forEach((p) => {
      const s = getSeriesForStat(p, selected);
      s.forEach((v, i) => (totals[i] += v));
    });

    return totals.map((t) => Math.round(t / players.length));
  }, [players, selected]);

  const topScorer = useMemo(() => {
    return players
      .map((p) => ({
        name: p.name,
        last: getSeriesForStat(p, selected).at(-1) || 0,
      }))
      .sort((a, b) => b.last - a.last)[0];
  }, [players, selected]);

  const biggestRiser = useMemo(() => {
    return players
      .map((p) => {
        const s = getSeriesForStat(p, selected);
        if (s.length < 2) return null;
        return { name: p.name, diff: s.at(-1)! - s.at(-2)! };
      })
      .filter(Boolean)
      .sort((a, b) => b!.diff - a!.diff)[0];
  }, [players, selected]);

  const mostConsistent = useMemo(() => {
    return players
      .map((p) => {
        const s = getSeriesForStat(p, selected);
        const base = average(s) || 1;
        const consistency =
          (s.filter((v) => v >= base).length / s.length) * 100;
        return { name: p.name, consistency };
      })
      .sort((a, b) => b.consistency - a.consistency)[0];
  }, [players, selected]);

  const ROUND_NUMBER = 6;

  /* ---------------------------------------------------------
     Render
  --------------------------------------------------------- */
  return (
    <section
      className="
        relative rounded-2xl border border-white/10 px-5 py-8
        bg-gradient-to-br from-black/60 via-black/70 to-black/90
        shadow-[0_0_30px_rgba(0,0,0,0.45)]
        animate-in fade-in slide-in-from-bottom-6
      "
    >
      {/* MOBILE glow tone down */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[380px] h-[200px] bg-yellow-500/10 blur-3xl rounded-full md:bg-yellow-500/20" />

      {/* HEADER BLOCK */}
      <div className="mb-6">
        {/* Title + Round number */}
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between md:gap-2">
          <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-400" />
            Round Momentum Summary —
          </h2>

          {/* MOBILE: under title / DESKTOP: to the right */}
          <div className="text-yellow-300 font-bold text-xl md:text-2xl md:mt-0 mt-1">
            Round {ROUND_NUMBER}
          </div>
        </div>

        {/* Sub text */}
        <p className="text-white/60 text-sm mt-2 max-w-xl">
          Live round snapshot — track fantasy trends, standout players and
          role/stability shifts across the league.
        </p>
      </div>

      {/* FILTER BAR */}
      <div
        className="
          flex gap-2 overflow-x-auto snap-x snap-mandatory
          pb-1 mb-4 scrollbar-none
        "
      >
        {STATS.map((s) => (
          <button
            key={s}
            onClick={() => setSelected(s)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm whitespace-nowrap snap-start transition-all",
              selected === s
                ? "bg-yellow-400 text-black font-semibold shadow-[0_0_10px_rgba(234,179,8,0.45)]"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* GRID */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {/* Pulse */}
        <div
          className="
            rounded-xl p-5 border border-white/10
            bg-black/30 backdrop-blur-sm
            transition hover:shadow-[0_0_12px_rgba(234,179,8,0.18)]
          "
        >
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <Activity className="h-5 w-5 text-yellow-300" />
            Round Momentum Pulse
          </h3>

          <p className="text-sm text-white/70 leading-relaxed mb-3">
            League-wide <strong>{selected}</strong> trends show shifts driven by
            usage rates, matchup edges and evolving team roles.
          </p>

          <Sparkline data={avgRounds} />
        </div>

        {/* Headlines */}
        <div
          className="
            rounded-xl p-5 border border-white/10
            bg-black/30 backdrop-blur-sm
            transition hover:shadow-[0_0_12px_rgba(234,179,8,0.18)]
          "
        >
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400" />
            Key Headlines
          </h3>

          <ul className="space-y-2 text-sm text-white/80">
            <li>
              • <strong>{topScorer?.name}</strong> led with{" "}
              <strong>{topScorer?.last} pts</strong>.
            </li>
            <li>
              • <strong>{biggestRiser?.name}</strong> rose{" "}
              <strong>{biggestRiser?.diff.toFixed(1)} pts</strong> from last
              week.
            </li>
            <li>
              • <strong>{mostConsistent?.name}</strong> leads consistency at{" "}
              <strong>{mostConsistent?.consistency.toFixed(0)}%</strong>.
            </li>
            <li>
              • League-wide {selected} output shows meaningful momentum shifts.
            </li>
          </ul>
        </div>
      </div>

      {/* MINI CARDS */}
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <MiniCard
          icon={Flame}
          label="Top Score"
          value={`${topScorer?.last || 0} pts`}
          player={topScorer?.name || ""}
          delay={100}
        />
        <MiniCard
          icon={TrendingUp}
          label="Biggest Riser"
          value={`${biggestRiser?.diff.toFixed(1) || 0} pts`}
          player={biggestRiser?.name || ""}
          delay={200}
        />
        <MiniCard
          icon={Shield}
          label="Most Consistent"
          value={`${mostConsistent?.consistency.toFixed(0) || 0}%`}
          player={mostConsistent?.name || ""}
          delay={300}
        />
      </div>
    </section>
  );
}