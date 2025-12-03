// src/components/afl/players/RoundSummary.tsx
import { useMemo, useState } from "react";
import {
  Sparkles,
  Activity,
  Flame,
  TrendingUp,
  Shield,
} from "lucide-react";

import {
  useAFLMockPlayers,
  getSeriesForStat,
  average,
  StatKey,
} from "@/components/afl/players/useAFLMockData";

import { cn } from "@/lib/utils";

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
   BRAND GOLD
--------------------------------------------------------- */
const GOLD = "rgb(253 224 71)"; // Tailwind yellow-300

/* ---------------------------------------------------------
   SPARKLINE (No gap + Gold Theme)
--------------------------------------------------------- */
function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);

  const normalized = data.map(
    (v) => ((v - min) / (max - min || 1)) * 100
  );

  return (
    <div className="relative w-full h-20 flex items-end">
      {/* Glow line */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${normalized.length * 20} 100`}
        preserveAspectRatio="none"
      >
        <polyline
          points={normalized
            .map((v, i) => `${i * 20},${100 - v}`)
            .join(" ")}
          fill="none"
          stroke={`${GOLD}80`}
          strokeWidth="4"
          className="drop-shadow-[0_0_10px_rgba(253,224,71,0.5)] animate-[pulse_2.4s_ease-in-out_infinite]"
        />
      </svg>

      {/* Foreground line */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${normalized.length * 20} 100`}
        preserveAspectRatio="none"
      >
        <polyline
          points={normalized
            .map((v, i) => `${i * 20},${100 - v}`)
            .join(" ")}
          fill="none"
          stroke={GOLD}
          strokeWidth="3"
          className="animate-[fade-in_0.6s_ease-out]"
        />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------
   MINI CARD (Gold Theme)
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
        "rounded-xl border border-white/10 p-4 bg-black/30 backdrop-blur-sm",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(253,224,71,0.35)]",
        "animate-in fade-in slide-in-from-bottom-4"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <Icon className="mx-auto h-5 w-5 mb-2" style={{ color: GOLD }} />
      <p className="text-white/60 text-xs">{label}</p>
      <p className="text-lg font-semibold" style={{ color: GOLD }}>
        {value}
      </p>
      <p className="text-white/50 text-xs mt-1">{player}</p>
    </div>
  );
}

/* ---------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */
export default function RoundSummary() {
  const players = useAFLMockPlayers();
  const [selected, setSelected] = useState<StatKey>("fantasy");

  /* ---------------------------------------------------------
     Calculate average per round for sparkline
  --------------------------------------------------------- */
  const avgRounds = useMemo(() => {
    const sample = players[0];
    if (!sample) return [];

    const len = getSeriesForStat(sample, selected).length;
    const totals = Array.from({ length: len }, () => 0);

    players.forEach((p) => {
      const s = getSeriesForStat(p, selected);
      s.forEach((val, i) => (totals[i] += val));
    });

    return totals.map((t) => Math.round(t / players.length));
  }, [players, selected]);

  /* ---------------------------------------------------------
     Summary stats
  --------------------------------------------------------- */
  const topScorer = useMemo(() => {
    return players
      .map((p) => {
        const s = getSeriesForStat(p, selected);
        return { name: p.name, last: s.at(-1) || 0 };
      })
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

  return (
    <section
      className="
        relative rounded-2xl border border-white/10 px-6 py-10
        bg-gradient-to-br from-black/50 via-black/60 to-black
        shadow-[0_0_40px_rgba(253,224,71,0.12)]
        animate-in fade-in slide-in-from-bottom-6
      "
    >
      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_20%_0%,rgba(253,224,71,0.10),transparent_75%)]" />

      {/* TITLE */}
      <h2 className="text-3xl font-bold flex items-center gap-2 mb-1">
        <Sparkles className="h-6 w-6" style={{ color: GOLD }} />
        Round Momentum Summary — <span style={{ color: GOLD }}>Round 6</span>
      </h2>

      <p className="text-white/50 text-sm mb-6 max-w-2xl">
        Live round snapshot — track fantasy trends, standout players and role/stability shifts.
      </p>

      {/* FILTER BAR */}
      <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-4 mb-6">
        {STATS.map((s) => (
          <button
            key={s}
            onClick={() => setSelected(s)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm whitespace-nowrap snap-start transition-all",
              selected === s
                ? "bg-yellow-300 text-black font-semibold shadow-lg"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* GRID */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* LEFT: Pulse */}
        <div className="rounded-xl p-5 border border-white/10 bg-black/30 backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(253,224,71,0.25)]">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Activity className="h-5 w-5" style={{ color: GOLD }} />
            Round Momentum Pulse
          </h3>

          <p className="text-sm text-white/60 mb-4">
            League-wide <span className="font-semibold">{selected}</span> trends show shifts driven by
            usage rates, matchup edges and evolving team roles.
          </p>

          <Sparkline data={avgRounds} />
        </div>

        {/* RIGHT: Headlines */}
        <div className="rounded-xl p-5 border border-white/10 bg-black/30 backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(253,224,71,0.25)]">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400" />
            Key Headlines
          </h3>

          <ul className="space-y-2 text-sm text-white/70">
            <li>
              • <strong>{topScorer?.name}</strong> led with{" "}
              <strong>{topScorer?.last}</strong> pts.
            </li>
            <li>
              • <strong>{biggestRiser?.name}</strong> rose{" "}
              <strong>{biggestRiser?.diff.toFixed(1)}</strong> pts from last week.
            </li>
            <li>
              • <strong>{mostConsistent?.name}</strong> leads consistency at{" "}
              <strong>{mostConsistent?.consistency.toFixed(0)}%</strong>.
            </li>
            <li>• {selected} output shows meaningful league-wide momentum.</li>
          </ul>
        </div>
      </div>

      {/* MINI CARDS */}
      <div className="mt-8 grid md:grid-cols-3 gap-5">
        <MiniCard
          icon={Flame}
          label="Top Score"
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