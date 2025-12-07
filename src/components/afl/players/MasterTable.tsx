// src/components/afl/players/MasterTable.tsx
import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Lock, Search, Sparkles, X } from "lucide-react";
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
/*                               MOCK DATA BUILD                              */
/* -------------------------------------------------------------------------- */

function buildMockPlayers(): PlayerRow[] {
  const players: PlayerRow[] = [];

  for (let i = 1; i <= 60; i++) {
    const baseFantasy = 70 + Math.round(Math.random() * 40);
    const baseDisposals = 18 + Math.round(Math.random() * 10);
    const baseGoals = Math.random() < 0.5 ? 1 : 0;

    const roundsFantasy: number[] = [];
    const roundsDisposals: number[] = [];
    const roundsGoals: number[] = [];

    for (let r = 0; r < ROUND_LABELS.length; r++) {
      const fantasy =
        baseFantasy + Math.round((Math.random() - 0.5) * 24) +
        (Math.random() < 0.1 ? 20 : 0);

      const disposals =
        baseDisposals + Math.round((Math.random() - 0.5) * 8);

      const goals =
        baseGoals +
        (Math.random() < 0.15 ? 2 : 0) +
        (Math.random() < 0.05 ? 3 : 0);

      roundsFantasy.push(Math.max(40, fantasy));
      roundsDisposals.push(Math.max(8, disposals));
      roundsGoals.push(Math.max(0, goals));
    }

    players.push({
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
  return players;
}

const MOCK_PLAYERS: PlayerRow[] = buildMockPlayers();

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function getRoundsForLens(player: PlayerRow, lens: StatLens) {
  if (lens === "Fantasy") return player.roundsFantasy;
  if (lens === "Disposals") return player.roundsDisposals;
  return player.roundsGoals;
}

function computeSummary(player: PlayerRow, lens: StatLens) {
  const rounds = getRoundsForLens(player, lens);
  const min = Math.min(...rounds);
  const max = Math.max(...rounds);
  const total = rounds.reduce((a,b)=>a+b,0);
  const avg = +(total / rounds.length).toFixed(1);

  const lastWindow = rounds.slice(-8);
  const windowMin = lastWindow.length ? Math.min(...lastWindow) : min;
  const windowMax = lastWindow.length ? Math.max(...lastWindow) : max;
  const volatilityRange = windowMax - windowMin;

  return { min, max, avg, total, windowMin, windowMax, volatilityRange };
}

function computeHitRates(player: PlayerRow, lens: StatLens) {
  const rounds = getRoundsForLens(player, lens);
  return STAT_CONFIG[lens].thresholds.map((t)=>
    Math.round((rounds.filter(v=>v>=t).length / rounds.length) * 100)
  );
}

function computeConfidenceScore(player: PlayerRow, lens: StatLens) {
  const hitRates = computeHitRates(player, lens);
  const { volatilityRange } = computeSummary(player, lens);

  const baseScore = hitRates[1]*0.5 + hitRates[2]*0.35;

  let volFactor = 1;
  if (volatilityRange <= 10) volFactor = 1.1;
  else if (volatilityRange <= 16) volFactor = 0.95;
  else volFactor = 0.82;

  let health = 1;
  if (hitRates[0] < 40) health -= 0.3;
  if (hitRates[2] < 20) health -= 0.2;
  if (hitRates[3] < 10) health -= 0.1;

  return Math.max(0, Math.min(100, Math.round(baseScore * volFactor * health)));
}

/* -------------------------------------------------------------------------- */
/*      PATCH 2 — GREEN → RED HIT RATE COLOURING (REQUESTED)                 */
/* -------------------------------------------------------------------------- */

function getHitRateColorClasses(value: number) {
  if (value >= 75) return "text-lime-300";
  if (value >= 50) return "text-yellow-300";
  if (value >= 30) return "text-amber-300";
  return "text-red-300";
}

/* -------------------------------------------------------------------------- */
/*                               SHARED UI                                    */
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

function BodyCell({ value, className, compact, blurClass }: any) {
  return (
    <td
      className={`border-b border-neutral-900/80 bg-black/80 px-2.5
      ${compact ? "py-2" : "py-2.5"} text-[11px] text-neutral-200
      ${blurClass ?? ""} ${className ?? ""}`}
    >
      {value}
    </td>
  );
}

/* -------------------------------------------------------------------------- */
/*                          INSIGHTS CONTENT (UNCHANGED)                      */
/* -------------------------------------------------------------------------- */

function InsightsContent({ player, selectedStat }: any) {
  const config = STAT_CONFIG[selectedStat];
  const summary = computeSummary(player, selectedStat);
  const hitRates = computeHitRates(player, selectedStat);
  const vol =
    summary.volatilityRange <= 8
      ? "Low"
      : summary.volatilityRange <= 14
      ? "Medium"
      : "High";

  const rounds = getRoundsForLens(player, selectedStat);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* RR carousel */}
      <div>
        <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Round-by-round scores
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-2 pb-1">
            {rounds.map((value, i) => (
              <div key={i} className="flex min-w-[46px] flex-col items-center">
                <span className="text-[9px] text-neutral-500">{ROUND_LABELS[i]}</span>
                <div className="mt-1 flex h-8 w-10 items-center justify-center
                rounded-md bg-neutral-950/80 text-[11px] text-neutral-100">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* recent window */}
      <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b
      from-neutral-900/95 via-neutral-950 to-black p-5 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
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
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Average
            </div>
            <div className="mt-1 text-sm font-semibold text-yellow-200">
              {summary.avg.toFixed(1)} {config.valueUnitShort}
            </div>
          </div>
        </div>

        {/* sparkline placeholder */}
        <div className="h-20 rounded-xl bg-gradient-to-b from-neutral-800/70 to-black
        shadow-[0_0_40px_rgba(0,0,0,0.8)]" />

        <div className="mt-4 grid gap-3 text-[11px] text-neutral-300 sm:grid-cols-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Range window
            </div>
            <div className="mt-1 text-sm font-semibold text-neutral-100">
              {summary.windowMin}–{summary.windowMax} {config.valueUnitShort}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Volatility
            </div>
            <div className="mt-1 text-sm font-semibold text-teal-300">
              {vol} ({summary.volatilityRange} range)
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Total
            </div>
            <div className="mt-1 text-sm font-semibold text-neutral-100">
              {summary.total} {config.valueUnitShort}
            </div>
          </div>
        </div>
      </div>

      {/* AI summary */}
      <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b
      from-black/96 via-neutral-950 to-black px-5 py-4 text-[11px] text-neutral-300
      shadow-[0_0_40px_rgba(0,0,0,0.7)]">
        <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-yellow-200">
          AI performance summary
        </div>
        <p>
          Usage and role suggest{" "}
          <span className="font-semibold text-neutral-50">stable opportunity</span>{" "}
          with{" "}
          <span className="font-semibold text-neutral-50">
            {vol.toLowerCase()} volatility
          </span>{" "}
          at this lens. Hit-rate distribution indicates a secure floor with
          periodic ceiling spikes in favourable matchups.
        </p>
      </div>

      {/* confidence + hit-rate */}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)]">
        <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-b
        from-yellow-500/15 via-black to-black px-5 py-4 shadow-[0_0_40px_rgba(250,204,21,0.65)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em]
              text-yellow-200/90">
                Confidence index
              </div>
              <div className="mt-1 text-xs text-neutral-200">
                Blends floor/ceiling hit-rates, recent stability and window shape.
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-semibold text-yellow-200">
                {computeConfidenceScore(player, selectedStat)}%
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                Composite
              </div>
            </div>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-900/90">
            <div className="h-full w-[55%] rounded-full bg-gradient-to-r
            from-lime-400 via-yellow-300 to-orange-400" />
          </div>

          <div className="mt-3 flex justify-between text-[10px] text-neutral-400">
            <span>Floor security</span>
            <span>Ceiling access</span>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b
        from-black/96 via-neutral-950 to-black px-5 py-4 text-[11px] text-neutral-300
        shadow-[0_0_40px_rgba(0,0,0,0.7)]">
          <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            Hit-rate profile
          </div>

          <div className="space-y-2">
            {STAT_CONFIG[selectedStat].thresholds.map((threshold, idx) => {
              const value = hitRates[idx];
              return (
                <div key={threshold} className="flex items-center gap-3">
                  <div className="w-10 text-[10px] text-neutral-400">{threshold}+</div>

                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-900/90">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-400
                      via-yellow-300 to-lime-400"
                      style={{ width: `${value}%` }}
                    />
                  </div>

                  <div className={`w-8 text-right text-[10px] ${getHitRateColorClasses(value)}`}>
                    {value}%
                  </div>
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
/*                     INSIGHTS OVERLAY (DESKTOP + MOBILE)                    */
/* -------------------------------------------------------------------------- */

function InsightsOverlay({ player, selectedStat, onClose, onLensChange }: any) {
  // PATCH — FIX USEEFFECT ERROR
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // PATCH — MOBILE SWIPE-DOWN CLOSE
  const [swipeStart, setSwipeStart] = useState(0);
  const [swipeY, setSwipeY] = useState(0);

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md"
         onClick={onClose}>
      <div className="flex h-full w-full items-stretch justify-end">
        {/* DESKTOP PANEL */}
        <div
          className="hidden h-full w-[480px] max-w-full border-l border-yellow-500/30
          bg-gradient-to-b from-neutral-950 via-black to-black px-5 py-4
          shadow-[0_0_60px_rgba(250,204,21,0.7)] md:block"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em]
              text-yellow-200/80">
                Player insights
              </div>
              <div className="mt-1 text-sm font-semibold text-neutral-50">
                {player.name}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em]
              text-neutral-400">
                {player.team} • {player.role}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-neutral-900/90 p-1.5 text-neutral-300
              hover:bg-neutral-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stat lens pills */}
          <div className="mb-4 flex items-center gap-2 rounded-full border
          border-neutral-700/80 bg-black/80 px-2 py-1 text-[11px] text-neutral-200">
            {(["Fantasy","Disposals","Goals"] as const).map((stat) => (
              <button
                key={stat}
                type="button"
                onClick={() => onLensChange(stat)}
                className={`rounded-full px-3 py-1.5 ${
                  selectedStat === stat
                    ? "bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,0.9)]"
                    : "bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800"
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
        <div
          className="flex w-full items-end justify-center md:hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="w-full rounded-t-3xl border border-yellow-500/25
            bg-gradient-to-b from-neutral-950 to-black px-4 py-3
            shadow-[0_0_50px_rgba(250,204,21,0.7)]
            transition-transform duration-200"
            style={{
              transform:
                swipeY > 0 ? `translateY(${swipeY}px)` : "translateY(0)",
            }}
            onTouchStart={(e) => setSwipeStart(e.touches[0].clientY)}
            onTouchMove={(e) => {
              const dy = e.touches[0].clientY - swipeStart;
              if (dy > 0) setSwipeY(dy);
            }}
            onTouchEnd={() => {
              if (swipeY > 120) {
                onClose();
              }
              setSwipeY(0);
            }}
          >
            {/* Drag handle */}
            <button
              type="button"
              onClick={onClose}
              className="mx-auto mb-3 mt-1 flex h-1.5 w-10 items-center
              justify-center rounded-full bg-yellow-200/70"
            >
              <span className="sr-only">Close</span>
            </button>

            {/* Header */}
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em]
                text-yellow-200/80">Player insights</div>
                <div className="mt-1 text-sm font-semibold text-neutral-50">
                  {player.name}
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em]
                text-neutral-400">
                  {player.team} • {player.role}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-neutral-900/90 p-1.5 text-neutral-300
                hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Stat lens toggle */}
            <div className="mb-3 flex items-center gap-2 rounded-full border
            border-neutral-700/80 bg-black/80 px-2 py-1 text-[11px]
            text-neutral-200">
              {(["Fantasy","Disposals","Goals"] as const).map((stat) => (
                <button
                  key={stat}
                  type="button"
                  onClick={() => onLensChange(stat)}
                  className={`rounded-full px-3 py-1.5 ${
                    selectedStat === stat
                      ? "bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,0.9)]"
                      : "bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800"
                  }`}
                >
                  {stat}
                </button>
              ))}
            </div>

            {/* Content */}
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
/*                          MOBILE PLAYER CARD                                */
/* -------------------------------------------------------------------------- */

function MobilePlayerCard({
  player, index, selectedStat, blurClass, onOpen
}: any) {
  const config = STAT_CONFIG[selectedStat];
  const summary = computeSummary(player, selectedStat);
  const rounds = getRoundsForLens(player, selectedStat);

  return (
    <div
      className={`relative rounded-2xl border border-neutral-800/80
      bg-gradient-to-b from-black/95 via-black/90 to-black px-4 py-3
      shadow-[0_0_40px_rgba(0,0,0,0.7)] ${blurClass}`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* left */}
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full
          border border-neutral-700/80 bg-black/80 text-[11px] text-neutral-200">
            {index + 1}
          </div>
          <div>
            <div className="text-[13px] font-medium text-neutral-50">
              {player.name}
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em]
            text-neutral-400">
              {player.team} • {player.role}
            </div>
          </div>
        </div>

        {/* right */}
        <div className="text-right text-[11px] text-neutral-200">
          <div className="text-[10px] uppercase tracking-[0.18em]
          text-neutral-500">{config.label} avg</div>
          <div className="mt-0.5 text-sm font-semibold text-yellow-200">
            {summary.avg.toFixed(1)} {config.valueUnitShort}
          </div>
        </div>
      </div>

      {/* inline RR carousel */}
      <div className="mt-3 overflow-x-auto">
        <div className="flex gap-2 pb-1">
          {rounds.map((value, i) => (
            <div key={i}
              className="flex min-w-[46px] flex-col items-center">
              <span className="text-[9px] text-neutral-500">{ROUND_LABELS[i]}</span>
              <div className="mt-1 flex h-8 w-10 items-center justify-center
              rounded-md bg-neutral-950/80 text-[11px] text-neutral-100">
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-[10px] text-neutral-400">
          Tap insights for full confidence bands.
        </div>

        <Button
          size="sm"
          onClick={onOpen}
          className="rounded-full bg-yellow-400 px-3 py-1 text-[11px]
          font-semibold text-black shadow-[0_0_24px_rgba(250,204,21,0.9)]
          hover:bg-yellow-300"
        >
          View insights
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               MASTER TABLE                                 */
/* -------------------------------------------------------------------------- */

export default function MasterTable() {
  const { isPremium } = useAuth();

  const [selectedStat, setSelectedStat] =
    useState<StatLens>("Fantasy");

  const [compactMode, setCompactMode] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);

  const [selectedPlayer, setSelectedPlayer] =
    useState<any>(null);

  const [isMounted, setIsMounted] = useState(false);

  // Only portal after mount
  useEffect(() => setIsMounted(true), []);

  const players = useMemo(() => MOCK_PLAYERS, []);
  const visiblePlayers = useMemo(
    () => players.slice(0, visibleCount),
    [players, visibleCount]
  );
  const hasMoreRows = visibleCount < players.length;

  /* Show More button */
  const handleShowMore = () =>
    setVisibleCount((v) => Math.min(v + 20, players.length));

  return (
    <>
      {/* HEADER */}
      <div
        className="rounded-3xl border border-neutral-800/80
        bg-gradient-to-b from-neutral-950/95 via-black/96 to-black
        px-5 py-4 shadow-[0_0_60px_rgba(0,0,0,0.9)]"
      >
        <div className="flex flex-col justify-between gap-3
        md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border
            border-yellow-500/40 bg-gradient-to-r from-yellow-500/15
            via-yellow-500/5 to-transparent px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400
              shadow-[0_0_12px_rgba(250,204,21,0.9)]" />
              <span className="text-[10px] font-semibold uppercase
              tracking-[0.18em] text-yellow-200/90">
                Master table
              </span>
            </div>

            <h3 className="mt-3 text-xl font-semibold text-neutral-50
            md:text-2xl">
              Full-season player ledger &amp; hit-rate grid
            </h3>

            <p className="mt-2 max-w-2xl text-xs text-neutral-400">
              Every player’s{" "}
              <span className="font-medium text-yellow-200">
                round-by-round output
              </span>
              , totals and hit-rate profile — fully unlocked in prototype.
            </p>
          </div>

          {/* STAT SELECTOR */}
          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex items-center gap-2 rounded-full border
            border-neutral-700/80 bg-black/80 px-2 py-1 text-[11px]
            text-neutral-200">
              {(["Fantasy","Disposals","Goals"] as const).map((stat) => (
                <button
                  key={stat}
                  onClick={() => setSelectedStat(stat)}
                  className={`rounded-full px-3 py-1.5 ${
                    selectedStat === stat
                      ? "bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,0.9)]"
                      : "bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800"
                  }`}
                >
                  {stat}
                </button>
              ))}
            </div>

            {/* Compact toggle (removed on mobile by request) */}
            <div className="hidden md:flex items-center gap-2 rounded-full border
            border-neutral-700/80 bg-black/80 px-3 py-1.5">
              <Switch
                checked={compactMode}
                onCheckedChange={setCompactMode}
                className="data-[state=checked]:bg-yellow-400"
              />
              <span className="text-[11px] font-medium text-neutral-100">
                Compact (hide rounds)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP TABLE */}
      <div className="mt-8 hidden rounded-3xl border border-neutral-800/80
      bg-neutral-950/95 md:block">
        <div className="w-full overflow-x-auto">
          <table
            className="min-w-[1040px] border-separate border-spacing-0
            text-[11px] text-neutral-100 md:min-w-full"
          >
            <thead>
              <tr className="sticky top-0 z-20 bg-black/95 backdrop-blur-sm">
                <HeaderCell className="sticky left-0 z-30 w-60 border-r
                border-neutral-900/80 bg-gradient-to-r from-black/98
                via-black/94 to-black/80">
                  <span className="text-xs font-semibold text-neutral-200">
                    Player
                  </span>
                </HeaderCell>

                {!compactMode &&
                  ROUND_LABELS.map((round) => (
                    <HeaderCell key={round}>{round}</HeaderCell>
                  ))}

                <HeaderCell className="w-16 text-right">Min</HeaderCell>
                <HeaderCell className="w-16 text-right">Max</HeaderCell>
                <HeaderCell className="w-20 text-right">Avg</HeaderCell>
                <HeaderCell className="w-20 text-right">Total</HeaderCell>

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
                    ? "blur-[3px] brightness-[0.65]"
                    : "";

                return (
                  <tr key={player.id}
                    className="border-b border-neutral-900/80 hover:bg-neutral-900/55
                    text-[11px] text-neutral-200">
                    {/* Sticky left cell */}
                    <td
                      className={`sticky left-0 z-10 w-60 border-b
                      border-neutral-900/80 border-r border-r-neutral-900/80
                      bg-gradient-to-r from-black/98 via-black/94 to-black/80
                      px-4 ${compactMode ? "py-2" : "py-2.5"} ${blur}`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedPlayer(player)}
                        className="group flex w-full items-center gap-3 text-left"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full
                        border border-neutral-700/80 bg-black/80 text-[11px]
                        text-neutral-200">
                          {player.rank}
                        </div>

                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium text-neutral-50">
                            {player.name}
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.16em]
                          text-neutral-400">
                            {player.team} • {player.role}
                          </span>
                        </div>

                        <ChevronRight
                          className="ml-auto h-4 w-4 text-neutral-500
                          group-hover:text-yellow-300"
                        />
                      </button>
                    </td>

                    {/* Round cells */}
                    {!compactMode &&
                      rounds.map((value, idx) => (
                        <BodyCell key={idx} value={value}
                          compact={compactMode}
                          blurClass={blur}
                        />
                      ))}

                    {/* Summary cells */}
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
                      className="text-right text-yellow-200"
                      compact={compactMode}
                      blurClass={blur}
                    />
                    <BodyCell
                      value={summary.total}
                      className="text-right text-neutral-300"
                      compact={compactMode}
                      blurClass={blur}
                    />

                    {/* Hit rates */}
                    {STAT_CONFIG[selectedStat].thresholds.map((t, i) => (
                      <BodyCell
                        key={t}
                        value={`${hitRates[i]}%`}
                        className={`text-right ${getHitRateColorClasses(hitRates[i])}`}
                        compact={compactMode}
                        blurClass={blur}
                      />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Show more button — CENTERED (your request) */}
        {hasMoreRows && (
          <div className="border-t border-neutral-900/80 bg-black/95 px-5 py-3
          text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowMore}
              className="rounded-full border-neutral-700 bg-neutral-950/80
              text-neutral-200 hover:border-yellow-400 hover:bg-neutral-900"
            >
              Show 20 more players
            </Button>
          </div>
        )}
      </div>

      {/* MOBILE LIST */}
      <div className="mt-8 md:hidden">
        <div className="space-y-3">
          {visiblePlayers.map((player, index) => {
            const blur =
              !isPremium && index >= 20
                ? "blur-[3px] brightness-[0.65]"
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
              variant="outline"
              onClick={handleShowMore}
              className="rounded-full border-neutral-700 bg-neutral-950/85
              text-xs text-neutral-200 hover:border-yellow-400 hover:bg-neutral-900"
            >
              Show 20 more players
            </Button>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border
        border-yellow-500/40 bg-gradient-to-r from-yellow-500/20
        via-yellow-500/5 to-transparent px-3 py-1 text-[10px] font-semibold
        uppercase tracking-[0.18em] text-yellow-200/90">
          <Sparkles className="h-3 w-3" />
          <span>Neeko+ Master Grid</span>
        </div>

        <p className="max-w-xl text-xs text-neutral-300/90">
          Unlock full compact grid, advanced hit-rate bands and deep role
          filters for every player.
        </p>

        <Button
          size="lg"
          className="mt-1 rounded-full bg-yellow-400 px-7 py-2 text-sm
          font-semibold text-black shadow-[0_0_40px_rgba(250,204,21,0.9)]
          hover:bg-yellow-300"
        >
          Get Neeko+
        </Button>
      </div>

      {/* INSIGHTS OVERLAY (PORTAL) */}
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
