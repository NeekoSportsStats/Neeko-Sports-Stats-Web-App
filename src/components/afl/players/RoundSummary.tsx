import { useState } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, Flame, Shield, Sparkles } from "lucide-react";

const STATS = [
  "Fantasy",
  "Disposals",
  "Kicks",
  "Marks",
  "Tackles",
  "Hitouts",
  "Goals",
] as const;

export default function RoundSummary() {
  const [selected, setSelected] = useState<(typeof STATS)[number]>("Fantasy");

  return (
    <section
      className="
        rounded-2xl border border-white/10
        bg-gradient-to-b from-slate-900/70 via-slate-950/80 to-black
        shadow-xl shadow-black/40 px-6 py-8
        animate-in fade-in slide-in-from-bottom-4
      "
    >
      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-400" />
          Round Momentum Summary
        </h2>
        <p className="text-white/60 text-sm mt-1">
          AI-detected performance signals, momentum trends & standout players.
        </p>
      </div>

      {/* 🔥 SMALL STAT FILTER BAR */}
      <div
        className="
          flex gap-2 overflow-x-auto pb-2
          scrollbar-thin scrollbar-thumb-slate-700/40
        "
      >
        {STATS.map((s) => (
          <button
            key={s}
            onClick={() => setSelected(s)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all",
              selected === s
                ? "bg-emerald-500 text-black font-semibold shadow-lg"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* CONTENT GRID */}
      <div className="mt-6 grid md:grid-cols-2 gap-6">

        {/* LEFT CARD — Pulse */}
        <div
          className="
            rounded-xl p-5 border border-white/10
            bg-slate-900/40 backdrop-blur-sm
            hover:shadow-2xl hover:-translate-y-1 transition
          "
        >
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Round Momentum Pulse
          </h3>

          <p className="text-sm text-white/70 leading-relaxed">
            {selected === "Fantasy" &&
              "Overall fantasy scoring increased 4% vs last week driven by elite mid dominance and strong RUC numbers."}
            {selected === "Disposals" &&
              "High-possession midfielders led the round with multiple 35+ disposal performances."}
            {selected === "Goals" &&
              "Forward scoring surged with 8 players kicking 3+ goals."}

            {/* fallback general statement for other stats */}
            {selected !== "Fantasy" &&
              selected !== "Disposals" &&
              selected !== "Goals" &&
              `Notable shifts detected in ${selected.toLowerCase()} output across the league.`}
          </p>

          {/* placeholder sparkline */}
          <div className="mt-4 h-16 w-full rounded-lg bg-gradient-to-r from-emerald-500/20 via-emerald-400/10 to-transparent" />
        </div>

        {/* RIGHT CARD — Headlines */}
        <div
          className="
            rounded-xl p-5 border border-white/10
            bg-slate-900/40 backdrop-blur-sm
            hover:shadow-2xl hover:-translate-y-1 transition
          "
        >
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400" />
            Key Headlines
          </h3>

          <ul className="space-y-2 text-sm text-white/80">
            <li>• Breakout performer: A midfielder surged +24% over last week.</li>
            <li>• Role shift: Several forwards flagged for increased midfield usage.</li>
            <li>• Team velocity: Two clubs saw massive jumps in fantasy volume.</li>
            <li>• Stability watch: Elite trio continues long-term consistency trend.</li>
          </ul>
        </div>
      </div>

      {/* MINI CARDS */}
      <div className="mt-6 grid md:grid-cols-3 gap-5">
        <MiniCard
          icon={Flame}
          label="Top Fantasy Score"
          value="148 pts"
        />
        <MiniCard
          icon={TrendingUp}
          label="Biggest Riser"
          value="+23.7%"
        />
        <MiniCard
          icon={Shield}
          label="Most Consistent"
          value="92% stability"
        />
      </div>
    </section>
  );
}

function MiniCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-xl border border-white/10 p-4
        bg-slate-900/40 backdrop-blur-sm text-center
        hover:shadow-xl hover:-translate-y-1 transition
      "
    >
      <Icon className="mx-auto h-5 w-5 text-emerald-400 mb-2" />
      <p className="text-white/60 text-xs">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
