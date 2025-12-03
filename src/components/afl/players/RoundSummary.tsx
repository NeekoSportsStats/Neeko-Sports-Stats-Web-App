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
   Available Stats
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
   Sparkline (premium gold)
--------------------------------------------------------- */
function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const norm = data.map((v) => ((v - min) / (max - min || 1)) * 100);

  return (
    <div className="relative h-24 w-full">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${norm.length * 24} 100`}
      >
        <polyline
          points={norm.map((v, i) => `${i * 24},${100 - v}`).join(" ")}
          fill="none"
          stroke="rgba(255, 200, 40, 0.4)"
          strokeWidth="4"
          className="drop-shadow-[0_0_12px_rgba(255,200,40,0.5)]"
        />
      </svg>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${norm.length * 24} 100`}
      >
        <polyline
          points={norm.map((v, i) => `${i * 24},${100 - v}`).join(" ")}
          fill="none"
          stroke="rgb(255,210,55)"
          strokeWidth="3"
        />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------
   Mini Card (Top Score / Riser / Consistent)
--------------------------------------------------------- */
function MiniCard({
  icon: Icon,
  label,
  value,
  sub,
  delay,
}: {
  icon: any;
  label: string;
  value: string;
  sub: string;
  delay: number;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-4",
        "shadow-[0_0_20px_rgba(255,215,80,0.1)]",
        "animate-in fade-in slide-in-from-bottom-4"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-yellow-400" />
        <span className="text-xs tracking-wider text-white/50 uppercase">
          {label}
        </span>
      </div>

      <p className="mt-2 text-2xl font-bold text-yellow-300">{value}</p>
      <p className="text-sm text-white/60">{sub}</p>
    </div>
  );
}

/* ---------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */
export default function RoundSummary() {
  const players = useAFLMockPlayers();
  const [stat, setStat] = useState<StatKey>("fantasy");

  /* -----------------------------------------------
     Process Data
  ----------------------------------------------- */
  const avgRounds = useMemo(() => {
    const p0 = players[0];
    if (!p0) return [];

    const len = getSeriesForStat(p0, stat).length;
    const totals = Array.from({ length: len }, () => 0);

    players.forEach((p) => {
      const s = getSeriesForStat(p, stat);
      s.forEach((v, i) => (totals[i] += v));
    });

    return totals.map((t) => Math.round(t / players.length));
  }, [players, stat]);

  const topScorer = useMemo(() => {
    return players
      .map((p) => {
        const s = getSeriesForStat(p, stat);
        return { name: p.name, last: s.at(-1) || 0 };
      })
      .sort((a, b) => b.last - a.last)[0];
  }, [players, stat]);

  const biggestRiser = useMemo(() => {
    return players
      .map((p) => {
        const s = getSeriesForStat(p, stat);
        if (s.length < 2) return null;
        const diff = s.at(-1)! - s.at(-2)!;
        return { name: p.name, diff };
      })
      .filter(Boolean)
      .sort((a, b) => b!.diff - a!.diff)[0];
  }, [players, stat]);

  const mostConsistent = useMemo(() => {
    return players
      .map((p) => {
        const s = getSeriesForStat(p, stat);
        const avg = average(s) || 1;
        const pct = (s.filter((v) => v >= avg).length / s.length) * 100;
        return { name: p.name, pct };
      })
      .sort((a, b) => b.pct - a.pct)[0];
  }, [players, stat]);

  /* ---------------------------------------------------------
     UI
  --------------------------------------------------------- */
  return (
    <section
      className="
        relative rounded-2xl border border-yellow-500/10 p-6 md:p-10
        bg-gradient-to-br from-black/60 via-black/70 to-black
        shadow-[0_0_30px_rgba(255,215,80,0.08)]
        overflow-hidden
      "
    >
      {/* Gold glow */}
      <div className="pointer-events-none absolute -top-24 left-10 w-[360px] h-[240px] bg-yellow-500/20 blur-[140px] rounded-full" />

      {/* Header */}
      <h2 className="text-3xl font-bold flex items-center gap-2 mb-1">
        <Sparkles className="h-6 w-6 text-yellow-400" />
        Round Momentum Summary
      </h2>

      <p className="text-sm text-yellow-200/80 font-medium mb-4">
        Round 6 • {stat.charAt(0).toUpperCase() + stat.slice(1)} Snapshot
      </p>

      <p className="text-white/70 max-w-2xl mb-6 text-sm leading-relaxed">
        Live round snapshot — track fantasy trends, standout players and evolving role/stability shifts across the league as this stat moves week to week.
      </p>

      {/* Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin scrollbar-thumb-yellow-500/20">
        {STATS.map((s) => (
          <button
            key={s}
            onClick={() => setStat(s)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all",
              stat === s
                ? "bg-yellow-400 text-black font-semibold shadow-[0_0_12px_rgba(255,215,80,0.5)]"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Pulse + Headlines */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Pulse */}
        <div className="rounded-xl bg-black/40 border border-white/10 backdrop-blur-md p-5">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
            <Activity className="h-5 w-5 text-yellow-400" />
            Round Momentum Pulse
          </h3>

          <p className="text-sm text-white/70 leading-relaxed mb-4">
            League-wide <span className="font-semibold">{stat}</span> trends reflect shifts driven by usage, matchup edges and evolving roles.
          </p>

          <Sparkline data={avgRounds} />
        </div>

        {/* Headlines */}
        <div className="rounded-xl bg-black/40 border border-white/10 backdrop-blur-md p-5">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
            <Flame className="h-5 w-5 text-orange-400" />
            Key Headlines
          </h3>

          <ul className="text-sm space-y-2 text-white/80">
            <li>
              • <strong>{topScorer?.name}</strong> led this round with{" "}
              <strong>{topScorer?.last} pts</strong>.
            </li>
            <li>
              • <strong>{biggestRiser?.name}</strong> climbed{" "}
              <strong>{biggestRiser?.diff.toFixed(1)}</strong> pts from last week.
            </li>
            <li>
              • <strong>{mostConsistent?.name}</strong> holds{" "}
              <strong>{mostConsistent?.pct.toFixed(0)}%</strong> above-average games.
            </li>
            <li>
              • League-wide {stat} output continues showing meaningful momentum shifts.
            </li>
          </ul>
        </div>
      </div>

      {/* Mini Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <MiniCard
          icon={Flame}
          label="Top Score"
          value={`${topScorer?.last} pts`}
          sub={topScorer?.name || ""}
          delay={100}
        />
        <MiniCard
          icon={TrendingUp}
          label="Biggest Riser"
          value={`${biggestRiser?.diff.toFixed(1)} pts`}
          sub={biggestRiser?.name || ""}
          delay={200}
        />
        <MiniCard
          icon={Shield}
          label="Most Consistent"
          value={`${mostConsistent?.pct.toFixed(0)}%`}
          sub={mostConsistent?.name || ""}
          delay={300}
        />
      </div>
    </section>
  );
}