// src/components/afl/players/MasterTable.tsx
import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, ChevronDown, Lock, Search, Sparkles, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

/* -------------------------------------------------------------------------- */
/*                               TYPES & CONFIG                               */
/* -------------------------------------------------------------------------- */

type StatLens = "Fantasy" | "Disposals" | "Goals";

type PlayerRow = {
  id: number;
  rank: number;
  name: string;
  team: string;
  role: string;
  roundsFantasy: number[];
  roundsDisposals: number[];
  roundsGoals: number[];
};

type StatConfig = {
  label: string;
  valueUnitShort: string;
  thresholds: number[];
};

const ROUND_LABELS = [
  "OR","R1","R2","R3","R4","R5","R6","R7","R8","R9",
  "R10","R11","R12","R13","R14","R15","R16","R17","R18",
  "R19","R20","R21","R22","R23",
];

const STAT_CONFIG: Record<StatLens, StatConfig> = {
  Fantasy: { label: "Fantasy", valueUnitShort: "pts", thresholds: [90,100,110,120,130] },
  Disposals: { label: "Disposals", valueUnitShort: "dis", thresholds: [20,25,30,35,40] },
  Goals: { label: "Goals", valueUnitShort: "g", thresholds: [1,2,3,4,5] },
};

/* -------------------------------------------------------------------------- */
/*                            MOCK PLAYER DATA                                 */
/* -------------------------------------------------------------------------- */

function buildMockPlayers(): PlayerRow[] {
  const list: PlayerRow[] = [];

  for (let i = 1; i <= 60; i++) {
    const f = 70 + Math.round(Math.random() * 40);
    const d = 18 + Math.round(Math.random() * 10);
    const g = Math.random() < 0.5 ? 1 : 0;

    const roundsFantasy: number[] = [];
    const roundsDisposals: number[] = [];
    const roundsGoals: number[] = [];

    for (let r = 0; r < ROUND_LABELS.length; r++) {
      roundsFantasy.push(
        Math.max(
          40,
          f + Math.round((Math.random() - 0.5) * 24) + (Math.random() < 0.1 ? 20 : 0)
        )
      );
      roundsDisposals.push(
        Math.max(8, d + Math.round((Math.random() - 0.5) * 8))
      );
      roundsGoals.push(
        Math.max(
          0,
          g +
            (Math.random() < 0.15 ? 2 : 0) +
            (Math.random() < 0.05 ? 3 : 0)
        )
      );
    }

    list.push({
      id: i,
      rank: i,
      name: `Player ${i}`,
      team: ["CARL","ESS","COLL","RICH","GEEL","NMFC"][i % 6],
      role: ["MID","RUC","FWD","DEF"][i % 4],
      roundsFantasy,
      roundsDisposals,
      roundsGoals,
    });
  }

  return list;
}

const MOCK_PLAYERS = buildMockPlayers();

/* -------------------------------------------------------------------------- */
/*                               HELPERS                                       */
/* -------------------------------------------------------------------------- */

function getRoundsForLens(player: PlayerRow, lens: StatLens) {
  if (lens === "Fantasy") return player.roundsFantasy;
  if (lens === "Disposals") return player.roundsDisposals;
  return player.roundsGoals;
}

function computeSummary(player: PlayerRow, lens: StatLens) {
  const r = getRoundsForLens(player, lens);
  const min = Math.min(...r);
  const max = Math.max(...r);
  const total = r.reduce((a,b)=>a+b,0);
  const avg = +(total / r.length).toFixed(1);

  const lastWindow = r.slice(-8);
  const windowMin = Math.min(...lastWindow);
  const windowMax = Math.max(...lastWindow);

  return {
    min,
    max,
    avg,
    total,
    windowMin,
    windowMax,
    volatilityRange: windowMax - windowMin,
  };
}

function computeHitRates(player: PlayerRow, lens: StatLens) {
  const r = getRoundsForLens(player, lens);
  return STAT_CONFIG[lens].thresholds.map((t)=>
    Math.round((r.filter((v)=>v>=t).length / r.length) * 100)
  );
}

