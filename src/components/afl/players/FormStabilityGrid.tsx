// src/components/afl/players/FormStabilityGrid.tsx
//--------------------------------------------------------------
// Hybrid-C Layout + Pro Upgrades + Collapsible Sparkline
//--------------------------------------------------------------

import React, { useState, useMemo } from "react";
import {
  Flame,
  Shield,
  Snowflake,
  ChevronDown,
  ChevronUp,
  Activity,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  useAFLMockPlayers,
  getSeriesForStat,
  average,
  StatKey,
} from "@/components/afl/players/useAFLMockData";

/* ---------------------------------------------------------
   STAT LABELS
--------------------------------------------------------- */
const STAT_LABELS: Record<StatKey, string> = {
  fantasy: "Fantasy",
  disposals: "Disposals",
  kicks: "Kicks",
  marks: "Marks",
  tackles: "Tackles",
  hitouts: "Hitouts",
  goals: "Goals",
};

/* ---------------------------------------------------------
   Animated Sparkline (Collapsible)
--------------------------------------------------------- */

function Sparkline({ data, expanded }: { data: number[]; expanded: boolean }) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const normalized = data.map((v) => ((v - min) / (max - min || 1)) * 100);
  const width = Math.max(normalized.length * 20, 80);

  return (
    <div
      className={cn(
        "transition-all duration-500 overflow-hidden",
        expanded ? "max-h-24 opacity-100 mt-3" : "max-h-0 opacity-0"
      )}
    >
      <div className="relative h-16 w-full">
        {/* BACKLINE */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${width} 100`}
          preserveAspectRatio="none"
        >
          <polyline
            points={normalized
              .map(
                (v, i) => `${(i / (normalized.length - 1)) * width},${100 - v}`
              )
              .join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={4}
            className="transition-all duration-700 ease-[cubic-bezier(.17,.67,.43,1)]"
          />
        </svg>

        {/* FOREGROUND */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${width} 100`}
          preserveAspectRatio="none"
        >
          <polyline
            points={normalized
              .map(
                (v, i) => `${(i / (normalized.length - 1)) * width},${100 - v}`
              )
              .join(" ")}
            fill="none"
            stroke="rgb(255,255,255)"
            strokeWidth={2}
            className="transition-all duration-700 delay-75 ease-out"
          />
        </svg>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   FSCard — PRO VERSION
   - Hover tilt
   - Expand/collapse sparkline
   - Microbadge
   - Depth glow
--------------------------------------------------------- */

interface FSCardProps {
  player: string;
  club: string;
  pos: string;
  value: number;
  unit: string;
  diff: number;
  data: number[];
  accent: string;
  labelTopRight: string;
}

function FSCard(props: FSCardProps) {
  const {
    player,
    club,
    pos,
    value,
    unit,
    diff,
    data,
    accent,
    labelTopRight,
  } = props;

  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      className={cn(
        "relative rounded-2xl border p-4 md:p-5 cursor-pointer",
        "transition-all duration-300",
        "bg-black/60 backdrop-blur-sm group",
        "hover:-translate-y-[3px]",
        accent
      )}
    >
      {/* Glow lift when expanded */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none opacity-0 blur-2xl transition-all duration-500",
          expanded && "opacity-30"
        )}
        style={{
          background:
            accent.includes("red")
              ? "rgba(255,80,80,0.4)"
              : accent.includes("yellow")
              ? "rgba(255,230,120,0.4)"
              : "rgba(120,200,255,0.4)",
        }}
      />

      {/* Top row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-semibold">{player}</p>
          <p className="text-[11px] text-white/50 uppercase tracking-wide">
            {club} • {pos}
          </p>
        </div>

        <span className="text-[10px] text-white/40 uppercase tracking-wide">
          {labelTopRight}
        </span>
      </div>

      {/* Value + diff */}
      <div className="mt-3 mb-1 text-xl font-semibold">
        {value} {unit}
      </div>

      <p className="text-xs text-white/60 flex items-center gap-1">
        {diff > 0 ? (
          <span className="text-emerald-300 font-semibold">
            +{diff.toFixed(1)}
          </span>
        ) : diff < 0 ? (
          <span className="text-red-300 font-semibold">
            {diff.toFixed(1)}
          </span>
        ) : (
          <span className="text-white/40">0.0</span>
        )}
        <span className="text-white/40">vs avg</span>
      </p>

      {/* Expand / collapse row */}
      <div className="flex justify-between items-center mt-2">
        <span className="text-[10px] text-white/45">
          {expanded ? "Hide trend" : "Show trend"}
        </span>

        {expanded ? (
          <ChevronUp className="h-4 w-4 text-white/40" />
        ) : (
          <ChevronDown className="h-4 w-4 text-white/40" />
        )}
      </div>

      {/* Sparkline */}
      <Sparkline expanded={expanded} data={data} />
    </div>
  );
}

/* ---------------------------------------------------------
   FSColumn — pro aligned header + glow
--------------------------------------------------------- */

