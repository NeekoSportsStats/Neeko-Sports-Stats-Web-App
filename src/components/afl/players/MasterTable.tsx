// src/components/afl/players/MasterTable.tsx
import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Crown,
  Lock,
  Activity,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

/* ------------------------------------------------------------------ */
/* Types & stat config                                                */
/* ------------------------------------------------------------------ */

type StatKey =
  | "fantasy"
  | "disposals"
  | "goals"
  | "kicks"
  | "marks"
  | "tackles"
  | "hitouts";

const STAT_LABELS: Record<StatKey, string> = {
  fantasy: "Fantasy",
  disposals: "Disposals",
  goals: "Goals",
  kicks: "Kicks",
  marks: "Marks",
  tackles: "Tackles",
  hitouts: "Hitouts",
};

const FREE_STATS: StatKey[] = ["fantasy", "disposals", "goals"];

const TEAMS = [
  "ADE",
  "BRIS",
  "CARL",
  "COLL",
  "ESS",
  "FRE",
  "GEEL",
  "GCFC",
  "GWS",
  "HAW",
  "MELB",
  "NMFC",
  "PORT",
  "RICH",
  "STK",
  "SYD",
  "WBD",
  "WCE",
];

const POSITIONS = ["DEF", "MID", "RUC", "FWD"] as const;
type PositionKey = (typeof POSITIONS)[number];