function getHitRateColor(value: number) {
  if (value >= 75) return "text-lime-300";
  if (value >= 50) return "text-yellow-300";
  if (value >= 30) return "text-amber-300";
  return "text-red-300";
}

function getHitRateGlow(value: number) {
  if (value >= 75) return "shadow-[0_0_10px_rgba(132,255,162,0.5)]";
  if (value >= 50) return "shadow-[0_0_8px_rgba(255,255,150,0.4)]";
  if (value >= 30) return "shadow-[0_0_6px_rgba(255,200,80,0.35)]";
  return "shadow-[0_0_6px_rgba(255,80,80,0.35)]";
}

/* -------------------------------------------------------------------------- */
/*                           UI COMPONENTS (HELPERS)                           */
/* -------------------------------------------------------------------------- */

function HeaderCell({ children, className }: any) {
  return (
    <th
      className={`border-b border-neutral-800/80 bg-gradient-to-b from-black/98 to-black/94
      px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.16em]
      text-neutral-400 ${className}`}
    >
      {children}
    </th>
  );
}

function BodyCell({ value, className = "", compact, blurClass = "" }: any) {
  return (
    <td
      className={`border-b border-neutral-900/80 bg-black/80 px-2.5
      ${compact ? "py-2" : "py-2.5"} text-[11px] text-neutral-200 ${blurClass} ${className}`}
    >
      {value}
    </td>
  );
}

/* -------------------------------------------------------------------------- */
/*                    PREMIUM DROPDOWN (DS2 — CUSTOM UI)                      */
/* -------------------------------------------------------------------------- */