function FSColumn({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: any;
}) {
  return (
    <div className="relative rounded-3xl border bg-black/30 p-5 md:p-6 overflow-hidden">
      <div
        className={cn("absolute inset-0 opacity-20 blur-3xl pointer-events-none", color)}
      />

      <div className="relative flex items-center gap-2 mb-5">
        {icon}
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>

      <div className="relative space-y-4">{children}</div>
    </div>
  );
}

/* ---------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */

export default function FormStabilityGrid() {
  const players = useAFLMockPlayers();
  const [selected, setSelected] = useState<StatKey>("fantasy");

  // units
  const unit =
    selected === "fantasy"
      ? "pts"
      : selected === "goals"
      ? "goals"
      : selected;

  /* ---- COMPUTE LISTS ---- */

  const hot = useMemo(() => {
    return [...players]
      .sort((a, b) => {
        const A =
          getSeriesForStat(a, selected).at(-1)! -
          average(getSeriesForStat(a, selected));
        const B =
          getSeriesForStat(b, selected).at(-1)! -
          average(getSeriesForStat(b, selected));
        return B - A;
      })
      .slice(0, 6);
  }, [players, selected]);

  const stable = useMemo(() => {
    return [...players]
      .sort((a, b) => {
        const S1 = getSeriesForStat(a, selected);
        const S2 = getSeriesForStat(b, selected);
        const C1 = S1.filter((v) => v >= average(S1)).length / S1.length;
        const C2 = S2.filter((v) => v >= average(S2)).length / S2.length;
        return C2 - C1;
      })
      .slice(0, 6);
  }, [players, selected]);

  const cooling = useMemo(() => {
    return [...players]
      .sort((a, b) => {
        const A =
          average(getSeriesForStat(a, selected)) -
          getSeriesForStat(a, selected).at(-1)!;
        const B =
          average(getSeriesForStat(b, selected)) -
          getSeriesForStat(b, selected).at(-1)!;
        return B - A;
      })
      .slice(0, 6);
  }, [players, selected]);

  return (
    <section
      id="form-stability"
      className="mt-14 rounded-3xl border border-white/10 bg-black/30 px-4 py-8 md:px-8 md:py-12"
    >
      {/* Header pill */}
      <div className="flex items-center gap-2 mb-6">
        <span className="px-3 py-1 rounded-full border border-yellow-400/40 text-[11px] font-semibold tracking-wide flex items-center gap-1 text-yellow-300">
          <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
          FORM STABILITY GRID
        </span>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold mb-2">
        Hot risers, rock-solid anchors & form slumps
      </h2>

      <p className="text-white/70 text-sm md:text-[15px] max-w-2xl mb-6">
        Last 5 rounds of{" "}
        <span className="text-yellow-300 font-semibold">
          {STAT_LABELS[selected].toLowerCase()}
        </span>{" "}
        — split into surges, stability leaders, and cooling risks.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {(Object.keys(STAT_LABELS) as StatKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setSelected(key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs md:text-sm transition-all",
              selected === key
                ? "bg-yellow-400 text-black font-semibold shadow-[0_0_18px_rgba(250,204,21,0.6)]"
                : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
            )}
          >
            {STAT_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Columns — Hybrid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7 lg:gap-8">
        
        {/* HOT */}
        <FSColumn
          title="Hot form surge"
          icon={<Flame className="text-red-400 h-5 w-5" />}
          color="bg-red-500/40"
        >
          {hot.map((p, i) => (
            <FSCard
              key={i}
              player={p.name}
              club={p.team}
              pos={p.pos}
              value={getSeriesForStat(p, selected).at(-1)!}
              unit={unit}
              diff={
                getSeriesForStat(p, selected).at(-1)! -
                average(getSeriesForStat(p, selected))
              }
              data={getSeriesForStat(p, selected)}
              labelTopRight="AVG LAST 5"
              accent="border-red-500/40"
            />
          ))}
        </FSColumn>

        {/* STABILITY */}
        <FSColumn
          title="Stability leaders"
          icon={<Shield className="text-yellow-300 h-5 w-5" />}
          color="bg-yellow-300/40"
        >
          {stable.map((p, i) => (
            <FSCard
              key={i}
              player={p.name}
              club={p.team}
              pos={p.pos}
              value={getSeriesForStat(p, selected).at(-1)!}
              unit={unit}
              diff={0}
              data={getSeriesForStat(p, selected)}
              labelTopRight="CONSISTENCY"
              accent="border-yellow-300/40"
            />
          ))}
        </FSColumn>

        {/* COOLING */}
        <FSColumn
          title="Cooling risks"
          icon={<Snowflake className="text-sky-300 h-5 w-5" />}
          color="bg-sky-300/30"
        >
          {cooling.map((p, i) => (
            <FSCard
              key={i}
              player={p.name}
              club={p.team}
              pos={p.pos}
              value={getSeriesForStat(p, selected).at(-1)!}
              unit={unit}
              diff={
                getSeriesForStat(p, selected).at(-1)! -
                average(getSeriesForStat(p, selected))
              }
              data={getSeriesForStat(p, selected)}
              labelTopRight="LAST VS PREV"
              accent="border-sky-300/40"
            />
          ))}
        </FSColumn>
      </div>
    </section>
  );
}
