// src/components/afl/players/RoundSummary.tsx

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Flame,
  Shield,
  Activity,
} from "lucide-react";

import {
  useAFLMockPlayers,
  getSeriesForStat,
  average,
  StatKey,
} from "@/components/afl/players/useAFLMockData";

/* ---------------------------------------------------------
   Stat config
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

const STAT_LABEL: Record<StatKey, string> = {
  fantasy: "Fantasy",
  disposals: "Disposals",
  kicks: "Kicks",
  marks: "Marks",
  tackles: "Tackles",
  hitouts: "Hitouts",
  goals: "Goals",
};

const STAT_UNIT: Record<StatKey, string> = {
  fantasy: "pts",
  disposals: "",
  kicks: "",
  marks: "",
  tackles: "",
  hitouts: "",
  goals: "goals",
};

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
          stroke="rgb(250 204 21 / 0.45)"
          strokeWidth="4"
          className="drop-shadow-[0_0_14px_rgba(250,204,21,0.75)]"
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
          stroke="rgb(252,211,77)"
          strokeWidth="3"
        />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------
   MiniCard
--------------------------------------------------------- */

function MiniCard({
  icon: Icon,
  label,
  value,
  player,
  delay,
  divider,
}: {
  icon: any;
  label: string;
  value: string;
  player: string;
  delay: number;
  divider?: boolean;
}) {
  return (
    <div className="relative flex items-center justify-center">
      {divider && (
        <div className="absolute left-[-12px] top-0 h-full w-[1px] bg-gradient-to-b from-yellow-400/60 via-yellow-300/20 to-transparent blur-sm" />
      )}

      <div
        className={cn(
          "rounded-xl border border-yellow-500/40 p-4 w-full",
          "bg-gradient-to-br from-slate-900/70 via-slate-950/80 to-black",
          "backdrop-blur-sm text-center",
          "transition-transform duration-300",
          "hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(250,204,21,0.45)]",
          "animate-in fade-in slide-in-from-bottom-4"
        )}
        style={{ animationDelay: `${delay}ms` }}
      >
        <Icon className="mx-auto h-5 w-5 text-yellow-400 mb-2" />
        <p className="text-white/60 text-xs">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
        <p className="text-xs text-white/45 mt-1 truncate">{player}</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Main
--------------------------------------------------------- */

export default function RoundSummary({
  selectedStat,
  onStatChange,
}: {
  selectedStat: StatKey;
  onStatChange: (s: StatKey) => void;
}) {
  const players = useAFLMockPlayers();

  const statLabel = STAT_LABEL[selectedStat];
  const statUnit = STAT_UNIT[selectedStat];

  /* -----------------------------------------
     Avg round sparkline
  ----------------------------------------- */
  const avgRounds = useMemo(() => {
    const first = players[0];
    if (!first) return [];

    const len = getSeriesForStat(first, selectedStat).length;
    const totals = Array.from({ length: len }, () => 0);

    players.forEach((p) => {
      const series = getSeriesForStat(p, selectedStat);
      series.forEach((v, i) => (totals[i] += v));
    });

    return totals.map((t) => Math.round(t / players.length));
  }, [players, selectedStat]);

  /* -----------------------------------------
     Leaders
  ----------------------------------------- */
  const topScorer = useMemo(() => {
    return players
      .map((p) => {
        const s = getSeriesForStat(p, selectedStat);
        return { name: p.name, value: s.at(-1) ?? 0 };
      })
      .sort((a, b) => b.value - a.value)[0];
  }, [players, selectedStat]);

  const biggestRiser = useMemo(() => {
    return players
      .map((p) => {
        const s = getSeriesForStat(p, selectedStat);
        if (s.length < 2) return null;
        return {
          name: p.name,
          diff: (s.at(-1) ?? 0) - (s.at(-2) ?? 0),
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b!.diff ?? 0) - (a!.diff ?? 0))[0];
  }, [players, selectedStat]);

  const mostConsistent = useMemo(() => {
    return players
      .map((p) => {
        const s = getSeriesForStat(p, selectedStat);
        const base = average(s) || 1;
        return {
          name: p.name,
          consistency:
            (s.filter((v) => v >= base).length / s.length) *
            100,
        };
      })
      .sort((a, b) => b.consistency - a.consistency)[0];
  }, [players, selectedStat]);

  const topValue = topScorer?.value ?? 0;
  const riserValue = biggestRiser?.diff ?? 0;
  const consistentValue = mostConsistent?.consistency ?? 0;

  /* -----------------------------------------
     Render
  ----------------------------------------- */

  return (
    <section
      className="
        relative rounded-2xl px-6 py-10
        border border-yellow-500/30
        bg-gradient-to-br from-slate-950 via-black to-slate-950
        shadow-[0_0_40px_rgba(250,204,21,0.35)]
        overflow-hidden animate-in fade-in slide-in-from-bottom-6
      "
    >
      {/* moving gold beam */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_50%,rgba(255,215,0,0.06),transparent_70%)] animate-[pan-left-right_12s_linear_infinite]" />

      {/* subtle fades */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60px] bg-gradient-to-b from-black/50 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[80px] bg-gradient-to-t from-black/40 to-transparent" />

      {/* header */}
      <div className="relative mb-4">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          Round Momentum Summary
        </h2>
        <div className="h-[2px] w-[46px] bg-yellow-400/60 rounded-full mt-2" />
        <p className="text-white/60 text-sm max-w-xl mt-3">
          Live round snapshot — track {statLabel.toLowerCase()} trends, standout players and stability.
        </p>
      </div>

      {/* stat pills */}
      <div className="relative flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin scrollbar-thumb-slate-700/40">
        {STATS.map((s) => (
          <button
            key={s}
            onClick={() => onStatChange(s)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all relative overflow-hidden",
              selectedStat === s
                ? "bg-black/70 text-yellow-300 font-semibold border border-yellow-500/50 shadow-[inset_0_0_10px_rgba(250,204,21,0.5)] scale-[1.05]"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            )}
          >
            {STAT_LABEL[s]}
          </button>
        ))}
      </div>

      {/* grid */}
      <div className="relative grid md:grid-cols-2 gap-6">
        <div
          className="
            rounded-xl p-5
            border border-white/10
            bg-slate-950/60 backdrop-blur-sm
            hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(15,23,42,0.8)]
            transition
          "
        >
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Activity className="h-5 w-5 text-yellow-300" />
            Round Momentum Pulse
          </h3>

          <p className="text-sm text-white/70 leading-relaxed mb-4">
            {selectedStat === "fantasy" &&
              "League-wide fantasy trends show shifts driven by usage, roles and matchups."}
            {selectedStat === "disposals" &&
              "High-disposal midfielders controlled this round with multiple 30+ games."}
            {selectedStat === "kicks" &&
              "Kick volumes surged off half-back and wings."}
            {selectedStat === "marks" &&
              "Marking targets impressed, dominating intercept contests."}
            {selectedStat === "tackles" &&
              "Pressure lifted significantly across multiple teams."}
            {selectedStat === "hitouts" &&
              "Ruck contests dictated stoppage outcomes this round."}
            {selectedStat === "goals" &&
              "Forward accuracy was high with several multi-goal scorers."}
          </p>

          <Sparkline data={avgRounds} />
        </div>

        <div
          className="
            rounded-xl p-5
            border border-white/10
            bg-slate-950/60 backdrop-blur-sm
            hover:-translate-y-1 hover:shadow-[0_0_30px_rgrgba(15,23,42,0.8)]
            transition
          "
        >
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400" />
            Key Headlines
          </h3>

          <ul className="space-y-2 text-sm text-white/80">
            <li>
              • <strong>{topScorer?.name ?? "—"}</strong> leads{" "}
              {statLabel.toLowerCase()} for the round (
              {topValue.toFixed(1)} {statUnit.trim()}).
            </li>
            <li>
              • Biggest rise:{" "}
              <strong>{biggestRiser?.name ?? "—"}</strong> up{" "}
              {riserValue.toFixed(1)} {statUnit.trim()} vs last week.
            </li>
            <li>
              • Most consistent:{" "}
              <strong>{mostConsistent?.name ?? "—"}</strong> at{" "}
              {consistentValue.toFixed(0)}% stability.
            </li>
            <li>
              • League-wide {statLabel.toLowerCase()} trends highlight evolving roles & matchups.
            </li>
          </ul>
        </div>
      </div>

      {/* mini cards */}
      <div className="relative mt-8 grid md:grid-cols-3 gap-5">
        <MiniCard
          icon={Flame}
          label={`Top ${statLabel} Score`}
          value={`${topValue.toFixed(1)} ${statUnit}`.trim()}
          player={topScorer?.name ?? "—"}
          delay={150}
        />
        <MiniCard
          icon={TrendingUp}
          label="Biggest Riser"
          value={`${riserValue.toFixed(1)} ${statUnit}`.trim()}
          player={biggestRiser?.name ?? "—"}
          delay={250}
          divider
        />
        <MiniCard
          icon={Shield}
          label="Most Consistent"
          value={`${consistentValue.toFixed(0)}%`}
          player={mostConsistent?.name ?? "—"}
          delay={350}
          divider
        />
      </div>
    </section>
  );
}