interface PlayerSeasonRow {
  id: number;
  name: string;
  team: string;
  pos: PositionKey;
  openingRound: number;
  fantasy: number[]; // length 23
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function min(values: number[]): number {
  return values.length ? Math.min(...values) : 0;
}

function max(values: number[]): number {
  return values.length ? Math.max(...values) : 0;
}

function stdDev(values: number[]): number {
  if (values.length <= 1) return 0;
  const avg = average(values);
  const variance =
    values.reduce((acc, v) => acc + (v - avg) * (v - avg), 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

function hitRate(values: number[], threshold: number): number {
  if (!values.length) return 0;
  const hits = values.filter((v) => v >= threshold).length;
  return (hits / values.length) * 100;
}

// Simple stat lens transform so that non-fantasy stats still
// feel believable without us modelling full multi-stat data.
function projectStat(series: number[], stat: StatKey): number[] {
  switch (stat) {
    case "disposals":
      return series.map((v) => Math.round(v * 0.55));
    case "goals":
      return series.map((v) => Math.round(v / 25)); // 0–4-ish
    case "kicks":
      return series.map((v) => Math.round(v * 0.33));
    case "marks":
      return series.map((v) => Math.round(v * 0.18));
    case "tackles":
      return series.map((v) => Math.round(v * 0.12));
    case "hitouts":
      return series.map((v) => Math.round(v * 0.4));
    case "fantasy":
    default:
      return series;
  }
}

/* ------------------------------------------------------------------ */
/* Mock season data (SQL-ready shape for later Supabase wiring)       */
/* ------------------------------------------------------------------ */

const MOCK_PLAYERS: PlayerSeasonRow[] = Array.from(
  { length: 60 },
  (_, i): PlayerSeasonRow => {
    const team = TEAMS[i % TEAMS.length];
    const pos = POSITIONS[i % POSITIONS.length];
    const name = `Player ${i + 1}`;

    // Build a deterministic but slightly wavy scoring profile.
    const base = 82 + (i % 7) * 3;
    const fantasy = Array.from({ length: 23 }, (_, r) => {
      const phase = Math.sin((r + 1 + i * 0.3) / 3) * 8;
      const trend = r * 0.6 - 3; // gentle upward trend over season
      const noise = ((r * (i + 3)) % 7) - 3; // pseudo-random but deterministic
      return Math.round(base + phase + trend + noise);
    });

    const openingRound = fantasy[0];

    return {
      id: i + 1,
      name,
      team,
      pos,
      openingRound,
      fantasy,
    };
  }
);

/* ------------------------------------------------------------------ */
/* Tiny sparkline component                                           */
/* ------------------------------------------------------------------ */

function Sparkline({ values }: { values: number[] }) {
  if (!values.length) return null;

  const minVal = min(values);
  const maxVal = max(values);
  const range = maxVal - minVal || 1;
  const norm = values.map((v) => ((v - minVal) / range) * 100);
  const width = Math.max(values.length * 14, 80);

  const points = norm
    .map((v, i) => {
      const x =
        (i / Math.max(norm.length - 1, 1)) * width;
      const y = 100 - v;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} 100`}
      preserveAspectRatio="none"
      className="h-16 w-full"
    >
      <polyline
        points={points}
        fill="none"
        stroke="rgba(250,204,21,0.18)"
        strokeWidth={6}
      />
      <polyline
        points={points}
        fill="none"
        stroke="rgba(250,204,21,0.9)"
        strokeWidth={2.4}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Row component                                                      */
/* ------------------------------------------------------------------ */

interface MasterRowProps {
  row: PlayerSeasonRow;
  stat: StatKey;
  maxRounds: number;
  isExpanded: boolean;
  onToggle: () => void;
  hoveredCol: string | null;
  setHoveredCol: (key: string | null) => void;
  isBlurred?: boolean;
  confidenceOverride?: number;
}

const GRID_TEMPLATE =
  "grid grid-cols-[minmax(220px,260px)_70px_repeat(23,56px)_64px_64px_64px_72px_60px_60px_60px_60px_60px_56px]";

function MasterTableRow({
  row,
  stat,
  maxRounds,
  isExpanded,
  onToggle,
  hoveredCol,
  setHoveredCol,
  isBlurred,
  confidenceOverride,
}: MasterRowProps) {
  const statSeries = useMemo(
    () => projectStat(row.fantasy, stat),
    [row.fantasy, stat]
  );
  const rounds = statSeries.slice(0, maxRounds);
  const total = rounds.reduce((a, b) => a + b, 0);
  const avg = average(rounds);
  const minVal = min(rounds);
  const maxVal = max(rounds);
  const vol = stdDev(rounds);

  const h90 = hitRate(rounds, 90);
  const h95 = hitRate(rounds, 95);
  const h100 = hitRate(rounds, 100);
  const h105 = hitRate(rounds, 105);
  const h110 = hitRate(rounds, 110);

  const confidence =
    confidenceOverride ??
    Math.max(40, Math.min(99, 100 - vol * 1.1));

  const blurClass = isBlurred
    ? "select-none blur-sm opacity-60 pointer-events-none"
    : "";

  const valueCell = (opts: {
    children: React.ReactNode;
    colKey: string;
    align?: "left" | "right" | "center";
    className?: string;
  }) => (
    <div
      onMouseEnter={() => setHoveredCol(opts.colKey)}
      className={cn(
        "px-3 py-2 text-xs",
        opts.align === "right" && "text-right",
        opts.align === "center" && "text-center",
        hoveredCol === opts.colKey && "bg-white/[0.06]",
        opts.className
      )}
    >
      {opts.children}
    </div>
  );

  const hitRateTone = (v: number) =>
    v >= 80
      ? "text-emerald-400"
      : v >= 60
      ? "text-lime-300"
      : v >= 40
      ? "text-yellow-300"
      : v > 0
      ? "text-orange-300"
      : "text-red-400";

  return (
    <div
      className={cn(
        "border-b border-white/5",
        isExpanded && "bg-white/[0.01]"
      )}
    >
      {/* Main row */}
      <div
        className={cn(
          GRID_TEMPLATE,
          "items-center text-[11px] md:text-xs",
          blurClass
        )}
      >
        {/* PLAYER / EXPAND */}
        <div
          onMouseEnter={() => setHoveredCol("player")}
          className={cn(
            "sticky left-0 z-[15] flex min-w-[220px] items-center gap-3 bg-black/95 px-3 py-2 backdrop-blur-sm border-r border-white/5",
            hoveredCol === "player" && "bg-white/[0.06]"
          )}
        >
          <button
            type="button"
            onClick={onToggle}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/80 hover:bg-white/10"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
          <div>
            <p className="font-semibold text-white">
              {row.name}
            </p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
              {row.team} • {row.pos}
            </p>
          </div>
        </div>

        {/* Opening round */}
        {valueCell({
          colKey: "or",
          align: "right",
          children: row.openingRound,
        })}

        {/* R1–R23 */}
        {Array.from({ length: maxRounds }, (_, idx) =>
          valueCell({
            colKey: `r${idx + 1}`,
            align: "right",
            children: rounds[idx]?.toFixed(0) ?? "–",
          })
        )}

        {/* MIN / MAX / AVG / TOTAL */}
        {valueCell({
          colKey: "min",
          align: "right",
          children: minVal.toFixed(0),
        })}
        {valueCell({
          colKey: "max",
          align: "right",
          children: maxVal.toFixed(0),
        })}
        {valueCell({
          colKey: "avg",
          align: "right",
          children: avg.toFixed(1),
        })}
        {valueCell({
          colKey: "total",
          align: "right",
          className: "font-semibold text-white",
          children: total.toFixed(0),
        })}

        {/* Hit rate bands */}
        {valueCell({
          colKey: "h90",
          align: "right",
          className: hitRateTone(h90),
          children: `${h90.toFixed(0)}%`,
        })}
        {valueCell({
          colKey: "h95",
          align: "right",
          className: hitRateTone(h95),
          children: `${h95.toFixed(0)}%`,
        })}
        {valueCell({
          colKey: "h100",
          align: "right",
          className: hitRateTone(h100),
          children: `${h100.toFixed(0)}%`,
        })}
        {valueCell({
          colKey: "h105",
          align: "right",
          className: hitRateTone(h105),
          children: `${h105.toFixed(0)}%`,
        })}
        {valueCell({
          colKey: "h110",
          align: "right",
          className: hitRateTone(h110),
          children: `${h110.toFixed(0)}%`,
        })}

        {/* Games */}
        {valueCell({
          colKey: "gms",
          align: "center",
          children: rounds.length,
        })}
      </div>

      {/* Expanded panel */}
      {isExpanded && !isBlurred && (
        <div className="border-t border-white/5 bg-black/80 px-4 py-4 md:px-6 md:py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xl text-xs leading-relaxed text-white/75 md:text-sm">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                Round Trend &amp; Role Context
              </p>
              <p>
                Over the sampled rounds,{" "}
                <span className="font-semibold text-yellow-200">
                  {row.name}
                </span>{" "}
                has tracked at{" "}
                <span className="font-semibold">
                  {avg.toFixed(1)} {STAT_LABELS[stat].toLowerCase()}
                </span>{" "}
                with a scoring window between{" "}
                <span className="font-semibold">
                  {minVal.toFixed(0)}–{maxVal.toFixed(0)}
                </span>
                , signalling{" "}
                <span className="font-semibold">
                  {vol < 8
                    ? "steady output"
                    : vol < 14
                    ? "controlled volatility"
                    : "swing-heavy scoring"}
                </span>{" "}
                and a{" "}
                <span className={hitRateTone(h100)}>
                  {h100.toFixed(0)}% hit rate
                </span>{" "}
                above the key 100+ band in this stat lens.
              </p>
            </div>

            <div className="w-full max-w-xs rounded-2xl border border-yellow-500/35 bg-gradient-to-br from-yellow-500/20 via-black to-black px-4 py-3 shadow-[0_0_26px_rgba(250,204,21,0.45)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-200">
                Confidence Index
              </p>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <p className="text-xs text-white/70">
                  Confidence blends hit-rate bands, volatility spread and
                  number of games played in this lens.
                </p>
                <p className="text-sm font-semibold text-yellow-200">
                  {confidence.toFixed(0)}%
                </p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-lime-300 shadow-[0_0_18px_rgba(250,204,21,0.7)]"
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/70 px-3 py-3 md:px-4">
            <div className="mb-2 flex items-center justify-between text-[11px] text-white/55">
              <span className="uppercase tracking-[0.16em]">
                Recent scoring trend
              </span>
              <span className="inline-flex items-center gap-1">
                <Activity className="h-3.5 w-3.5 text-yellow-300" />
                <span>L5 trajectory</span>
              </span>
            </div>
            <Sparkline values={rounds} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Premium blur overlay for gated rows                                */
/* ------------------------------------------------------------------ */

function PremiumBlurOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/80 to-black/95 backdrop-blur-md" />
  );
}

/* ------------------------------------------------------------------ */
/* Main MasterTable component                                         */
/* ------------------------------------------------------------------ */

export default function MasterTable() {
  const { isPremium } = useAuth?.() ?? { isPremium: false };

  const [stat, setStat] = useState<StatKey>("fantasy");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedRound, setSelectedRound] = useState<string>("all");
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);

  const maxRounds = 23;

  const filteredRows = useMemo(() => {
    let rows = [...MOCK_PLAYERS];

    if (selectedTeam !== "all") {
      rows = rows.filter((r) => r.team === selectedTeam);
    }

    // Round filter intentionally does nothing for now – this will become
    // a Supabase query later. We keep the state so the UI is wired.

    return rows
      .map((r) => {
        const series = projectStat(r.fantasy, stat);
        const rounds = series.slice(0, maxRounds);
        const total = rounds.reduce((a, b) => a + b, 0);
        return { row: r, total };
      })
      .sort((a, b) => b.total - a.total)
      .map((x) => x.row);
  }, [stat, selectedTeam]);

  const visibleRows = filteredRows.slice(0, visibleCount);

  const freeRows = isPremium
    ? visibleRows
    : visibleRows.slice(0, 20);
  const gatedRows = isPremium
    ? []
    : visibleRows.slice(20);

  const canShowMore = visibleCount < filteredRows.length;

  const statLabel = STAT_LABELS[stat];

  const handleStatChange = (value: StatKey) => {
    if (!FREE_STATS.includes(value) && !isPremium) return;
    setStat(value);
    setExpandedRowId(null);
  };

  return (
    <section
      id="master-table"
      className={cn(
        "relative mt-8 rounded-3xl border border-white/10",
        "bg-gradient-to-br from-[#050507] via-black to-[#05060B]",
        "px-4 py-6 md:px-6 md:py-8 shadow-[0_0_80px_rgba(0,0,0,0.8)]"
      )}
    >
      {/* background wash */}
      <div className="pointer-events-none absolute inset-x-[-80px] bottom-[-80px] top-24 bg-gradient-to-r from-yellow-500/10 via-emerald-500/6 to-sky-500/12 blur-3xl" />

      <div className="relative space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-black/80 px-3 py-1 text-xs text-yellow-200/90">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500/15 text-[11px]">
                ☆
              </span>
              <span className="uppercase tracking-[0.18em]">
                Master Table
              </span>
            </div>
            <h2 className="text-xl font-semibold md:text-2xl">
              Full-season player ledger &amp; hit-rate grid
            </h2>
            <p className="max-w-xl text-xs text-white/70 md:text-sm">
              Every player&apos;s round-by-round{" "}
              <span className="font-semibold text-yellow-200">
                {statLabel.toLowerCase()}
              </span>{" "}
              output, totals and hit rates across key thresholds — ordered by
              total output.
            </p>
            <p className="text-[11px] text-white/45">
              Hit-rate bands (90+, 95+, 100+, 105+, 110+) automatically adjust
              to the selected stat lens.
            </p>
          </div>

          {/* Filters */}
          <div className="space-y-2 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
              Table Filters
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              {/* Stat filter */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-xs">
                <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">
                  Stat
                </span>
                <select
                  value={stat}
                  onChange={(e) =>
                    handleStatChange(e.target.value as StatKey)
                  }
                  className={cn(
                    "bg-transparent text-xs outline-none",
                    "appearance-none pr-5",
                    !isPremium &&
                      !FREE_STATS.includes(stat) &&
                      "text-white/40"
                  )}
                >
                  {(
                    [
                      "fantasy",
                      "disposals",
                      "goals",
                      "kicks",
                      "marks",
                      "tackles",
                      "hitouts",
                    ] as StatKey[]
                  ).map((s) => (
                    <option
                      key={s}
                      value={s}
                      className="bg-black"
                      disabled={!isPremium && !FREE_STATS.includes(s)}
                    >
                      {STAT_LABELS[s]}
                      {!isPremium && !FREE_STATS.includes(s)
                        ? " (Neeko+)"
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Team filter (locked for free) */}
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                  "border-white/15 bg-black/70",
                  !isPremium && "opacity-60"
                )}
                disabled={!isPremium}
              >
                <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">
                  Team
                </span>
                <span className="flex items-center gap-1 text-xs text-white/75">
                  {selectedTeam === "all" ? "All teams" : selectedTeam}
                  {!isPremium && (
                    <Lock className="h-3.5 w-3.5 text-yellow-300" />
                  )}
                </span>
              </button>

              {/* Round filter (locked for free) */}
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                  "border-white/15 bg-black/70",
                  !isPremium && "opacity-60"
                )}
                disabled={!isPremium}
              >
                <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">
                  Round
                </span>
                <span className="flex items-center gap-1 text-xs text-white/75">
                  {selectedRound === "all"
                    ? "All rounds"
                    : `Round ${selectedRound}`}
                  {!isPremium && (
                    <Lock className="h-3.5 w-3.5 text-yellow-300" />
                  )}
                </span>
              </button>
            </div>

            <p className="text-[10px] text-white/40">
              Fantasy, Disposals &amp; Goals are free. Team &amp; Round filters
              are Neeko+ only.
            </p>
          </div>
        </div>

        {/* Table */}
        <div
          className="relative overflow-auto rounded-2xl border border-white/10 bg-black/70"
          onMouseLeave={() => setHoveredCol(null)}
        >
          {/* Sticky header */}
          <div className="sticky top-0 z-30 border-b border-white/10 bg-black/95">
            <div
              className={cn(
                GRID_TEMPLATE,
                "items-center text-[10px] uppercase tracking-[0.18em] text-white/45"
              )}
            >
              <div className="sticky left-0 z-[20] flex min-w-[220px] items-center gap-2 bg-black/95 px-3 py-2 backdrop-blur-sm border-r border-white/5">
                <span>Player</span>
              </div>
              <div className="px-3 py-2 text-right">OR</div>
              {Array.from({ length: maxRounds }, (_, i) => (
                <div
                  key={`h-r${i + 1}`}
                  className="px-3 py-2 text-right"
                >
                  R{i + 1}
                </div>
              ))}
              <div className="px-3 py-2 text-right">Min</div>
              <div className="px-3 py-2 text-right">Max</div>
              <div className="px-3 py-2 text-right">Avg</div>
              <div className="px-3 py-2 text-right">Total</div>
              <div className="px-3 py-2 text-right">90+</div>
              <div className="px-3 py-2 text-right">95+</div>
              <div className="px-3 py-2 text-right">100+</div>
              <div className="px-3 py-2 text-right">105+</div>
              <div className="px-3 py-2 text-right">110+</div>
              <div className="px-3 py-2 text-center">Gms</div>
            </div>
          </div>

          {/* Free rows */}
          <div className="divide-y divide-white/5">
            {freeRows.map((row) => (
              <MasterTableRow
                key={row.id}
                row={row}
                stat={stat}
                maxRounds={maxRounds}
                isExpanded={expandedRowId === row.id}
                onToggle={() =>
                  setExpandedRowId(
                    expandedRowId === row.id ? null : row.id
                  )
                }
                hoveredCol={hoveredCol}
                setHoveredCol={setHoveredCol}
              />
            ))}
          </div>

          {/* Gated block for non-premium */}
          {!isPremium && gatedRows.length > 0 && (
            <div className="relative border-t border-white/10">
              {/* CTA at start of blur */}
              <div className="pointer-events-auto sticky top-0 z-40 flex flex-col items-center gap-3 bg-gradient-to-b from-black/98 via-black/90 to-transparent px-4 py-6 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-black/80 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-yellow-200/90">
                  <Crown className="h-3.5 w-3.5 text-yellow-300" />
                  <span>Neeko+ Master Grid</span>
                </div>
                <p className="max-w-md text-[13px] leading-relaxed text-yellow-100/90">
                  Unlock full-season {statLabel.toLowerCase()} ledgers, advanced
                  hit-rate bands and deep role filters for every player.
                </p>
                <button
                  type="button"
                  className="rounded-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 px-6 py-2.5 text-sm font-semibold text-black shadow-[0_0_26px_rgba(250,204,21,0.75)] hover:brightness-110 transition"
                >
                  Unlock Neeko+ Insights
                </button>
                <button
                  type="button"
                  className="text-[11px] font-medium text-yellow-200/85 underline-offset-4 hover:underline"
                >
                  View full AI analysis →
                </button>
              </div>

              {/* Blurred realistic rows */}
              <div className="relative divide-y divide-white/5">
                {gatedRows.map((row) => (
                  <MasterTableRow
                    key={`blur-${row.id}`}
                    row={row}
                    stat={stat}
                    maxRounds={maxRounds}
                    isExpanded={false}
                    onToggle={() => {}}
                    hoveredCol={hoveredCol}
                    setHoveredCol={setHoveredCol}
                    isBlurred
                    confidenceOverride={72}
                  />
                ))}
              </div>

              <PremiumBlurOverlay />
            </div>
          )}
        </div>

        {/* Show more */}
        {canShowMore && (
          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={() =>
                setVisibleCount((prev) => prev + 20)
              }
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/70 px-4 py-2 text-xs font-medium text-white/80 hover:bg-white/10"
            >
              Show 20 more rows
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
