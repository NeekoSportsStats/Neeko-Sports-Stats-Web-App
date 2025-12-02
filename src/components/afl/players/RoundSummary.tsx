// src/components/afl/players/RoundSummary.tsx

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
  lastN,
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
   SPARKLINE
--------------------------------------------------------- */
function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);

  const normalized = data.map(
    (v) => ((v - min) / (max - min || 1)) * 100
  );

  return (
    <div className="relative h-20 w-full">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${normalized.length * 20} 100`}
      >
        <polyline
          points={normalized
            .map((v, i) => `${i * 20},${100 - v}`)
            .join(" ")}
          fill="none"
          stroke="rgb(52 211 153 / 0.5)"
          strokeWidth="4"
          className="drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-[pulse_1.8s_ease-in-out_infinite]"
        />
      </svg>

      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${normalized.length * 20} 100`}
      >
        <polyline
          points={normalized
            .map((v, i) => `${i * 20},${100 - v}`)
            .join(" ")}
          fill="none"
          stroke="rgb(16 185 129)"
          strokeWidth="3"
          className="animate-[fade-in_0.8s_ease-out]"
        />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------
   MINI CARD
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
        "rounded-xl border border-white/10 p-4 bg-slate-900/40 backdrop-blur-sm text-center",
        "transition-transform duration-300",
        "hover:-translate-y-1 hover:shadow-2xl",
        "animate-in fade-in slide-in-from-bottom-4"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <Icon className="mx-auto h-5 w-5 text-emerald-400 mb-2" />
      <p className="text-white/60 text-xs">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-white/50 mt-1">{player}</p>
    </div>
  );
}

/* ---------------------------------------------------------
   MAIN COMPONENT (NOW CONTROLLED)
--------------------------------------------------------- */
export default function RoundSummary({
  selectedStat,
  onStatChange,
}: {
  selectedStat: StatKey;
  onStatChange: (s: StatKey) => void;
}) {
  const players = useAFLMockPlayers();

  /* -----------------------------------------
     ROUND SPARKLINE (avg per round)
  ----------------------------------------- */
  const avgRounds = useMemo(() => {
    const p0 = players[0];
    if (!p0) return [];

    const len = getSeriesForStat(p0, selectedStat).length;
    const totals = Array.from({ length: len }, () => 0);

    players.forEach((p) => {
      const series = getSeriesForStat(p, selectedStat);
      series.forEach((val, i) => (totals[i] += val));
    });

    return totals.map((t) => Math.round(t / players.length));
  }, [players, selectedStat]);

  /* -----------------------------------------
     LEADERS (ALWAYS USE FANTASY FOR HEADLINES)
  ----------------------------------------- */
  const topScorer = useMemo(() => {
    return players
      .map((p) => {
        const s = getSeriesForStat(p, "fantasy");
        return { name: p.name, last: s.at(-1) || 0 };
      })
      .sort((a, b) => b.last - a.last)[0];
  }, [players]);

  const biggestRiser = useMemo(() => {
    return players
      .map((p) => {
        const s = getSeriesForStat(p, "fantasy");
        if (s.length < 2) return null;
        const diff = s.at(-1)! - s.at(-2)!;
        return { name: p.name, diff };
      })
      .filter(Boolean)
      .sort((a, b) => b!.diff - a!.diff)[0];
  }, [players]);

  const mostConsistent = useMemo(() => {
    return players
      .map((p) => {
        const s = getSeriesForStat(p, "fantasy");
        const base = average(s) || 1;
        const consistency =
          (s.filter((v) => v >= base).length / s.length) * 100;
        return { name: p.name, consistency };
      })
      .sort((a, b) => b.consistency - a.consistency)[0];
  }, [players]);

  return (
    <section
      className="
        relative rounded-2xl border border-white/10 px-6 py-10
        bg-gradient-to-br from-slate-900/70 via-slate-950/80 to-black
        shadow-2xl shadow-black/40 overflow-hidden
        animate-in fade-in slide-in-from-bottom-6
      "
    >
      {/* PRETTY GLOW */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[260px] bg-emerald-500/20 blur-3xl rounded-full" />

      {/* HEADER */}
      <h2 className="text-3xl font-bold flex items-center gap-2 mb-2">
        <Sparkles className="h-6 w-6 text-emerald-400" />
        Round Momentum Summary
      </h2>
      <p className="text-white/60 text-sm max-w-xl mb-6">
        AI-detected performance signals, round impact trends & player momentum.
      </p>

      {/* FILTER BAR — now fully controlled */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin scrollbar-thumb-slate-700/40">
        {STATS.map((s) => (
          <button
            key={s}
            onClick={() => onStatChange(s)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all",
              selectedStat === s
                ? "bg-emerald-500 text-black font-semibold shadow-lg"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* GRID */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* LEFT — Pulse */}
        <div
          className="
            rounded-xl p-5 border border-white/10
            bg-slate-900/40 backdrop-blur-sm
            hover:-translate-y-1 hover:shadow-2xl transition
            animate-in fade-in slide-in-from-bottom-4
          "
        >
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-300" />
            Round Momentum Pulse
          </h3>

          <p className="text-sm text-white/70 leading-relaxed mb-4">
            League-wide <strong>{selectedStat}</strong> trends indicate shifting
            round momentum driven by matchup edges, role changes and team strategy.
          </p>

          <Sparkline data={avgRounds} />
        </div>

        {/* RIGHT — Headlines */}
        <div
          className="
            rounded-xl p-5 border border-white/10
            bg-slate-900/40 backdrop-blur-sm
            hover:-translate-y-1 hover:shadow-2xl transition
            animate-in fade-in slide-in-from-bottom-4
          "
        >
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400" />
            Key Headlines
          </h3>

          <ul className="space-y-2 text-sm text-white/80">
            <li>
              • <strong>{topScorer?.name}</strong> delivered the round’s top
              fantasy score ({topScorer?.last} pts).
            </li>
            <li>
              • <strong>{biggestRiser?.name}</strong> rose{" "}
              {biggestRiser?.diff.toFixed(1)} pts vs last week.
            </li>
            <li>
              • <strong>{mostConsistent?.name}</strong> leads stability (
              {mostConsistent?.consistency.toFixed(0)}%).
            </li>
            <li>
              • League-wide {selectedStat} volume shows strong round momentum.
            </li>
          </ul>
        </div>

      </div>

      {/* MINI CARDS */}
      <div className="mt-8 grid md:grid-cols-3 gap-5">
        <MiniCard
          icon={Flame}
          label="Top Fantasy Score"
          value={`${topScorer?.last || 0} pts`}
          player={topScorer?.name || ""}
          delay={150}
        />
        <MiniCard
          icon={TrendingUp}
          label="Biggest Riser"
          value={`${biggestRiser?.diff.toFixed(1) || 0} pts`}
          player={biggestRiser?.name || ""}
          delay={250}
        />
        <MiniCard
          icon={Shield}
          label="Most Consistent"
          value={`${mostConsistent?.consistency.toFixed(0) || 0}%`}
          player={mostConsistent?.name || ""}
          delay={350}
        />
      </div>
    </section>
  );
}