function PremiumDropdown({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled: boolean;
}) {
  return (
    <div className="relative">
      <div
        className={`flex items-center justify-between rounded-full border px-3 py-1.5 text-[11px] min-w-[130px]
        transition cursor-pointer ${
          disabled
            ? "border-neutral-800 bg-neutral-900/60 text-neutral-600"
            : "border-neutral-700 bg-black/80 text-neutral-200 hover:border-yellow-400 hover:bg-neutral-900"
        }`}
      >
        <span>{label}: {value}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </div>

      {!disabled && (
        <div className="absolute z-40 mt-1 w-full rounded-xl border border-neutral-700 bg-black shadow-2xl overflow-hidden">
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => onChange(opt)}
              className={`px-3 py-2 text-[11px] cursor-pointer hover:bg-neutral-800 ${
                opt === value ? "text-yellow-300" : "text-neutral-300"
              }`}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                      INSIGHTS CONTENT + PANEL (FULL)                        */
/* -------------------------------------------------------------------------- */

function InsightsContent({ player, selectedStat }: any) {
  const config = STAT_CONFIG[selectedStat];
  const summary = computeSummary(player, selectedStat);
  const hitRates = computeHitRates(player, selectedStat);
  const rounds = getRoundsForLens(player, selectedStat);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* RR List */}
      <div>
        <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Round-by-round scores
        </div>
        <div className="overflow-x-auto pb-1 flex gap-2">
          {rounds.map((v, i) => (
            <div key={i} className="flex min-w-[46px] flex-col items-center">
              <span className="text-[9px] text-neutral-500">{ROUND_LABELS[i]}</span>
              <div className="mt-1 flex h-8 w-10 items-center justify-center
              rounded-md bg-neutral-950/80 text-[11px] text-neutral-100">
                {v}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Window */}
      <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b
      from-neutral-900/95 via-neutral-950 to-black p-5 shadow-lg">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Recent scoring window
            </div>
            <div className="mt-1 text-xs text-neutral-300">
              Last 8 games at this stat lens.
            </div>
          </div>

          <div className="text-right text-[11px] text-neutral-200">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500">
              Average
            </div>
            <div className="mt-1 text-sm font-semibold text-yellow-200">
              {summary.avg.toFixed(1)} {config.valueUnitShort}
            </div>
          </div>
        </div>

        {/* Sparkline Placeholder */}
        <div className="h-20 rounded-xl bg-gradient-to-b from-neutral-800/70 to-black shadow-inner" />

        <div className="mt-4 grid gap-3 text-[11px] text-neutral-300 sm:grid-cols-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-neutral-500">
              Range window
            </div>
            <div className="mt-1 text-sm font-semibold text-neutral-100">
              {summary.windowMin}–{summary.windowMax} {config.valueUnitShort}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wide text-neutral-500">
              Volatility
            </div>
            <div className="mt-1 text-sm font-semibold text-teal-300">
              {summary.volatilityRange} range
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wide text-neutral-500">
              Total
            </div>
            <div className="mt-1 text-sm font-semibold text-neutral-100">
              {summary.total} {config.valueUnitShort}
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b
      from-black/96 via-neutral-950 to-black px-5 py-4 text-[11px] text-neutral-300 shadow-lg">
        <div className="mb-2 text-[10px] uppercase tracking-widest text-yellow-200">
          AI performance summary
        </div>
        <p>
          Usage profile suggests{" "}
          <span className="font-semibold text-neutral-50">
            stable opportunity
          </span>{" "}
          with moderate volatility at this lens.
        </p>
      </div>

      {/* Hit-rate Section */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-b
        from-yellow-500/15 via-black to-black px-5 py-4 shadow-[0_0_40px_rgba(250,204,21,0.35)]">
          <div className="mb-3">
            <div className="text-[10px] uppercase tracking-widest text-yellow-200/90">
              Confidence index
            </div>
            <div className="text-xs text-neutral-200">
              Blends hit-rates + window shape.
            </div>
          </div>

          <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
            <div className="h-full w-[55%] bg-gradient-to-r from-lime-400 via-yellow-200 to-orange-400 rounded-full" />
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-700 bg-black/90 px-5 py-4 shadow-lg">
          <div className="mb-3 text-[10px] uppercase tracking-widest text-neutral-500">
            Hit-rate profile
          </div>

          <div className="space-y-3">
            {STAT_CONFIG[selectedStat].thresholds.map((t, i) => {
              const hr = hitRates[i];
              return (
                <div key={t} className="flex items-center gap-3">
                  <span className="w-10 text-[10px] text-neutral-400">{t}+</span>
                  <div className="h-1.5 flex-1 rounded-full bg-neutral-900 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-400 via-yellow-300 to-lime-300"
                      style={{ width: `${hr}%` }}
                    />
                  </div>
                  <span
                    className={`w-8 text-right text-[10px] ${getHitRateColor(hr)} ${getHitRateGlow(hr)}`}
                  >
                    {hr}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                        INSIGHTS OVERLAY (DESKTOP + MOBILE)                  */
/* -------------------------------------------------------------------------- */

function InsightsOverlay({ player, selectedStat, onClose, onLensChange }: any) {
 useEffect(() => {
  const original = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  return () => {
    document.body.style.overflow = original;
  };
}, []);


  /* mobile swipe */
  const [swipeStart, setSwipeStart] = useState(0);
  const [swipeY, setSwipeY] = useState(0);

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div className="flex h-full w-full justify-end">
        
        {/* DESKTOP PANEL */}
        <div
          className="hidden md:block h-full w-[480px] max-w-full border-l border-yellow-500/30
          bg-gradient-to-b from-neutral-950 via-black to-black px-5 py-4
          animate-slideInRight shadow-[0_0_50px_rgba(250,204,21,0.5)]"
          onClick={(e)=>e.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-yellow-200/80">
                Player insights
              </div>
              <div className="text-sm font-semibold text-neutral-50">{player.name}</div>
              <div className="text-[10px] uppercase tracking-widest text-neutral-400">
                {player.team} • {player.role}
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full bg-neutral-900 p-1.5 hover:bg-neutral-800"
            >
              <X className="h-4 w-4 text-neutral-300" />
            </button>
          </div>

          {/* Stat pills */}
          <div className="mb-4 flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1">
            {(["Fantasy","Disposals","Goals"] as const).map((stat) => (
              <button
                key={stat}
                onClick={()=>onLensChange(stat)}
                className={`rounded-full px-3 py-1.5 text-[11px] ${
                  selectedStat === stat
                    ? "bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,1)]"
                    : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                {stat}
              </button>
            ))}
          </div>

          <div className="h-[calc(100%-120px)] overflow-y-auto pr-1">
            <InsightsContent player={player} selectedStat={selectedStat} />
          </div>
        </div>

        {/* MOBILE BOTTOM SHEET */}
        <div className="flex w-full items-end justify-center md:hidden" onClick={(e)=>e.stopPropagation()}>
          <div
            className="w-full rounded-t-3xl border border-yellow-500/30 bg-gradient-to-b from-neutral-950 to-black px-4 py-3 shadow-xl transition-transform duration-200"
            style={{ transform: swipeY > 0 ? `translateY(${swipeY}px)` : "translateY(0)" }}
            onTouchStart={(e)=>setSwipeStart(e.touches[0].clientY)}
            onTouchMove={(e)=>{
              const dy = e.touches[0].clientY - swipeStart;
              if (dy > 0) setSwipeY(dy);
            }}
            onTouchEnd={()=>{
              if (swipeY > 120) onClose();
              setSwipeY(0);
            }}
          >
            {/* Handle */}
            <button
              onClick={onClose}
              className="mx-auto mb-3 mt-1 flex h-1.5 w-10 rounded-full bg-yellow-200/70"
            />

            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-yellow-200/80">
                  Player insights
                </div>
                <div className="mt-1 text-sm font-semibold text-neutral-50">
                  {player.name}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-neutral-400">
                  {player.team} • {player.role}
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-full bg-neutral-900 p-1.5 hover:bg-neutral-800"
              >
                <X className="h-4 w-4 text-neutral-300" />
              </button>
            </div>

            {/* Stat pills */}
            <div className="mb-3 flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1 text-[11px] text-neutral-200">
              {(["Fantasy","Disposals","Goals"] as const).map((stat)=>(
                <button
                  key={stat}
                  onClick={()=>onLensChange(stat)}
                  className={`rounded-full px-3 py-1.5 ${
                    selectedStat === stat
                      ? "bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,1)]"
                      : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
                  }`}
                >
                  {stat}
                </button>
              ))}
            </div>

            <div className="max-h-[65vh] overflow-y-auto pb-2">
              <InsightsContent player={player} selectedStat={selectedStat} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          MOBILE PLAYER CARD (unchanged)                    */
/* -------------------------------------------------------------------------- */

function MobilePlayerCard({
  player,
  index,
  selectedStat,
  blurClass,
  onOpen,
}: any) {
  const config = STAT_CONFIG[selectedStat];
  const summary = computeSummary(player, selectedStat);
  const rounds = getRoundsForLens(player, selectedStat);

  return (
    <div
      className={`relative rounded-2xl border border-neutral-800 bg-gradient-to-b
      from-black/95 via-black/90 to-black px-4 py-3 shadow-xl ${blurClass}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full
          border border-neutral-700 bg-black/80 text-[11px] text-neutral-200">
            {index + 1}
          </div>
          <div>
            <div className="text-[13px] font-medium text-neutral-50">
              {player.name}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-neutral-400">
              {player.team} • {player.role}
            </div>
          </div>
        </div>

        <div className="text-right text-[11px] text-neutral-200">
          <div className="text-[10px] uppercase tracking-widest text-neutral-500">
            {config.label} avg
          </div>
          <div className="mt-0.5 text-sm font-semibold text-yellow-200">
            {summary.avg.toFixed(1)} {config.valueUnitShort}
          </div>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <div className="flex gap-2 pb-1">
          {rounds.map((v, i) => (
            <div key={i} className="flex min-w-[46px] flex-col items-center">
              <span className="text-[9px] text-neutral-500">{ROUND_LABELS[i]}</span>
              <div className="mt-1 flex h-8 w-10 items-center justify-center
              rounded-md bg-neutral-950 text-[11px] text-neutral-100">
                {v}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-[10px] text-neutral-400">
          Tap for full insights & confidence.
        </div>

        <Button
          size="sm"
          onClick={onOpen}
          className="rounded-full bg-yellow-400 px-3 py-1 text-[11px]
          font-semibold text-black shadow-[0_0_20px_rgba(250,204,21,0.5)]
          hover:bg-yellow-300"
        >
          View
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              MASTER TABLE COMPONENT                         */
/* -------------------------------------------------------------------------- */

export default function MasterTable() {
  const { isPremium } = useAuth();

  const [selectedStat, setSelectedStat] = useState<StatLens>("Fantasy");
  const [compactMode, setCompactMode] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("All Teams");
  const [roundFilter, setRoundFilter] = useState("All Rounds");

  useEffect(() => setIsMounted(true), []);

  const players = useMemo(() => MOCK_PLAYERS, []);

  // Dynamic team list (TD3)
  const teamOptions = useMemo(() => {
    const set = new Set(players.map((p) => p.team));
    return ["All Teams", ...Array.from(set).sort()];
  }, [players]);

  const roundOptions = ["All Rounds", ...ROUND_LABELS];

  // Filtering logic
  const filteredPlayers = useMemo(() => {
    let list = [...players];

    if (isPremium) {
      if (searchQuery.length > 0) {
        list = list.filter((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (teamFilter !== "All Teams") {
        list = list.filter((p) => p.team === teamFilter);
      }

      if (roundFilter !== "All Rounds") {
        const idx = ROUND_LABELS.indexOf(roundFilter);
        list = list.sort(
          (a, b) =>
            getRoundsForLens(b, selectedStat)[idx] -
            getRoundsForLens(a, selectedStat)[idx]
        );
      }
    }

    return list;
  }, [players, searchQuery, teamFilter, roundFilter, selectedStat, isPremium]);

  const visiblePlayers = useMemo(
    () => filteredPlayers.slice(0, visibleCount),
    [filteredPlayers, visibleCount]
  );

  const hasMoreRows = visibleCount < filteredPlayers.length;

  const handleShowMore = () =>
    setVisibleCount((v) => Math.min(v + 20, filteredPlayers.length));

  /* ---------------------------------------------------------------------- */
  /*                                 HEADER                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <>
      <div className="rounded-3xl border border-neutral-800 bg-gradient-to-b
      from-neutral-950 via-black to-black px-5 py-4 shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">

          {/* LEFT SIDE */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border
            border-yellow-500/40 bg-gradient-to-r from-yellow-500/15
            via-yellow-500/5 to-transparent px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-yellow-500" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-yellow-200">
                Master table
              </span>
            </div>

            <h3 className="mt-3 text-xl font-semibold text-neutral-50 md:text-2xl">
              Full-season player ledger & hit-rate grid
            </h3>

            <p className="mt-2 max-w-xl text-xs text-neutral-400">
              Complete ledger of{" "}
              <span className="text-yellow-200 font-medium">
                round-by-round production
              </span>
              , hit-rates and volatility — fully unlocked in prototype.
            </p>
          </div>

          {/* RIGHT SIDE: STAT PILLS + FILTERS */}
          <div className="flex flex-col gap-3 md:items-end">

            {/* STAT PILLS */}
            <div className="flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1 text-[11px]">
              {(["Fantasy", "Disposals", "Goals"] as const).map((stat) => (
                <button
                  key={stat}
                  onClick={() => setSelectedStat(stat)}
                  className={`rounded-full px-3 py-1.5 ${
                    selectedStat === stat
                      ? "bg-yellow-400 text-black shadow-yellow-300"
                      : "bg-neutral-900 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  {stat}
                </button>
              ))}
            </div>

            {/* Compact — desktop only */}
            <div className="hidden md:flex items-center gap-2 rounded-full border
            border-neutral-700 bg-black/80 px-3 py-1.5">
              <Switch
                checked={compactMode}
                onCheckedChange={setCompactMode}
                className="data-[state=checked]:bg-yellow-400"
              />
              <span className="text-[11px] text-neutral-200">Compact (hide rounds)</span>
            </div>

            {/* FILTER ROW — stacked mobile, horizontal desktop */}
            <div className="flex w-full flex-col gap-3 md:flex-row md:gap-3 md:justify-end">

              {/* SEARCH */}
              <div className="flex-1 md:flex-none">
                <div
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] transition ${
                    isPremium
                      ? "border-neutral-700 bg-black/80 text-neutral-200"
                      : "border-neutral-800 bg-neutral-900/60 text-neutral-600"
                  }`}
                >
                  <Search className="h-3.5 w-3.5 text-neutral-500" />
                  <input
                    disabled={!isPremium}
                    value={isPremium ? searchQuery : ""}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isPremium ? "Search players…" : "Search (Neeko+ only)"}
                    className="w-full bg-transparent text-[11px] text-neutral-200 placeholder:text-neutral-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* TEAM DROPDOWN */}
              <PremiumDropdown
                label="Team"
                value={teamFilter}
                onChange={setTeamFilter}
                options={teamOptions}
                disabled={!isPremium}
              />

              {/* ROUND DROPDOWN */}
              <PremiumDropdown
                label="Round"
                value={roundFilter}
                onChange={setRoundFilter}
                options={roundOptions}
                disabled={!isPremium}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*                           DESKTOP TABLE                            */}
      {/* ------------------------------------------------------------------ */}

      <div className="mt-8 hidden rounded-3xl border border-neutral-800 bg-neutral-950 md:block">
        <div className="overflow-x-auto w-full">
          <table className="min-w-[1100px] border-separate border-spacing-0 text-[11px] text-neutral-100">
            <thead>
              <tr className="sticky top-0 z-20 bg-black/95 backdrop-blur-sm">
                {/* Sticky Player Header */}
                <HeaderCell className="sticky left-0 z-30 w-60 border-r border-neutral-900 bg-black/90">
                  Player
                </HeaderCell>

                {/* Round headers */}
                {!compactMode &&
                  ROUND_LABELS.map((round) => (
                    <HeaderCell key={round}>{round}</HeaderCell>
                  ))}

                {/* Summary */}
                <HeaderCell className="w-16 text-right">Min</HeaderCell>
                <HeaderCell className="w-16 text-right">Max</HeaderCell>
                <HeaderCell className="w-20 text-right">Avg</HeaderCell>
                <HeaderCell className="w-20 text-right">Total</HeaderCell>

                {/* Hit-rates */}
                {STAT_CONFIG[selectedStat].thresholds.map((t) => (
                  <HeaderCell key={t} className="w-16 text-right">
                    {t}+
                  </HeaderCell>
                ))}
              </tr>
            </thead>
            <tbody>
              {visiblePlayers.map((player, index) => {
                const summary = computeSummary(player, selectedStat);
                const hitRates = computeHitRates(player, selectedStat);
                const rounds = getRoundsForLens(player, selectedStat);

                const blur =
                  !isPremium && index >= 20
                    ? "blur-[3px] brightness-[0.55]"
                    : "";

                return (
                  <tr
                    key={player.id}
                    className="border-b border-neutral-900 hover:bg-neutral-900/60 text-neutral-200"
                  >
                    {/* Sticky Player Cell */}
                    <td
                      className={`sticky left-0 z-10 w-60 border-b border-neutral-900 border-r border-neutral-900
                      bg-gradient-to-r from-black/98 via-black/94 to-black/80 px-4
                      ${compactMode ? "py-2" : "py-2.5"} ${blur}`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedPlayer(player)}
                        className="group flex w-full items-center gap-3"
                      >
                        {/* Rank */}
                        <div className="flex h-7 w-7 items-center justify-center rounded-full
                        border border-neutral-700 bg-black/80 text-[11px] text-neutral-300">
                          {player.rank}
                        </div>

                        {/* Name + Role */}
                        <div className="flex flex-col text-left">
                          <span className="text-[13px] font-medium text-neutral-50">
                            {player.name}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest text-neutral-500">
                            {player.team} • {player.role}
                          </span>
                        </div>

                        <ChevronRight className="ml-auto h-4 w-4 text-neutral-500 group-hover:text-yellow-300" />
                      </button>
                    </td>

                    {/* Round-by-round cells */}
                    {!compactMode &&
                      rounds.map((v, i) => (
                        <BodyCell key={i} value={v} compact={compactMode} blurClass={blur} />
                      ))}

                    {/* Summary */}
                    <BodyCell
                      value={summary.min}
                      className="text-right text-neutral-300"
                      compact={compactMode}
                      blurClass={blur}
                    />

                    <BodyCell
                      value={summary.max}
                      className="text-right text-neutral-300"
                      compact={compactMode}
                      blurClass={blur}
                    />

                    <BodyCell
                      value={summary.avg.toFixed(1)}
                      className="text-right text-yellow-200 font-semibold"
                      compact={compactMode}
                      blurClass={blur}
                    />

                    <BodyCell
                      value={summary.total}
                      className="text-right text-neutral-300"
                      compact={compactMode}
                      blurClass={blur}
                    />

                    {/* Hit-rate columns */}
                    {STAT_CONFIG[selectedStat].thresholds.map((_, i) => {
                      const hr = hitRates[i];
                      return (
                        <BodyCell
                          key={i}
                          value={`${hr}%`}
                          className={`text-right ${getHitRateColor(hr)} ${getHitRateGlow(hr)}`}
                          compact={compactMode}
                          blurClass={blur}
                        />
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Show more — centered */}
        {hasMoreRows && (
          <div className="border-t border-neutral-900 bg-black/95 py-4 text-center">
            <Button
              onClick={handleShowMore}
              variant="outline"
              size="sm"
              className="rounded-full border-neutral-700 bg-neutral-950 text-neutral-200 hover:border-yellow-400 hover:bg-neutral-900"
            >
              Show 20 more players
            </Button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*                           MOBILE LIST                              */}
      {/* ------------------------------------------------------------------ */}

      <div className="mt-8 md:hidden">
        <div className="space-y-3">
          {visiblePlayers.map((player, index) => {
            const blur =
              !isPremium && index >= 20
                ? "blur-[3px] brightness-[0.55]"
                : "";

            return (
              <MobilePlayerCard
                key={player.id}
                player={player}
                index={index}
                selectedStat={selectedStat}
                blurClass={blur}
                onOpen={() => setSelectedPlayer(player)}
              />
            );
          })}
        </div>

        {hasMoreRows && (
          <div className="mt-4 text-center">
            <Button
              onClick={handleShowMore}
              variant="outline"
              size="sm"
              className="rounded-full border-neutral-700 bg-neutral-950 text-neutral-200 hover:border-yellow-400 hover:bg-neutral-900"
            >
              Show 20 more players
            </Button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*                       NEKO+ CTA SECTION                            */}
      {/* ------------------------------------------------------------------ */}

      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40
        bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-transparent px-3 py-1
        text-[10px] font-semibold uppercase tracking-widest text-yellow-200">
          <Sparkles className="h-3 w-3" />
          <span>Neeko+ Master Grid</span>
        </div>

        <p className="max-w-xl text-xs text-neutral-300">
          Unlock full compact grid, advanced hit-rate bands and deep role filters for every player.
        </p>

        <Button
          size="lg"
          className="rounded-full bg-yellow-400 px-7 py-2 text-sm font-semibold text-black
          shadow-[0_0_40px_rgba(250,204,21,0.9)] hover:bg-yellow-300"
        >
          Get Neeko+
        </Button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*                            INSIGHTS PORTAL                          */}
      {/* ------------------------------------------------------------------ */}

      {isMounted && selectedPlayer &&
        createPortal(
          <InsightsOverlay
            player={selectedPlayer}
            selectedStat={selectedStat}
            onClose={() => setSelectedPlayer(null)}
            onLensChange={setSelectedStat}
          />,
          document.body
        )}
    </>
  );
}
